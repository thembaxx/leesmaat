'use client';
import { useState } from 'react';
import { FireIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { dailyItem, KINDS, LEVELS, LIBRARY, type Kind } from '@/lib/data';
import { CATALOGUE_SOURCE, CURRICULUM_SOURCE } from '@/lib/curriculum';
import { today } from '@/lib/text';
import { useStore } from '@/lib/store';
import { Cover, ItemRow } from './Cover';
import { SettingsPanel, Sheet, chip } from './Sheets';

export function Home({ onOpen }: { onOpen: (id: string) => void }) {
  const { s, set } = useStore();
  const [kind, setKind] = useState<'All' | Kind>('All');
  const [sheet, setSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('All');
  const [course, setCourse] = useState<'All' | 'HL' | 'FAL'>('All');
  const [h] = useState(() => new Date().getHours());
  const af = s.lang === 'af';
  const greet = af
    ? h < 12
      ? 'Goeie môre'
      : h < 18
        ? 'Goeie middag'
        : 'Goeie naand'
    : h < 12
      ? 'Good morning'
      : h < 18
        ? 'Good afternoon'
        : 'Good evening';
  const daily = dailyItem(s.lang, today());
  const pool = LIBRARY.filter((i) => i.g === s.lang);
  const resume = pool.find((i) => (s.pos[i.id] ?? 0) > 0.02 && (s.pos[i.id] ?? 0) < 0.97);
  const list = pool
    .filter(
      (i) =>
        (kind === 'All' || i.k === kind) &&
        (course === 'All' || i.course === course) &&
        (grade === 'All' || i.grade === Number(grade)) &&
        `${i.t} ${i.a}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => Math.abs(a.v - s.levels[s.lang]) - Math.abs(b.v - s.levels[s.lang]));
  const secs = Math.min(s.secs, 300);
  const C = 2 * Math.PI * 40;

  return (
    <div className="absolute inset-0 animate-rise overflow-y-auto px-5 pt-4 pb-32">
      <div className="mb-3.5 flex items-center justify-between">
        <h1 className="text-3xl leading-[1.1] font-bold tracking-tight">{greet}</h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-ln px-3.5 py-2 text-[13px] font-semibold">
            <FireIcon size={16} weight="fill" className="text-fl" />
            {s.streak}
          </span>
          <button
            aria-label="Settings"
            onClick={() => setSheet(true)}
            className="glass grid size-11 place-items-center rounded-full"
          >
            <SlidersHorizontalIcon size={22} />
          </button>
        </div>
      </div>

      <div className="my-2 mb-3.5 flex rounded-[14px] bg-ln p-[3px]">
        {(['en', 'af'] as const).map((g) => (
          <button
            key={g}
            onClick={() => set({ lang: g })}
            className={`flex-1 rounded-[11px] p-2 text-[13px] font-semibold transition ${s.lang === g ? 'bg-sf shadow' : ''}`}
          >
            {g === 'en' ? 'English' : 'Afrikaans'}
          </button>
        ))}
      </div>

      {!s.placed[s.lang] && (
        <button
          onClick={() => set({ ob: false })}
          className="mb-3 w-full rounded-2xl bg-ln p-3 text-left text-sm"
        >
          Find your {s.lang === 'af' ? 'Afrikaans' : 'English'} reading level →
        </button>
      )}

      <div className="cover squircle grid grid-cols-[1fr_96px] items-center gap-3 rounded-[28px] bg-[linear-gradient(155deg,#1f4030,#0f1f18)] p-5 text-white">
        <div>
          <small className="text-[13px] text-white/70">
            {s.done === today() ? 'Daily goal complete' : 'Today’s 5-minute read'}
          </small>
          <h2 className="mt-1.5 mb-0.5 font-serif text-[22px] leading-tight font-bold">
            {daily.t}
          </h2>
          <small className="text-[13px] text-white/70">
            {daily.k} · {LEVELS[daily.v]}
          </small>
          <br />
          <button
            onClick={() => onOpen(daily.id)}
            className="mt-3 rounded-2xl bg-white px-5 py-3 font-semibold text-[#111] transition active:scale-95"
          >
            {secs > 0 && secs < 300 ? 'Keep going' : 'Start'}
          </button>
        </div>
        <svg viewBox="0 0 100 100" aria-label="Daily progress">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#fff3" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#9fe0a8"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - secs / 300)}
            transform="rotate(-90 50 50)"
            className="transition-[stroke-dashoffset] duration-1000 ease-ios"
          />
          <text x="50" y="55" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </text>
        </svg>
      </div>

      {resume && (
        <>
          <h2 className="mt-6 mb-2.5 text-xl font-bold tracking-tight">Continue</h2>
          <ItemRow item={resume} onOpen={onOpen} />
        </>
      )}

      <h2 className="mt-6 mb-2.5 text-xl font-bold tracking-tight">NSC setworks · 2026</h2>
      <p className="mb-3 text-[13px] text-mu">
        Read excerpts and study notes alongside your own setwork.{' '}
        <a href={CURRICULUM_SOURCE} target="_blank" rel="noreferrer" className="underline">
          Official Grade 12 list
        </a>
      </p>
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
        {pool
          .filter((i) => i.grade === 12 && (course === 'All' || i.course === course))
          .map((i) => (
            <button
              key={i.id}
              onClick={() => onOpen(i.id)}
              className="w-28 shrink-0 snap-start text-left"
            >
              <Cover item={i} />
              <b className="mt-2 block text-[13px]">{i.t}</b>
              <small className="text-xs text-mu">{i.n}</small>
            </button>
          ))}
      </div>

      <p className="my-3 text-[13px] text-mu">
        Grades 10–11: confirm your school’s selection in the{' '}
        <a className="underline" href={CATALOGUE_SOURCE} target="_blank" rel="noreferrer">
          DBE literature catalogue
        </a>
        .
      </p>
      <h2 className="mt-2 mb-2.5 text-xl font-bold tracking-tight">Read</h2>
      <input
        aria-label="Search library"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Find a title or author"
        className="mb-3 w-full rounded-2xl bg-ln px-4 py-3 text-sm"
      />
      <label className="mb-3 flex items-center gap-3 text-sm text-mu">
        Grade
        <select
          aria-label="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded-xl bg-ln px-3 py-2 text-ink"
        >
          {['All', '10', '11', '12'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <div className="mb-3 flex gap-2">
        {(['All', 'HL', 'FAL'] as const).map((c) => (
          <button
            key={c}
            aria-pressed={course === c}
            onClick={() => setCourse(c)}
            className={chip(course === c)}
          >
            {c === 'All' ? 'All readers' : c === 'HL' ? 'Home Language' : 'First Additional'}
          </button>
        ))}
      </div>
      <div className="mb-2.5 flex gap-2 overflow-x-auto">
        {(['All', ...KINDS] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={chip(kind === k)}>
            {k}
          </button>
        ))}
      </div>
      {!list.length && (
        <output className="py-6 text-sm text-mu">No reads match your search.</output>
      )}
      {list.map((i) => (
        <ItemRow key={i.id} item={i} onOpen={onOpen} />
      ))}

      <Sheet open={sheet} onClose={() => setSheet(false)}>
        <SettingsPanel />
      </Sheet>
    </div>
  );
}
