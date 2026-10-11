'use client';
import { useEffect, useRef, useState } from 'react';
import { DICT, LIBRARY } from '@/lib/data';
import { nextReview } from '@/lib/learning';
import { useStore } from '@/lib/store';
import { chip } from './Sheets';
type Question = {
  prompt: string;
  answer: string;
  options: string[];
  wordId?: string;
  passage?: string;
  explanation?: string;
};
type Run = { index: number; correct: number; pick: string | null; questions: Question[] };
function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  return list;
}
export function Practice() {
  const { s, set } = useStore();
  const [run, setRun] = useState<Run | null>(null),
    [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [mode, setMode] = useState<'words' | 'reading'>('words');
  const locked = useRef(false);
  const saved = s.wd.filter((word) => word.g === s.lang && word.d.trim());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const due = saved.filter(
    (word) => !s.reviews[word.id] || Date.parse(s.reviews[word.id]!.due) <= now,
  );
  const start = () => {
    let questions: Question[];
    if (mode === 'reading') {
      const af = s.lang === 'af',
        item = LIBRARY.find((i) => i.id === (af ? 'a1' : 'e1'))!;
      questions = af
        ? [
            {
              prompt: 'Waar wag Pieter?',
              answer: 'Op die perron',
              options: ['Op die perron', 'By die plaas', 'By die skool'],
              passage: item.x,
              explanation: 'Pieter kom by die stasie aan en gaan langs die ou man sit.',
            },
            {
              prompt: 'Wat suggereer die ou man se woorde oor die trein?',
              answer: 'Hy is geduldig en vertrou dat dit sal kom',
              options: [
                'Hy is geduldig en vertrou dat dit sal kom',
                'Hy weet dat die trein nooit kom nie',
                'Hy is kwaad vir Pieter',
              ],
              passage: item.x,
              explanation: '“Maar hy kom altyd” dui op vertroue ondanks die vertraging.',
            },
          ]
        : [
            {
              prompt: 'What does Gogo do when the power goes out?',
              answer: 'She places a candle by the window',
              options: [
                'She places a candle by the window',
                'She goes to sleep',
                'She sends her neighbours home',
              ],
              passage: item.x,
              explanation: 'The story states that Gogo lights a candle and puts it by the window.',
            },
            {
              prompt: 'What does the light come to represent?',
              answer: 'Care and welcome for the community',
              options: [
                'Care and welcome for the community',
                'Gogo’s fear of the dark',
                'A warning to stay away',
              ],
              passage: item.x,
              explanation:
                'Neighbours gather around the light. Thando realises it was never only for Gogo.',
            },
          ];
    } else {
      const dictionary = Object.entries(DICT)
        .filter(([, word]) => word.g === s.lang)
        .map(([w, word]) => ({ w, d: word.d, id: undefined as string | undefined }));
      const pool = due.length
        ? due.map((word) => ({ w: word.w, d: word.d, id: word.id }))
        : dictionary;
      const definitions = [...new Set([...dictionary, ...saved].map((word) => word.d))];
      questions = shuffle(pool)
        .slice(0, 5)
        .map((word) => ({
          prompt: word.w,
          answer: word.d,
          wordId: word.id,
          options: shuffle([
            word.d,
            ...shuffle(definitions.filter((d) => d !== word.d)).slice(0, 2),
          ]),
        }));
    }
    locked.current = false;
    setScore(null);
    setRun({ index: 0, correct: 0, pick: null, questions });
  };
  const choose = (answer: string) => {
    if (!run || run.pick || locked.current) return;
    locked.current = true;
    const question = run.questions[run.index]!,
      correct = answer === question.answer;
    setRun({ ...run, pick: answer, correct: run.correct + (correct ? 1 : 0) });
    if (question.wordId) {
      const id = question.wordId;
      set((old) => ({ reviews: { ...old.reviews, [id]: nextReview(old.reviews[id], correct) } }));
    }
  };
  const next = () => {
    if (!run) return;
    if (run.index + 1 === run.questions.length) {
      set((old) => ({ xp: old.xp + run.correct * 10 }));
      setScore({ correct: run.correct, total: run.questions.length });
      setRun(null);
    } else {
      locked.current = false;
      setRun({ ...run, index: run.index + 1, pick: null });
    }
  };
  const question = run?.questions[run.index];
  return (
    <div className="absolute inset-0 animate-rise overflow-y-auto px-5 pt-4 pb-32">
      <div className="mb-3.5 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{score ? 'Nice work' : 'Practice'}</h1>
        <span className="rounded-full bg-ln px-3.5 py-2 text-[13px] font-semibold">{s.xp} XP</span>
      </div>
      {run && question ? (
        <div key={run.index} className="animate-rise">
          <p className="text-[13px] text-mu">
            {run.index + 1} of {run.questions.length}
          </p>
          {question.passage && (
            <blockquote className="my-3 rounded-2xl bg-ln p-4 font-serif text-base leading-relaxed">
              {question.passage}
            </blockquote>
          )}
          <h2 className="my-3 font-serif text-2xl font-bold">{question.prompt}</h2>
          <p className="mb-4 text-[13px] text-mu">
            {mode === 'words'
              ? 'Pick the meaning.'
              : 'Choose the answer best supported by the passage.'}
          </p>
          {question.options.map((option) => (
            <button
              key={option}
              disabled={run.pick !== null}
              onClick={() => choose(option)}
              className={`squircle mb-2.5 block w-full rounded-[22px] p-4 text-left shadow-[inset_0_0_0_1px_var(--ln)] ${run.pick && option === question.answer ? 'bg-ink text-bg' : 'bg-sf'}`}
            >
              {option}
              {run.pick && option === question.answer ? ' ✓' : ''}
            </button>
          ))}
          {run.pick && (
            <>
              <output className="my-3 text-sm">
                {run.pick === question.answer ? 'Correct.' : `Answer: ${question.answer}.`}{' '}
                {question.explanation}
              </output>
              <button onClick={next} className={chip(true)}>
                {run.index + 1 === run.questions.length ? 'Finish' : 'Next question'}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            {(['words', 'reading'] as const).map((value) => (
              <button
                key={value}
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setScore(null);
                }}
                className={chip(mode === value)}
              >
                {value === 'words' ? 'Words' : 'Comprehension'}
              </button>
            ))}
          </div>
          <div className="squircle rounded-[22px] bg-sf p-5 shadow-[inset_0_0_0_1px_var(--ln)]">
            <h2 className="mb-2 text-lg font-bold">
              {score
                ? `${score.correct} / ${score.total} · +${score.correct * 10} XP`
                : mode === 'words'
                  ? 'Make words stick'
                  : 'Read between the lines'}
            </h2>
            <p className="mb-4 text-[13px] text-mu">
              {mode === 'words'
                ? due.length
                  ? `${due.length} saved words are ready to review. Words you know return after longer intervals.`
                  : 'Build vocabulary with a short word match. Save words while reading to review them here.'
                : 'Read a short passage, then practise understanding and interpretation.'}
            </p>
            <button
              onClick={start}
              className="rounded-2xl bg-ink px-5 py-3.5 font-semibold text-bg"
            >
              {score ? 'Go again' : 'Start'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
