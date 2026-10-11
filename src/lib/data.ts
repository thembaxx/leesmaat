import { hash } from './text';
import { FET_CATALOGUE } from './catalogue';
import { CURRICULUM } from './curriculum';

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
};

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const KINDS: Kind[] = ['Story', 'Poem', 'Article', 'Book'];

export const DICT: Record<string, { g: Lang; d: string; t: string }> = {
  flickered: { g: 'en', d: 'burned with an unsteady light', t: 'flikker' },
  neighbour: { g: 'en', d: 'someone who lives near you', t: 'buurman' },
  understood: { g: 'en', d: 'knew the meaning of something', t: 'verstaan' },
  gogo: { g: 'en', d: 'grandmother (isiZulu, isiXhosa)', t: 'ouma' },
  lingers: { g: 'en', d: 'stays a little longer than expected', t: 'talm' },
  borrow: { g: 'en', d: 'to take something for a short while', t: 'leen' },
  habits: { g: 'en', d: 'things you do regularly, almost without thinking', t: 'gewoontes' },
  comprehension: { g: 'en', d: 'the ability to understand what you read', t: 'begrip' },
  vocabulary: { g: 'en', d: 'all the words you know', t: 'woordeskat' },
  negotiating: { g: 'en', d: 'talking to reach an agreement', t: 'onderhandel' },
  horizon: { g: 'en', d: 'the line where land meets sky', t: 'horison' },
  perron: { g: 'af', d: 'die plek by die stasie waar passasiers staan', t: 'platform' },
  verskyn: { g: 'af', d: 'sigbaar word', t: 'appear' },
  geglimlag: { g: 'af', d: 'saggies gelag sonder geluid', t: 'smiled' },
  ontwaak: { g: 'af', d: 'wakker word', t: 'awaken' },
  stilte: { g: 'af', d: 'geen geluid nie', t: 'silence' },
  vlakte: { g: 'af', d: 'groot, plat stuk land', t: 'plain' },
  heuwels: { g: 'af', d: 'lae berge', t: 'hills' },
};

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

export const LIBRARY: Item[] = [...ORIGINALS, ...CURRICULUM, ...FET_CATALOGUE].map(
  (item, index) => ({
    ...item,
    rights: item.rights ?? 'Original Leesmaat writing',
    art: `/art/cover-${index % 6}.svg`,
  }),
);

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
  const pool = LIBRARY.filter((i) => i.g === g && (!i.n || i.rights === 'Public-domain excerpt'));
  return pool[hash(day + g) % pool.length]!;
}
