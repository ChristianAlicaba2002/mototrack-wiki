import { BIKE_LIMITS, parseWholeNumber } from './bike-form';

// Pure logic for the odometer update screen.

/**
 * Validates a new reading. It can't be lower than the current one: odometers
 * only count up. Corrections go through the edit form.
 */
export function validateOdometerReading(
  text: string,
  currentKm: number
): { value: number | null; error?: string } {
  if (text.trim().length === 0) return { value: null, error: 'Enter the new odometer reading.' };
  const value = parseWholeNumber(text);
  if (value === null) return { value: null, error: 'The reading must be a whole number.' };
  if (value > BIKE_LIMITS.odometerMax) {
    return {
      value: null,
      error: `The reading must be ${BIKE_LIMITS.odometerMax.toLocaleString('en-US')} km or less.`,
    };
  }
  if (value < currentKm) {
    return {
      value: null,
      error: `The reading can’t be lower than the current ${formatKm(currentKm)} km. To fix a mistake, edit the motorcycle.`,
    };
  }
  if (value === currentKm) return { value: null, error: 'That’s the current reading already.' };
  return { value };
}

export function formatKm(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
