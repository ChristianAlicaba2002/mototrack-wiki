import type { WikiCategory, WikiDifficulty, WikiDoc } from '@/lib/firestore/types';

export const WIKI_CATEGORY_LABELS: Record<WikiCategory, string> = {
  specs: 'Specs',
  fluids: 'Fluids',
  tire_pressure: 'Tire pressure',
  torque: 'Torque',
  diy: 'DIY guides',
};

export const WIKI_DIFFICULTY_LABELS: Record<WikiDifficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  advanced: 'Advanced',
};

export function docInCategory(doc: WikiDoc, category: WikiCategory): boolean {
  if (doc.category === category) return true;
  if (doc.kind === 'guide') return category === 'diy';
  switch (category) {
    case 'fluids':
    case 'tire_pressure':
      return true;
    case 'torque':
      return doc.torque.length > 0;
    default:
      return false;
  }
}
