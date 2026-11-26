import type { Timestamp } from 'firebase/firestore';

import type { WithId } from '@/lib/firestore/collections';
import type { DocumentType, VaultDocument } from '@/lib/firestore/types';

// Pure logic for the vault: labels, expiry status and ordering.

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  registration: 'OR/CR',
  insurance: 'Insurance',
  license: 'Driver’s license',
  receipt: 'Receipt',
  other: 'Other',
};

/** Longer names for headings and screen readers. */
export const DOCUMENT_TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  registration: 'Official receipt and certificate of registration',
  insurance: 'CTPL or comprehensive insurance policy',
  license: 'Your driver’s license',
  receipt: 'Parts, service or purchase receipt',
  other: 'Any other paper worth keeping',
};

/** The picker order: the papers you're asked for at a checkpoint first. */
export const DOCUMENT_TYPE_ORDER: readonly DocumentType[] = ['registration', 'license', 'insurance', 'receipt', 'other'];

/** Types that usually belong to one motorcycle; a license belongs to the rider. */
export const BIKE_DOCUMENT_TYPES: readonly DocumentType[] = ['registration', 'insurance', 'receipt'];

/** Types that normally carry an expiry date, so the form starts with one on. */
export const EXPIRING_DOCUMENT_TYPES: readonly DocumentType[] = ['registration', 'insurance', 'license'];

/** "Expires soon" this many days ahead, enough time to renew an OR/CR or license. */
export const EXPIRY_WARNING_DAYS = 30;

export type ExpiryStatus =
  | { kind: 'none' }
  | { kind: 'valid'; daysLeft: number }
  | { kind: 'soon'; daysLeft: number }
  | { kind: 'expired'; daysAgo: number };

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from today to the expiry date. The expiry date itself still counts as valid. */
export function expiryStatus(expiresAt: Timestamp | null, now: Date = new Date()): ExpiryStatus {
  if (!expiresAt) return { kind: 'none' };
  const days = Math.round((startOfDay(expiresAt.toDate()).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (days < 0) return { kind: 'expired', daysAgo: -days };
  if (days <= EXPIRY_WARNING_DAYS) return { kind: 'soon', daysLeft: days };
  return { kind: 'valid', daysLeft: days };
}

/** "Expired 3 days ago", "Expires today", "Expires in 12 days", "Valid until Mar 4, 2027", "No expiry". */
export function formatExpiry(expiresAt: Timestamp | null, now: Date = new Date()): string {
  const status = expiryStatus(expiresAt, now);
  switch (status.kind) {
    case 'none':
      return 'No expiry';
    case 'expired':
      return status.daysAgo === 0
        ? 'Expired today'
        : `Expired ${status.daysAgo === 1 ? 'yesterday' : `${status.daysAgo} days ago`}`;
    case 'soon':
      return status.daysLeft === 0
        ? 'Expires today'
        : `Expires ${status.daysLeft === 1 ? 'tomorrow' : `in ${status.daysLeft} days`}`;
    case 'valid':
      return `Valid until ${formatDate(expiresAt!.toDate())}`;
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const URGENCY: Record<ExpiryStatus['kind'], number> = { expired: 0, soon: 1, valid: 2, none: 3 };

/**
 * Expired first, then expiring soon, then the rest by expiry date; documents
 * without one last, by type then title.
 */
export function sortDocuments(documents: WithId<VaultDocument>[], now: Date = new Date()): WithId<VaultDocument>[] {
  return [...documents].sort((a, b) => {
    const ua = URGENCY[expiryStatus(a.expiresAt, now).kind];
    const ub = URGENCY[expiryStatus(b.expiresAt, now).kind];
    if (ua !== ub) return ua - ub;
    if (a.expiresAt && b.expiresAt) return a.expiresAt.toMillis() - b.expiresAt.toMillis();
    return (
      DOCUMENT_TYPE_ORDER.indexOf(a.type) - DOCUMENT_TYPE_ORDER.indexOf(b.type) || a.title.localeCompare(b.title)
    );
  });
}

/** How many documents need renewing: expired or expiring soon. */
export function attentionCount(documents: Pick<VaultDocument, 'expiresAt'>[], now: Date = new Date()): {
  expired: number;
  soon: number;
} {
  let expired = 0;
  let soon = 0;
  for (const d of documents) {
    const kind = expiryStatus(d.expiresAt, now).kind;
    if (kind === 'expired') expired += 1;
    else if (kind === 'soon') soon += 1;
  }
  return { expired, soon };
}

/** Short status names for badges and filters. */
export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus['kind'], string> = {
  expired: 'Expired',
  soon: 'Expiring soon',
  valid: 'Valid',
  none: 'No expiry',
};

/** The vault list filter: everything, or one expiry status. */
export type StatusFilter = 'all' | ExpiryStatus['kind'];

/** Filter order, most urgent first. */
export const STATUS_FILTER_ORDER: readonly StatusFilter[] = ['all', 'expired', 'soon', 'valid', 'none'];

/** How many documents are in each status, plus the total under 'all'. */
export function statusCounts(
  documents: Pick<VaultDocument, 'expiresAt'>[],
  now: Date = new Date()
): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: documents.length, expired: 0, soon: 0, valid: 0, none: 0 };
  for (const d of documents) counts[expiryStatus(d.expiresAt, now).kind] += 1;
  return counts;
}

export function filterDocuments<T extends Pick<VaultDocument, 'expiresAt'>>(
  documents: T[],
  filter: StatusFilter,
  now: Date = new Date()
): T[] {
  if (filter === 'all') return documents;
  return documents.filter((d) => expiryStatus(d.expiresAt, now).kind === filter);
}

/** The DocumentInput that keeps a saved document's details as they are, e.g. when only its photo changes. */
export function toDocumentInput(
  document: VaultDocument,
  existingBikeIds: readonly string[]
): { type: VaultDocument['type']; title: string; bikeId: string | null; expiresAt: Date | null } {
  return {
    type: document.type,
    title: document.title,
    // A bike that was deleted since can't be saved (firestore.rules); drop the link.
    bikeId: document.bikeId && existingBikeIds.includes(document.bikeId) ? document.bikeId : null,
    expiresAt: document.expiresAt?.toDate() ?? null,
  };
}
