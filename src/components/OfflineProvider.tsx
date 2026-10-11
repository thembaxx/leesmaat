'use client';
/* oxlint-disable react/set-state-in-effect -- Synchronize service-worker and browser connectivity state. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { downloadItem, offlineItems, removeDownload } from '@/lib/offline';
import type { Item } from '@/lib/data';
import { useStore } from '@/lib/store';
type Offline = {
  items: Item[];
  online: boolean;
  available: boolean;
  busy: string | null;
  error: string;
  download: (item: Item) => Promise<void>;
  remove: (id: string) => Promise<void>;
};
const Context = createContext<Offline | null>(null);
export function OfflineProvider({ children }: { children: ReactNode }) {
  const { set, ready } = useStore();
  const [items, setItems] = useState<Item[]>([]),
    [online, setOnline] = useState(true),
    [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    setOnline(navigator.onLine);
    const change = () => setOnline(navigator.onLine);
    window.addEventListener('online', change);
    window.addEventListener('offline', change);
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then(() => setAvailable(!!navigator.serviceWorker.controller))
        .catch(() => setError('Offline reading could not prepare. Reconnect and reload to retry.'));
    }
    const controlled = () => setAvailable(true);
    navigator.serviceWorker?.addEventListener('controllerchange', controlled);
    return () => {
      window.removeEventListener('online', change);
      window.removeEventListener('offline', change);
      navigator.serviceWorker?.removeEventListener('controllerchange', controlled);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    offlineItems()
      .then((saved) => {
        if (live) {
          setItems(saved);
          set({ dl: saved.map((item) => item.id) });
        }
      })
      .catch(() => {
        if (live) {
          set({ dl: [] });
          setError('Your browser could not open offline storage.');
        }
      });
    return () => {
      live = false;
    };
  }, [ready, set]);
  const download = async (item: Item) => {
    setBusy(item.id);
    setError('');
    try {
      await downloadItem(item);
      setItems((old) => [...old.filter((i) => i.id !== item.id), item]);
      set((old) => ({ dl: [...new Set([...old.dl, item.id])] }));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Download failed. Check your storage space and try again.',
      );
    } finally {
      setBusy(null);
    }
  };
  const remove = async (id: string) => {
    setBusy(id);
    setError('');
    try {
      await removeDownload(id);
      setItems((old) => old.filter((i) => i.id !== id));
      set((old) => ({ dl: old.dl.filter((key) => key !== id) }));
    } catch {
      setError('Could not remove this download. Please try again.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <Context value={{ items, online, available, busy, error, download, remove }}>
      {children}
    </Context>
  );
}
export function useOffline() {
  const context = useContext(Context);
  if (!context) throw new Error('OfflineProvider missing');
  return context;
}
