import excerpts from './public-domain.json';
import type { Item, Kind, Lang } from './data';
export const CURRICULUM_SOURCE =
  'https://www.westerncape.gov.za/education/files/wcg-blob-files?file=2026-07%2Fgrade-12-literature-extract-from-dcf-0008-of-2024-booklet.pdf&type=file';
export const CATALOGUE_SOURCE =
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/LTSMNationalCatalogue.aspx';
// Title/author metadata transcribed from the official 2025–June 2027 list.
// Study prompts are original Leesmaat writing, never substituted for the actual setwork.
type Group = { g: Lang; course: 'HL' | 'FAL'; kind: Kind; rows: [string, string][] };
const groups: Group[] = [
  {
    g: 'en',
    course: 'HL',
    kind: 'Book',
    rows: [
      ['Life of Pi', 'Yann Martel'],
      ['The Picture of Dorian Gray', 'Oscar Wilde'],
      ['Othello', 'William Shakespeare'],
      ['The Crucible', 'Arthur Miller'],
      ['Hamlet', 'William Shakespeare'],
    ],
  },
  {
    g: 'en',
    course: 'FAL',
    kind: 'Book',
    rows: [
      ['Cry, the Beloved Country', 'Alan Paton'],
      ['Strange Case of Dr Jekyll and Mr Hyde', 'Robert Louis Stevenson'],
      ['My Children! My Africa!', 'Athol Fugard'],
      ['Macbeth', 'William Shakespeare'],
    ],
  },
  {
    g: 'af',
    course: 'HL',
    kind: 'Book',
    rows: [
      ['Manaka plek van die horings', 'Pieter Pieterse'],
      ['Vatmaar', 'A. H. M. Scholtz'],
      ['Die kwart-voor-sewe-lelie', 'Eleanor Baker'],
      ['Onderwêreld', 'Fanie Viljoen'],
      ['Mis', 'Reza de Wet'],
      ['Die krismis van Map Jacobs', 'Adam Small'],
    ],
  },
  {
    g: 'af',
    course: 'FAL',
    kind: 'Book',
    rows: [
      ['Meeulanders', 'Esta Steyn'],
      ['Die ongelooflike avonture van Hanna Hoekom', 'Marita van der Vyver'],
      ['Kringe in ’n bos', 'Dalene Matthee'],
      ['Lien se lankstaanskoene', 'Derick van der Walt'],
      ['Poppie', 'Elsa Joubert'],
      ['Paljas', 'Chris Barnard'],
      ['Fiela se kind – die drama', 'Dalene Matthee'],
    ],
  },
  {
    g: 'en',
    course: 'HL',
    kind: 'Poem',
    rows: [
      ['Sonnet 130', 'William Shakespeare'],
      ['The Child Who Was Shot Dead by Soldiers in Nyanga', 'Ingrid Jonker'],
      ['At a Funeral', 'Dennis Brutus'],
      ['Poem of Return', 'Jofre Rocha'],
      ['Talk to the Peach Tree', 'Sipho Sepamla'],
      ['Prayer to Masks', 'Léopold Sédar Senghor'],
      ['This Winter Coming', 'Karen Press'],
      ['Solitude', 'Ella Wheeler Wilcox'],
      ['The Morning Sun is Shining', 'Olive Schreiner'],
      ['It Is a Beauteous Evening, Calm and Free', 'William Wordsworth'],
      ['Fern Hill', 'Dylan Thomas'],
      ['The Shipwreck', 'Emily Dickinson'],
    ],
  },
  {
    g: 'en',
    course: 'FAL',
    kind: 'Story',
    rows: [
      ['Forbidden Love', 'Can Themba'],
      ['Rejection', 'Mariama Bâ'],
      ['Eveline', 'James Joyce'],
      ['A Bag of Sweets', 'Agnes Sam'],
      ['Class Act', 'Namhla Tshisana'],
      ['The Wind and a Boy', 'Bessie Head'],
      ['The Girl Who Can', 'Ama Ata Aidoo'],
      ['Triumph in the Face of Adversity', 'Kedibone Seku'],
    ],
  },
  {
    g: 'en',
    course: 'FAL',
    kind: 'Poem',
    rows: [
      ['Hard to find', 'Sinesipo Jojo'],
      ['On the Grasshopper and Cricket', 'John Keats'],
      ['Sonnet 73', 'William Shakespeare'],
      ['Reciprocities', 'Cathal Lagan'],
      ['What Life Is Really Like', 'Beverly Rycroft'],
      ['You Laughed and Laughed and Laughed', 'Gabriel Okara'],
      ['The Lake Isle of Innisfree', 'William Butler Yeats'],
      ['The Slave Dealer', 'Thomas Pringle'],
      ['Inversnaid', 'Gerard Manley Hopkins'],
      ['The Night-jar and Inkosazana Yasenzulwini', 'Chris Mann'],
    ],
  },
  {
    g: 'af',
    course: 'FAL',
    kind: 'Story',
    rows: [
      ['Kringloop', 'Ruto Vambo'],
      ['Die vlek', 'Piet Nell'],
      ['Die droom', 'Pierré Olivier'],
      ['Geluk in ongeluk', 'Theltom Masimila'],
      ['Opdrag', 'Rike Olivier'],
      ['Kom ons stuur vir Tasu', 'Maretha Maartens'],
      ['Two-step in die Moederstad', 'Mioné du Toit'],
      ['’n Hulpelose Samaritaan', 'T. T. Cloete'],
    ],
  },
  {
    g: 'af',
    course: 'FAL',
    kind: 'Poem',
    rows: [
      ['Krisis', 'Elisabeth Eybers'],
      ['Ken jy die see …', 'Uys Krige'],
      ['Wetenskapmannetjies', 'Antjie Krog'],
      ['Eksamenlokaal', 'Suzaan Laing'],
      ['Die dans van die reën', 'Eugène N. Marais'],
      ['Die heks van Hexrivier', 'Philip Nel'],
      ['Sproeireën', 'D. J. Opperman'],
      ['Haar uitvaart', 'P. J. Philander'],
      ['Die Hanswors', 'S. J. Pretorius'],
      ['Die hardloper', 'Ernst van Heerden'],
    ],
  },
  {
    g: 'af',
    course: 'HL',
    kind: 'Poem',
    rows: [
      ['Suiwer wiskunde', 'N. P. van Wyk Louw'],
      ['Die bokser', 'Ernst van Heerden'],
      ['elegie vir my toekomstige vrou', 'André Letoit'],
      ['Vroue van Vermeer', 'T. T. Cloete'],
      ['27 april 1994', 'Vincent Oliphant'],
      ['dienaar van die nagereg', 'Patrick Petersen'],
      ['Maaltyd', 'P. J. Philander'],
      ['’n Paternoster vir Suid-Afrika', 'Lina Spies'],
      ['Tsunami', 'Kobus de Wet'],
      ['Op sy branderplank', 'Petra Müller'],
      ['Briefie aan Madiba', 'Sandra O’Kelly'],
      ['Susan Boyle', 'Kobus Grobler'],
    ],
  },
];

