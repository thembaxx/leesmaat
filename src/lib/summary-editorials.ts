import { DISCOVERIES } from './discoveries';
import publicDomain from './public-domain.json';
import type { Item, Lang } from './data';
import { CURRICULUM } from './curriculum';
import { FET_CATALOGUE } from './catalogue';

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

const body = (text: string) => text.split('\n\n').slice(1).join('\n\n');
const studySource = (items: Item[], language: Lang) =>
  body(items.find((item) => item.g === language && item.rights === 'Original study note')!.x);
const STUDY_EDITORIALS: (Omit<Editorial, 'source'> & { sourceBody: string })[] = [
  {
    language: 'en',
    sourceBody: studySource(CURRICULUM, 'en'),
    overview:
      'Read a short passage, explain its mood and separate facts from inference. Use textual evidence, consider alternative readings and revise your interpretation after rereading.',
    points: [
      {
        label: 'Mood',
        text: 'Explain how a chosen word shapes your response.',
        quote: 'Pick a word that shapes the mood, then explain how it changes your response.',
      },
      {
        label: 'Evidence',
        text: 'Separate stated facts from inference and support your reading.',
        quote:
          'Separate what the text states from what you infer. Support your inference with a specific detail from your copy.',
      },
      {
        label: 'Revision',
        text: 'Reread for missed details and clarify your interpretation.',
        quote:
          'Return to the passage after writing your answer. Did you overlook a detail? Revise one sentence so that your interpretation is clearer.',
      },
    ],
  },
  {
    language: 'af',
    sourceBody: studySource(CURRICULUM, 'af'),
    overview:
      'Lees ’n kort gedeelte en verduidelik die stemming. Onderskei tussen wat die teks sê en jou afleiding, en vergelyk interpretasies met behulp van bewyse.',
    points: [
      {
        label: 'Stemming',
        text: 'Kies ’n woord en verduidelik die uitwerking daarvan.',
        quote:
          'Kies dan ’n woord wat die stemming beïnvloed. Verduidelik hoe daardie woord jou reaksie verander.',
      },
      {
        label: 'Bewyse',
        text: 'Ondersteun jou afleiding met ’n spesifieke detail.',
        quote: 'Ondersteun jou afleiding met ’n spesifieke detail uit jou eksemplaar.',
      },
      {
        label: 'Interpretasie',
        text: 'Vergelyk moontlike interpretasies met die bewyse.',
        quote:
          'Dink aan ’n ander moontlike interpretasie en besluit watter een die beste by die bewyse pas.',
      },
    ],
  },
  {
    language: 'en',
    sourceBody: studySource(FET_CATALOGUE, 'en'),
    overview:
      'Identify the speaker and mood in a short passage. Distinguish facts from interpretation, then compare your reading with a classmate’s using evidence.',
    points: [
      {
        label: 'Voice',
        text: 'Identify who speaks and what they want the reader to understand.',
        quote: 'Identify who is speaking and what they want the reader to understand.',
      },
      {
        label: 'Mood',
        text: 'Choose a mood and a supporting detail.',
        quote:
          'Describe the mood in a single word, then choose a detail that supports your description.',
      },
      {
        label: 'Interpretation',
        text: 'Separate fact from interpretation and compare the evidence for different views.',
        quote:
          'Explain the difference between a fact in the passage and your interpretation of it. Try to state your interpretation in a complete sentence. Compare it with a classmate’s response: how does the evidence support each view?',
      },
    ],
  },
  {
    language: 'af',
    sourceBody: studySource(FET_CATALOGUE, 'af'),
    overview:
      'Identifiseer die spreker en stemming in ’n kort gedeelte. Onderskei feite van interpretasie en vergelyk jou antwoord met ’n klasmaat s’n deur bewyse te gebruik.',
    points: [
      {
        label: 'Spreker',
        text: 'Identifiseer wie praat en wat die leser moet verstaan.',
        quote: 'Identifiseer wie praat en wat daardie persoon wil hê die leser moet verstaan.',
      },
      {
        label: 'Stemming',
        text: 'Beskryf die stemming en kies ’n ondersteunende detail.',
        quote: 'Beskryf die stemming in een woord en kies ’n detail wat jou beskrywing ondersteun.',
      },
      {
        label: 'Interpretasie',
        text: 'Onderskei feite van interpretasie en vergelyk antwoorde met bewyse.',
        quote:
          'Verduidelik die verskil tussen ’n feit in die gedeelte en jou interpretasie daarvan. Skryf jou interpretasie in ’n volledige sin. Vergelyk dit met ’n klasmaat se antwoord: watter bewyse ondersteun elke siening?',
      },
    ],
  },
];
export function studyEditorial(item: Item): Editorial | undefined {
  if (item.rights !== 'Original study note') return;
  const template = STUDY_EDITORIALS.find(
    (entry) => entry.language === item.g && entry.sourceBody === body(item.x),
  );
  if (template) return { ...template, source: item.x };
}
