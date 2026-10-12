import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
mkdirSync('public/assistant-runtime', { recursive: true });
await build({
  entryPoints: ['src/lib/assistant-worker.ts'],
  outfile: 'public/assistant-runtime/assistant-worker.js',
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2022',
  legalComments: 'linked',
});
const bytes = readFileSync('public/assistant-runtime/assistant-worker.js'),
  sha256 = createHash('sha256').update(bytes).digest('hex');
writeFileSync(
  'src/lib/assistant-runtime.json',
  JSON.stringify(
    {
      name: 'assistant-worker.js',
      url: `/assistant-runtime/assistant-worker.js?v=${sha256}`,
      bytes: bytes.length,
      sha256,
      cache: 'leesmaat-assistant-runtime-v1',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Optional reading-assistant runtime: ${(bytes.length / 1e6).toFixed(1)} MB; excluded from the default offline shell.`,
);
