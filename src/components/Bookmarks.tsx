'use client';
import { useState, type ReactNode } from 'react';
import { LIBRARY } from '@/lib/data';
import { useStore } from '@/lib/store';
import { ItemRow } from './Cover';
import { useOffline } from './OfflineProvider';
import { chip } from './Sheets';
const TABS = ['Saved', 'Words', 'Notes', 'Archive'] as const;
const Empty = ({ children }: { children: string }) => (
  <p className="py-8 text-center text-[13px] text-mu">{children}</p>
);
const Card = ({ children }: { children: ReactNode }) => (
  <div className="squircle mb-2.5 rounded-[22px] bg-sf p-4 shadow-[inset_0_0_0_1px_var(--ln)]">
    {children}
  </div>
);
export function Bookmarks({ onOpen }: { onOpen: (id: string) => void }) {
  const { s, set } = useStore(),
    offline = useOffline();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Saved');
  const items = LIBRARY.filter((i) => s.sv.includes(i.id));
  return (
    <div className="absolute inset-0 animate-rise overflow-y-auto px-5 pt-4 pb-32">
      <h1 className="mb-3.5 text-3xl font-bold tracking-tight">Bookmarks</h1>
      <div className="mb-3.5 flex rounded-[14px] bg-ln p-[3px]">
        {TABS.map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-[11px] p-2 text-[13px] font-semibold ${tab === t ? 'bg-sf shadow' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Saved' &&
        (items.length ? (
          items.map((i) => <ItemRow key={i.id} item={i} onOpen={onOpen} />)
        ) : (
          <Empty>Tap the bookmark while reading to keep something here.</Empty>
        ))}
      {tab === 'Words' &&
        (s.wd.length ? (
          s.wd.map((word) => (
            <Card key={word.id}>
              <b lang={word.g} className="font-serif text-xl">
                {word.w}
              </b>
              <p className="font-serif text-[17px]">{word.d}</p>
              <p className="text-[13px] text-mu">{[word.t, word.u].filter(Boolean).join(' · ')}</p>
              <button
                aria-label={`Remove word ${word.w}`}
                onClick={() =>
                  set((old) => ({
                    wd: old.wd.filter((w) => w.id !== word.id),
                    reviews: Object.fromEntries(
                      Object.entries(old.reviews).filter(([id]) => id !== word.id),
                    ),
                  }))
                }
                className={`${chip(false)} mt-3`}
              >
                Remove
              </button>
            </Card>
          ))
        ) : (
          <Empty>Tap a word while reading, then save it.</Empty>
        ))}
      {tab === 'Words' && s.wd.length > 0 && (
        <p className="mb-5 text-xs text-mu">
          Dictionary definitions:{' '}
          <a
            href="https://kaikki.org/dictionary/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Wiktionary via Kaikki
          </a>{' '}
          ·{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="underline">
            CC BY-SA 4.0 / GFDL
          </a>
        </p>
      )}
      {tab === 'Notes' &&
        (s.nt.length ? (
          s.nt.map((note) => (
            <Card key={note.id}>
              <p className="font-serif text-[17px]">{note.n}</p>
              <p className="mt-1 text-[13px] text-mu">
                “{note.q.slice(0, 60)}” · {note.f}
              </p>
              <div className="mt-3 flex gap-2">
                {note.itemId && (
                  <button onClick={() => onOpen(note.itemId!)} className={chip(false)}>
                    Open reading
                  </button>
                )}
                <button
                  aria-label={`Remove note ${note.n.slice(0, 30)}`}
                  onClick={() => set((old) => ({ nt: old.nt.filter((n) => n.id !== note.id) }))}
                  className={chip(false)}
                >
                  Remove
                </button>
              </div>
            </Card>
          ))
        ) : (
          <Empty>Select text while reading to add a note.</Empty>
        ))}
      {tab === 'Archive' && (
        <>
          <p className="mb-3 text-sm text-mu">
            {offline.online
              ? 'Downloaded reads stay available without a connection.'
              : 'You’re offline. Your downloads are ready to read.'}
          </p>
          {offline.items.length ? (
            offline.items.map((item) => (
              <div key={item.id}>
                <ItemRow item={item} onOpen={onOpen} />
                <button
                  disabled={offline.busy !== null}
                  aria-label={`Remove download ${item.t}`}
                  onClick={() => offline.remove(item.id)}
                  className={`${chip(false)} mb-4`}
                >
                  Remove download
                </button>
              </div>
            ))
          ) : (
            <Empty>Download a read from its reading settings to keep it here.</Empty>
          )}
          {offline.error && (
            <p role="alert" className="text-sm">
              {offline.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
