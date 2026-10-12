# Content provenance

Checked 12 October 2026.

## Grade 12, English and Afrikaans HL/FAL

Title and author metadata is transcribed in `src/lib/curriculum.ts` from the [official WCED booklet, extracted from Curriculum FET minute 0008/2024](https://www.westerncape.gov.za/education/files/wcg-blob-files?file=2026-07%2Fgrade-12-literature-extract-from-dcf-0008-of-2024-booklet.pdf&type=file). This covers October/November 2025 through May/June 2027 and implements DBE Circular E11 of 2024. The [covering minute](https://www.westerncape.gov.za/education/files/wcg-blob-files?file=2025-01%2Fedcf0008-2024.pdf&type=file) confirms that the setworks continue from the preceding exam cycle.

The four subject lists include novels, drama, poetry and short stories. Modern texts are represented by factual catalogue metadata and library links. Generic prototype study prompts have been removed from these records. Five public-domain English setworks include complete imported reading texts.

## Grade 10–11

`src/lib/fet-catalogue.json` contains 32 deduplicated English and Afrikaans HL/FAL title/author/ISBN records from the [DBE FET literature catalogue, revised 29 February 2024](https://www.education.gov.za/LinkClick.aspx?fileticket=D3b62PzdnJE%3D&mid=2688&portalid=0&tabid=757&forcedownload=true), linked by the [current official catalogue index](https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/LTSMNationalCatalogue.aspx). Repeated publisher rows were deduplicated by language, level, grade and ISBN. These are approved catalogue selections, not a claim that all schools prescribe all of them.

## Published reading texts

`scripts/import-content.py` produces `src/lib/published.json` and `public/content/*.json` from attributed Project Gutenberg HTML editions. The current 45 works contain 15 complete book reading texts, 18 complete poems, nine complete short stories and three Francis Bacon essays. Historical spelling is retained; footnotes, illustrations and publisher front matter are omitted. The Afrikaans anthology contains its 115 poem texts. The source editions of _Kampstories_ and _Digters uit Suid-Afrika_ are dated 1924 and 1922 respectively.

Books include Alice, Pride and Prejudice, Dorian Gray, Jekyll and Hyde, Treasure Island, Oz, The Secret Garden, Frankenstein, Gatsby, The Story of an African Farm, Hamlet, Othello, Macbeth and the two Afrikaans collections. Their complete chapter/scene lists and download checksums are verified in tests. Public plain-text endpoints include all imported sections. Each title records its source URL, edition note and cover attribution. Source-edition covers are fetched from Project Gutenberg's published cover assets.

The underlying texts are public domain in the USA and South Africa. Modern study editions and commentary are not imported. Anna’s Archive is linked for metadata discovery; it supplies no reading text to this app. Open Library and official education catalogues provide edition-finding paths.

## Dictionary

Dictionary entries are real Wiktionary records extracted through [Kaikki](https://kaikki.org/dictionary/). `scripts/import-dictionary.py` normalizes IPA, part of speech, senses, examples, synonyms, inflections and source links. The committed Afrikaans snapshot has 9,150 entries from English Wiktionary, so its Afrikaans headwords have **English definitions**. The UI states this explicitly. English entries load on demand through a validated same-origin endpoint; 49 initial entries across both languages are bundled. Looked-up entries are cached offline. Definitions retain CC BY-SA 4.0 / GFDL attribution and individual Wiktionary links; see `public/dictionaries/SOURCE.md`. No unavailable entry gets a fabricated definition.

## Original material and artwork

The short reads supplied in the prototype, the six additional complete readings in `src/lib/discoveries.ts`, placement questions are Leesmaat original writing. `public/art/cover-0.svg` through `cover-5.svg` are original vector illustrations created for this project, reproducible with `node scripts/create-art.mjs`. They evoke a window light, mountains, evening hills, forest, city and coastal landscape. They remain available for previously archived original readings. Current catalogue cards use sourced covers or typography. `public/art/covers/*.svg` now contains 125 title-assigned original illustrations, with motifs chosen by title and stable palette variations. These are Leesmaat artwork, not publisher cover reproductions. `pnpm art` regenerates these, the open-book and spark mark, wordmark, PNG icons, social preview and portrait iOS launch screens. `scripts/create-art.mjs` is retained only to reproduce the legacy six covers; use `pnpm art` afterward to restore the current brand icon.

Future texts need a recorded source and permission/public-domain basis. Update the Grade 12 list when the examination circular changes; do not relabel the approved Grades 10–11 catalogue as a national prescribed list.
