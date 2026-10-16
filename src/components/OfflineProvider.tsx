'use client';
/* oxlint-disable react/set-state-in-effect -- Reconcile saved downloads with browser storage after hydration. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { completeDownload } from '@/lib/books';
import { downloadItem, offlineItems, removeDownload } from '@/lib/offline';
import type { Item } from '@/lib/data';
import { useStore } from '@/lib/store';
import { usePwa, type Pwa } from './PwaProvider';
type Offline = Pwa & {
  items: Item[];
  busy: string | null;
  download: (item: Item) => Promise<void>;
  remove: (id: string) => Promise<void>;
};
const Context = createContext<Offline | null>(null);
export function OfflineProvider({ children }: { children: ReactNode }) {
  const { set, ready } = useStore();
  const pwa = usePwa();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
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
      item = await completeDownload(item);
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
    <Context
      value={{
        ...pwa,
        items,
        busy,
        error: error || pwa.error,
        download,
        remove,
      }}
    >
      {children}
    </Context>
  );
}
export function useOffline() {
  const context = useContext(Context);
  if (!context) throw new Error('OfflineProvider missing');
  return context;
}
