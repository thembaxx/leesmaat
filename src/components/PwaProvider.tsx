'use client';
/* oxlint-disable react/set-state-in-effect -- Follow browser installation, connectivity, and worker state. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type Pwa = {
  online: boolean;
  available: boolean;
  error: string;
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
const Context = createContext<Pwa | null>(null);

// Lives in the root layout so public library pages prepare the app for offline use too.
export function PwaProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState('');
  const [updateReady, setUpdateReady] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const installEvent = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    const display = matchMedia('(display-mode: standalone), (display-mode: minimal-ui)');
    const checkInstalled = () =>
      setInstalled(
        display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    checkInstalled();
    setOnline(navigator.onLine);
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );
    display.addEventListener('change', checkInstalled, options);
    window.addEventListener(
      'beforeinstallprompt',
      (event) => {
        event.preventDefault();
        installEvent.current = event as InstallEvent;
        setInstallable(true);
      },
      options,
    );
    window.addEventListener(
      'appinstalled',
      () => {
        installEvent.current = null;
        setInstallable(false);
        setInstalled(true);
      },
      options,
    );

    const workers = navigator.serviceWorker;
    setAvailable(!!workers?.controller);
    let controlledBefore = !!workers?.controller;
    let reloading = false;
    const controlled = () => {
      setAvailable(!!workers.controller);
      setUpdateReady(false);
      setError('');
      if (controlledBefore && !reloading) {
        reloading = true;
        location.reload();
      }
      controlledBefore = !!workers.controller;
    };
    workers?.addEventListener('controllerchange', controlled, options);

    let preparing = false;
    const prepare = async () => {
      if (
        process.env.NODE_ENV !== 'production' ||
        !workers ||
        preparing ||
        document.hidden ||
        !navigator.onLine
      )
        return;
      preparing = true;
      try {
        const reg = await workers.register('/sw.js', { scope: '/', updateViaCache: 'none' });
        if (listeners.signal.aborted) return;
        if (registration.current !== reg) {
          registration.current = reg;
          const watch = () => {
            const worker = reg.installing;
            worker?.addEventListener(
              'statechange',
              () => {
                setUpdateReady(!!reg.waiting);
                if (worker.state === 'redundant' && !workers.controller)
                  setError('Offline reading could not prepare. Reconnect and reload to retry.');
              },
              options,
            );
          };
          reg.addEventListener('updatefound', watch, options);
          watch();
        }
        setAvailable(!!workers.controller);
        setUpdateReady(!!reg.waiting);
        setError('');
        await reg.update();
      } catch {
        if (!listeners.signal.aborted && !workers.controller)
          setError('Offline reading could not prepare. Reconnect and reload to retry.');
      } finally {
        preparing = false;
      }
    };
    const connectivity = () => {
      setOnline(navigator.onLine);
      void prepare();
    };
    window.addEventListener('online', connectivity, options);
    window.addEventListener('offline', connectivity, options);
    document.addEventListener('visibilitychange', () => void prepare(), options);
    void prepare();
    return () => {
      listeners.abort();
      registration.current = null;
    };
  }, []);

  const install = async () => {
    const event = installEvent.current;
    if (!event) return;
    // A browser install prompt can be used only once, including when it is dismissed.
    installEvent.current = null;
    setInstallable(false);
    setError('');
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      setError(
        'Installation could not open. Use your browser’s Install or Add to Home Screen menu.',
      );
    }
  };
  const applyUpdate = () => registration.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  return (
    <Context
      value={{
        online,
        available,
        error,
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

export function usePwa() {
  const context = useContext(Context);
  if (!context) throw new Error('PwaProvider missing');
  return context;
}
