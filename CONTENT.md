# Content provenance

Checked 11 October 2026.

## Grade 12, English and Afrikaans HL/FAL

Title and author metadata is transcribed in `src/lib/curriculum.ts` from the [official WCED booklet, extracted from Curriculum FET minute 0008/2024](https://www.westerncape.gov.za/education/files/wcg-blob-files?file=2026-07%2Fgrade-12-literature-extract-from-dcf-0008-of-2024-booklet.pdf&type=file). This covers October/November 2025 through May/June 2027 and implements DBE Circular E11 of 2024. The [covering minute](https://www.westerncape.gov.za/education/files/wcg-blob-files?file=2025-01%2Fedcf0008-2024.pdf&type=file) confirms that the setworks continue from the preceding exam cycle.

The four subject lists include novels, drama, poetry and short stories. Modern texts are represented by factual catalogue metadata and original Leesmaat reading prompts. They do not contain unlicensed extracts, publisher artwork or impersonations of the original text. An original study note is identified in the home list, cover and reader.

## Grade 10–11

`src/lib/fet-catalogue.json` contains 32 deduplicated English and Afrikaans HL/FAL title/author/ISBN records from the [DBE FET literature catalogue, revised 29 February 2024](https://www.education.gov.za/LinkClick.aspx?fileticket=D3b62PzdnJE%3D&mid=2688&portalid=0&tabid=757&forcedownload=true), linked by the [current official catalogue index](https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/LTSMNationalCatalogue.aspx). Repeated publisher rows were deduplicated by language, level, grade and ISBN. These are approved catalogue selections, not a claim that all schools prescribe all of them.

## Public-domain excerpts

`src/lib/public-domain.json` contains the opening seven paragraphs of:

- [The Picture of Dorian Gray](https://www.gutenberg.org/ebooks/174), Oscar Wilde (1854–1900). Gutenberg transcription credits Judith Boss; HTML version Al Haines.
- [Strange Case of Dr Jekyll and Mr Hyde](https://www.gutenberg.org/ebooks/43), Robert Louis Stevenson (1850–1894).

The underlying texts are public domain in South Africa as well as the USA. Line wrapping was normalised; source links stay visible in the reader. Modern study editions and their commentary are not included. These are excerpts, not complete books.

## Original material and artwork

The short reads supplied in the prototype, placement questions, comprehension questions and catalogue study prompts are Leesmaat original writing. `public/art/cover-0.svg` through `cover-5.svg` are original vector illustrations created for this project, reproducible with `node scripts/create-art.mjs`. They evoke a window light, mountains, evening hills, forest, city and coastal landscape. They do not reproduce commercial book covers. `public/icon.svg` is an original book mark; PNG app icons are rasterisations of it.

Future texts need a recorded source and permission/public-domain basis. Update the Grade 12 list when the examination circular changes; do not relabel the approved Grades 10–11 catalogue as a national prescribed list.
