# Leesmaat — current handoff

The supplied prototype has been installed and completed as a Next.js App Router application. See README.md for run, deployment, sync configuration and test commands, and CONTENT.md for catalogue provenance and text/art rights.

## Branding and PWA pass

The name stays Leesmaat. A new open-book/spark identity, tagline, 125 title-specific illustrated covers, six original readings, 3D interactive onboarding and animated Three.js backgrounds are included. Themes now cover browser chrome, first paint, loading/recovery, safe areas, responsive layouts and supported iOS portrait launch screens. PWA installation, shortcuts, update prompts, real offline reading and storage protection are wired. Reader Back/Forward, sharing, fullscreen, Media Session and read-aloud wake lock use native browser support where available.

Public library/title pages, structured data, robots, a configurable sitemap, social art, plain-text endpoints and llms.txt/llm.txt/llms-full.txt support discovery. Set NEXT_PUBLIC_SITE_URL before building to activate production canonical URLs and the sitemap. The existing Firebase setup requirement remains. See BRAND.md and README.md.

## Delivered

Home, reader, practice, bookmarks/archive and richer onboarding; separate English/Afrikaans levels; phrase search and navigation; stable note anchors and highlights; saved-word spaced repetition and comprehension questions; accessible native sheets, keyboard focus, reduced motion and first-paint theming; original illustrated covers; optional Firebase Google sign-in and per-entry Firestore sync; production PWA shell, manifest and real IndexedDB downloads; daily-goal celebration and once-per-day awards; verified 2026 Grade 12 setworks and 32 Grade 10–11 catalogue selections.

## Architecture

- src/lib/state.ts: validated state and prototype migration.
- src/lib/store.tsx: local persistence, cross-tab updates and theme/clock integration.
- src/lib/sync.ts: timestamped per-field/entry merging with deletion tombstones; downloads stay local.
- src/components/SyncProvider.tsx: Firebase auth, realtime reads and transactional writes with reconnect handling.
- firestore.rules: owner-only reading data; tested against emulators.
- src/lib/offline.ts + OfflineProvider.tsx: IndexedDB content and download reconciliation.
- scripts/prepare-build.mjs + build-sw.mjs + sw-template.js: worker generated from the actual production build.
- src/lib/curriculum.ts, catalogue.ts, fet-catalogue.json and public-domain.json: factual catalogue and licensed/original readings.
- src/lib/learning.ts + reader.ts: goal/review logic and source offsets.
- tests/: meaningful unit, Firebase emulator, mobile-browser and accessibility checks; GitHub Actions workflow included.

## Activation and platform limits

The owner still needs to supply a Firebase web app's public config, enable Google auth, authorize the hosting domain and deploy firestore.rules. Everything works locally without this setup. Google identity and sync are exercised with emulators; real OAuth needs the owner's project. Offline caching requires a production build on HTTPS or localhost. TTS languages and word boundary events depend on device voices and browsers. Modern copyrighted setworks have original, labelled study notes; public-domain entries contain excerpts. Grade 10–11 school selections must be confirmed with the teacher. Same-entry concurrent progress/XP edits use last-write-wins rather than summing sessions.

Use pnpm. Run format, lint, typecheck, unit and sync tests, production build and browser tests before changing the release.
