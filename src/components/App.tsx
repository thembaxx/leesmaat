'use client';
/* oxlint-disable react/set-state-in-effect -- Read and follow native browser history. */
import { useEffect, useState } from 'react';
import { LIBRARY } from '@/lib/data';
import { StoreProvider, useStore } from '@/lib/store';
import { OfflineProvider, useOffline } from './OfflineProvider';
import { SyncProvider } from './SyncProvider';
import { Celebration } from './Celebration';
import { Bookmarks } from './Bookmarks';
import { FloatingNav, type Tab } from './FloatingNav';
import { Home } from './Home';
import { Onboarding } from './Onboarding';
import { Practice } from './Practice';
import { Reader } from './Reader';
import { AppLoading } from './Brand';
import { PwaStatus } from './PwaControls';

function Shell() {
  const { s, ready, storageError } = useStore();
  const offline = useOffline();
  const [tab, setTab] = useState<Tab>('home');
  const [open, setOpen] = useState<string | null>(null);
  const item = offline.items.find((i) => i.id === open) ?? LIBRARY.find((i) => i.id === open);
  useEffect(() => {
    const readLocation = () => {
      const url = new URL(location.href);
      const value = url.searchParams.get('tab');
      setTab(value === 'practice' || value === 'bookmarks' ? value : 'home');
      setOpen(url.searchParams.get('read'));
    };
    readLocation();
    window.addEventListener('popstate', readLocation);
    return () => window.removeEventListener('popstate', readLocation);
  }, []);
  const navigate = (id: string | null, nextTab = tab) => {
    const url = new URL(location.href);
    url.searchParams.delete('read');
    url.searchParams.delete('tab');
    if (id) url.searchParams.set('read', id);
    if (nextTab !== 'home') url.searchParams.set('tab', nextTab);
    history.pushState({ leesmaat: true, reader: !!id }, '', url);
    setOpen(id);
    setTab(nextTab);
  };
  const closeReader = () => {
    if (history.state?.reader) history.back();
    else navigate(null);
  };
  if (!ready) return <AppLoading />;

  return (
    <main className="app-frame">
      {storageError && (
        <p role="alert" className="absolute inset-x-0 top-0 z-40 bg-sf p-3 text-sm">
          This browser could not save your progress. Allow local storage to keep it.
        </p>
      )}
      <div className="contents" inert={!!item || !s.ob} aria-hidden={!!item || !s.ob}>
        {tab === 'home' && <Home onOpen={(id) => navigate(id)} />}
        {tab === 'practice' && <Practice />}
        {tab === 'bookmarks' && <Bookmarks onOpen={(id) => navigate(id)} />}
        <PwaStatus />
        <FloatingNav tab={tab} onChange={(next) => navigate(null, next)} />
      </div>
      <Celebration />
      {item && s.ob && <Reader key={item.id} item={item} onClose={closeReader} />}
      {!s.ob && <Onboarding />}
    </main>
  );
}

export function App() {
  return (
    <StoreProvider>
      <SyncProvider>
        <OfflineProvider>
          <Shell />
        </OfflineProvider>
      </SyncProvider>
    </StoreProvider>
  );
}
