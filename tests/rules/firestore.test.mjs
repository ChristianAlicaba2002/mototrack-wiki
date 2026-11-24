// Firestore security rules tests. Run with `pnpm test:rules` (starts the emulator).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

let env;

const ALICE = 'alice';
const BOB = 'bob';
const now = () => serverTimestamp();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mototrack',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

const asAlice = () => env.authenticatedContext(ALICE, { email: 'alice@example.com' }).firestore();
const asBob = () => env.authenticatedContext(BOB, { email: 'bob@example.com' }).firestore();
const asGuest = () => env.unauthenticatedContext().firestore();

/** Writes data as an admin (rules disabled), for test setup. */
async function seed(path, data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

const profile = (overrides = {}) => ({
  displayName: 'Alice',
  email: 'alice@example.com',
  photoURL: null,
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});

const bike = (overrides = {}) => ({
  make: 'Honda',
  model: 'Click 125i',
  engineCc: 125,
  year: 2022,
  nickname: null,
  plateNumber: 'ABC 1234',
  odometerKm: 12500,
  photoPath: null,
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});

const service = (overrides = {}) => ({
  bikeId: 'bike1',
  type: 'oil_change',
  title: 'Oil change',
  date: Timestamp.fromDate(new Date('2026-11-01')),
  odometerKm: 12000,
  cost: 450,
  notes: null,
  nextDueKm: 15000,
  nextDueDate: null,
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});

const vaultDoc = (overrides = {}) => ({
  bikeId: null,
  type: 'license',
  title: "Driver's license",
  storagePath: `users/${ALICE}/documents/doc1/license.pdf`,
  contentType: 'application/pdf',
  sizeBytes: 204800,
  expiresAt: null,
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});

async function seedBike(uid = ALICE, bikeId = 'bike1') {
  const t = Timestamp.now();
  await seed(`users/${uid}/bikes/${bikeId}`, bike({ createdAt: t, updatedAt: t }));
}

describe('users/{uid}', () => {
  test('owner can create and read their profile', async () => {
    await assertSucceeds(setDoc(doc(asAlice(), 'users/alice'), profile()));
    await assertSucceeds(getDoc(doc(asAlice(), 'users/alice')));
  });

  test('guests and other users cannot read or write it', async () => {
    await assertFails(setDoc(doc(asBob(), 'users/alice'), profile()));
    await assertFails(setDoc(doc(asGuest(), 'users/alice'), profile()));
    await assertFails(getDoc(doc(asBob(), 'users/alice')));
    await assertFails(getDoc(doc(asGuest(), 'users/alice')));
  });

  test('rejects extra fields, a wrong email and client timestamps', async () => {
    const db = asAlice();
    await assertFails(setDoc(doc(db, 'users/alice'), profile({ role: 'admin' })));
    await assertFails(setDoc(doc(db, 'users/alice'), profile({ email: 'bob@example.com' })));
    await assertFails(setDoc(doc(db, 'users/alice'), profile({ createdAt: Timestamp.now() })));
  });

  test('update keeps createdAt; delete is not allowed', async () => {
    const t = Timestamp.fromDate(new Date('2026-01-01'));
    await seed('users/alice', profile({ createdAt: t, updatedAt: t }));
    const ref = doc(asAlice(), 'users/alice');
    await assertSucceeds(updateDoc(ref, { displayName: 'Ally', updatedAt: now() }));
    await assertFails(updateDoc(ref, { createdAt: now(), updatedAt: now() }));
    await assertFails(deleteDoc(ref));
  });
});

describe('users/{uid} activeBikeId', () => {
  const seedProfile = async (overrides = {}) => {
    const t = Timestamp.fromDate(new Date('2026-01-01'));
    await seed('users/alice', profile({ createdAt: t, updatedAt: t, ...overrides }));
  };

  test('profiles without activeBikeId are still valid', async () => {
    await seedProfile();
    await assertSucceeds(updateDoc(doc(asAlice(), 'users/alice'), { displayName: 'Ally', updatedAt: now() }));
  });

  test('can be set to one of the owner\'s bikes or cleared', async () => {
    await seedProfile();
    await seedBike();
    const ref = doc(asAlice(), 'users/alice');
    await assertSucceeds(updateDoc(ref, { activeBikeId: 'bike1', updatedAt: now() }));
    await assertSucceeds(updateDoc(ref, { activeBikeId: null, updatedAt: now() }));
  });

  test('can be included when the profile is created', async () => {
    const ref = doc(asAlice(), 'users/alice');
    await assertFails(setDoc(ref, profile({ activeBikeId: 'missing' })));
    await assertSucceeds(setDoc(ref, profile({ activeBikeId: null })));
  });

  test('rejects bikes that do not exist or belong to someone else', async () => {
    await seedProfile();
    await seedBike(BOB, 'bobBike');
    const ref = doc(asAlice(), 'users/alice');
    await assertFails(updateDoc(ref, { activeBikeId: 'missing', updatedAt: now() }));
    await assertFails(updateDoc(ref, { activeBikeId: 'bobBike', updatedAt: now() }));
    await assertFails(updateDoc(ref, { activeBikeId: 42, updatedAt: now() }));
  });

  test('a stale activeBikeId does not block other edits', async () => {
    await seedProfile({ activeBikeId: 'deleted' });
    await assertSucceeds(updateDoc(doc(asAlice(), 'users/alice'), { displayName: 'Ally', updatedAt: now() }));
  });
});

describe('users/{uid} serviceIntervals', () => {
  const intervals = (overrides = {}) => ({
    oil_change: 3000,
    tires: 15000,
    brakes: 10000,
    chain: 1000,
    battery: null,
    inspection: 5000,
    repair: null,
    other: null,
    ...overrides,
  });

  const seedProfile = async (overrides = {}) => {
    const t = Timestamp.fromDate(new Date('2026-01-01'));
    await seed('users/alice', profile({ createdAt: t, updatedAt: t, ...overrides }));
  };

  test('owner can save intervals, with null to turn one off', async () => {
    await seedProfile();
    const ref = doc(asAlice(), 'users/alice');
    await assertSucceeds(updateDoc(ref, { serviceIntervals: intervals(), updatedAt: now() }));
    await assertSucceeds(updateDoc(ref, { serviceIntervals: intervals({ chain: null }), updatedAt: now() }));
  });

  test('can be included when the profile is created', async () => {
    await assertSucceeds(setDoc(doc(asAlice(), 'users/alice'), profile({ serviceIntervals: intervals() })));
  });

  test('rejects unknown types and out-of-range or fractional values', async () => {
    await seedProfile();
    const ref = doc(asAlice(), 'users/alice');
    const bad = [
      intervals({ wash: 500 }),
      intervals({ oil_change: 50 }),
      intervals({ oil_change: 100001 }),
      intervals({ oil_change: 2500.5 }),
      intervals({ oil_change: '3000' }),
    ];
    for (const serviceIntervals of bad) {
      await assertFails(updateDoc(ref, { serviceIntervals, updatedAt: now() }));
    }
    await assertFails(updateDoc(ref, { serviceIntervals: [3000], updatedAt: now() }));
  });

  test('other users cannot change them', async () => {
    await seedProfile();
    await assertFails(updateDoc(doc(asBob(), 'users/alice'), { serviceIntervals: intervals(), updatedAt: now() }));
  });
});

describe('users/{uid}/bikes/{bikeId}/odometerReadings', () => {
  const readings = (db, bikeId = 'bike1') => collection(db, `users/alice/bikes/${bikeId}/odometerReadings`);

  test('owner logs a reading together with the bike\'s odometer', async () => {
    await seedBike();
    const db = asAlice();
    const batch = writeBatch(db);
    batch.update(doc(db, 'users/alice/bikes/bike1'), { odometerKm: 13000, updatedAt: now() });
    batch.set(doc(readings(db)), { odometerKm: 13000, createdAt: now() });
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDoc(doc(db, 'users/alice/bikes/bike1')));
  });

  test('can be written in the batch that creates the bike', async () => {
    const db = asAlice();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users/alice/bikes/b1'), bike());
    batch.set(doc(readings(db, 'b1')), { odometerKm: 12500, createdAt: now() });
    await assertSucceeds(batch.commit());
  });

  test('must match the bike\'s odometer', async () => {
    await seedBike();
    const db = asAlice();
    // Bike is at 12,500; a reading alone for another value is rejected.
    await assertFails(addDoc(readings(db), { odometerKm: 13000, createdAt: now() }));
    const batch = writeBatch(db);
    batch.update(doc(db, 'users/alice/bikes/bike1'), { odometerKm: 13000, updatedAt: now() });
    batch.set(doc(readings(db)), { odometerKm: 14000, createdAt: now() });
    await assertFails(batch.commit());
  });

  test('validates fields and requires the bike', async () => {
    await seedBike();
    const db = asAlice();
    await assertFails(addDoc(readings(db, 'missing'), { odometerKm: 0, createdAt: now() }));
    await assertFails(addDoc(readings(db), { odometerKm: 12500, createdAt: Timestamp.now() }));
    await assertFails(addDoc(readings(db), { odometerKm: 12500.5, createdAt: now() }));
    await assertFails(addDoc(readings(db), { odometerKm: 12500, note: 'x', createdAt: now() }));
  });

  test('append-only for the owner; private to others', async () => {
    await seedBike();
    const t = Timestamp.now();
    await seed('users/alice/bikes/bike1/odometerReadings/r1', { odometerKm: 12500, createdAt: t });
    const ref = doc(asAlice(), 'users/alice/bikes/bike1/odometerReadings/r1');
    await assertSucceeds(getDoc(ref));
    await assertFails(updateDoc(ref, { odometerKm: 12500, createdAt: t }));
    await assertFails(getDoc(doc(asBob(), 'users/alice/bikes/bike1/odometerReadings/r1')));
    await assertFails(deleteDoc(doc(asBob(), 'users/alice/bikes/bike1/odometerReadings/r1')));
    await assertSucceeds(deleteDoc(ref));
  });
});

