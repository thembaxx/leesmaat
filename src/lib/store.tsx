'use client';
/* oxlint-disable react/set-state-in-effect -- Hydrate from browser storage after the server and client initial render. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { INIT, hydrateState, type State } from './state';
import { applyFields, mergeFields, seedFields, stampChanges, type Fields } from './sync';
import { today } from './text';
import { syncBrowserTheme } from './theme';
export type { State } from './state';
type Patch = Partial<State> | ((s: State) => Partial<State>);
type Ctx = {
  s: State;
  set: (p: Patch) => void;
  ready: boolean;
  fields: Fields;
  merge: (fields: Fields) => void;
  storageError: boolean;
};
const C = createContext<Ctx | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [snapshot, update] = useState({ s: INIT, fields: {} as Fields });
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const device = useRef('');
  useEffect(() => {
    device.current = crypto.randomUUID();
    try {
      const id = localStorage.getItem('lm-device');
      if (id) device.current = id;
      else localStorage.setItem('lm-device', device.current);
      const s = hydrateState(JSON.parse(localStorage.getItem('lm') ?? '{}'));
      const stored = JSON.parse(localStorage.getItem('lm-fields') ?? '{}');
      const fields = mergeFields(seedFields(s, device.current, 0), stored);
      update({ s: applyFields(s, fields), fields });
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('lm', JSON.stringify(snapshot.s));
      localStorage.setItem('lm-fields', JSON.stringify(snapshot.fields));
    } catch {
      setStorageError(true);
    }
  }, [snapshot, ready]);
  const merge = useCallback(
    (remote: Fields) =>
      update((old) => {
        const fields = mergeFields(old.fields, remote);
        if (JSON.stringify(fields) === JSON.stringify(old.fields)) return old;
        return { s: applyFields(old.s, fields), fields };
      }),
    [],
  );
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key === 'lm-fields' && event.newValue) {
        try {
          merge(JSON.parse(event.newValue));
        } catch {
          /* ignore malformed other-tab data */
        }
      }
    };
    const rollover = () =>
      update((old) => {
        if (old.s.day === today()) return old;
        const s = { ...old.s, day: today(), secs: 0 };
        return { s, fields: stampChanges(old.s, s, old.fields, device.current) };
      });
    window.addEventListener('storage', receive);
    const id = window.setInterval(rollover, 30000);
    return () => {
      window.removeEventListener('storage', receive);
      window.clearInterval(id);
    };
  }, [merge]);
  const s = snapshot.s;
  useEffect(() => {
    if (!ready) return;
    const r = document.documentElement;
    if (s.theme) r.dataset.theme = s.theme;
    else delete r.dataset.theme;
    r.toggleAttribute('data-mono', s.mono);
    r.style.setProperty('--fs', `${s.fs}px`);
    syncBrowserTheme(s.theme);
    const preference = matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => syncBrowserTheme(s.theme);
    preference.addEventListener('change', updateTheme);
    return () => preference.removeEventListener('change', updateTheme);
  }, [s.theme, s.mono, s.fs, s.lang, ready]);
  const set = useCallback(
    (p: Patch) =>
      update((old) => {
        const next = hydrateState({ ...old.s, ...(typeof p === 'function' ? p(old.s) : p) });
        return { s: next, fields: stampChanges(old.s, next, old.fields, device.current) };
      }),
    [],
  );
  return <C value={{ s, set, ready, fields: snapshot.fields, merge, storageError }}>{children}</C>;
}
export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error('StoreProvider is missing');
  return c;
}
