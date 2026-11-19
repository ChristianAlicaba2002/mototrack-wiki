import type { Timestamp } from 'firebase/firestore';

import { formatKm } from '@/features/garage/model/odometer';

/** The app's currency. Costs are stored as plain numbers. */
export const CURRENCY_SYMBOL = '₱';

/** 1250 → "₱1,250", 1250.5 → "₱1,250.50". */
export function formatCost(amount: number): string {
  // Round to cents first so float sums like 2.9999999 don't print as "2.100".
  const totalCents = Math.round(amount * 100);
  const whole = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  return `${CURRENCY_SYMBOL}${formatKm(whole)}${cents > 0 ? `.${String(cents).padStart(2, '0')}` : ''}`;
}

export function formatServiceDate(date: Timestamp): string {
  return date.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