describe('users/{uid}/bikes', () => {
  test('owner can create, read, update and delete bikes', async () => {
    const db = asAlice();
    const ref = await assertSucceeds(addDoc(collection(db, 'users/alice/bikes'), bike()));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { odometerKm: 13000, updatedAt: now() }));
    await assertSucceeds(deleteDoc(ref));
  });

  test('other users cannot touch them', async () => {
    await seedBike();
    await assertFails(getDoc(doc(asBob(), 'users/alice/bikes/bike1')));
    await assertFails(setDoc(doc(asBob(), 'users/alice/bikes/bike2'), bike()));
    await assertFails(deleteDoc(doc(asBob(), 'users/alice/bikes/bike1')));
  });

  test('validates fields', async () => {
    const col = collection(asAlice(), 'users/alice/bikes');
    await assertFails(addDoc(col, bike({ year: 1800 })));
    await assertFails(addDoc(col, bike({ year: 2022.5 })));
    await assertFails(addDoc(col, bike({ make: '' })));
    await assertFails(addDoc(col, bike({ odometerKm: -1 })));
    await assertFails(addDoc(col, bike({ engineCc: 0 })));
    await assertFails(addDoc(col, bike({ engineCc: 3001 })));
    await assertFails(addDoc(col, bike({ engineCc: 124.5 })));
    await assertFails(addDoc(col, bike({ engineCc: '125' })));
    const { plateNumber: _omitted, ...missingField } = bike();
    await assertFails(addDoc(col, missingField));
  });

  test('photoPath must point at this bike in Storage', async () => {
    const db = asAlice();
    await assertSucceeds(
      setDoc(doc(db, 'users/alice/bikes/b1'), bike({ photoPath: 'users/alice/bikes/b1/photo.jpg' }))
    );
    await assertFails(
      setDoc(doc(db, 'users/alice/bikes/b2'), bike({ photoPath: 'users/bob/bikes/b2/photo.jpg' }))
    );
    await assertFails(
      setDoc(doc(db, 'users/alice/bikes/b3'), bike({ photoPath: 'users/alice/bikes/b1/photo.jpg' }))
    );
  });
});

