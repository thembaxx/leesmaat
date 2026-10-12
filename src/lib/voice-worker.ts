// The neural runtime is a separate, lazily loaded worker. No reading text leaves it.
import * as ort from 'onnxruntime-web/wasm';
type Job = {
  id: number;
  text: string;
  speed: number;
  voice: { id: string; files: { url: string }[] };
  assets: Record<string, string>;
};
const scope = self as unknown as {
  onmessage: (event: MessageEvent<Job>) => void;
  postMessage: (value: unknown, transfer?: Transferable[]) => void;
  importScripts: (...urls: string[]) => void;
  createPiperPhonemize: (
    options: Record<string, unknown>,
  ) => Promise<{ callMain: (args: string[]) => void }>;
};
let currentVoice = '';
let session: ort.InferenceSession | null = null;
let config: {
  espeak: { voice: string };
  audio: { sample_rate: number };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  speaker_id_map: Record<string, number>;
};
let phonemizer: { callMain: (args: string[]) => void } | null = null;
let capture: ((ids: number[]) => void) | null = null;
let queue = Promise.resolve();
async function cached(url: string) {
  const result = await (await caches.open('leesmaat-voices-v1')).match(url);
  if (!result) throw new Error('Voice files are missing. Download this voice again.');
  return result;
}
async function run(job: Job) {
  if (!phonemizer) {
    scope.importScripts(job.assets['piper-phonemize.js']!);
    phonemizer = await scope.createPiperPhonemize({
      noInitialRun: true,
      noExitRuntime: true,
      locateFile: (file: string) => job.assets[file.replace('piper_phonemize', 'piper-phonemize')],
      print: (line: string) => {
        try {
          const value = JSON.parse(line);
          if (Array.isArray(value.phoneme_ids)) capture?.(value.phoneme_ids);
        } catch {
          /* Diagnostic output is not speech data. */
        }
      },
      printErr: () => {},
    });
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = { 'ort-wasm-simd.wasm': job.assets['ort-wasm-simd.wasm']! };
  }
  if (currentVoice !== job.voice.id) {
    if (session) await session.release();
    config = await (await cached(job.voice.files[1]!.url)).json();
    session = await ort.InferenceSession.create(
      await (await cached(job.voice.files[0]!.url)).arrayBuffer(),
      { executionProviders: ['wasm'] },
    );
    currentVoice = job.voice.id;
  }
  const ids = await new Promise<number[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      capture = null;
      reject(new Error('Could not prepare speech.'));
    }, 30000);
    capture = (value) => {
      clearTimeout(timeout);
      capture = null;
      resolve(value);
    };
    try {
      phonemizer!.callMain([
        '-l',
        config.espeak.voice,
        '--input',
        JSON.stringify([{ text: job.text.trim() }]),
        '--espeak_data',
        '/espeak-ng-data',
      ]);
    } catch (error) {
      clearTimeout(timeout);
      capture = null;
      reject(error);
    }
  });
  if (!ids.length) throw new Error('No speech was generated.');
  const feeds: Record<string, ort.Tensor> = {
    input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
    input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ort.Tensor(
      'float32',
      Float32Array.from([
        config.inference.noise_scale,
        config.inference.length_scale / job.speed,
        config.inference.noise_w,
      ]),
      [3],
    ),
  };
  if (Object.keys(config.speaker_id_map).length)
    feeds.sid = new ort.Tensor('int64', BigInt64Array.from([0n]), [1]);
  const output = await session!.run(feeds);
  const samples = new Float32Array(output.output!.data as Float32Array);
  scope.postMessage({ id: job.id, samples, sampleRate: config.audio.sample_rate }, [
    samples.buffer,
  ]);
}
scope.onmessage = ({ data }) => {
  queue = queue
    .then(() => run(data))
    .catch((error: unknown) => {
      scope.postMessage({
        id: data.id,
        error: error instanceof Error ? error.message : 'Speech generation failed.',
      });
    });
};
