'use client';
/* oxlint-disable react/set-state-in-effect -- Synchronize the Firebase auth and document subscriptions. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { firebaseClient, syncConfigured } from '@/lib/firebase';
import { mergeFields, type Fields } from '@/lib/sync';
import { useStore } from '@/lib/store';
type Sync = {
  user: User | null;
  status: string;
  error: string;
  configured: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Sync | null>(null);
export function SyncProvider({ children }: { children: ReactNode }) {
  const { fields, merge, ready } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState('Reading on this device');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [retry, setRetry] = useState(0);
  const latest = useRef(fields),
    remote = useRef<Fields>({});
  useEffect(() => {
    latest.current = fields;
  }, [fields]);
  useEffect(() => {
    if (!syncConfigured) return;
    const { auth } = firebaseClient();
    return onAuthStateChanged(auth, (account) => {
      setUser(account);
      setError('');
    });
  }, []);
  useEffect(() => {
    setConnected(false);
    remote.current = {};
    if (!user || !ready) return;
    const { db } = firebaseClient();
    setStatus('Connecting…');
    return onSnapshot(
      doc(db, 'users', user.uid, 'state', 'reading'),
      (snapshot) => {
        const cloud = snapshot.data()?.fields as Fields | undefined;
        remote.current = mergeFields({}, cloud ?? {});
        merge(remote.current);
        setConnected(true);
        setError('');
        setStatus(navigator.onLine ? 'Up to date' : 'Offline · changes saved here');
      },
      () => {
        setError('Sync could not connect. Your reading is saved on this device.');
        setConnected(false);
      },
    );
  }, [user, ready, merge, retry]);
  useEffect(() => {
    const online = () => setRetry((n) => n + 1);
    const offline = () => setStatus('Offline · changes saved here');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);
  useEffect(() => {
    if (!user || !connected || !ready) return;
    const merged = mergeFields(remote.current, fields);
    if (JSON.stringify(merged) === JSON.stringify(remote.current)) return;
    setStatus(navigator.onLine ? 'Saving…' : 'Offline · changes saved here');
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!navigator.onLine) return;
      try {
        const { db } = firebaseClient();
        const target = doc(db, 'users', user.uid, 'state', 'reading');
        const result = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(target);
          const mergedFields = mergeFields(snapshot.data()?.fields ?? {}, latest.current);
          transaction.set(target, { schema: 2, fields: mergedFields });
          return mergedFields;
        });
        if (!cancelled) {
          remote.current = result;
          merge(result);
          setError('');
          setStatus('Up to date');
        }
      } catch {
        if (!cancelled) {
          setError('Sync paused. Changes are saved here; reconnect to retry.');
          setStatus('Saved on this device');
        }
      }
    }, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fields, user, connected, ready, merge, retry]);
  const login = async () => {
    setError('');
    try {
      const { auth } = firebaseClient();
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user')
        setError(
          code === 'auth/popup-blocked'
            ? 'Allow the sign-in window and try again.'
            : 'Google sign-in could not finish. Please try again.',
        );
    }
  };
  const logout = async () => {
    try {
      await signOut(firebaseClient().auth);
      setStatus('Reading on this device');
    } catch {
      setError('Could not sign out. Please try again.');
    }
  };
  return (
    <Context value={{ user, status, error, configured: syncConfigured, login, logout }}>
      {children}
    </Context>
  );
}
export function useSync() {
  const context = useContext(Context);
  if (!context) throw new Error('SyncProvider missing');
  return context;
}
