import records from './fet-catalogue.json';
import { CATALOGUE_SOURCE } from './curriculum';
import type { Item } from './data';
export const FET_CATALOGUE: Item[] = records.map((record) => {
  const g = record.g === 'af' ? 'af' : 'en',
    course = record.course === 'HL' ? 'HL' : 'FAL';
  return {
    ...record,
    g,
    course,
    k: 'Book',
    v: course === 'HL' ? 2 : 1,
    m: 2,
    source: CATALOGUE_SOURCE,
    rights: 'Original study note',
    n: `Gr ${record.grade} · ${course === 'HL' ? 'Home Language' : 'First Additional Language'} · Catalogue selection`,
    x:
      g === 'en'
        ? `This is an original Leesmaat study note. “${record.t}” appears in the DBE Grade ${record.grade} ${course} literature catalogue. Confirm your school’s selection with your teacher and use your own copy of the text.\n\nRead one short passage. Identify who is speaking and what they want the reader to understand. Describe the mood in a single word, then choose a detail that supports your description.\n\nExplain the difference between a fact in the passage and your interpretation of it. Try to state your interpretation in a complete sentence. Compare it with a classmate’s response: how does the evidence support each view?`
        : `Hierdie is ’n oorspronklike Leesmaat-studienota. “${record.t}” verskyn in die DBE se literatuurkatalogus vir Graad ${record.grade}. Bevestig jou skool se keuse by jou onderwyser en gebruik jou eie eksemplaar.\n\nLees ’n kort gedeelte. Identifiseer wie praat en wat daardie persoon wil hê die leser moet verstaan. Beskryf die stemming in een woord en kies ’n detail wat jou beskrywing ondersteun.\n\nVerduidelik die verskil tussen ’n feit in die gedeelte en jou interpretasie daarvan. Skryf jou interpretasie in ’n volledige sin. Vergelyk dit met ’n klasmaat se antwoord: watter bewyse ondersteun elke siening?`,
  };
});
