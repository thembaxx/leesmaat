'use client';
/* oxlint-disable react/set-state-in-effect -- Synchronize service-worker and browser connectivity state. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
  updateReady: boolean;
  applyUpdate: () => void;
  installable: boolean;
  installed: boolean;
  ios: boolean;
  install: () => Promise<void>;
};
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const Context = createContext<Offline | null>(null);
export function OfflineProvider({ children }: { children: ReactNode }) {
  const { set, ready } = useStore();
  const [items, setItems] = useState<Item[]>([]),
    [online, setOnline] = useState(true),
    [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState('');
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const installEvent = useRef<InstallEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setOnline(navigator.onLine);
    const change = () => setOnline(navigator.onLine);
    window.addEventListener('online', change);
    window.addEventListener('offline', change);
    const standalone = matchMedia('(display-mode: standalone)');
    const checkInstalled = () =>
      setInstalled(
        standalone.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    checkInstalled();
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      installEvent.current = event as InstallEvent;
      setInstallable(true);
    };
    const didInstall = () => {
      installEvent.current = null;
      setInstallable(false);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', didInstall);
    standalone.addEventListener('change', checkInstalled);
    let live = true;
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          if (!live) return;
          registration.current = reg;
          setUpdateReady(!!reg.waiting);
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            worker?.addEventListener('statechange', () => {
              if (live && worker.state === 'installed' && navigator.serviceWorker.controller)
                setUpdateReady(!!reg.waiting);
            });
          });
          return navigator.serviceWorker.ready;
        })
        .then(() => setAvailable(!!navigator.serviceWorker.controller))
        .catch(() => setError('Offline reading could not prepare. Reconnect and reload to retry.'));
    }
    let controlledBefore = !!navigator.serviceWorker?.controller;
    const controlled = () => {
      setAvailable(true);
      if (controlledBefore) location.reload();
      controlledBefore = true;
    };
    const checkUpdate = () => {
      if (!document.hidden && navigator.onLine) void registration.current?.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', checkUpdate);
    window.addEventListener('online', checkUpdate);
    navigator.serviceWorker?.addEventListener('controllerchange', controlled);
    return () => {
      live = false;
      window.removeEventListener('online', change);
      window.removeEventListener('offline', change);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', didInstall);
      standalone.removeEventListener('change', checkInstalled);
      document.removeEventListener('visibilitychange', checkUpdate);
      window.removeEventListener('online', checkUpdate);
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
  const install = async () => {
    const event = installEvent.current;
    if (!event) return;
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      setError(
        'Installation could not open. Use your browser’s Install or Add to Home Screen menu.',
      );
    } finally {
      installEvent.current = null;
      setInstallable(false);
    }
  };
  const applyUpdate = () => registration.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  return (
    <Context
      value={{
        items,
        online,
        available,
        busy,
        error,
        download,
        remove,
        updateReady,
        applyUpdate,
        installable,
        installed,
        ios,
        install,
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
