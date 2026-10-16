import { readFileSync, writeFileSync } from 'node:fs';
import { themeBoot, themePaint } from '../src/lib/theme.ts';

// Keep the standalone fallback on the same pre-paint theme code as the app.
writeFileSync(
  'public/offline.html',
  readFileSync('scripts/offline-template.html', 'utf8')
    .replace('__THEME_BOOT__', () => themeBoot)
    .replace('__THEME_PAINT__', () => themePaint),
);
// Next snapshots the public file list during its build. Reserve the worker path first.
writeFileSync('public/sw.js', '// Offline worker is generated after the production build.\n');
