import catalogue from './voice-catalogue.json' with { type: 'json' };
import runtimes from './voice-runtime.json' with { type: 'json' };
import type { Lang } from './data';
export type VoiceFile = {
  name?: string;
  url: string;
  bytes: number;
  sha256: string;
  remote?: string;
};
export type VoiceProfile = {
  id: string;
  name: string;
  language: Lang;
  country: string;
  gender: 'male' | 'female';
  engine: 'piper' | 'espeak';
  style: string;
  variant?: string;
  files: VoiceFile[];
  preview: string;
  licence: string;
  source: string;
};
export const VOICES = catalogue as VoiceProfile[];
export const VOICE_CACHE = 'leesmaat-voices-v1';
export const filesFor = (voice: VoiceProfile): VoiceFile[] => [
  ...runtimes[voice.engine],
  ...voice.files,
];
export const formatBytes = (bytes: number) =>
  bytes < 1e6 ? `${Math.ceil(bytes / 1000)} KB` : `${(bytes / 1e6).toFixed(1)} MB`;
export const countryName = (code: string) =>
  new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
export function readVoicePreferences(): Record<Lang, string> {
  try {
    const raw = JSON.parse(localStorage.getItem('lm-voices') ?? '{}');
    return {
      en: typeof raw.en === 'string' ? raw.en : '',
      af: typeof raw.af === 'string' ? raw.af : '',
    };
  } catch {
    return { en: '', af: '' };
  }
}
export async function installedVoices() {
  if (!('caches' in globalThis)) return [];
  const cache = await caches.open(VOICE_CACHE);
  const result: string[] = [];
  for (const voice of VOICES)
    if (
      (
        await Promise.all(
          filesFor(voice).map(
            async (file) =>
              (await cache.match(file.url))?.headers.get('x-leesmaat-sha256') === file.sha256,
          ),
        )
      ).every(Boolean)
    )
      result.push(voice.id);
  return result;
}
export async function missingFiles(voice: VoiceProfile) {
  const cache = await caches.open(VOICE_CACHE);
  const flags = await Promise.all(
    filesFor(voice).map(
      async (file) =>
        (await cache.match(file.url))?.headers.get('x-leesmaat-sha256') !== file.sha256,
    ),
  );
  return filesFor(voice).filter((_, index) => flags[index]);
}
export async function downloadVoice(
  voice: VoiceProfile,
  signal: AbortSignal,
  progress: (loaded: number, total: number) => void,
) {
  const cache = await caches.open(VOICE_CACHE),
    files = await missingFiles(voice);
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  const capacity = await navigator.storage?.estimate().catch(() => ({}) as StorageEstimate);
  if (capacity?.quota && capacity.quota - (capacity.usage ?? 0) < total * 1.2)
    throw new Error(
      'There is not enough free storage for this voice. Remove a download and try again.',
    );
  let completed = 0;
  const staged: string[] = [];
  try {
    for (const file of files) {
      signal.throwIfAborted();
      const response = await fetch(file.url, { signal, cache: 'no-store' }).catch((error) => {
        if (signal.aborted) throw error;
        throw new Error('The voice could not download. Reconnect and try again.');
      });
      if (!response.ok || !response.body)
        throw new Error('The voice could not download. Reconnect and try again.');
      const reader = response.body.getReader(),
        chunks: Uint8Array<ArrayBuffer>[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        if (loaded > file.bytes) {
          await reader.cancel();
          throw new Error('The voice file changed. Update the app and try again.');
        }
        chunks.push(value);
        progress(completed + loaded, total);
      }
      const blob = new Blob(chunks, {
        type: response.headers.get('content-type') ?? 'application/octet-stream',
      });
      const hash = [
        ...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())),
      ]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      signal.throwIfAborted();
      if (blob.size !== file.bytes || hash !== file.sha256)
        throw new Error('The voice download was incomplete. Try again.');
      await cache.put(
        file.url,
        new Response(blob, {
          headers: { 'Content-Type': blob.type, 'x-leesmaat-sha256': file.sha256 },
        }),
      );
      staged.push(file.url);
      completed += file.bytes;
      progress(completed, total);
    }
  } catch (error) {
    await Promise.all(staged.map((url) => cache.delete(url)));
    throw error;
  }
}
export async function removeVoice(voice: VoiceProfile) {
  const cache = await caches.open(VOICE_CACHE);
  // Shared engines stay for other installed voices; remove them when none need them.
  await Promise.all(voice.files.map((file) => cache.delete(file.url)));
  const others = VOICES.filter(
    (candidate) => candidate.id !== voice.id && candidate.engine === voice.engine,
  );
  const anyOther = others.some((candidate) => candidate.files.length > 0);
  const installed = await installedVoices();
  if (!anyOther || !others.some((candidate) => installed.includes(candidate.id)))
    await Promise.all(runtimes[voice.engine].map((file) => cache.delete(file.url)));
}
export type SpeechAudio = { samples: Float32Array; sampleRate: number };
let audioContext: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let playbackToken = 0;
let cancelAudio: (() => void) | undefined;
export const audioTicket = () => playbackToken;
export async function unlockAudio() {
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') await audioContext.resume();
}
export function stopAudio() {
  playbackToken++;
  const cancelled = cancelAudio;
  cancelAudio = undefined;
  cancelled?.();
  if (source) {
    source.onended = null;
    try {
      source.stop();
    } catch {}
    source.disconnect();
    source = null;
  }
}
export function playAudio(audio: SpeechAudio, ended?: () => void, cancelled?: () => void) {
  if (!audioContext) throw new Error('Tap Listen to enable audio.');
  stopAudio();
  cancelAudio = cancelled;
  const buffer = audioContext.createBuffer(1, audio.samples.length, audio.sampleRate);
  buffer.getChannelData(0).set(audio.samples);
  source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.onended = () => {
    source = null;
    cancelAudio = undefined;
    ended?.();
  };
  source.start();
}
export async function playPreview(url: string, ended?: () => void) {
  const token = playbackToken;
  await unlockAudio();
  const cache = await caches.open('leesmaat-voice-previews-v1');
  let response = await cache.match(url);
  if (!response) {
    response = await fetch(url);
    if (!response.ok) throw new Error('This preview could not load. Reconnect and try again.');
    await cache.put(url, response.clone());
  }
  const buffer = await audioContext!.decodeAudioData(await response.arrayBuffer());
  if (token !== playbackToken) return;
  stopAudio();
  cancelAudio = ended;
  source = audioContext!.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext!.destination);
  source.onended = () => {
    source = null;
    cancelAudio = undefined;
    ended?.();
  };
  source.start();
}
let neuralWorker: Worker | null = null,
  compactWorker: Worker | null = null;
