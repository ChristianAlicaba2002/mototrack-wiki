import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const WIKI_DIR = path.resolve(import.meta.dirname, '..', 'wiki');
const CATEGORIES = ['specs', 'fluids', 'tire_pressure', 'torque', 'diy'];
const CATEGORY_LABELS = {
  specs: 'specs spec sheet',
  fluids: 'fluids oil coolant',
  tire_pressure: 'tire pressure',
  torque: 'torque',
  diy: 'diy guide',
};
const DIFFICULTIES = ['easy', 'moderate', 'advanced'];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const dryRun = process.argv.includes('--dry-run');

class SeedError extends Error {}

function fail(file, message) {
  throw new SeedError(`${file}: ${message}`);
}

function normalizePart(value) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeModelKey(make, model) {
  return `${normalizePart(make)}:${normalizePart(model)}`;
}

function normalizeText(value) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.:+-]+/g, ' ')
    .trim();
}

function buildSearchText(parts) {
  const words = new Set();
  for (const part of parts) {
    for (const word of normalizeText(part).split(' ')) {
      if (word) words.add(word);
    }
  }
  return [...words].join(' ');
}

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
const isYear = (value) => value === null || (Number.isInteger(value) && value >= 1885 && value <= 2100);
const isTextList = (value) => Array.isArray(value) && value.every(isText);

function requireText(file, value, field) {
  if (!isText(value)) fail(file, `${field} must be a non-empty string`);
}

function requireNumber(file, value, field) {
  if (!isNumber(value)) fail(file, `${field} must be a positive number`);
}

function requireYears(file, from, to) {
  if (!isYear(from) || !isYear(to)) fail(file, 'yearFrom and yearTo must be a year or null');
  if (from !== null && to !== null && from > to) fail(file, 'yearFrom must not be after yearTo');
}

function requireFluid(file, fluid, field, nullable) {
  if (fluid === null && nullable) return;
  if (!fluid || typeof fluid !== 'object') fail(file, `${field} must be an object${nullable ? ' or null' : ''}`);
  requireText(file, fluid.grade, `${field}.grade`);
  requireNumber(file, fluid.capacityL, `${field}.capacityL`);
}

function requirePressure(file, pressure, field) {
  if (!pressure || typeof pressure !== 'object') fail(file, `${field} must be an object`);
  requireNumber(file, pressure.soloPsi, `${field}.soloPsi`);
  requireNumber(file, pressure.passengerPsi, `${field}.passengerPsi`);
}

function toModelRefs(file, refs) {
  if (!Array.isArray(refs)) fail(file, 'appliesTo must be a list');
  return refs.map((ref, i) => {
    requireText(file, ref?.make, `appliesTo[${i}].make`);
    requireText(file, ref?.model, `appliesTo[${i}].model`);
    const yearFrom = ref.yearFrom ?? null;
    const yearTo = ref.yearTo ?? null;
    requireYears(file, yearFrom, yearTo);
    return { key: normalizeModelKey(ref.make, ref.model), yearFrom, yearTo };
  });
}

function buildSpec(file, raw) {
  requireText(file, raw.title, 'title');
  requireText(file, raw.make, 'make');
  requireText(file, raw.model, 'model');
  if (!isTextList(raw.aliases ?? [])) fail(file, 'aliases must be a list of strings');
  if (!isTextList(raw.keywords ?? [])) fail(file, 'keywords must be a list of strings');
  const yearFrom = raw.yearFrom ?? null;
  const yearTo = raw.yearTo ?? null;
  requireYears(file, yearFrom, yearTo);
  if (!Number.isInteger(raw.engineCc) || raw.engineCc < 1 || raw.engineCc > 3000) {
    fail(file, 'engineCc must be an integer from 1 to 3000');
  }

  const fluids = raw.fluids;
  if (!fluids || typeof fluids !== 'object') fail(file, 'fluids must be an object');
  requireFluid(file, fluids.engineOil, 'fluids.engineOil', false);
  requireFluid(file, fluids.gearOil ?? null, 'fluids.gearOil', true);
  requireFluid(file, fluids.coolant ?? null, 'fluids.coolant', true);
  requireText(file, fluids.brakeFluid, 'fluids.brakeFluid');

  const tirePressure = raw.tirePressure;
  if (!tirePressure || typeof tirePressure !== 'object') fail(file, 'tirePressure must be an object');
  requirePressure(file, tirePressure.front, 'tirePressure.front');
  requirePressure(file, tirePressure.rear, 'tirePressure.rear');

  if (!Array.isArray(raw.torque)) fail(file, 'torque must be a list');
  raw.torque.forEach((row, i) => {
    requireText(file, row?.item, `torque[${i}].item`);
    requireNumber(file, row.nm, `torque[${i}].nm`);
  });

  if (!Array.isArray(raw.intervals)) fail(file, 'intervals must be a list');
  raw.intervals.forEach((row, i) => {
    requireText(file, row?.item, `intervals[${i}].item`);
    const everyKm = row.everyKm ?? null;
    const everyMonths = row.everyMonths ?? null;
    if (everyKm === null && everyMonths === null) fail(file, `intervals[${i}] needs everyKm or everyMonths`);
    if (everyKm !== null) requireNumber(file, everyKm, `intervals[${i}].everyKm`);
    if (everyMonths !== null) requireNumber(file, everyMonths, `intervals[${i}].everyMonths`);
  });

  const modelNames = [raw.model, ...(raw.aliases ?? [])];
  const keys = [...new Set(modelNames.map((model) => normalizeModelKey(raw.make, model)))];

  return {
    kind: 'spec',
    title: raw.title,
    category: 'specs',
    models: keys.map((key) => ({ key, yearFrom, yearTo })),
    make: raw.make,
    model: raw.model,
    yearFrom,
    yearTo,
    engineCc: raw.engineCc,
    fluids: {
      engineOil: fluids.engineOil,
      gearOil: fluids.gearOil ?? null,
      coolant: fluids.coolant ?? null,
      brakeFluid: fluids.brakeFluid,
    },
    tirePressure: { front: tirePressure.front, rear: tirePressure.rear },
    torque: raw.torque.map(({ item, nm }) => ({ item, nm })),
    intervals: raw.intervals.map(({ item, everyKm, everyMonths }) => ({
      item,
      everyKm: everyKm ?? null,
      everyMonths: everyMonths ?? null,
    })),
    searchText: buildSearchText([
      raw.title,
      raw.make,
      ...modelNames,
      ...keys,
      `${raw.engineCc}cc`,
      CATEGORY_LABELS.specs,
      CATEGORY_LABELS.fluids,
      CATEGORY_LABELS.tire_pressure,
      raw.torque.length > 0 ? CATEGORY_LABELS.torque : '',
      'engine oil brake fluid service intervals',
      fluids.gearOil ? 'gear oil' : '',
      fluids.engineOil.grade,
      ...(raw.keywords ?? []),
    ]),
  };
}

