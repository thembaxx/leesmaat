import type { Item } from './data';

export const EXAM_STORAGE_KEY = 'leesmaat-exam-responses-v1';
export const MAX_EXAM_DRAFTS = 20;
export const MAX_QUOTATION = 1200;
export const EXAM_RUBRIC = [
  {
    id: 'claim',
    en: 'My claim answers the question directly.',
    af: 'My stelling beantwoord die vraag direk.',
  },
  {
    id: 'evidence',
    en: 'My exact quotation supports that claim.',
    af: 'My presiese aanhaling ondersteun die stelling.',
  },
  {
    id: 'reasoning',
    en: 'I explain how the quoted words support my interpretation.',
    af: 'Ek verduidelik hoe die aangehaalde woorde my interpretasie ondersteun.',
  },
  {
    id: 'context',
    en: 'I checked the surrounding passage and considered another interpretation.',
    af: 'Ek het die omliggende teks nagegaan en ’n ander interpretasie oorweeg.',
  },
] as const;

export interface ExamDraft {
  version: 1;
  itemId: string;
  sourceVersion: string;
  claim: string;
  explanation: string;
  quotation: { start: number; end: number; text: string } | null;
  reviewed: string[];
  updatedAt: string;
}

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const bounded = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max;

function isDraft(value: unknown): value is ExamDraft {
  if (!object(value)) return false;
  const quote = value.quotation;
  return (
    value.version === 1 &&
    bounded(value.itemId, 300) &&
    typeof value.sourceVersion === 'string' &&
    /^[a-f0-9]{64}$/.test(value.sourceVersion) &&
    bounded(value.claim, 1200) &&
    bounded(value.explanation, 6000) &&
    typeof value.updatedAt === 'string' &&
    Number.isFinite(Date.parse(value.updatedAt)) &&
    Array.isArray(value.reviewed) &&
    value.reviewed.length <= EXAM_RUBRIC.length &&
    new Set(value.reviewed).size === value.reviewed.length &&
    value.reviewed.every((id) => EXAM_RUBRIC.some((entry) => entry.id === id)) &&
    (quote === null ||
      (object(quote) &&
        typeof quote.start === 'number' &&
        Number.isSafeInteger(quote.start) &&
        quote.start >= 0 &&
        typeof quote.end === 'number' &&
        Number.isSafeInteger(quote.end) &&
        quote.end > quote.start &&
        bounded(quote.text, MAX_QUOTATION) &&
        quote.text.length > 0 &&
        quote.end - quote.start === quote.text.length))
  );
}

function readCollection(raw: string | null): ExamDraft[] {
  if (raw === null) return [];
  if (raw.length > 200000)
    throw new Error(
      'Saved response data is too large to read safely. Download your work before clearing browser storage.',
    );
  const value: unknown = JSON.parse(raw);
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.drafts) ||
    value.drafts.length > MAX_EXAM_DRAFTS ||
    !value.drafts.every(isDraft)
  ) {
    throw new Error('Saved response data could not be read safely. It has been left unchanged.');
  }
  const ids = value.drafts.map((draft) => `${draft.itemId}:${draft.sourceVersion}`);
  if (new Set(ids).size !== ids.length)
    throw new Error('Saved responses contain duplicate versions and have been left unchanged.');
  return value.drafts;
}

