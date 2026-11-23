import { BIKE_LIMITS, parseWholeNumber } from '@/features/garage/model/bike-form';
import type { ServiceInput } from '@/lib/firestore/services';
import type { ServiceRecord, ServiceType } from '@/lib/firestore/types';

// Pure form logic: raw text values in, field errors and a validated ServiceInput out.
// Limits mirror firestore.rules so the user sees a message instead of a
// permission-denied error.

export const SERVICE_LIMITS = {
  titleMax: 120,
  notesMax: 2000,
  costMax: 10_000_000,
  /** Earliest date accepted, as a year. */
  yearMin: 1900,
} as const;

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: 'Oil change',
  brakes: 'Brakes',
  chain: 'Chain',
  tires: 'Tires',
  battery: 'Battery',
  inspection: 'Inspection',
  repair: 'Repair',
  other: 'Other',
};

/** The order the type picker shows them in: the most common first. */
export const SERVICE_TYPE_ORDER: readonly ServiceType[] = [
  'oil_change',
  'brakes',
  'chain',
  'tires',
  'battery',
  'inspection',
  'repair',
  'other',
];

export type ServiceFormValues = {
  type: ServiceType | null;
  title: string;
  date: Date;
  odometerKm: string;
  cost: string;
  notes: string;
};

export type ServiceFormField = keyof ServiceFormValues;
export type ServiceFormErrors = Partial<Record<ServiceFormField, string>>;

export function emptyServiceForm(today: Date = new Date(), odometerKm?: number): ServiceFormValues {
  return {
    type: null,
    title: '',
    date: startOfDay(today),
    odometerKm: odometerKm === undefined ? '' : String(odometerKm),
    cost: '',
    notes: '',
  };
}

export function toFormValues(service: ServiceRecord): ServiceFormValues {
  return {
    type: service.type,
    // A title equal to the type's label was filled in for the user; show it empty again.
    title: service.title === SERVICE_TYPE_LABELS[service.type] ? '' : service.title,
    date: startOfDay(service.date.toDate()),
    odometerKm: String(service.odometerKm),
    cost: service.cost === null ? '' : String(service.cost),
    notes: service.notes ?? '',
  };
}

/** The title to store: what the user typed, or the type's label. */
export function serviceTitle(type: ServiceType, title: string): string {
  return title.trim() || SERVICE_TYPE_LABELS[type];
}

// ---------- Dates ----------

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function earliestServiceDate(bikeYear?: number): Date {
  const year = bikeYear === undefined ? SERVICE_LIMITS.yearMin : Math.max(SERVICE_LIMITS.yearMin, bikeYear - 1);
  return new Date(year, 0, 1);
}

export function latestServiceDate(now: Date = new Date()): Date {
  return startOfDay(now);
}

export function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

// ---------- Cost ----------

/** Parses an amount with up to 2 decimals, allowing separators and a ₱ sign ("₱1,250.50"). */
export function parseCost(text: string): number | null {
  const cleaned = text.trim().replace(/[,\s₱]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

// ---------- Validation ----------

export function validateServiceForm(
  values: ServiceFormValues,
  bikeId: string,
  bikeYear?: number,
  now: Date = new Date()
): { errors: ServiceFormErrors; input: ServiceInput | null } {
  const errors: ServiceFormErrors = {};

  if (values.type === null) errors.type = 'Choose what was done.';

  const title = values.title.trim();
  if (title.length > SERVICE_LIMITS.titleMax) {
    errors.title = `Keep the title under ${SERVICE_LIMITS.titleMax} characters.`;
  }

  const date = Number.isNaN(values.date.getTime()) ? null : startOfDay(values.date);
  const earliest = earliestServiceDate(bikeYear);
  if (date === null) {
    errors.date = 'Pick the date of the service.';
  } else if (date > latestServiceDate(now)) {
    errors.date = 'The date can’t be in the future.';
  } else if (date < earliest) {
    errors.date =
      bikeYear === undefined || earliest.getFullYear() === SERVICE_LIMITS.yearMin
        ? `The date can’t be before ${SERVICE_LIMITS.yearMin}.`
        : `A ${bikeYear} model can’t have been serviced before ${earliest.getFullYear()}.`;
  }

  let odometerKm: number | null = null;
  if (values.odometerKm.trim().length === 0) {
    errors.odometerKm = 'Enter the odometer reading at the time of the service.';
  } else {
    odometerKm = parseWholeNumber(values.odometerKm);
    if (odometerKm === null) errors.odometerKm = 'The odometer reading must be a whole number.';
    else if (odometerKm > BIKE_LIMITS.odometerMax) {
      errors.odometerKm = `The odometer reading must be ${BIKE_LIMITS.odometerMax.toLocaleString('en-US')} km or less.`;
    }
  }

  let cost: number | null = null;
  if (values.cost.trim().length > 0) {
    cost = parseCost(values.cost);
    if (cost === null) errors.cost = 'Enter an amount like 450 or 1,250.50.';
    else if (cost > SERVICE_LIMITS.costMax) {
      errors.cost = `The cost must be ${SERVICE_LIMITS.costMax.toLocaleString('en-US')} or less.`;
    }
  }

  const notes = values.notes.trim();
  if (notes.length > SERVICE_LIMITS.notesMax) {
    errors.notes = `Keep the notes under ${SERVICE_LIMITS.notesMax.toLocaleString('en-US')} characters.`;
  }

  for (const key of Object.keys(errors) as ServiceFormField[]) {
    if (errors[key] === undefined) delete errors[key];
  }

  if (Object.keys(errors).length > 0 || values.type === null || date === null || odometerKm === null) {
    return { errors, input: null };
  }

  return {
    errors,
    input: {
      bikeId,
      type: values.type,
      title: serviceTitle(values.type, title),
      date,
      odometerKm,
      cost,
      notes: notes || null,
    },
  };
}