export const CURRICULUM: Item[] = groups.flatMap(({ g, course, kind, rows }) =>
  rows.map(([t, a], index) => {
    const excerpt = (excerpts as Record<string, { text: string; source: string }>)[t];
    const af = g === 'af';
    const x =
      excerpt?.text ??
      (af
        ? `Hierdie is ’n oorspronklike Leesmaat-studienota oor hoe om jou voorgeskrewe teks te lees. Hou jou eie eksemplaar van “${t}” byderhand.\n\nLees ’n kort gedeelte stadig. Skryf in een sin neer wat gebeur of wat die spreker beskryf. Kies dan ’n woord wat die stemming beïnvloed. Verduidelik hoe daardie woord jou reaksie verander.\n\nOnderskei tussen wat die teks sê en wat jy daaruit aflei. Ondersteun jou afleiding met ’n spesifieke detail uit jou eksemplaar. Dink aan ’n ander moontlike interpretasie en besluit watter een die beste by die bewyse pas.`
        : `This is an original Leesmaat study note to use alongside your own copy of “${t}”.\n\nRead a short passage slowly. In one sentence, describe what happens or what the speaker notices. Pick a word that shapes the mood, then explain how it changes your response.\n\nSeparate what the text states from what you infer. Support your inference with a specific detail from your copy. Consider another possible interpretation and decide which one the evidence supports.\n\nReturn to the passage after writing your answer. Did you overlook a detail? Revise one sentence so that your interpretation is clearer.`);
    return {
      id: `nsc-${g}-${course}-${kind.toLowerCase()}-${index}`,
      g,
      k: kind,
      v: course === 'HL' ? 2 : 1,
      t,
      a,
      m: excerpt ? Math.max(1, Math.ceil(excerpt.text.split(/\s+/).length / 180)) : 2,
      n: `Gr 12 · ${course === 'HL' ? (af ? 'Huistaal' : 'Home Language') : af ? 'Eerste Addisionele Taal' : 'First Additional Language'}`,
      course,
      grade: 12,
      source: CURRICULUM_SOURCE,
      textSource: excerpt?.source,
      rights: excerpt ? 'Public-domain excerpt' : 'Original study note',
      x,
    };
  }),
);
