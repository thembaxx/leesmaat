import { build } from 'esbuild';
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
mkdirSync('public/voice-runtime', { recursive: true });
for (const suffix of ['js', 'wasm', 'data'])
  copyFileSync(
    `node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.${suffix}`,
    `public/voice-runtime/piper-phonemize.${suffix}`,
  );
copyFileSync(
  'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
  'public/voice-runtime/ort-wasm-simd-threaded.wasm',
);
await build({
  entryPoints: ['src/lib/voice-worker.ts'],
  outfile: 'public/voice-runtime/piper-worker.js',
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2022',
  legalComments: 'linked',
});
const manifest = {};
for (const [engine, files] of Object.entries({
  piper: [
    'piper-worker.js',
    'piper-phonemize.js',
    'piper-phonemize.wasm',
    'piper-phonemize.data',
    'ort-wasm-simd-threaded.wasm',
  ],
  espeak: ['espeak.worker.js', 'espeak.worker.data'],
})) {
  manifest[engine] = files.map((name) => {
    const data = readFileSync(`public/voice-runtime/${name}`);
    return {
      name,
      url: `/voice-runtime/${name}`,
      bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
    };
  });
}
writeFileSync('src/lib/voice-runtime.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Voice runtimes built; large voice files are downloaded only on request.');
