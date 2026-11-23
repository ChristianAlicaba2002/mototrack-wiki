import { formatKm } from '@/features/garage/model/odometer';
import type { WikiFluid, WikiServiceInterval } from '@/lib/firestore/types';

export function formatYears(from: number | null, to: number | null): string {
  if (from !== null && to !== null) return from === to ? String(from) : `${from}–${to}`;
  if (from !== null) return `${from}–present`;
  if (to !== null) return `Up to ${to}`;
  return 'All years';
}

export function formatLitres(litres: number): string {
  return `${litres} L`;
}

export function formatFluid(fluid: WikiFluid): string {
  return `${fluid.grade} · ${formatLitres(fluid.capacityL)}`;
}

export function formatPsi(psi: number): string {
  return `${psi} psi`;
}

export function formatTorque(nm: number): string {
  return `${nm} N·m`;
}

function formatMonths(months: number): string {
  if (months >= 12 && months % 12 === 0) return `${months / 12} yr`;
  return `${months} mo`;
}

export function formatInterval({ everyKm, everyMonths }: WikiServiceInterval): string {
  const parts = [];
  if (everyKm !== null) parts.push(`${formatKm(everyKm)} km`);
  if (everyMonths !== null) parts.push(formatMonths(everyMonths));
  return parts.join(' · ');
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}