describe('users/{uid}/services', () => {
  test('owner can log a service for one of their bikes', async () => {
    await seedBike();
    await assertSucceeds(addDoc(collection(asAlice(), 'users/alice/services'), service()));
  });

  test('bikeId must be an existing bike of the owner', async () => {
    await seedBike(BOB, 'bobsBike');
    const col = collection(asAlice(), 'users/alice/services');
    await assertFails(addDoc(col, service({ bikeId: 'missing' })));
    await assertFails(addDoc(col, service({ bikeId: 'bobsBike' })));
  });

  test('validates type and numbers', async () => {
    await seedBike();
    const col = collection(asAlice(), 'users/alice/services');
    await assertFails(addDoc(col, service({ type: 'wash' })));
    await assertFails(addDoc(col, service({ cost: -5 })));
    await assertFails(addDoc(col, service({ date: '2026-11-01' })));
  });

  test('validates title, notes and decimal costs', async () => {
    await seedBike();
    const col = collection(asAlice(), 'users/alice/services');
    await assertSucceeds(addDoc(col, service({ cost: 1250.5, notes: 'Shell Advance 10W-40', nextDueKm: null })));
    await assertSucceeds(addDoc(col, service({ cost: null })));
    await assertFails(addDoc(col, service({ title: '' })));
    await assertFails(addDoc(col, service({ title: 'x'.repeat(121) })));
    await assertFails(addDoc(col, service({ notes: 'x'.repeat(2001) })));
  });

  test('owner can edit and delete a service', async () => {
    await seedBike();
    const t = Timestamp.now();
    await seed('users/alice/services/s1', service({ createdAt: t, updatedAt: t }));
    const ref = doc(asAlice(), 'users/alice/services/s1');
    await assertSucceeds(updateDoc(ref, { type: 'brakes', title: 'Brake pads', cost: 900, updatedAt: now() }));
    await assertFails(updateDoc(ref, { createdAt: now(), updatedAt: now() }));
    await assertFails(deleteDoc(doc(asBob(), 'users/alice/services/s1')));
    await assertSucceeds(deleteDoc(ref));
  });

  test('can be logged in the batch that moves the bike odometer up', async () => {
    await seedBike();
    const db = asAlice();
    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'users/alice/services')), service({ odometerKm: 13200 }));
    batch.update(doc(db, 'users/alice/bikes/bike1'), { odometerKm: 13200, updatedAt: now() });
    batch.set(doc(collection(db, 'users/alice/bikes/bike1/odometerReadings')), {
      odometerKm: 13200,
      createdAt: now(),
    });
    await assertSucceeds(batch.commit());
  });

  test('other users cannot read them', async () => {
    await seedBike();
    const t = Timestamp.now();
    await seed('users/alice/services/s1', service({ createdAt: t, updatedAt: t }));
    await assertFails(getDoc(doc(asBob(), 'users/alice/services/s1')));
  });
});

