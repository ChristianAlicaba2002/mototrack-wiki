import { GroqError, visionJson } from '@/lib/ai/groq';
import type { DocumentType } from '@/lib/firestore/types';

/** What the vision model may answer. */
const DETECTED = [
  'registration',
  'license',
  'insurance',
  'receipt',
  'other_document',
  'not_a_document',
  'unreadable',
] as const;
type Detected = (typeof DETECTED)[number];

/**
 * What each vault type accepts. "Other" has no fixed paper, so any document
 * will do; it only turns away photos that aren't documents at all.
 */
const ACCEPTS: Record<DocumentType, readonly Detected[]> = {
  registration: ['registration'],
  license: ['license'],
  insurance: ['insurance'],
  receipt: ['receipt'],
  other: ['registration', 'license', 'insurance', 'receipt', 'other_document'],
};

/** Below this, the model isn't sure enough to block a save. */
const MIN_CONFIDENCE = 0.6;

export type VerifyResult =
  | { kind: 'ok' }
  /** The photo isn't the chosen document; `message` says so in plain words. */
  | { kind: 'mismatch'; message: string }
  /** The check couldn't run (offline, no key, Groq down). The save goes ahead. */
  | { kind: 'unchecked' };

const INSTRUCTIONS = `You check photos for a motorcycle app in the Philippines. Identify what the photo shows.
Answer with JSON only: {"detected": one of ${DETECTED.map((d) => `"${d}"`).join(', ')}, "confidence": number from 0 to 1}.
- "registration": an LTO Official Receipt (OR) and/or Certificate of Registration (CR) for a motor vehicle, including photocopies.
- "license": a driver's license card (LTO or any country), front or back, including student permits.
- "insurance": a vehicle insurance paper: CTPL certificate of cover, insurance policy or its schedule, or an insurance company's receipt for the premium.
- "receipt": a store, parts, fuel, repair or service receipt or invoice, on paper or as a screenshot of a digital receipt (e.g. GCash, Maya, online shop). Not an LTO OR and not an insurance receipt.
- "other_document": any other paper, ID, card or document.
- "not_a_document": a photo that is not a document (people, places, vehicles, objects, spreadsheets or tables, app screenshots that aren't receipts, etc.).
- "unreadable": too blurry, dark or cropped to tell.`;

/** How each detected thing is named in a message. */
const DETECTED_NAMES: Partial<Record<Detected, string>> = {
  registration: 'an OR/CR',
  license: 'a driver’s license',
  insurance: 'an insurance paper',
  receipt: 'a receipt',
  other_document: 'a different document',
};

/** The chosen type as said in a sentence. */
const YOUR: Record<DocumentType, string> = {
  registration: 'your OR/CR',
  license: 'your driver’s license',
  insurance: 'your insurance paper',
  receipt: 'a receipt',
  other: 'a document',
};

const HOW_TO_FIX: Record<DocumentType, string> = {
  registration: 'Take a photo of your Official Receipt and Certificate of Registration from LTO',
  license: 'Take a photo of the front of your driver’s license',
  insurance: 'Take a photo of your CTPL certificate or insurance policy',
  receipt: 'Take a photo of the receipt or invoice',
  other: 'Take a photo of the paper or card you want to keep',
};

function isDetected(value: unknown): value is Detected {
  return typeof value === 'string' && (DETECTED as readonly string[]).includes(value);
}

function mismatchMessage(expected: DocumentType, detected: Detected): string {
  if (detected === 'unreadable') {
    return `MotoTrack can’t make out this photo. ${HOW_TO_FIX[expected]} in good light, with the whole paper in the frame.`;
  }
  const found = DETECTED_NAMES[detected];
  const lead = found
    ? `This photo looks like ${found}, not ${YOUR[expected]}.`
    : `This photo doesn’t look like ${YOUR[expected]}.`;
  // When it's another kind the vault knows, saving it under that type is a fix too.
  const choose = found && detected !== 'other_document' ? ', or pick the matching type above' : '';
  return `${lead} ${HOW_TO_FIX[expected]}${choose}.`;
}

/**
 * Asks the vision model whether the photo is the document type chosen. When
 * the check can't run, the save isn't blocked: a rider at a checkpoint with a
 * bad signal still needs to save.
 */
export async function verifyDocumentPhoto(type: DocumentType, base64: string): Promise<VerifyResult> {
  try {
    const reply = (await visionJson(
      INSTRUCTIONS,
      `The rider is saving this as ${YOUR[type]}. What does the photo show?`,
      `data:image/jpeg;base64,${base64}`
    )) as { detected?: unknown; confidence?: unknown } | null;

    const detected = reply?.detected;
    const confidence = typeof reply?.confidence === 'number' ? reply.confidence : 0;
    if (!isDetected(detected)) return { kind: 'unchecked' };
    if (ACCEPTS[type].includes(detected)) return { kind: 'ok' };
    // An unreadable photo is always worth retaking; anything else only when the model is sure.
    if (detected !== 'unreadable' && confidence < MIN_CONFIDENCE) return { kind: 'ok' };
    return { kind: 'mismatch', message: mismatchMessage(type, detected) };
  } catch (e) {
    if (__DEV__) console.warn('[vault] photo check skipped:', e instanceof GroqError ? `${e.kind}: ${e.message}` : e);
    return { kind: 'unchecked' };
  }
}
