import { hash } from './text';
import { FET_CATALOGUE } from './catalogue';
import { CURRICULUM } from './curriculum';
import { DISCOVERIES } from './discoveries';
import published from './published.json' with { type: 'json' };
import dictionarySeed from './dictionary-seed.json' with { type: 'json' };
import { artPath } from './art';

export type Lang = 'en' | 'af';
export type Kind = 'Story' | 'Poem' | 'Article' | 'Book';
export type Item = {
  id: string;
  g: Lang;
  k: Kind;
  v: 0 | 1 | 2;
  t: string;
  a: string;
  m: number;
  n?: string;
  x: string;
  art?: string;
  source?: string;
  textSource?: string;
  rights?: string;
  course?: 'HL' | 'FAL';
  grade?: number;
  genre?: string;
  isbn?: string;
  summary?: string;
  tags?: string[];
  published?: boolean;
  year?: number;
  cover?: string | null;
  coverSource?: string;
  collection?: string;
  editionNote?: string;
  wordCount?: number;
  contentUrl?: string;
  contentBytes?: number;
  contentHash?: string;
  sections?: { title: string; words: number }[];
  book?: BookContent;
  bookId?: string;
  sectionIndex?: number;
  sectionTitle?: string;
};

export type BookContent = {
  title: string;
  author: string;
  source: string;
  sections: { title: string; x: string; author?: string }[];
  licence: string;
};
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const KINDS: Kind[] = ['Book', 'Poem', 'Story', 'Article'];
export const KIND_LABELS: Record<Kind, string> = {
  Book: 'Books',
  Poem: 'Poems',
  Story: 'Short stories',
  Article: 'Articles',
};

// Real, attributed Wiktionary senses replace the prototype's hand-written glossary.
export const DICT: Record<string, { g: Lang; d: string; t: string }> = Object.fromEntries(
  Object.values(dictionarySeed)
    .map((entry) => [
      entry.word.toLowerCase(),
      { g: entry.language as Lang, d: entry.meanings[0]?.definitions[0]?.definition ?? '', t: '' },
    ])
    .filter(([, value]) => typeof value !== 'string' && value.d),
);

// Original short reads plus the verified NSC catalogue.
const ORIGINALS: Item[] = [
  {
    id: 'e1',
    g: 'en',
    k: 'Story',
    v: 0,
    t: "Gogo's Kitchen Light",
    a: 'Original story',
    m: 1,
    x: `Every evening, Gogo left the kitchen light on. Thando never asked why. The light was small and yellow, and it made the whole street feel safe.

One night the power went out. The street turned dark, but Gogo lit a candle and placed it by the window. "A light must stay," she said. "Someone may be walking home."

Soon a neighbour knocked, then another. They sat together, sharing bread and old stories while the candle flickered. Thando understood at last: the light was never only for Gogo.`,
  },
  {
    id: 'e2',
    g: 'en',
    k: 'Poem',
    v: 1,
    t: 'Morning on the Mountain',
    a: 'Original poem',
    m: 1,
    x: `The mist lifts slowly from the mountain's shoulder,
a quiet kettle of cloud begins to sing.
The city stretches, older than its noise,

and lingers in the gold of early light.
We borrow this calm the way the sea borrows the shore,
and carry a little of it home.`,
  },
  {
    id: 'e3',
    g: 'en',
    k: 'Article',
    v: 2,
    t: 'Why Five Minutes Works',
    a: 'Original article',
    m: 2,
    x: `Reading for five minutes a day sounds too small to matter. Yet habits grow from repetition, not intensity. When a task is easy to start, the brain stops negotiating with itself.

Short sessions also help comprehension. Instead of rushing, you can pause, reread a hard sentence, and look up a new word. Over weeks, these small pauses build vocabulary and confidence.`,
  },
  {
    id: 'a1',
    g: 'af',
    k: 'Story',
    v: 0,
    t: 'Die Laaste Trein',
    a: 'Oorspronklike storie',
    m: 1,
    x: `Die son het reeds agter die heuwels gesak toe Pieter by die stasie aankom. Die perron was stil. Net 'n ou man het op 'n bank gesit en wag.

"Die trein is laat," het die man gesê. "Maar hy kom altyd."

Pieter het langsaan gaan sit. Hy het gedink aan die plaas, aan sy ma se brood en aan die lang pad terug. Toe die lig van die trein tussen die bome verskyn, het hy geglimlag.`,
  },
  {
    id: 'a2',
    g: 'af',
    k: 'Poem',
    v: 1,
    t: 'Karoo-aand',
    a: 'Oorspronklike gedig',
    m: 1,
    x: `Die dag sak stadig in die rooi sand,
die sterre ontwaak, een vir een.

Die wind dra 'n lied oor die leë land,
en die stilte hou my aan die hand.`,
  },
];

const publishedItems = published as Item[];
const curriculum = [...CURRICULUM, ...FET_CATALOGUE].map((item) => {
  const full = publishedItems.find((entry) => entry.id === item.id);
  return full
    ? { ...item, ...full, source: item.source }
    : {
        ...item,
        x: '',
        m: 0,
        rights: 'Catalogue metadata',
        summary: `${item.t} by ${item.a}. ${item.n ?? ''}${item.isbn ? ' ISBN ' + item.isbn + '.' : ''}`,
      };
});
export const LIBRARY: Item[] = [
  ...publishedItems.filter((item) => !curriculum.some((entry) => entry.id === item.id)),
  ...curriculum,
  ...ORIGINALS,
  ...DISCOVERIES,
].map((item) => ({
  ...item,
  rights: item.rights ?? 'Original Leesmaat writing',
  art: item.art ?? artPath(item.id),
  summary:
    item.summary ??
    `${item.t} · ${item.a}${item.year ? ' · ' + item.year : ''}. ${item.contentUrl ? 'Read the book by chapter or scene.' : item.published ? 'Read the complete ' + item.k.toLowerCase() + '.' : item.x.split('\n\n')[0]!.replace(/\n/g, ' ').slice(0, 160)}`,
  tags:
    item.tags ??
    [
      item.k,
      item.g === 'af' ? 'Afrikaans' : 'English',
      ...(item.genre ? [item.genre] : []),
      ...(item.grade ? ['Grade ' + item.grade, item.course ?? ''] : []),
    ].filter(Boolean),
}));
export const BROWSABLE_LIBRARY = LIBRARY.filter(
  (item) => item.published || item.rights === 'Catalogue metadata',
);
export const readable = (item: Item) => !!(item.contentUrl || item.x.trim());

export const PLACEMENT: Record<Lang, { c: string[]; w: string; o: string[]; a: number }> = {
  en: {
    c: [
      'The cat sat on the mat.',
      'The market was loud, but Thandi found the quiet corner she loved.',
      'Despite the clamour, she cultivated a deliberate stillness that unsettled everyone around her.',
    ],
    w: 'linger',
    o: ['to leave quickly', 'to stay a little longer', 'to shout'],
    a: 1,
  },
  af: {
    c: [
      'Die kat sit op die mat.',
      'Die mark was raserig, maar Thandi het die stil hoekie gevind wat sy liefgehad het.',
      "Ondanks die geraas het sy 'n doelbewuste stilte gekweek wat almal om haar ontstel het.",
    ],
    w: 'aarsel',
    o: ['vinnig hardloop', 'huiwer omdat jy nie seker is nie', 'hardop lag'],
    a: 1,
  },
};

export function dailyItem(g: Lang, day: string): Item {
  const pool = LIBRARY.filter((i) => i.g === g && i.published && readable(i));
  return pool[hash(day + g) % pool.length]!;
}
