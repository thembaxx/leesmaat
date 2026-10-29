'use client';
/* oxlint-disable react/set-state-in-effect -- Synchronize the Firebase auth and document subscriptions. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
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
  emailLinkEnabled: boolean;
  sendEmailLink: (email: string) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Sync | null>(null);
const emailLinkEnabled =
  syncConfigured && process.env.NEXT_PUBLIC_FIREBASE_EMAIL_LINK_ENABLED === 'true';
const PENDING_EMAIL_KEY = 'leesmaat-email-link-address';
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
  const sendEmailLink = async (email: string) => {
    if (!emailLinkEnabled) throw new Error('Email link sign-in is not enabled.');
    const address = email.trim().toLowerCase();
    setError('');
    try {
      const { auth } = firebaseClient();
      await sendSignInLinkToEmail(auth, address, {
        url: new URL('/', window.location.origin).href,
        handleCodeInApp: true,
      });
      try {
        window.sessionStorage.setItem(PENDING_EMAIL_KEY, address);
      } catch {
        // Cross-browser completion will explicitly request the email address.
      }
      setStatus('Check your inbox for your Leesmaat sign-in link.');
    } catch {
      setError('We could not send a sign-in link. Check your address or try Google sign-in.');
      throw new Error('Unable to send an email sign-in link.');
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
    <Context
      value={{
        user,
        status,
        error,
        configured: syncConfigured,
        emailLinkEnabled,
        sendEmailLink,
        login,
        logout,
      }}
    >
      {children}
      <EmailLinkFinish />
    </Context>
  );
}
export function useSync() {
  const context = useContext(Context);
  if (!context) throw new Error('SyncProvider missing');
  return context;
}

/** One-time email action links must be completed with the original mailbox.
 * Never pass an email address in the link URL or trust a query-string identity.
 */
function EmailLinkFinish() {
  const [link, setLink] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!emailLinkEnabled) return;
    try {
      const { auth } = firebaseClient();
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      setLink(window.location.href);
      setEmail(window.sessionStorage.getItem(PENDING_EMAIL_KEY) || '');
    } catch {
      setError('Could not inspect your sign-in link. Please try again.');
    }
  }, []);
  useEffect(() => {
    if (link && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [link]);
  if (!link) return null;

  async function finish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!link || busy || !email.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { auth } = firebaseClient();
      await signInWithEmailLink(auth, email.trim(), link);
      try {
        window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
      } catch {
        /* ignored */
      }
      // The action code is sensitive. Remove it from the visible browser URL after use.
      window.history.replaceState(window.history.state, '', window.location.pathname);
      dialog.current?.close();
      setLink(null);
    } catch {
      setError(
        'The email and link did not match, or the link expired. Confirm the inbox address or request a new link.',
      );
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    dialog.current?.close();
    window.history.replaceState(window.history.state, '', window.location.pathname);
    setLink(null);
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="leesmaat-email-link-heading"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      className="squircle fixed inset-0 m-auto w-[min(24rem,calc(100vw-2rem))] rounded-[26px] bg-sf p-6 text-ink shadow-2xl backdrop:bg-black/45"
    >
      <h2 id="leesmaat-email-link-heading" className="text-xl font-bold">
        Finish signing in
      </h2>
      <p className="my-3 text-sm text-mu">
        Confirm the same email address that received the Leesmaat link. On another device or
        browser, type that address again.
      </p>
      <form onSubmit={finish} className="flex flex-col gap-3">
        <label className="text-sm font-semibold" htmlFor="leesmaat-email-confirm">
          Email address
        </label>
        <input
          id="leesmaat-email-confirm"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 rounded-xl border border-ln bg-bg px-3 text-ink"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-xl bg-ink px-4 font-semibold text-bg"
        >
          {busy ? 'Checking your link…' : 'Verify and sign in'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 rounded-xl bg-ln px-4 text-sm font-semibold"
        >
          Not now
        </button>
      </form>
    </dialog>
  );
}
