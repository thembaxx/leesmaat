import { writeFileSync } from 'node:fs';
// Next snapshots the public file list during its build. Reserve the worker path first.
writeFileSync('public/sw.js', '// Offline worker is generated after the production build.\n');
