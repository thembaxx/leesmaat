'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { DICT, LEVELS, type Item, type Lang } from '@/lib/data';
import { norm } from '@/lib/text';
import { useStore, type State } from '@/lib/store';
import { useOffline } from './OfflineProvider';
import { useSync } from './SyncProvider';
export const chip = (on: boolean) =>
  `rounded-full px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${on ? 'bg-ink text-bg' : 'bg-ln'}`;
export function Sheet({
  open,
  onClose,
  children,
  title = 'Reading options',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const element = dialog.current,
      previous = document.activeElement as HTMLElement | null;
    if (open && element && !element.open) element.showModal();
    return () => {
      if (element?.open) element.close();
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}

      className="squircle fixed inset-x-0 top-auto bottom-2 mx-auto max-h-[85dvh] w-[calc(100%-16px)] max-w-[432px] overflow-auto rounded-[34px] bg-sf p-0 text-ink shadow-2xl backdrop:bg-black/40"
    >
      <div className="px-5 pt-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 id={titleId} className="text-sm font-semibold text-mu">
            {title}
          </h2>
          <button onClick={onClose} className={chip(false)}>
            Done
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
const THEMES: [State['theme'], string][] = [
  ['', 'Auto'],
  ['paper', 'Paper'],
  ['sepia', 'Sepia'],
  ['night', 'Night'],
];
const SPEEDS = [0.8, 1, 1.25, 1.5, 2];
export function SettingsPanel({ reader }: { reader?: { item: Item; onZen: () => void } }) {
  const { s, set } = useStore(),
    offline = useOffline(),
    sync = useSync();
  const downloaded = reader && s.dl.includes(reader.item.id);
  return (
    <div>
      <h3 className="mb-2.5 text-lg font-bold">Reading</h3>
      <label className="my-3.5 flex items-center gap-3">
        <span className="font-serif text-sm">A</span>
        <input
          aria-label="Font size"
          type="range"
          min={15}
          max={30}
          value={s.fs}
          onChange={(e) => set({ fs: +e.target.value })}
          className="flex-1 accent-ac"
        />
        <span className="font-serif text-[22px]">A</span>
      </label>
      <div className="flex rounded-[14px] bg-ln p-[3px]">
        {THEMES.map(([v, n]) => (
          <button
            key={n}
            aria-pressed={s.theme === v}
            onClick={() => set({ theme: v })}
            className={`flex-1 rounded-[11px] p-2 text-[13px] font-semibold ${s.theme === v ? 'bg-sf shadow' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
      <label className="my-3.5 flex items-center justify-between">
        Monochrome
        <input
          type="checkbox"
          checked={s.mono}
          onChange={(e) => set({ mono: e.target.checked })}
          className="size-5 accent-ac"
        />
      </label>
      <p className="text-[13px] text-mu">Read-aloud speed</p>
      <div className="my-2.5 flex gap-2 overflow-x-auto">
        {SPEEDS.map((v) => (
          <button
            key={v}
            aria-pressed={s.sp === v}
            onClick={() => set({ sp: v })}
            className={chip(s.sp === v)}
          >
            {v}×
          </button>
        ))}
      </div>
      {reader ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button onClick={reader.onZen} className={chip(false)}>
              Zen mode
            </button>
            <button
              disabled={offline.busy !== null || (!downloaded && !offline.available)}
              onClick={() =>
                downloaded ? offline.remove(reader.item.id) : offline.download(reader.item)
              }
              className={chip(!!downloaded)}
            >
              {offline.busy === reader.item.id
                ? 'Saving…'
                : downloaded
                  ? 'Remove offline copy'
                  : 'Download offline'}
            </button>
          </div>
          {!offline.available && (
            <p className="mt-2 text-[13px] text-mu">
              Offline reading prepares when you open the installed app online.
            </p>
          )}
          {offline.error && (
            <p role="alert" className="mt-2 text-[13px]">
              {offline.error}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="mt-5 border-t border-ln pt-4">
            <h3 className="mb-2 text-lg font-bold">Your levels</h3>
            <p className="mb-3 text-[13px] text-mu">
              English: {LEVELS[s.levels.en]} · Afrikaans: {LEVELS[s.levels.af]}
            </p>
            <button onClick={() => set({ ob: false })} className={chip(false)}>
              Re-run onboarding
            </button>
          </div>
          <div className="mt-5 border-t border-ln pt-4">
            <h3 className="mb-2 text-lg font-bold">Google sync</h3>
            <output className="mb-3 text-[13px] text-mu">
              {sync.user
                ? `${sync.user.displayName ?? 'Signed in'} · ${sync.status}`
                : 'Reading stays on this device. Sign in to sync progress, words and notes.'}
            </output>
            {sync.configured ? (
              <button
                onClick={() => (sync.user ? sync.logout() : sync.login())}
                className={chip(false)}
              >
                {sync.user ? 'Sign out' : 'Continue with Google'}
              </button>
            ) : (
              <p className="text-[13px] text-mu">
                Google sign-in will be available when sync is enabled for this app.
              </p>
            )}
            {sync.error && (
              <p role="alert" className="mt-2 text-[13px]">
                {sync.error}
              </p>
            )}
            <p className="mt-3 text-xs text-mu">
              Your Google account receives only your own reading data. Downloads stay on this
              device. Signing out keeps your local library.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
export type Anchor = { itemId: string; start: number; end: number };
export function WordPanel({
  text,
  from,
  anchor,
  language,
  onClose,
}: {
  text: string;
  from: string;
  anchor?: Anchor;
  language?: Lang;
  onClose: () => void;
}) {
  const { s, set } = useStore();
  const [note, setNote] = useState('');
  const lang = language ?? s.lang;
  const e = DICT[norm(text)],
    saved = s.wd.some((w) => norm(w.w) === norm(text) && w.g === lang);
  return (
    <div>
      <h3 className="mb-1.5 font-serif text-[28px] font-bold">{text}</h3>
      {e ? (
        <>
          <p className="mb-1.5 font-serif text-[17px]">{e.d}</p>
          <p className="text-[13px] text-mu">
            {e.g === 'en' ? 'Afrikaans' : 'English'}: <b>{e.t}</b>
          </p>
        </>
      ) : (
        <p className="text-[13px] text-mu">Add your own definition or note below.</p>
      )}
      <label className="mt-3 block text-[13px] text-mu">
        Your note
        <textarea
          value={note}
          onChange={(x) => setNote(x.target.value)}
          rows={3}
          placeholder="Add a definition, paragraph or note"
          className="mt-1 w-full resize-none rounded-2xl bg-ln p-3 text-ink"
        />
      </label>
      <div className="mt-2 flex gap-2">
        <button
          disabled={!note.trim()}
          onClick={() => {
            set((x) => ({
              nt: [
                ...x.nt,
                { id: crypto.randomUUID(), q: text, n: note.trim(), f: from, ...anchor },
              ],
            }));
            onClose();
          }}
          className={chip(true)}
        >
          Save note
        </button>
        {text.trim().split(/\s+/).length === 1 && (
          <button
            disabled={saved || (!e && !note.trim())}
            onClick={() =>
              set((x) => ({
                wd: [
                  ...x.wd,
                  {
                    id: `${lang}-${norm(text)}`,
                    g: lang,
                    w: text,
                    d: e?.d ?? note.trim(),
                    t: e?.t ?? '',
                    u: note.trim(),
                  },
                ],
              }))
            }
            className={chip(false)}
          >
            {saved ? 'Word saved' : 'Save word'}
          </button>
        )}
      </div>
    </div>
  );
}
