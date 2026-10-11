'use client';
import { useState } from 'react';
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

function Shell() {
  const { s, ready, storageError } = useStore();
  const offline = useOffline();
  const [tab, setTab] = useState<Tab>('home');
  const [open, setOpen] = useState<string | null>(null);
  const item = offline.items.find((i) => i.id === open) ?? LIBRARY.find((i) => i.id === open);
  if (!ready) return <output className="p-8 text-center">Opening your library…</output>; // wait for localStorage so server and client markup never disagree

  return (
    <main className="relative mx-auto h-dvh max-w-md overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {storageError && (
        <p role="alert" className="absolute inset-x-0 top-0 z-40 bg-sf p-3 text-sm">
          This browser could not save your progress. Allow local storage to keep it.
        </p>
      )}
      <div className="contents" inert={!!item || !s.ob} aria-hidden={!!item || !s.ob}>
        {tab === 'home' && <Home onOpen={setOpen} />}
        {tab === 'practice' && <Practice />}
        {tab === 'bookmarks' && <Bookmarks onOpen={setOpen} />}
        <FloatingNav tab={tab} onChange={setTab} />
      </div>
      <Celebration />
      {item && s.ob && <Reader key={item.id} item={item} onClose={() => setOpen(null)} />}
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
