import profiles from './assistant-models.json' with { type: 'json' };
import runtime from './assistant-runtime.json' with { type: 'json' };
export type AssistantFile = {
  name: string;
  url: string;
  bytes: number;
  sha256: string;
  cache: string;
};
export type AssistantModel = (typeof profiles)[number];
export const ASSISTANT_MODELS = profiles;
export const assistantFiles = (model: AssistantModel): AssistantFile[] => [...model.files, runtime];
export const assistantBytes = (model: AssistantModel) =>
  assistantFiles(model).reduce((sum, file) => sum + file.bytes, 0);
export function modelSupportMessage(maxBuffer: number, memory?: number, fallback = false) {
  if (fallback)
    return 'This browser is using software graphics. Local AI needs hardware graphics; the existing summaries still work.';
  if (maxBuffer < 134217728)
    return 'This device has too little graphics capacity for local AI. The existing summaries still work.';
  if (memory && memory < 4)
    return 'This device reports less than 4 GB of memory. Use the existing summaries here, or download the assistant on a larger device.';
  return '';
}
export async function assistantSupport(): Promise<string> {
  if (!window.isSecureContext || !('caches' in window) || !('Worker' in window))
    return 'Local AI needs a secure browser with offline storage and background workers.';
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    gpu?: {
      requestAdapter: () => Promise<{
        limits: { maxStorageBufferBindingSize: number };
        info?: { isFallbackAdapter?: boolean };
      } | null>;
    };
  };
  if (!nav.gpu)
    return 'Local AI is unavailable in this browser. Try a browser with WebGPU support. The existing summaries still work.';
  try {
    const adapter = await nav.gpu.requestAdapter();
    return adapter
      ? modelSupportMessage(
          adapter.limits.maxStorageBufferBindingSize,
          nav.deviceMemory,
          adapter.info?.isFallbackAdapter,
        )
      : 'This browser could not access compatible graphics. The existing summaries still work.';
  } catch {
    return 'This device could not enable local AI. The existing summaries still work.';
  }
}
export async function missingAssistantFiles(model: AssistantModel) {
  const missing: AssistantFile[] = [];
  for (const file of assistantFiles(model)) {
    const response = await (await caches.open(file.cache)).match(file.url);
    if (response?.headers.get('x-leesmaat-sha256') !== file.sha256) missing.push(file);
  }
  return missing;
}
export async function installedAssistants() {
  if (!('caches' in globalThis)) return [];
  const ids: string[] = [];
  for (const model of ASSISTANT_MODELS)
    if (!(await missingAssistantFiles(model)).length) ids.push(model.id);
  return ids;
}
export async function downloadAssistant(
  model: AssistantModel,
  signal: AbortSignal,
  progress: (loaded: number, total: number) => void,
) {
  const files = await missingAssistantFiles(model),
    total = files.reduce((n, f) => n + f.bytes, 0);
  const storage = await navigator.storage?.estimate();
  if (storage?.quota && storage.quota - (storage.usage ?? 0) < total * 1.2)
    throw new Error(
      'There is not enough free storage for this model. Remove a download and try again.',
    );
  const staged: AssistantFile[] = [];
  let completed = 0;
  progress(0, total);
  try {
    for (const file of files) {
      signal.throwIfAborted();
      const response = await fetch(file.url, {
        signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      }).catch((error) => {
        if (signal.aborted) throw error;
        throw new Error('The model could not download. Reconnect and try again.');
      });
      if (!response.ok || !response.body)
        throw new Error('The model could not download. Reconnect and try again.');
      const reader = response.body.getReader(),
        chunks: Uint8Array<ArrayBuffer>[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        if (loaded > file.bytes) {
          await reader.cancel();
          throw new Error('The model file changed. Update the app and try again.');
        }
        chunks.push(value);
        progress(completed + loaded, total);
      }
      const blob = new Blob(chunks, {
        type: response.headers.get('content-type') ?? 'application/octet-stream',
      });
      const checksum = [
        ...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())),
      ]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      signal.throwIfAborted();
      if (blob.size !== file.bytes || checksum !== file.sha256)
        throw new Error('The model download was incomplete. Try again.');
      await (
        await caches.open(file.cache)
      ).put(
        file.url,
        new Response(blob, {
          headers: { 'Content-Type': blob.type, 'x-leesmaat-sha256': checksum },
        }),
      );
      staged.push(file);
      completed += file.bytes;
      progress(completed, total);
    }
    signal.throwIfAborted();
  } catch (error) {
    await Promise.all(staged.map(async (f) => (await caches.open(f.cache)).delete(f.url)));
    throw error;
  }
}
export async function removeAssistant(model: AssistantModel) {
  for (const file of model.files) await (await caches.open(file.cache)).delete(file.url);
  if (!(await installedAssistants()).length)
    await (await caches.open(runtime.cache)).delete(runtime.url);
}
export async function assistantWorkerUrl() {
  const response = await (await caches.open(runtime.cache)).match(runtime.url);
  if (!response || response.headers.get('x-leesmaat-sha256') !== runtime.sha256)
    throw new Error('The assistant files are missing. Download the model again.');
  return URL.createObjectURL(await response.blob());
}
