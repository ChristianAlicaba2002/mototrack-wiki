const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';
/** Reads images (console.groq.com/docs/vision). A preview model: if Groq retires it, set EXPO_PUBLIC_GROQ_VISION_MODEL. */
const DEFAULT_VISION_MODEL = 'qwen/qwen3.8-27b';
const TIMEOUT_MS = 30_000;
const MAX_COMPLETION_TOKENS = 1024;

export type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GroqErrorKind = 'missing-key' | 'rate-limited' | 'timeout' | 'network' | 'bad-response';

export class GroqError extends Error {
  readonly kind: GroqErrorKind;
  readonly status: number | null;

  constructor(kind: GroqErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'GroqError';
    this.kind = kind;
    this.status = status;
  }
}

type CompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
};

type ErrorResponse = {
  error?: { message?: string };
};

function apiKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  if (!key) throw new GroqError('missing-key', 'EXPO_PUBLIC_GROQ_API_KEY is not set.');
  return key;
}

function model(): string {
  return process.env.EXPO_PUBLIC_GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

function visionModel(): string {
  return process.env.EXPO_PUBLIC_GROQ_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message ?? `Groq responded with ${response.status}.`;
  } catch {
    return `Groq responded with ${response.status}.`;
  }
}

export async function chatCompletion(messages: GroqMessage[]): Promise<string> {
  return complete({
    model: model(),
    messages,
    reasoning_effort: 'low',
    include_reasoning: false,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
  });
}

/** A user message with one image, for the vision model. */
export type GroqImageMessage = {
  role: 'user';
  content: (
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  )[];
};

/**
 * Asks the vision model about one image and returns its reply parsed as JSON.
 * `imageDataUri` is a `data:image/jpeg;base64,…` URI (Groq allows up to 20 MB).
 */
export async function visionJson(instructions: string, prompt: string, imageDataUri: string): Promise<unknown> {
  const messages: (GroqMessage | GroqImageMessage)[] = [
    { role: 'system', content: instructions },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageDataUri } },
      ],
    },
  ];
  const content = await complete({
    model: visionModel(),
    messages,
    response_format: { type: 'json_object' },
    temperature: 0,
    max_completion_tokens: 300,
  });
  try {
    return JSON.parse(content);
  } catch {
    throw new GroqError('bad-response', 'Groq sent a reply that was not JSON.');
  }
}

async function complete(request: Record<string, unknown>): Promise<string> {
  const key = apiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.aborted) throw new GroqError('timeout', 'Groq took too long to respond.');
    throw new GroqError('network', e instanceof Error ? e.message : 'Network request failed.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) {
    throw new GroqError('rate-limited', await readErrorMessage(response), 429);
  }
  if (!response.ok) {
    throw new GroqError('bad-response', await readErrorMessage(response), response.status);
  }

  let body: CompletionResponse;
  try {
    body = (await response.json()) as CompletionResponse;
  } catch {
    throw new GroqError('bad-response', 'Groq sent a reply that could not be read.', response.status);
  }

  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new GroqError('bad-response', 'Groq sent an empty reply.', response.status);
  return content;
}