export async function examSourceVersion(item: Item): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${item.id}\0${item.x}`),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function emptyExamDraft(item: Item, sourceVersion: string): ExamDraft {
  return {
    version: 1,
    itemId: item.id,
    sourceVersion,
    claim: '',
    explanation: '',
    quotation: null,
    reviewed: [],
    updatedAt: new Date().toISOString(),
  };
}

export function quoteFromSelection(item: Item, start: number, end: number) {
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end > item.x.length ||
    end <= start ||
    end - start > MAX_QUOTATION
  )
    return null;
  const text = item.x.slice(start, end);
  return text.trim() ? { start, end, text } : null;
}

export function validExamDraft(
  draft: unknown,
  item: Item,
  sourceVersion: string,
): draft is ExamDraft {
  return (
    isDraft(draft) &&
    draft.itemId === item.id &&
    draft.sourceVersion === sourceVersion &&
    (draft.quotation === null ||
      item.x.slice(draft.quotation.start, draft.quotation.end) === draft.quotation.text)
  );
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function loadExamDraft(storage: DraftStorage, item: Item, sourceVersion: string) {
  const fresh = emptyExamDraft(item, sourceVersion);
  try {
    const drafts = readCollection(storage.getItem(EXAM_STORAGE_KEY));
    const saved = drafts.find(
      (draft) => draft.itemId === item.id && draft.sourceVersion === sourceVersion,
    );
    if (saved && !validExamDraft(saved, item, sourceVersion))
      throw new Error(
        'The saved quotation no longer matches this passage. Existing data has been left unchanged.',
      );
    return {
      draft: saved ?? fresh,
      error: '',
      olderVersions: drafts.filter(
        (draft) => draft.itemId === item.id && draft.sourceVersion !== sourceVersion,
      ).length,
    };
  } catch (error) {
    return {
      draft: fresh,
      error:
        error instanceof Error
          ? error.message
          : 'Saved responses could not be opened. Existing data has been left unchanged.',
      olderVersions: 0,
    };
  }
}

export function saveExamDraft(storage: DraftStorage, draft: ExamDraft, item: Item) {
  try {
    if (!validExamDraft(draft, item, draft.sourceVersion))
      throw new Error('This response has an invalid source quotation. Select the quotation again.');
    const drafts = readCollection(storage.getItem(EXAM_STORAGE_KEY));
    const other = drafts.filter(
      (entry) => entry.itemId !== draft.itemId || entry.sourceVersion !== draft.sourceVersion,
    );
    if (other.length >= MAX_EXAM_DRAFTS)
      throw new Error(
        'Twenty responses are already saved. Download your work and remove an older response before saving a new one.',
      );
    storage.setItem(EXAM_STORAGE_KEY, JSON.stringify({ version: 1, drafts: [...other, draft] }));
    return { ok: true, error: '' };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Saving failed. Download this response to keep it.',
    };
  }
}

export function removeExamDraft(storage: DraftStorage, itemId: string, sourceVersion: string) {
  try {
    const drafts = readCollection(storage.getItem(EXAM_STORAGE_KEY));
    storage.setItem(
      EXAM_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        drafts: drafts.filter(
          (draft) => draft.itemId !== itemId || draft.sourceVersion !== sourceVersion,
        ),
      }),
    );
    return { ok: true, error: '' };
  } catch {
    return {
      ok: false,
      error: 'The saved response could not be removed. Existing data has been left unchanged.',
    };
  }
}

export function examPrompt(item: Item) {
  return item.g === 'af'
    ? 'Hoe gebruik die skrywer ’n besonderheid in hierdie teks om ’n idee, karakter of stemming te ontwikkel?'
    : 'How does the writer use a detail in this passage to develop an idea, character or mood?';
}

export function examResponseText(item: Item, draft: ExamDraft) {
  if (!validExamDraft(draft, item, draft.sourceVersion))
    throw new Error('The response does not match this source.');
  return [
    'Leesmaat · Source-anchored response practice',
    `${item.t} · ${item.a}${item.sectionTitle ? ` · ${item.sectionTitle}` : ''}`,
    `Source: ${item.textSource ?? item.source ?? 'Text supplied in the reading workspace'}`,
    `Source version (SHA-256): ${draft.sourceVersion}`,
    `Updated: ${draft.updatedAt}`,
    '',
    examPrompt(item),
    '',
    'Claim',
    draft.claim || '(not written)',
    '',
    'Quotation',
    draft.quotation
      ? `“${draft.quotation.text}”\nSource character range ${draft.quotation.start}–${draft.quotation.end} (end exclusive).`
      : '(not selected)',
    '',
    'Explanation',
    draft.explanation || '(not written)',
    '',
    'Learner self-review',
    ...EXAM_RUBRIC.map(
      (entry) => `${draft.reviewed.includes(entry.id) ? '[x]' : '[ ]'} ${entry[item.g]}`,
    ),
    '',
    'This is a learner response and self-review, not a marked essay or an official exam grade.',
    '',
  ].join('\n');
}
