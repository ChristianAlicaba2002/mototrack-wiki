import type { BikeInput } from '@/lib/firestore/bikes';
import type { Bike } from '@/lib/firestore/types';

// Pure form logic: raw text values in, field errors and a validated BikeInput out.
// Limits mirror firestore.rules so the user sees a message instead of a
// permission-denied error.

export const BIKE_LIMITS = {
  makeMax: 60,
  modelMax: 60,
  nicknameMax: 60,
  plateMax: 20,
  engineCcMin: 1,
  engineCcMax: 3000,
  yearMin: 1885,
  odometerMax: 1_000_000,
} as const;

export type BikeFormValues = {
  make: string;
  model: string;
  engineCc: string;
  year: string;
  odometerKm: string;
  nickname: string;
  plateNumber: string;
};

export type BikeFormField = keyof BikeFormValues;
export type BikeFormErrors = Partial<Record<BikeFormField, string>>;

export const EMPTY_BIKE_FORM: BikeFormValues = {
  make: '',
  model: '',
  engineCc: '',
  year: '',
  odometerKm: '',
  nickname: '',
  plateNumber: '',
};

export function toFormValues(bike: Bike): BikeFormValues {
  return {
    make: bike.make,
    model: bike.model,
    engineCc: String(bike.engineCc),
    year: String(bike.year),
    odometerKm: String(bike.odometerKm),
    nickname: bike.nickname ?? '',
    plateNumber: bike.plateNumber ?? '',
  };
}

/** Parses a whole number, allowing thousands separators ("12,500"). Returns null if it isn't one. */
export function parseWholeNumber(text: string): number | null {
  const cleaned = text.trim().replace(/[,\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) ? value : null;
}

function requiredText(value: string, label: string, max: number): string | undefined {
  if (value.length === 0) return `Enter the ${label}.`;
  if (value.length > max) return `Keep the ${label} under ${max} characters.`;
  return undefined;
}

function wholeNumberInRange(
  text: string,
  label: string,
  min: number,
  max: number
): { value: number | null; error?: string } {
  if (text.trim().length === 0) return { value: null, error: `Enter the ${label}.` };
  const value = parseWholeNumber(text);
  if (value === null) return { value: null, error: `The ${label} must be a whole number.` };
  if (value < min || value > max) {
    // Separators only for big numbers, so years read "2027", not "2,027".
    const maxText = max >= 10_000 ? max.toLocaleString('en-US') : String(max);
    return { value: null, error: `The ${label} must be between ${min} and ${maxText}.` };
  }
  return { value };
}

export function validateBikeForm(
  values: BikeFormValues,
  now: Date = new Date()
): { errors: BikeFormErrors; input: BikeInput | null } {
  const errors: BikeFormErrors = {};

  const make = values.make.trim();
  const model = values.model.trim();
  const nickname = values.nickname.trim();
  const plateNumber = values.plateNumber.trim().toUpperCase();

  errors.make = requiredText(make, 'make', BIKE_LIMITS.makeMax);
  errors.model = requiredText(model, 'model', BIKE_LIMITS.modelMax);

  const engineCc = wholeNumberInRange(
    values.engineCc,
    'engine displacement',
    BIKE_LIMITS.engineCcMin,
    BIKE_LIMITS.engineCcMax
  );
  errors.engineCc = engineCc.error;

  // Next year's models go on sale this year.
  const year = wholeNumberInRange(values.year, 'year', BIKE_LIMITS.yearMin, now.getFullYear() + 1);
  errors.year = year.error;

  const odometer = wholeNumberInRange(values.odometerKm, 'odometer reading', 0, BIKE_LIMITS.odometerMax);
  errors.odometerKm = odometer.error;

  if (nickname.length > BIKE_LIMITS.nicknameMax) {
    errors.nickname = `Keep the nickname under ${BIKE_LIMITS.nicknameMax} characters.`;
  }
  if (plateNumber.length > BIKE_LIMITS.plateMax) {
    errors.plateNumber = `Keep the plate number under ${BIKE_LIMITS.plateMax} characters.`;
  }

  for (const key of Object.keys(errors) as BikeFormField[]) {
    if (errors[key] === undefined) delete errors[key];
  }

  if (Object.keys(errors).length > 0) return { errors, input: null };

  return {
    errors,
    input: {
      make,
      model,
      engineCc: engineCc.value!,
      year: year.value!,
      odometerKm: odometer.value!,
      nickname: nickname || null,
      plateNumber: plateNumber || null,
    },
  };
}
