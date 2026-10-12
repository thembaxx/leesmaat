import { DISCOVERIES } from './discoveries';
import publicDomain from './public-domain.json' with { type: 'json' };
import type { Lang } from './data';

export type Editorial = {
  language: Lang;
  source: string;
  overview: string;
  points: { label: string; text: string; quote: string }[];
};
const original = (id: string) => DISCOVERIES.find((item) => item.id === id)!.x;

// Editorial summaries describe only these exact source versions. Archived or newly
// added passages fall back to source-only extraction instead of reusing stale claims.
export const EDITORIALS: Record<string, Editorial> = {
  e3: {
    language: 'en',
    source:
      'Reading for five minutes a day sounds too small to matter. Yet habits grow from repetition, not intensity. When a task is easy to start, the brain stops negotiating with itself.\n\nShort sessions also help comprehension. Instead of rushing, you can pause, reread a hard sentence, and look up a new word. Over weeks, these small pauses build vocabulary and confidence.',
    overview:
      'Brief daily reading builds a habit while leaving time to understand unfamiliar words and sentences.',
    points: [
      {
        label: 'Consistency',
        text: 'Repetition matters more than intensity.',
        quote: 'Yet habits grow from repetition, not intensity.',
      },
      {
        label: 'Understanding',
        text: 'Pause, reread and look up new words.',
        quote: 'Instead of rushing, you can pause, reread a hard sentence, and look up a new word.',
      },
      {
        label: 'Progress',
        text: 'Small pauses build vocabulary and confidence over time.',
        quote: 'Over weeks, these small pauses build vocabulary and confidence.',
      },
    ],
  },
  e4: {
    language: 'en',
    source: original('e4'),
    overview:
      'Naledi follows a map hidden in a library book to a quiet courtyard. A notebook of readers’ messages helps her find the pleasure of reading without hurry.',
    points: [
      {
        label: 'A different treasure',
        text: 'The map asks Naledi to find somewhere quiet.',
        quote: 'Three words waited there: Find somewhere quiet.',
      },
      {
        label: 'Shared stories',
        text: 'A box holds pencils and messages from other readers.',
        quote: 'Inside were pencils and a notebook filled with messages from other readers.',
      },
      {
        label: 'Time to read',
        text: 'Naledi adds a message about finding an unhurried place.',
        quote:
          'She wrote about the pleasure of finding a place where nobody expected her to hurry.',
      },
    ],
  },
  e6: {
    language: 'en',
    source: original('e6'),
    overview:
      'Read a poem more than once, noticing sound, imagery and pauses. Build an interpretation from the words on the page rather than seeking an immediate perfect answer.',
    points: [
      {
        label: 'First impressions',
        text: 'Read the whole poem and notice what stays with you.',
        quote:
          'Start by reading the whole poem without stopping to solve every line. Notice a sound, an image or a feeling that stays with you.',
      },
      {
        label: 'Listen closely',
        text: 'Read aloud to hear repetition, pauses and line breaks.',
        quote:
          'On the second reading, try speaking the words aloud. Listen for repeated sounds and pauses.',
      },
      {
        label: 'Use evidence',
        text: 'Explore an image and support your interpretation with the text.',
        quote: 'Support your interpretation with the words on the page.',
      },
      {
        label: 'Stay curious',
        text: 'Begin a note with “I notice…” or “I wonder…”.',
        quote: 'You can write a short note beginning with “I notice…” or “I wonder…”.',
      },
    ],
  },
  a3: {
    language: 'af',
    source: original('a3'),
    overview:
      '’n Versteekte stadstuin bring bure bymekaar om kos te kweek en stories te deel. Die tuin leer samewerking en wys hoe ’n klein gewoonte verandering kan begin.',
    points: [
      {
        label: 'Saamwerk',
        text: 'Bure werk elke Saterdag saam en deel stories.',
        quote: 'Elke Saterdag kom bure hier bymekaar om te werk en stories te deel.',
      },
      {
        label: 'Verantwoordelikheid',
        text: 'Gereedskap en die verdeling van die oes vra onderhandeling.',
        quote:
          'Iemand moet die hekke oopsluit, die gereedskap versorg en besluit hoe die oes gedeel sal word. Die mense leer dus om met mekaar te onderhandel.',
      },
      {
        label: 'Ontdekking',
        text: 'Kinders leer dat kos tyd, sonlig en aandag nodig het.',
        quote: "'n Saadjie het tyd, sonlig en aandag nodig.",
      },
      {
        label: 'Verandering',
        text: 'Die tuin help bure om mekaar te leer ken.',
        quote: "Dit gee wel vir mense 'n rede om mekaar se name te leer.",
      },
    ],
  },
  a4: {
    language: 'af',
    source: original('a4'),
    overview:
      'Mia vind ’n boek op die bus en herken haar eie ervaring van verhuising in die storie. Wanneer sy die boek aangee, begin ’n nuwe vriendskap.',
    points: [
      {
        label: 'Gee dit aan',
        text: '’n Briefie vra dat die leser die boek ná die lees aangee.',
        quote:
          "Daar was geen naam binne-in nie, net 'n klein briefie: As jy klaar gelees het, gee dit vir iemand anders.",
      },
      {
        label: 'Herkenning',
        text: 'Die meisie in die verhaal help Mia met haar eie nuwe begin.',
        quote: 'Mia het onlangs verhuis en het presies geweet hoe dit voel.',
      },
      {
        label: 'Verbinding',
        text: 'Mia gee die boek aan ’n klasmaat en hulle stap saam.',
        quote: 'Vir die eerste keer het hulle saam na die bushalte gestap.',
      },
    ],
  },
  'nsc-en-HL-book-1': {
    language: 'en',
    source: publicDomain['The Picture of Dorian Gray'].text,
    overview:
      'In Basil Hallward’s richly described studio, Lord Henry admires a beautiful young man’s portrait. Basil refuses to exhibit it, puzzling Henry, who prizes public recognition.',
    points: [
      {
        label: 'Atmosphere',
        text: 'Flowers, light and distant city sounds create a vivid setting.',
        quote: 'The dim roar of London was like the bourdon note of a distant organ.',
      },
      {
        label: 'The portrait',
        text: 'Basil has painted a young man of extraordinary beauty.',
        quote:
          'In the centre of the room, clamped to an upright easel, stood the full-length portrait of a young man of extraordinary personal beauty',
      },
      {
        label: 'A refusal',
        text: 'Basil decides to keep the portrait out of exhibitions.',
        quote: 'No, I won’t send it anywhere.',
      },
      {
        label: 'Reputation',
        text: 'Henry argues that being talked about is better than obscurity.',
        quote:
          'there is only one thing in the world worse than being talked about, and that is not being talked about.',
      },
    ],
  },
  'nsc-en-FAL-book-1': {
    language: 'en',
    source: publicDomain['Strange Case of Dr Jekyll and Mr Hyde'].text,
    overview:
      'The reserved lawyer Utterson is loyal and tolerant toward others. During a valued Sunday walk, Enfield points out a neglected door and hints at an unusual story.',
    points: [
      {
        label: 'Character',
        text: 'Utterson is strict with himself but inclined to help others.',
        quote: 'and in any extremity inclined to help rather than to reprove.',
      },
      {
        label: 'Friendship',
        text: 'Utterson and Enfield protect their weekly walks from interruptions.',
        quote:
          'For all that, the two men put the greatest store by these excursions, counted them the chief jewel of each week',
      },
      {
        label: 'Contrast',
        text: 'A neglected building interrupts a cheerful shopping street.',
        quote: 'a certain sinister block of building thrust forward its gable on the street.',
      },
      {
        label: 'Suspense',
        text: 'The door prompts Enfield to mention a very odd story.',
        quote: '“It is connected in my mind,” added he, “with a very odd story.”',
      },
    ],
  },
};
