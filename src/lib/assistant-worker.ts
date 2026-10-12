// Compiled separately and downloaded only with an assistant model.
import { MLCEngine, type ModelRecord } from '@mlc-ai/web-llm';
import type { AssistantModel } from './assistant-downloads';
import type { assistantMessages } from './assistant-source';
type Job =
  | { id: number; action: 'load'; model: AssistantModel }
  | {
      id: number;
      action: 'generate';
      messages: ReturnType<typeof assistantMessages>;
      schema: string;
    };
const scope = self as unknown as {
  onmessage: (event: MessageEvent<Job>) => void;
  postMessage: (value: unknown) => void;
};
let engine: MLCEngine | null = null;
let queue = Promise.resolve();
// Inference has no network path. Missing cached artifacts fail rather than downloading silently.
globalThis.fetch = async () => {
  throw new Error('An assistant file is missing. Download the model again.');
};
Cache.prototype.add = async () => {
  throw new Error('An assistant file is missing. Download the model again.');
};
Cache.prototype.addAll = async () => {
  throw new Error('An assistant file is missing. Download the model again.');
};
async function handle(job: Job) {
  if (job.action === 'load') {
    for (const file of job.model.files) {
      const entry = await (await caches.open(file.cache)).match(file.url);
      if (entry?.headers.get('x-leesmaat-sha256') !== file.sha256)
        throw new Error('An assistant file is missing. Download the model again.');
    }
    engine = new MLCEngine({
      appConfig: { model_list: [job.model.record as ModelRecord], cacheBackend: 'cache' },
      logLevel: 'ERROR',
      initProgressCallback: (progress) =>
        scope.postMessage({ id: job.id, progress: progress.progress }),
    });
    await engine.reload(job.model.id);
    scope.postMessage({ id: job.id, ready: true });
  } else {
    if (!engine) throw new Error('The reading assistant is not ready.');
    await engine.resetChat();
    const result = await engine.chat.completions.create({
      messages: job.messages,
      temperature: 0,
      max_tokens: 300,
      response_format: { type: 'json_object', schema: job.schema },
      stream: false,
    });
    if (result.choices[0]?.finish_reason !== 'stop')
      throw new Error('The model did not finish its answer. Try a shorter passage.');
    scope.postMessage({ id: job.id, text: result.choices[0]?.message.content ?? '' });
  }
}
scope.onmessage = ({ data }) => {
  queue = queue
    .then(() => handle(data))
    .catch((error: unknown) =>
      scope.postMessage({
        id: data.id,
        error: error instanceof Error ? error.message : 'Local AI could not run on this device.',
      }),
    );
};
