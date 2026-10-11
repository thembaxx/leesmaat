import { z } from 'zod';
import { today } from './text';
const level = z.number().int().min(0).max(2);
export const wordSchema = z.object({
  id: z.string(),
  w: z.string(),
  d: z.string(),
  t: z.string(),
  u: z.string(),
  g: z.enum(['en', 'af']),
});
export const noteSchema = z.object({
  id: z.string(),
  q: z.string(),
  n: z.string(),
  f: z.string(),
  itemId: z.string().optional(),
  start: z.number().int().nonnegative().optional(),
  end: z.number().int().nonnegative().optional(),
});
export const reviewSchema = z.object({
  due: z.string(),
  interval: z.number().nonnegative(),
  successes: z.number().int().nonnegative(),
});
export const stateSchema = z.object({
  lang: z.enum(['en', 'af']).default('en'),
  lv: level.default(1),
  levels: z.object({ en: level, af: level }).default({ en: 1, af: 1 }),
  placed: z.object({ en: z.boolean(), af: z.boolean() }).default({ en: false, af: false }),
  theme: z.enum(['', 'paper', 'sepia', 'night']).default(''),
  mono: z.boolean().default(false),
  fs: z.number().min(15).max(30).default(19),
  sp: z.number().min(0.5).max(2).default(1),
  streak: z.number().int().nonnegative().default(0),
  secs: z.number().int().nonnegative().default(0),
  day: z.string().default(''),
  last: z.string().default(''),
  done: z.string().default(''),
  xp: z.number().int().nonnegative().default(0),
  ob: z.boolean().default(false),
  pos: z.record(z.string(), z.number().min(0).max(1)).default({}),
  sv: z.array(z.string()).default([]),
  dl: z.array(z.string()).default([]),
  wd: z.array(wordSchema).default([]),
  nt: z.array(noteSchema).default([]),
  reviews: z.record(z.string(), reviewSchema).default({}),
});
export type State = z.infer<typeof stateSchema>;
export type SavedWord = z.infer<typeof wordSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Review = z.infer<typeof reviewSchema>;
export const INIT = stateSchema.parse({});
/** Migrate prototype data; a bad field must not wipe the user's library. */
export function hydrateState(input: unknown): State {
  if (!input || typeof input !== 'object') return { ...INIT, day: today() };
  const raw = input as Record<string, unknown>,
    migrated = { ...raw };
  const lang = raw.lang === 'af' ? 'af' : 'en';
  if (!raw.levels)
    migrated.levels = { ...INIT.levels, [lang]: level.safeParse(raw.lv).success ? raw.lv : 1 };
  if (!raw.placed) migrated.placed = { ...INIT.placed, [lang]: !!raw.ob };
  if (Array.isArray(raw.wd))
    migrated.wd = raw.wd.map((w, i) => ({ id: `legacy-word-${i}`, g: lang, ...w }));
  if (Array.isArray(raw.nt)) migrated.nt = raw.nt.map((n, i) => ({ id: `legacy-note-${i}`, ...n }));
  const clean: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(stateSchema.shape)) {
    const result = schema.safeParse(migrated[key]);
    clean[key] = result.success ? result.data : INIT[key as keyof State];
  }
  const state = stateSchema.parse(clean);
  return state.day === today() ? state : { ...state, day: today(), secs: 0 };
}