function buildGuide(file, raw) {
  requireText(file, raw.title, 'title');
  requireText(file, raw.summary, 'summary');
  if (!CATEGORIES.includes(raw.category)) fail(file, `category must be one of ${CATEGORIES.join(', ')}`);
  if (!DIFFICULTIES.includes(raw.difficulty)) fail(file, `difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  if (!Number.isInteger(raw.minutes) || raw.minutes < 1) fail(file, 'minutes must be a positive integer');
  if (!isTextList(raw.tools)) fail(file, 'tools must be a list of strings');
  if (!isTextList(raw.parts)) fail(file, 'parts must be a list of strings');
  if (!isTextList(raw.keywords ?? [])) fail(file, 'keywords must be a list of strings');
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail(file, 'steps must be a non-empty list');
  raw.steps.forEach((step, i) => {
    requireText(file, step?.text, `steps[${i}].text`);
    if (step.caution != null) requireText(file, step.caution, `steps[${i}].caution`);
  });

  const appliesTo = raw.appliesTo ?? [];
  const models = toModelRefs(file, appliesTo);

  return {
    kind: 'guide',
    title: raw.title,
    category: raw.category,
    models,
    summary: raw.summary,
    difficulty: raw.difficulty,
    minutes: raw.minutes,
    tools: raw.tools,
    parts: raw.parts,
    steps: raw.steps.map((step) => ({ text: step.text, caution: step.caution ?? null })),
    searchText: buildSearchText([
      raw.title,
      raw.summary,
      CATEGORY_LABELS[raw.category],
      CATEGORY_LABELS.diy,
      raw.difficulty,
      ...raw.tools,
      ...raw.parts,
      ...appliesTo.flatMap((ref) => [ref.make, ref.model]),
      ...models.map((ref) => ref.key),
      ...(raw.keywords ?? []),
    ]),
  };
}

function loadDocs() {
  const docs = new Map();
  for (const [folder, kind, build] of [
    ['specs', 'spec', buildSpec],
    ['guides', 'guide', buildGuide],
  ]) {
    const dir = path.join(WIKI_DIR, folder);
    const files = readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort();
    for (const name of files) {
      const file = path.join('wiki', folder, name);
      const id = name.slice(0, -'.json'.length);
      if (!ID_PATTERN.test(id)) fail(file, 'file name must be lowercase words joined by dashes');
      if (docs.has(id)) fail(file, `duplicate id "${id}"`);
      let raw;
      try {
        raw = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
      } catch (error) {
        fail(file, `invalid JSON (${error.message})`);
      }
      if (raw?.kind !== kind) fail(file, `kind must be "${kind}" for files in wiki/${folder}`);
      docs.set(id, build(file, raw));
    }
  }
  return docs;
}

function connect() {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
    (emulatorHost ? 'demo-mototrack' : undefined);

  if (emulatorHost) {
    console.log(`Seeding the Firestore emulator at ${emulatorHost} (project ${projectId}).`);
    return getFirestore(initializeApp({ projectId }));
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyPath && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new SeedError(
      'Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to a service account key, or set FIRESTORE_EMULATOR_HOST to seed the emulator.'
    );
  }
  const credential = keyPath
    ? cert(JSON.parse(readFileSync(path.resolve(keyPath), 'utf8')))
    : applicationDefault();
  console.log(`Seeding Firestore in project ${projectId ?? '(from credentials)'}.`);
  return getFirestore(initializeApp({ credential, projectId }));
}

async function main() {
  const docs = loadDocs();
  const specs = [...docs.values()].filter((d) => d.kind === 'spec').length;
  console.log(`Loaded ${docs.size} wiki docs (${specs} spec sheets, ${docs.size - specs} guides).`);

  if (dryRun) {
    console.log('Dry run: nothing was written.');
    return;
  }

  const db = connect();
  const batch = db.batch();
  for (const [id, data] of docs) {
    batch.set(db.collection('wiki').doc(id), { ...data, updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  console.log(`Upserted ${docs.size} docs into wiki/.`);
}

main().catch((error) => {
  console.error(error instanceof SeedError ? `seed-wiki: ${error.message}` : error);
  process.exitCode = 1;
});
