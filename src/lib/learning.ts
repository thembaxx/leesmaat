import type { Review } from './state';
export function nextReview(
  previous: Review | undefined,
  correct: boolean,
  now = new Date(),
): Review {
  const successes = correct ? (previous?.successes ?? 0) + 1 : 0;
  const interval = correct
    ? successes === 1
      ? 1
      : successes === 2
        ? 3
        : Math.min(60, (previous?.interval ?? 3) * 2)
    : 0;
  const due = new Date(now);
  if (correct) due.setDate(due.getDate() + interval);
  else due.setMinutes(due.getMinutes() + 10);
  return { due: due.toISOString(), interval, successes };
}
export function readingTick(
  state: { day: string; secs: number; done: string; last: string; xp: number; streak: number },
  day: string,
  previousDay: string,
) {
  const secs = Math.min(300, (state.day === day ? state.secs : 0) + 1);
  return secs === 300 && state.done !== day
    ? {
        day,
        secs,
        done: day,
        last: day,
        xp: state.xp + 20,
        streak: state.last === previousDay ? state.streak + 1 : 1,
      }
    : { day, secs };
}
