'use client';
import { useRef, useState } from 'react';
import { autoStudy } from '@/lib/study';
import { nextReview } from '@/lib/learning';
import { summarize, SUMMARY_COPY } from '@/lib/summaries';
import { BROWSABLE_LIBRARY, readable, type Item } from '@/lib/data';
import { loadBook, bookSection } from '@/lib/books';
import { useStore } from '@/lib/store';
import { chip } from './Sheets';

export function AutoStudy({ item }: { item: Item }) {
  const { s, set } = useStore();
  const [questions] = useState(() => {
    const all = autoStudy(item),
      now = Date.now();
    return all.sort(
      (a, b) =>
        Number(Date.parse(s.reviews[a.id]?.due ?? '') > now) -
        Number(Date.parse(s.reviews[b.id]?.due ?? '') > now),
    );
  });
  const [index, setIndex] = useState(0),
    [pick, setPick] = useState<string | null>(null),
    [correct, setCorrect] = useState(0),
    [finished, setFinished] = useState(false);
  const locked = useRef(false),
    completed = useRef(false);
  const digest = summarize(item),
    question = questions[index];
  if (!question)
    return (
      <p className="py-4 text-sm text-mu">
        This passage is too short for a study session. Choose a longer chapter.
      </p>
    );
  const choose = (answer: string) => {
    if (locked.current || completed.current) return;
    locked.current = true;
    setPick(answer);
    const ok = answer === question.answer;
    if (ok) setCorrect((c) => c + 1);
    set((old) => ({
      reviews: { ...old.reviews, [question.id]: nextReview(old.reviews[question.id], ok) },
    }));
  };
  const next = () => {
    if (!locked.current || completed.current) return;
    if (index + 1 === questions.length) {
      completed.current = true;
      set((old) => ({ xp: old.xp + correct * 10 }));
      setFinished(true);
    } else {
      locked.current = false;
      setPick(null);
      setIndex((i) => i + 1);
    }
  };
  return (
    <section aria-label="Automatic study">
      <p className="text-xs text-mu">
        {item.t}
        {item.sectionTitle ? ' · ' + item.sectionTitle : ''}
      </p>
      <h2 className="my-3 font-serif text-2xl">
        {finished
          ? `${correct} / ${questions.length} · +${correct * 10} XP`
          : 'Read, recall, remember'}
      </h2>
      <p className="mb-4 text-sm text-mu">
        Questions come directly from this text. Your answers schedule the next review.
      </p>
      {digest && (
        <details className="mb-5 rounded-2xl bg-ln p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            {SUMMARY_COPY[item.g].points}
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm">
            {digest.points.map((p) => (
              <li key={p.start}>{p.text}</li>
            ))}
          </ul>
        </details>
      )}
      {finished ? (
        <p className="rounded-2xl bg-ln p-4 text-sm">
          Saved. Missed questions return in 10 minutes; correct answers return after longer
          intervals.
        </p>
      ) : (
        <>
          <p className="text-xs text-mu">
            {index + 1} of {questions.length} · Source recall
          </p>
          <h3 className="my-3 text-base font-semibold">{question.prompt}</h3>
          <blockquote className="mb-4 whitespace-pre-line rounded-2xl bg-ln p-4 font-serif text-lg leading-relaxed">
            {question.passage}
          </blockquote>
          <div className="space-y-2">
            {question.options.map((option) => (
              <button
                key={option}
                disabled={pick !== null}
                onClick={() => choose(option)}
                className={`min-h-11 w-full rounded-2xl border border-ln p-3 text-left text-sm ${pick && option === question.answer ? 'bg-ink text-bg' : 'bg-sf'}`}
              >
                {option}
                {pick && option === question.answer ? ' ✓' : ''}
              </button>
            ))}
          </div>
          {pick && (
            <>
              <output className="my-4 block rounded-2xl border border-ln p-4 text-sm">
                {pick === question.answer ? 'Correct.' : 'Answer: ' + question.answer + '.'}
                <span className="mt-2 block font-serif">“{question.explanation}”</span>
              </output>
              <button onClick={next} className={chip(true)}>
                {index + 1 === questions.length ? 'Finish study' : 'Next question'}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}

export function StudyPicker() {
  const { s } = useStore();
  const items = BROWSABLE_LIBRARY.filter((i) => i.g === s.lang && readable(i));
  const [id, setId] = useState(items[0]?.id ?? ''),
    [chapter, setChapter] = useState(0),
    [item, setItem] = useState<Item | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const chosen = items.find((i) => i.id === id) ?? items[0];
  const begin = async () => {
    if (!chosen || busy) return;
    setBusy(true);
    setError('');
    try {
      setItem(chosen.contentUrl ? bookSection(chosen, await loadBook(chosen), chapter) : chosen);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the text.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-[22px] bg-sf p-5 shadow-[inset_0_0_0_1px_var(--ln)]">
      {item ? (
        <>
          <AutoStudy key={item.id} item={item} />
          <button onClick={() => setItem(null)} className={`${chip(false)} mt-5`}>
            Choose another text
          </button>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-lg font-bold">Automatic study</h2>
          <p className="mb-4 text-sm text-mu">
            Study a real book chapter, poem, short story or essay. Recall the source, revisit its
            main points and build a review schedule.
          </p>
          <label className="block text-sm">
            Reading
            <select
              aria-label="Study reading"
              value={chosen?.id ?? ''}
              onChange={(e) => {
                setId(e.target.value);
                setChapter(0);
              }}
              className="my-2 block w-full min-w-0 rounded-xl bg-ln p-3"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.t} · {i.a}
                </option>
              ))}
            </select>
          </label>
          {chosen?.sections && (
            <label className="block text-sm">
              Chapter or scene
              <select
                aria-label="Study chapter"
                value={chapter}
                onChange={(e) => setChapter(Number(e.target.value))}
                className="my-2 block w-full min-w-0 rounded-xl bg-ln p-3"
              >
                {chosen.sections.map((p, i) => (
                  <option key={i} value={i}>
                    {i + 1}. {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={() => void begin()}
            disabled={busy || !chosen}
            className={`${chip(true)} mt-3`}
          >
            {busy ? 'Opening text…' : 'Start study'}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-sm">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