const objectUrls: string[] = [];
let neuralLocations: Record<string, string> = {};
let request = 0;
let neuralReady: Promise<Worker> | null = null,
  compactReady: Promise<Worker> | null = null;
const pending = new Map<
  number,
  { resolve: (audio: SpeechAudio) => void; reject: (error: Error) => void }
>();
async function cachedAsset(file: VoiceFile) {
  const response = await (await caches.open(VOICE_CACHE)).match(file.url);
  if (!response) throw new Error('Voice files are missing. Download this voice again.');
  const url = URL.createObjectURL(await response.blob());
  objectUrls.push(url);
  return url;
}
async function assets(engine: 'piper' | 'espeak') {
  const records = await Promise.all(
    runtimes[engine].map(async (file) => [file.name, await cachedAsset(file)] as const),
  );
  return Object.fromEntries(records);
}
async function neural() {
  if (!neuralReady)
    neuralReady = (async () => {
      const locations = await assets('piper');
      neuralLocations = locations;
      const worker = new Worker(locations['piper-worker.js']!);
      neuralWorker = worker;
      worker.onmessage = ({ data }) => {
        const task = pending.get(data.id);
        if (!task) return;
        pending.delete(data.id);
        if (data.error) task.reject(new Error(data.error));
        else task.resolve({ samples: data.samples, sampleRate: data.sampleRate });
      };
      worker.onerror = () => {
        for (const task of pending.values())
          task.reject(
            new Error('This device could not start the voice. Choose a compact or device voice.'),
          );
        pending.clear();
        releaseVoiceWorkers();
      };
      return worker;
    })().catch((error) => {
      neuralReady = null;
      throw error;
    });
  return neuralReady;
}
let compactQueue = Promise.resolve();
async function compact() {
  if (!compactReady)
    compactReady = (async () => {
      const locations = await assets('espeak');
      const bootstrap = `var Module = { locateFile: function(name) { return name.endsWith('.data') ? ${JSON.stringify(locations['espeak.worker.data'])} : name; } }; importScripts(${JSON.stringify(locations['espeak.worker.js'])});`;
      const url = URL.createObjectURL(new Blob([bootstrap], { type: 'application/javascript' }));
      objectUrls.push(url);
      const worker = new Worker(url);
      compactWorker = worker;
      return await new Promise<Worker>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('The compact voice could not start. Download it again.')),
          30000,
        );
        worker.onmessage = ({ data }) => {
          if (data === 'ready') {
            clearTimeout(timeout);
            resolve(worker);
          }
        };
        worker.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('This device could not start the compact voice.'));
        };
      });
    })().catch((error) => {
      compactReady = null;
      throw error;
    });
  return compactReady;
}
export async function synthesize(
  voice: VoiceProfile,
  text: string,
  speed = 1,
): Promise<SpeechAudio> {
  if (!text.trim() || text.length > 2000)
    throw new Error('Choose a shorter passage for read-aloud.');
  if (voice.engine === 'piper') {
    const worker = await neural(),
      id = ++request;
    const locations = neuralLocations;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({
        id,
        text,
        speed,
        voice: {
          ...voice,
          files: voice.files.map((file) => ({
            ...file,
            url: new URL(file.url, location.origin).href,
          })),
        },
        assets: locations,
      });
    });
  }
  const task = async () => {
    const worker = await compact();
    const callback = `speech-${++request}`;
    return await new Promise<SpeechAudio>((resolve, reject) => {
      const chunks: Float32Array[] = [];
      const timeout = setTimeout(() => {
        worker.removeEventListener('message', receive);
        reject(new Error('Speech generation took too long.'));
      }, 30000);
      const receive = ({ data }: MessageEvent) => {
        if (data.callback !== callback) return;
        if (data.done) {
          clearTimeout(timeout);
          worker.removeEventListener('message', receive);
          const samples = new Float32Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            samples.set(chunk, offset);
            offset += chunk.length;
          }
          if (!samples.length) reject(new Error('No speech was generated.'));
          else resolve({ samples, sampleRate: 44100 });
        } else if (data.result?.[0]) chunks.push(new Float32Array(data.result[0]));
      };
      worker.addEventListener('message', receive);
      worker.postMessage({ method: 'set_voice', args: [voice.variant ?? 'af'] });
      worker.postMessage({ method: 'set_rate', args: [Math.round(175 * speed)] });
      worker.postMessage({ method: 'set_pitch', args: [50] });
      worker.postMessage({ method: 'synthesize', args: [text], callback });
    });
  };
  const result = compactQueue.then(task);
  compactQueue = result.then(
    () => {},
    () => {},
  );
  return result;
}
export function releaseVoiceWorkers() {
  neuralWorker?.terminate();
  compactWorker?.terminate();
  neuralWorker = compactWorker = null;
  neuralReady = compactReady = null;
  neuralLocations = {};
  for (const task of pending.values()) task.reject(new Error('Speech was cancelled.'));
  pending.clear();
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls.length = 0;
}
export function pcmWav(audio: SpeechAudio) {
  const bytes = new ArrayBuffer(44 + audio.samples.length * 2),
    view = new DataView(bytes);
  const tag = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  tag(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  tag(8, 'WAVE');
  tag(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, 'data');
  view.setUint32(40, audio.samples.length * 2, true);
  audio.samples.forEach((sample, index) =>
    view.setInt16(44 + index * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true),
  );
  return new Blob([bytes], { type: 'audio/wav' });
}
