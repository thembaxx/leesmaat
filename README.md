# Leesmaat

English and Afrikaans literacy, five minutes at a time. Next.js App Router, TypeScript, Tailwind v4 and Phosphor icons, with optional Google sync and an offline reading archive.

## Run

Use Node 24 and pnpm 11.25.0 (declared in `package.json`).

```sh
pnpm install
pnpm dev
```

The home, reader, practice, bookmarks and placement screens work without any account or backend. The floating navigation keeps three icon-only destinations.

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

Offline caching runs in production (`pnpm build && pnpm start`), on localhost or HTTPS. Development deliberately does not register a worker. On a production page, allow the app shell to prepare, open a reading's settings, and choose **Download offline**. The **Archive** tab in Bookmarks lists real IndexedDB downloads. Reload offline to verify the shell, reading, artwork, words and notes remain available. In iOS Safari, use Share → Add to Home Screen; other supporting browsers offer installation from their menu.

## Enable Google sync

1. Create a Firebase project and register a web app. Enable **Authentication → Google** and create a **Cloud Firestore Standard edition** database.
2. Copy `.env.example` to `.env.local` and fill in the four public web-app config values. No service account or client secret belongs in this repository. Configure the same variables on your host **before building**; Next embeds these public values in its client bundle.
3. Add localhost and the deployed domain under Authentication's **Authorized domains**. The Firebase project's auth domain must match the web-app configuration.
4. Deploy the provided rules to that project:

   ```sh
   pnpm exec firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

   Use your own authenticated Firebase CLI connection for this administrative setup. Keep the supplied rules; test-mode rules expose reading data.

5. Rebuild and open Settings → **Continue with Google**. A second browser signed into the same Google account receives progress, language levels, preferences, bookmarks, words, anchored notes and review schedules. Signing out keeps the local library.

Each learner owns `/users/{uid}/state/reading`; the rules deny anonymous and cross-account access. Every logical setting or collection entry has a timestamp and device tie-breaker. Firestore transactions merge clocks before saving, and tombstones preserve deletions. Download IDs and content remain device-local. Local changes survive failed sign-in, loss of connectivity and reload, and upload when reconnected. There is a short debounce to avoid a write every reading second. Simultaneous edits to the same entry resolve to the latest clock; reading seconds and XP use this same rule rather than adding concurrent sessions together. Device clocks should be correct.

The Firebase public configuration has not been supplied with this project. Sign-in is intentionally unavailable until the project owner enables the service; the rest of Leesmaat continues to work.

## Learning and content

- Separate placement and levels for English and Afrikaans: sentence comfort, vocabulary and inference.
- Saved-word review intervals of 1, 3, 6 days, then progressively longer up to 60 days. Missed words return after ten minutes. Comprehension practice includes passage-based understanding and interpretation.
- Speech synthesis follows sentences and highlights words when the browser supplies boundary events. Available languages and voice quality depend on installed device voices.
- Source-range notes highlight the actual selected words. Prototype notes without a range are preserved in Bookmarks.
- Reader search supports phrases, match counts and previous/next matches. Paper, sepia, night, monochrome, font size, speed and zen controls are included.
- A daily goal awards once per day; a completion celebration respects reduced motion.
- The verified Grade 12 HL/FAL literature list covers the 2026 exam period. Grade 10–11 entries come from the current DBE FET literature catalogue and are labelled catalogue selections: confirm the school's chosen texts.
- Modern setworks show **original study notes**, clearly identified as such. Two public-domain works include attributed opening excerpts. Six original vector illustrations provide book and article art. See [CONTENT.md](CONTENT.md) for sources and rights.

## Verification

```sh
pnpm test              # migration, conflict merging, anchors, goals, review intervals and content
pnpm test:sync         # Firebase Auth/Firestore emulators; requires Java 21+
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e          # production browser, offline reload, notes, placement, practice and axe checks
```

The sync tests use the isolated `demo-leesmaat` emulator project, including simulated Google credentials, account isolation and two-device transaction merging. They do not use a real Google account. Browser tests run a production server on port 3100. CI runs all of these checks and preserves failure traces.

Deploy to a Next.js-compatible host with Node support. The build generates `/sw.js` from the actual production JavaScript, CSS and font assets; it caches only public same-origin app files and never auth/API traffic. A newly built worker waits for old tabs to close before activation. Browsers may evict stored files when space is scarce: the archive reconciles with IndexedDB on startup, and downloads can be recreated. Removing an archived read deletes its stored content; artwork is a small shared app asset.
