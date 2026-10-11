import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { INIT } from '../../src/lib/state';
import { applyFields, mergeFields, seedFields, stampChanges } from '../../src/lib/sync';
let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-leesmaat',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
after(async () => {
  await env.cleanup();
});
test('users can access their own state; anonymous and other-account access are denied', async () => {
  const owner = env.authenticatedContext('learner-one').firestore(),
    stranger = env.authenticatedContext('learner-two').firestore();
  const target = doc(owner, 'users/learner-one/state/reading');
  await assertSucceeds(setDoc(target, { schema: 2, fields: seedFields(INIT, 'one') }));
  await assertSucceeds(getDoc(target));
  await assertFails(getDoc(doc(stranger, 'users/learner-one/state/reading')));
  await assertFails(
    setDoc(doc(stranger, 'users/learner-one/state/reading'), { schema: 2, fields: {} }),
  );
  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), 'users/learner-one/state/reading')),
  );
});
test('invalid schema and unexpected data are rejected', async () => {
  const target = doc(
    env.authenticatedContext('learner-three').firestore(),
    'users/learner-three/state/reading',
  );
  await assertFails(setDoc(target, { schema: 1, fields: {} }));
  await assertFails(setDoc(target, { schema: 2, fields: [], email: 'unneeded' }));
});
test('two devices transactionally merge independent edits without losing either bookmark', async () => {
  const one = env.authenticatedContext('shared-user').firestore(),
    two = env.authenticatedContext('shared-user').firestore();
  const base = seedFields(INIT, 'base');
  const a = stampChanges(INIT, { ...INIT, sv: ['e1'] }, base, 'one', 10),
    b = stampChanges(INIT, { ...INIT, sv: ['a1'] }, base, 'two', 11);
  const save = (db: typeof one, fields: typeof a) =>
    runTransaction(db, async (tx) => {
      const target = doc(db, 'users/shared-user/state/reading'),
        snap = await tx.get(target);
      tx.set(target, { schema: 2, fields: mergeFields(snap.data()?.fields ?? {}, fields) });
    });
  await Promise.all([save(one, a), save(two, b)]);
  const snapshot = await getDoc(doc(one, 'users/shared-user/state/reading'));
  assert.deepEqual(applyFields(INIT, snapshot.data()!.fields).sv.sort(), ['a1', 'e1']);
});