describe('users/{uid}/documents', () => {
  test('owner can store document metadata', async () => {
    await assertSucceeds(setDoc(doc(asAlice(), 'users/alice/documents/doc1'), vaultDoc()));
  });

  test('storagePath must match the owner and document id', async () => {
    const db = asAlice();
    await assertFails(
      setDoc(
        doc(db, 'users/alice/documents/doc1'),
        vaultDoc({ storagePath: 'users/bob/documents/doc1/license.pdf' })
      )
    );
    await assertFails(setDoc(doc(db, 'users/alice/documents/doc2'), vaultDoc()));
  });

  test('can be linked to one of the owner\'s bikes', async () => {
    await seedBike();
    await assertSucceeds(
      setDoc(doc(asAlice(), 'users/alice/documents/doc1'), vaultDoc({ bikeId: 'bike1', type: 'registration' }))
    );
    await assertSucceeds(
      setDoc(doc(asAlice(), 'users/alice/chats/c1'), {
        title: 'Brakes squeal',
        bikeId: 'bike1',
        createdAt: now(),
        updatedAt: now(),
      })
    );
  });

  test('validates content type, size and bike', async () => {
    const ref = doc(asAlice(), 'users/alice/documents/doc1');
    await assertFails(setDoc(ref, vaultDoc({ contentType: 'application/zip' })));
    await assertFails(setDoc(ref, vaultDoc({ sizeBytes: 10 * 1024 * 1024 + 1 })));
    await assertFails(setDoc(ref, vaultDoc({ bikeId: 'missing' })));
  });
});

