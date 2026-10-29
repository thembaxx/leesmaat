'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { LEVELS, type Item, type Lang } from '@/lib/data';
import { norm } from '@/lib/text';
import { useStore, type State } from '@/lib/store';
import { useOffline } from './OfflineProvider';
import { useSync } from './SyncProvider';
import { DictionaryCard } from './DictionaryCard';
import type { DictionaryEntry } from '@/lib/dictionary';
import { AssistantDownloadPanel } from './AssistantPanel';
import { VoicePanel } from './VoicePanel';
import { InstallPanel } from './PwaControls';
import { XIcon } from '@phosphor-icons/react';
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

      className="squircle fixed inset-x-0 top-auto bottom-[calc(8px+env(safe-area-inset-bottom))] mx-auto max-h-[85dvh] w-[calc(100%-16px)] max-w-[432px] overflow-auto rounded-[34px] bg-sf p-0 text-ink shadow-2xl backdrop:bg-black/40"
    >
      <div className="px-5 pt-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 id={titleId} className="text-sm font-semibold text-mu">
            {title}
          </h2>
          <button
            aria-label="Done"
            title="Close"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full bg-ln"
          >
            <XIcon size={20} />
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
  const downloaded = reader && s.dl.includes(reader.item.bookId ?? reader.item.id);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmailLink, setSendingEmailLink] = useState(false);
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
      <VoicePanel language={reader?.item.g ?? s.lang} />
      <AssistantDownloadPanel />
      {reader ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button onClick={reader.onZen} className={chip(false)}>
              Zen mode
            </button>
            <button
              disabled={offline.busy !== null || (!downloaded && !offline.available)}
              onClick={() =>
                downloaded
                  ? offline.remove(reader.item.bookId ?? reader.item.id)
                  : offline.download(reader.item)
              }
              className={chip(!!downloaded)}
            >
              {offline.busy === (reader.item.bookId ?? reader.item.id)
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
          <InstallPanel />
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
            <h3 className="mb-2 text-lg font-bold">Account & sync</h3>
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
            {sync.emailLinkEnabled && !sync.user && (
              <form className="mt-4 flex flex-col gap-2" onSubmit={async (event) => {
                event.preventDefault();
                if (sendingEmailLink) return;
                setSendingEmailLink(true);
                try { await sync.sendEmailLink(emailAddress); }
                catch { /* The provider displays a safe error. */ }
                finally { setSendingEmailLink(false); }
              }}>
                <label htmlFor="leesmaat-email-link" className="text-[13px] font-semibold">
                  Sign in with an email link
                </label>
                <input id="leesmaat-email-link" name="email" type="email" required maxLength={254}
                  autoComplete="email" placeholder="you@example.com"
                  className="min-h-11 rounded-xl border border-ln bg-bg px-3 text-ink"
                  value={emailAddress} onChange={event => setEmailAddress(event.target.value)} />
                <button type="submit" className={chip(false)} disabled={sendingEmailLink}>
                  {sendingEmailLink ? 'Sending link…' : 'Email me a sign-in link'}
                </button>
                <p className="text-xs text-mu">
                  Open the link from your inbox. If you switch browsers or devices, confirm the same email address to finish.
                </p>
              </form>
            )}
            {sync.emailLinkEnabled && !sync.user && (
              <p role="status" className="mt-2 text-[13px] text-mu">{sync.status}</p>
            )}
            {sync.error && (
              <p role="alert" className="mt-2 text-[13px]">
                {sync.error}
              </p>
            )}
            <p className="mt-3 text-xs text-mu">
              Your signed-in account receives only your own reading data. Downloads stay on this
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
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const definition = entry?.meanings[0]?.definitions[0]?.definition;
  const vocabularyWord = entry?.requested || entry?.word || text;
  const saved = s.wd.some((w) => norm(w.w) === norm(vocabularyWord) && w.g === lang);
  return (
    <div>
      <DictionaryCard text={text} language={lang} onEntry={setEntry} />
      <label className="mt-3 block text-[13px] text-mu">
        Your note
        <textarea
          value={note}
          onChange={(x) => setNote(x.target.value)}
          rows={3}
          placeholder="Write a thought or example sentence"
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
            disabled={saved || !definition}
            onClick={() =>
              set((x) => ({
                wd: [
                  ...x.wd,
                  {
                    id: `${lang}-${norm(vocabularyWord)}`,
                    g: lang,
                    w: vocabularyWord,
                    d: definition ?? '',
                    t: '',
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
