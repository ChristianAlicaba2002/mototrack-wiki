import { formatKm } from '@/features/garage/model/odometer';
import { formatCost, formatServiceDate } from '@/features/services/model/format';
import { SERVICE_TYPE_LABELS } from '@/features/services/model/service-form';
import { formatFluid, formatInterval, formatPsi, formatTorque, formatYears } from '@/features/wiki/model/format';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike, ServiceRecord, WikiSpec } from '@/lib/firestore/types';

import type { MechanicContext } from './build-context';

const ROLE = `You are MotoTrack's AI mechanic, a friendly and practical motorcycle mechanic helping riders in the Philippines diagnose problems and look after their bikes.`;

const RULES = `Rules:
1. Only help with motorcycles: symptoms, maintenance, parts, riding care and costs. If asked about anything else, say briefly that you can only help with motorcycles.
2. Always reply in English, even if the rider writes in Filipino, Taglish or another language.
3. Write plain text only. Do not use markdown: no headings, bold, italics, tables, bullet symbols or code blocks. For steps, use simple numbered lines like "1. Check the oil level."
4. Keep replies short and practical. Ask one clarifying question when the symptom is unclear instead of guessing.
5. Safety first. If the rider describes a problem with brakes, steering, a fuel leak, overheating, smoke, or anything else that could cause a crash or fire, tell them clearly to stop riding and have a mechanic check the bike before riding again. Do not give workarounds that keep an unsafe bike on the road.
6. Prefer the bike's spec sheet below for fluids, tire pressure, torque and intervals. If a value is not in it, say it is a typical value and suggest checking the owner's manual.
7. Never invent service history. Only refer to the services listed below.
8. Suggest a professional mechanic for jobs that need special tools or skills.`;

function describeBike(bike: WithId<Bike>): string {
  const lines = [
    `Make and model: ${bike.make} ${bike.model}`,
    `Year: ${bike.year}`,
    `Engine: ${bike.engineCc} cc`,
    `Odometer: ${formatKm(bike.odometerKm)} km`,
  ];
  if (bike.nickname) lines.push(`Nickname: ${bike.nickname}`);
  return lines.join('\n');
}

function describeService(service: WithId<ServiceRecord>): string {
  const parts = [
    formatServiceDate(service.date),
    SERVICE_TYPE_LABELS[service.type],
    service.title !== SERVICE_TYPE_LABELS[service.type] ? service.title : null,
    `at ${formatKm(service.odometerKm)} km`,
    service.cost !== null ? formatCost(service.cost) : null,
    service.nextDueKm !== null ? `next due at ${formatKm(service.nextDueKm)} km` : null,
    service.notes ? `notes: ${service.notes}` : null,
  ];
  return `- ${parts.filter(Boolean).join(', ')}`;
}

function describeSpec(spec: WikiSpec): string {
  const { fluids, tirePressure } = spec;
  const lines = [
    `Spec sheet: ${spec.title} (${formatYears(spec.yearFrom, spec.yearTo)}, ${spec.engineCc} cc)`,
    `Engine oil: ${formatFluid(fluids.engineOil)}`,
  ];
  if (fluids.gearOil) lines.push(`Gear oil: ${formatFluid(fluids.gearOil)}`);
  if (fluids.coolant) lines.push(`Coolant: ${formatFluid(fluids.coolant)}`);
  lines.push(`Brake fluid: ${fluids.brakeFluid}`);
  lines.push(
    `Tire pressure front: ${formatPsi(tirePressure.front.soloPsi)} solo, ${formatPsi(tirePressure.front.passengerPsi)} with passenger`
  );
  lines.push(
    `Tire pressure rear: ${formatPsi(tirePressure.rear.soloPsi)} solo, ${formatPsi(tirePressure.rear.passengerPsi)} with passenger`
  );
  if (spec.torque.length > 0) {
    lines.push('Torque:');
    for (const t of spec.torque) lines.push(`- ${t.item}: ${formatTorque(t.nm)}`);
  }
  if (spec.intervals.length > 0) {
    lines.push('Service intervals:');
    for (const i of spec.intervals) lines.push(`- ${i.item}: every ${formatInterval(i)}`);
  }
  return lines.join('\n');
}

function describeContext({ bike, services, spec }: MechanicContext): string {
  if (!bike) {
    return `The rider has not picked a bike for this chat. Give general advice, and ask for the make, model and year when the answer depends on the bike.`;
  }

  const sections = [`The rider's bike:\n${describeBike(bike)}`];
  sections.push(
    services.length > 0
      ? `Last ${services.length} logged services, newest first:\n${services.map(describeService).join('\n')}`
      : 'No services are logged for this bike yet.'
  );
  sections.push(
    spec
      ? describeSpec(spec)
      : 'There is no spec sheet for this bike in the MotoTrack wiki. Use typical values for this kind of bike and say so.'
  );
  return sections.join('\n\n');
}

export function buildSystemPrompt(context: MechanicContext, today: Date = new Date()): string {
  const date = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return [ROLE, RULES, `Today is ${date}.`, describeContext(context)].join('\n\n');
}