describe('users/{uid}/chats and messages', () => {
  test('owner can create a chat and send user messages', async () => {
    const db = asAlice();
    await assertSucceeds(
      setDoc(doc(db, 'users/alice/chats/c1'), {
        title: 'Engine noise',
        bikeId: null,
        createdAt: now(),
        updatedAt: now(),
      })
    );
    await assertSucceeds(
      addDoc(collection(db, 'users/alice/chats/c1/messages'), {
        role: 'user',
        text: 'It ticks at idle.',
        createdAt: now(),
      })
    );
  });

  test('the app cannot write assistant messages or edit messages', async () => {
    const db = asAlice();
    const messages = collection(db, 'users/alice/chats/c1/messages');
    await assertFails(addDoc(messages, { role: 'assistant', text: 'Check the valves.', createdAt: now() }));

    await seed('users/alice/chats/c1/messages/m1', {
      role: 'user',
      text: 'Hi',
      createdAt: Timestamp.now(),
    });
    await assertFails(updateDoc(doc(db, 'users/alice/chats/c1/messages/m1'), { text: 'Edited' }));
    await assertSucceeds(deleteDoc(doc(db, 'users/alice/chats/c1/messages/m1')));
  });

  test('other users cannot read or post', async () => {
    await seed('users/alice/chats/c1/messages/m1', {
      role: 'user',
      text: 'Hi',
      createdAt: Timestamp.now(),
    });
    await assertFails(getDoc(doc(asBob(), 'users/alice/chats/c1/messages/m1')));
    await assertFails(
      addDoc(collection(asBob(), 'users/alice/chats/c1/messages'), {
        role: 'user',
        text: 'Hi',
        createdAt: now(),
      })
    );
  });
});

describe('wiki', () => {
  test('signed-in users can read; nobody can write', async () => {
    await seed('wiki/chain-care', {
      kind: 'guide',
      title: 'Clean, lube and adjust the chain',
      category: 'diy',
      models: [],
      summary: 'Clean and lube every 1,000 km.',
      difficulty: 'easy',
      minutes: 30,
      tools: ['Chain brush'],
      parts: ['Chain lube'],
      steps: [{ text: 'Scrub the chain.', caution: null }],
      searchText: 'chain lube diy guide',
      updatedAt: Timestamp.now(),
    });
    await seed('wiki/honda-click-125i', {
      kind: 'spec',
      title: 'Honda Click 125i',
      category: 'specs',
      models: [{ key: 'honda:click125i', yearFrom: 2018, yearTo: null }],
      make: 'Honda',
      model: 'Click 125i',
      yearFrom: 2018,
      yearTo: null,
      engineCc: 125,
      fluids: {
        engineOil: { grade: 'SAE 10W-30, JASO MB', capacityL: 0.8 },
        gearOil: { grade: 'SAE 10W-30', capacityL: 0.12 },
        coolant: null,
        brakeFluid: 'DOT 3 or DOT 4',
      },
      tirePressure: {
        front: { soloPsi: 29, passengerPsi: 29 },
        rear: { soloPsi: 33, passengerPsi: 36 },
      },
      torque: [{ item: 'Engine oil drain bolt', nm: 24 }],
      intervals: [{ item: 'Engine oil', everyKm: 4000, everyMonths: 6 }],
      searchText: 'honda click 125i specs',
      updatedAt: Timestamp.now(),
    });
    await assertSucceeds(getDoc(doc(asAlice(), 'wiki/chain-care')));
    await assertSucceeds(getDocs(collection(asAlice(), 'wiki')));
    await assertFails(getDoc(doc(asGuest(), 'wiki/honda-click-125i')));
    await assertFails(setDoc(doc(asAlice(), 'wiki/new'), { kind: 'guide', title: 'Mine' }));
    await assertFails(updateDoc(doc(asAlice(), 'wiki/honda-click-125i'), { engineCc: 150 }));
    await assertFails(deleteDoc(doc(asAlice(), 'wiki/chain-care')));
  });
});

test('collections not in the rules are denied', async () => {
  await assertFails(setDoc(doc(asAlice(), 'admin/settings'), { open: true }));
  await assertFails(getDoc(doc(asAlice(), 'admin/settings')));
});
