'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BookmarkSimpleIcon,
  CaretLeftIcon,
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  TextAaIcon,
} from '@phosphor-icons/react';
import { DICT, LEVELS, type Item } from '@/lib/data';
import { norm, parse, today, yesterday } from '@/lib/text';
import { locateWords, findRanges } from '@/lib/reader';
import { useFocusScope } from '@/lib/focus';
import { readingTick } from '@/lib/learning';
import { useStore } from '@/lib/store';
import { SettingsPanel, Sheet, WordPanel, type Anchor } from './Sheets';

const SPEEDS = [0.8, 1, 1.25, 1.5, 2];
type View = { k: 'settings' } | { k: 'word'; text: string; anchor?: Anchor };

const Round = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    aria-label={label}
    onClick={(event) => {
      event.currentTarget.focus();
      onClick();
    }}
    className="glass grid size-11 place-items-center rounded-full transition active:scale-95"
  >
    {children}
  </button>
);

export function Reader({ item, onClose }: { item: Item; onClose: () => void }) {
  const { s, set } = useStore();
  const poem = item.k === 'Poem';
  const paras = useMemo(() => parse(item.x, poem), [item.x, poem]);
  const flat = useMemo(() => paras.flat(), [paras]);
  const offsets = useMemo(
    () => paras.map((_, i) => paras.slice(0, i).reduce((total, p) => total + p.length, 0)),
    [paras],
  );
  const wordOffsets = useMemo(() => locateWords(item.x, flat), [flat, item.x]);
  const root = useRef<HTMLDialogElement>(null);
  useFocusScope(root);

  const scroller = useRef<HTMLDivElement>(null);
  const start = useRef(s.pos[item.id] ?? 0);
  const saveT = useRef(0);
  const tok = useRef(0);
  const act = useRef(0);
  const sp = useRef(s.sp);
  const playingRef = useRef(false);
  const [cur, setCur] = useState(-1);
  const [cw, setCw] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [zen, setZen] = useState(false);
  const [find, setFind] = useState<string | null>(null);
  const [findPosition, setFindPosition] = useState({ query: '', index: 0 });
  const exitZen = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (zen) exitZen.current?.focus();
  }, [zen]);
  const [sel, setSel] = useState<{ text: string; anchor: Anchor } | null>(null);
  const [audioError, setAudioError] = useState('');
  const [view, setView] = useState<View>({ k: 'settings' });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    sp.current = s.sp;
  }, [s.sp]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // restore last position, track selection, count reading time toward the 5-minute goal
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = start.current * (el.scrollHeight - el.clientHeight);
    act.current = Date.now();
    const mark = () => {
      act.current = Date.now();
    };
    const pick = () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount || selection.isCollapsed) {
        setSel(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const element = (node: Node) =>
        (node.nodeType === Node.ELEMENT_NODE
          ? (node as Element)
          : node.parentElement
        )?.closest<HTMLElement>('[data-start]');
      const first = element(range.startContainer),
        last = element(range.endContainer);
      if (!first || !last || !el?.contains(first) || !el.contains(last)) {
        setSel(null);
        return;
      }
      const start =
        Number(first.dataset.start) +
        (range.startContainer.nodeType === Node.TEXT_NODE ? range.startOffset : 0);
      const end =
        Number(last.dataset.start) +
        (range.endContainer.nodeType === Node.TEXT_NODE
          ? range.endOffset
          : (last.textContent?.length ?? 0));
      const text = item.x.slice(start, end);
      if (text.trim().length > 1)
        setSel({
          text: text.trim(),
          anchor: {
            itemId: item.id,
            start: start + text.length - text.trimStart().length,
            end: end - (text.length - text.trimEnd().length),
          },
        });
    };
    window.addEventListener('pointerdown', mark, true);
    window.addEventListener('scroll', mark, true);
    document.addEventListener('selectionchange', pick);
    const speechToken = tok;
    const id = window.setInterval(() => {
      if (document.hidden || !(playingRef.current || Date.now() - act.current < 20000)) return;
      set((x) => {
        return readingTick(x, today(), yesterday());
      });
    }, 1000);
    return () => {
      window.removeEventListener('pointerdown', mark, true);
      window.removeEventListener('scroll', mark, true);
      document.removeEventListener('selectionchange', pick);
      window.clearInterval(id);
      speechToken.current++;
      window.clearTimeout(saveT.current);
      if (el)
        set((x) => ({
          pos: {
            ...x.pos,
            [item.id]: el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight),
          },
        }));
      window.speechSynthesis?.cancel();
    };
  }, [set, item.id, item.x]);

  useEffect(() => {
    if (playing)
      document.getElementById(`s${cur}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cur, playing]);

  const q = find?.trim().toLowerCase() ?? '';
  const matches = useMemo(() => findRanges(item.x, q), [item.x, q]);
  const matchIndex =
    findPosition.query === q ? findPosition.index % Math.max(1, matches.length) : 0;
  const activeMatch = matches[matchIndex];
  useEffect(() => {
    if (q)
      scroller.current
        ?.querySelector('[data-find-current]')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [q, matchIndex]);

  // read aloud: one utterance per sentence, word highlight where the device reports boundaries
  const say = (i: number) => {
    const syn = window.speechSynthesis;
    if (!syn || typeof SpeechSynthesisUtterance === 'undefined') {
      setAudioError('Read-aloud is unavailable in this browser.');
      return;
    }
    setAudioError('');
    tok.current++;
    syn?.cancel();
    const n = Math.max(i, 0);
    if (n >= flat.length) {
      setPlaying(false);
      setCur(-1);
      setCw(-1);
      return;
    }
    const t = tok.current;
    const words = flat[n]!;
    const starts: number[] = [];
    let c = 0;
    for (const w of words) {
      starts.push(c);
      c += w.length + 1;
    }
    setCur(n);
    setCw(-1);
    setPlaying(true);
    const u = new SpeechSynthesisUtterance(words.join(' '));
    u.lang = item.g === 'af' ? 'af-ZA' : 'en-ZA';
    u.rate = sp.current;
    const voice = syn.getVoices().find((v) => v.lang.toLowerCase().startsWith(item.g));
    if (voice) u.voice = voice;
    else if (item.g === 'af')
      setAudioError('Install an Afrikaans voice on your device for accurate read-aloud.');
    u.onerror = (e) => {
      if (t === tok.current && e.error !== 'canceled' && e.error !== 'interrupted') {
        setPlaying(false);
        setAudioError('Read-aloud stopped. Try again or check your device voices.');
      }
    };
    u.onboundary = (e) => {
      if (t !== tok.current) return;
      let k = 0;
      starts.forEach((st, j) => {
        if (st <= e.charIndex) k = j;
      });
      setCw(k);
    };
    u.onend = () => {
      if (t === tok.current) say(n + 1);
    };
    syn?.speak(u);
  };
  const toggle = () => {
    if (playing) {
      tok.current++;
      window.speechSynthesis?.cancel();
      setPlaying(false);
    } else if (cur >= 0) say(cur);
    else {
      const first = [...scroller.current!.querySelectorAll('[data-sentence]')].findIndex(
        (e) => e.getBoundingClientRect().top > 70,
      );
      say(first);
    }
  };
  const cycle = () => {
    const next = SPEEDS[(SPEEDS.indexOf(s.sp) + 1) % SPEEDS.length]!;
    sp.current = next;
    set({ sp: next });
    if (playing) say(cur);
  };
  const show = (v: View) => {
    setView(v);
    setOpen(true);
  };
  const saved = s.sv.includes(item.id);
  const goal = s.done === today();

  return (
    <dialog
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !open && find === null) onClose();
      }}
      open
      ref={root}
      aria-modal="true"
      aria-label={item.t}
      className="absolute inset-0 z-20 m-0 h-full max-h-none w-full max-w-none animate-rise border-0 bg-bg p-0 text-ink"
    >
      <div
        className="absolute top-0 left-0 z-30 h-[3px] bg-ac transition-[width] duration-1000 ease-linear"
        style={{ width: `${Math.min(s.secs / 3, 100)}%` }}
      />
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          window.clearTimeout(saveT.current);
          saveT.current = window.setTimeout(
            () =>
              set((x) => ({
                pos: {
                  ...x.pos,
                  [item.id]: el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight),
                },
              })),
            400,
          );
        }}
        className="h-full overflow-y-auto pb-44"
      >
        <div
          inert={zen}
          aria-hidden={zen}
          className={`sticky top-0 z-10 flex justify-between p-3 transition-all duration-500 ease-ios ${zen ? 'pointer-events-none -translate-y-6 opacity-0' : ''}`}
        >
          <Round label="Back" onClick={onClose}>
            <CaretLeftIcon size={22} />
          </Round>
          <div className="flex gap-2">
            <Round label="Find in text" onClick={() => setFind(find === null ? '' : null)}>
              <MagnifyingGlassIcon size={22} />
            </Round>
            <Round
              label="Bookmark"
              onClick={() =>
                set((x) => ({ sv: saved ? x.sv.filter((i) => i !== item.id) : [...x.sv, item.id] }))
              }
            >
              <BookmarkSimpleIcon size={22} weight={saved ? 'fill' : 'regular'} />
            </Round>
            <Round label="Reading settings" onClick={() => show({ k: 'settings' })}>
              <TextAaIcon size={22} />
            </Round>
          </div>
        </div>

        <article
          lang={item.g}
          className={`px-6 font-serif leading-[1.75] text-pretty transition-[padding] duration-500 ease-ios [hyphens:auto] ${zen ? 'pt-[9vh]' : ''}`}
          style={{ fontSize: 'var(--fs)' }}
        >
          <h1 className="font-serif text-[1.75em] leading-[1.15] font-bold tracking-tight">
            {item.t}
          </h1>
          <p className="mt-2.5 mb-5 border-b border-ln pb-4 font-sans text-[13px] text-mu">
            {item.a} · {item.k} · {LEVELS[item.v]}
            {item.n ? ` · ${item.n}` : ''}
            {goal ? ' · Daily goal complete' : ''}
          </p>
          <p className="mb-4 font-sans text-xs text-mu">
            {item.rights}
            {item.source && (
              <>
                {' '}
                ·{' '}
                <a className="underline" href={item.source} target="_blank" rel="noreferrer">
                  Curriculum source
                </a>
              </>
            )}
            {item.textSource && (
              <>
                {' '}
                ·{' '}
                <a className="underline" href={item.textSource} target="_blank" rel="noreferrer">
                  Read the full text
                </a>
              </>
            )}
          </p>
          {paras.map((p, pi) => (
            <p key={pi} className="mb-[1.15em]">
              {p.map((words, si) => {
                const gi = offsets[pi]! + si;
                return (
                  <span
                    data-sentence
                    key={si}
                    id={`s${gi}`}
                    className={`rounded-[.3em] box-decoration-clone transition-colors duration-300 ${poem ? 'block' : ''} ${gi === cur ? 'bg-hl' : ''}`}
                  >
                    {words.map((w, wi) => {
                      const range = wordOffsets[gi]![wi]!;
                      const match = matches.some(
                        (found) => found.start < range.end && found.end > range.start,
                      );
                      const currentMatch =
                        activeMatch &&
                        activeMatch.start < range.end &&
                        activeMatch.end > range.start;
                      const notes = s.nt.filter(
                        (n) =>
                          n.itemId === item.id &&
                          n.start !== undefined &&
                          n.end !== undefined &&
                          n.start < range.end &&
                          n.end > range.start,
                      );
                      const anchor = { itemId: item.id, ...range };
                      return (
                        <span key={wi}>
                          <button
                            type="button"
                            data-start={range.start}
                            data-end={range.end}
                            title={notes.map((n) => n.n).join(' · ') || undefined}
                            data-fm={match || undefined}
                            data-find-current={currentMatch || undefined}
                            onClick={() => {
                              if (!window.getSelection()?.toString().trim())
                                show({
                                  k: 'word',
                                  text: w.replace(/[.,;:!?"“”‘’()]/g, ''),
                                  anchor,
                                });
                            }}
                            className={`rounded-[.25em] text-left [font:inherit] ${notes.length ? 'bg-hl underline decoration-ac underline-offset-4' : ''} ${DICT[norm(w)] ? 'underline decoration-mu decoration-dotted underline-offset-[.22em]' : ''} ${(gi === cur && wi === cw) || match ? 'bg-hw' : ''}`}
                          >
                            {w}
                          </button>{' '}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </p>
          ))}
        </article>
      </div>

      {audioError && (
        <output className="absolute right-4 bottom-24 left-4 z-20 rounded-2xl bg-sf p-3 text-sm shadow-lg">
          {audioError}
        </output>
      )}
      {find !== null && (
        <div className="absolute top-16 right-4 left-4 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-sf p-3 shadow-xl">
          <input
            aria-label="Find in text"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setFind(null);
            }}
            placeholder="Find in text"
            className="min-w-0 flex-1 bg-ln px-3 py-2"
          />
          <output className="text-xs text-mu">
            {matches.length ? `${matchIndex + 1}/${matches.length}` : q ? 'No matches' : ''}
          </output>
          <button
            aria-label="Previous match"
            disabled={!matches.length}
            onClick={() =>
              setFindPosition({
                query: q,
                index: (matchIndex + matches.length - 1) % matches.length,
              })
            }
            className="p-2"
          >
            ↑
          </button>
          <button
            aria-label="Next match"
            disabled={!matches.length}
            onClick={() => setFindPosition({ query: q, index: (matchIndex + 1) % matches.length })}
            className="p-2"
          >
            ↓
          </button>
        </div>
      )}

      <div
        inert={zen}
        aria-hidden={zen}
        className={`glass absolute bottom-[18px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full p-[7px] transition-all duration-500 ease-ios ${zen ? 'pointer-events-none translate-y-8 opacity-0' : ''}`}
      >
        <button
          aria-label="Previous sentence"
          onClick={() => say(cur - 1)}
          className="grid size-11 place-items-center rounded-full"
        >
          <SkipBackIcon size={22} weight="fill" />
        </button>
        <button
          key={playing ? 'p' : 'q'}
          aria-label={playing ? 'Pause' : 'Listen'}
          onClick={toggle}
          className="grid size-[54px] animate-pop place-items-center rounded-full bg-ink text-bg"
        >
          {playing ? <PauseIcon size={26} weight="fill" /> : <PlayIcon size={26} weight="fill" />}
        </button>
        <button
          aria-label="Next sentence"
          onClick={() => say(cur + 1)}
          className="grid size-11 place-items-center rounded-full"
        >
          <SkipForwardIcon size={22} weight="fill" />
        </button>
        <button
          aria-label="Speed"
          onClick={cycle}
          className="rounded-full bg-ln px-3.5 py-3 text-sm font-bold"
        >
          {s.sp}×
        </button>
      </div>

      {zen && (
        <button
          ref={exitZen}
          onClick={() => setZen(false)}
          className="absolute top-3.5 right-4 z-20 rounded-full bg-ln px-3.5 py-2 text-[13px] font-semibold opacity-60"
        >
          Exit zen
        </button>
      )}
      {sel && !open && (
        <button
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => show({ k: 'word', text: sel.text, anchor: sel.anchor })}
          className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 animate-rise rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-bg"
        >
          Add note
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)}>
        {view.k === 'settings' ? (
          <SettingsPanel
            reader={{
              item,
              onZen: () => {
                setOpen(false);
                setZen(true);
              },
            }}
          />
        ) : (
          <WordPanel
            key={view.text}
            text={view.text}
            from={item.t}
            language={item.g}
            anchor={view.anchor}
            onClose={() => setOpen(false)}
          />
        )}
      </Sheet>
    </dialog>
  );
}
