import { INIT, hydrateState, type State } from './state';
export type Field = { value: unknown; time: number; device: string };
export type Fields = Record<string, Field>;
const maps = new Set(['pos', 'levels', 'placed', 'reviews']);
const arrays = new Set(['wd', 'nt', 'sv']);
/** Each collection entry has a clock; null is a deletion tombstone. Downloads stay local. */
export function flatten(state: State): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (key === 'dl') continue;
    if (maps.has(key)) {
      for (const [id, entry] of Object.entries(value)) values[`${key}/${id}`] = entry;
    } else if (arrays.has(key)) {
      for (const entry of value as (string | { id: string })[])
        values[`${key}/${typeof entry === 'string' ? entry : entry.id}`] = entry;
    } else values[key] = value;
  }
  return values;
}
export function stampChanges(
  before: State,
  after: State,
  fields: Fields,
  device: string,
  now = Date.now(),
): Fields {
  const prev = flatten(before),
    next = flatten(after),
    result = { ...fields };
  const time = Math.max(now, ...Object.values(fields).map((f) => f.time + 1));
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (JSON.stringify(prev[key]) !== JSON.stringify(next[key]))
      result[key] = { value: next[key] ?? null, time, device };
  }
  return result;
}
export function mergeFields(a: Fields, b: Fields): Fields {
  const result = { ...a };
  for (const [key, candidate] of Object.entries(b)) {
    if (
      !candidate ||
      typeof candidate.time !== 'number' ||
      !Number.isFinite(candidate.time) ||
      typeof candidate.device !== 'string'
    )
      continue;
    const old = result[key];
    if (
      !old ||
      candidate.time > old.time ||
      (candidate.time === old.time && candidate.device > old.device)
    )
      result[key] = candidate;
  }
  return result;
}
export function applyFields(state: State, fields: Fields): State {
  const raw: Record<string, unknown> = { ...state };
  for (const key of maps) raw[key] = { ...(INIT[key as keyof State] as object) };
  for (const key of arrays) raw[key] = [];
  for (const [path, field] of Object.entries(fields)) {
    const slash = path.indexOf('/'),
      key = slash < 0 ? path : path.slice(0, slash);
    if (!(key in INIT) || key === 'dl' || field.value === null) continue;
    if (maps.has(key) && slash >= 0) {
      const id = path.slice(slash + 1);
      if (!['__proto__', 'constructor', 'prototype'].includes(id))
        (raw[key] as Record<string, unknown>)[id] = field.value;
    } else if (arrays.has(key) && slash >= 0) (raw[key] as unknown[]).push(field.value);
    else if (slash < 0) raw[key] = field.value;
  }
  return hydrateState(raw);
}
export function seedFields(state: State, device: string, time = 0): Fields {
  return Object.fromEntries(
    Object.entries(flatten(state)).map(([key, value]) => [key, { value, time, device }]),
  );
}
