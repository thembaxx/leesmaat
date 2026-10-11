import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
test('Google credentials resolve to the same learner on two devices and sign-out works', async () => {
  const apps = [
    initializeApp({ apiKey: 'test-key', projectId: 'demo-leesmaat' }, 'auth-device-one'),
    initializeApp({ apiKey: 'test-key', projectId: 'demo-leesmaat' }, 'auth-device-two'),
  ];
  try {
    const auths = apps.map((app) => {
      const auth = getAuth(app);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      return auth;
    });
    const payload = {
      sub: 'google-learner-123',
      email: 'learner@example.test',
      email_verified: true,
      name: 'Test learner',
      aud: 'demo-leesmaat',
      iss: 'https://accounts.google.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.`;
    const users = await Promise.all(
      auths.map((auth) => signInWithCredential(auth, GoogleAuthProvider.credential(token))),
    );
    assert.equal(users[0]!.user.uid, users[1]!.user.uid);
    assert.equal(users[0]!.user.providerData[0]!.providerId, 'google.com');
    await signOut(auths[0]!);
    assert.equal(auths[0]!.currentUser, null);
  } finally {
    await Promise.all(apps.map((app) => deleteApp(app)));
  }
});
