// Cloud Storage security rules tests. Run with `pnpm test:rules` (starts the emulator).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';

let env;

const MB = 1024 * 1024;
const bytes = (size = 16) => new Uint8Array(size);

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mototrack',
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearStorage();
});

const asAlice = () => env.authenticatedContext('alice').storage();
const asBob = () => env.authenticatedContext('bob').storage();
const asGuest = () => env.unauthenticatedContext().storage();

const upload = (storage, path, contentType, size) =>
  uploadBytes(ref(storage, path), bytes(size), { contentType });

/** Uploads as an admin (rules disabled), for test setup. */
async function seed(path, contentType = 'image/jpeg') {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await upload(ctx.storage(), path, contentType);
  });
}

describe('users/{uid}/bikes', () => {
  const path = 'users/alice/bikes/bike1/photo.jpg';

  test('owner can upload, read and delete an image', async () => {
    await assertSucceeds(upload(asAlice(), path, 'image/jpeg'));
    await assertSucceeds(getBytes(ref(asAlice(), path)));
    await assertSucceeds(deleteObject(ref(asAlice(), path)));
  });

  test('rejects non-images and files over 5 MB', async () => {
    await assertFails(upload(asAlice(), 'users/alice/bikes/bike1/a.pdf', 'application/pdf'));
    await assertFails(upload(asAlice(), path, 'image/jpeg', 5 * MB + 1));
  });

  test('other users and guests are denied', async () => {
    await seed(path);
    await assertFails(getBytes(ref(asBob(), path)));
    await assertFails(getBytes(ref(asGuest(), path)));
    await assertFails(upload(asBob(), 'users/alice/bikes/bike1/x.jpg', 'image/jpeg'));
    await assertFails(deleteObject(ref(asBob(), path)));
  });
});

describe('users/{uid}/documents', () => {
  test('owner can upload PDFs and images up to 10 MB', async () => {
    await assertSucceeds(upload(asAlice(), 'users/alice/documents/d1/or.pdf', 'application/pdf'));
    await assertSucceeds(upload(asAlice(), 'users/alice/documents/d2/scan.png', 'image/png', 6 * MB));
  });

  test('rejects other types and files over 10 MB', async () => {
    await assertFails(upload(asAlice(), 'users/alice/documents/d1/a.zip', 'application/zip'));
    await assertFails(upload(asAlice(), 'users/alice/documents/d1/big.pdf', 'application/pdf', 10 * MB + 1));
  });

  test('other users are denied', async () => {
    await seed('users/alice/documents/d1/or.pdf', 'application/pdf');
    await assertFails(getBytes(ref(asBob(), 'users/alice/documents/d1/or.pdf')));
  });
});

describe('wiki', () => {
  test('signed-in users can read; nobody can write', async () => {
    await seed('wiki/chain/cover.jpg');
    await assertSucceeds(getBytes(ref(asAlice(), 'wiki/chain/cover.jpg')));
    await assertFails(getBytes(ref(asGuest(), 'wiki/chain/cover.jpg')));
    await assertFails(upload(asAlice(), 'wiki/chain/new.jpg', 'image/jpeg'));
  });
});

test('paths not in the rules are denied', async () => {
  await assertFails(upload(asAlice(), 'public/anything.jpg', 'image/jpeg'));
  await assertFails(upload(asAlice(), 'users/alice/other/x.jpg', 'image/jpeg'));
});
