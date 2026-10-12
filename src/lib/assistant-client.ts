import type { Item } from './data';
import {
  assistantWorkerUrl,
  missingAssistantFiles,
  type AssistantModel,
} from './assistant-downloads';
import {
  assistantPassages,
  assistantMessages,
  resultSchema,
  parseAssistantPoints,
  groupAssistantPoints,
  type AssistantTask,
  type AssistantRange,
  type AssistantPoint,
  type AssistantResult,
} from './assistant-source';
type Progress = (message: string, progress: number) => void;
type Pending = {
  resolve: (value: { text?: string }) => void;
  reject: (error: Error) => void;
  progress?: Progress;
  timer: ReturnType<typeof setTimeout>;
};
let worker: Worker | null = null,
  url = '',
  loaded = '',
  counter = 0;
const pending = new Map<number, Pending>();
const abortError = () => new DOMException('The assistant was stopped.', 'AbortError');
export function stopAssistant() {
  worker?.terminate();
  worker = null;
  loaded = '';
  if (url) URL.revokeObjectURL(url);
  url = '';
  for (const task of pending.values()) {
    clearTimeout(task.timer);
    task.reject(abortError());
  }
  pending.clear();
}
function rpc(data: object, progress?: Progress): Promise<{ text?: string }> {
  const id = ++counter;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(
        new Error(
          'Local AI took too long on this device. Try a shorter passage or the existing summary.',
        ),
      );
      stopAssistant();
    }, 300000);
    pending.set(id, { resolve, reject, progress, timer });
    worker!.postMessage({ ...data, id });
  });
}
async function prepare(model: AssistantModel, progress: Progress, signal: AbortSignal) {
  if (loaded === model.id && worker) return;
  stopAssistant();
  if ((await missingAssistantFiles(model)).length)
    throw new Error('The assistant files are missing. Download the model again.');
  signal.throwIfAborted();
  const nextUrl = await assistantWorkerUrl();
  if (signal.aborted) {
    URL.revokeObjectURL(nextUrl);
    signal.throwIfAborted();
  }
  url = nextUrl;
  worker = new Worker(url);
  worker.onmessage = ({ data }) => {
    const task = pending.get(data.id);
    if (!task) return;
    if (typeof data.progress === 'number') {
      task.progress?.('Preparing the downloaded model…', data.progress);
      return;
    }
    clearTimeout(task.timer);
    pending.delete(data.id);
    if (data.error) task.reject(new Error(data.error));
    else task.resolve(data);
  };
  worker.onerror = () => {
    for (const task of pending.values()) {
      clearTimeout(task.timer);
      task.reject(
        new Error('Local AI could not start on this device. Your existing summaries still work.'),
      );
    }
    pending.clear();
    stopAssistant();
  };
  progress('Preparing the downloaded model…', 0);
  await rpc({ action: 'load', model }, progress);
  loaded = model.id;
}
export async function runAssistant(
  model: AssistantModel,
  item: Item,
  task: AssistantTask,
  range: AssistantRange | undefined,
  signal: AbortSignal,
  progress: Progress,
): Promise<AssistantResult> {
  signal.throwIfAborted();
  const stop = () => stopAssistant();
  signal.addEventListener('abort', stop, { once: true });
  try {
    const passages = assistantPassages(item, range);
    await prepare(model, progress, signal);
    signal.throwIfAborted();
    let points: AssistantPoint[] = [];
    for (const [index, passage] of passages.entries()) {
      signal.throwIfAborted();
      progress(`Reading passage ${index + 1} of ${passages.length}…`, index / passages.length);
      const reply = await rpc({
        action: 'generate',
        messages: assistantMessages(task, item.g, { source: passage.id, text: passage.quote }),
        schema: resultSchema([passage.id]),
      });
      points.push(...parseAssistantPoints(reply.text ?? '', [passage.id]));
    }
    let rounds = 0;
    while (points.length > 3) {
      if (++rounds > 8)
        throw new Error('This chapter is too long for this model. Select a shorter passage.');
      const groups = groupAssistantPoints(points);
      const reduced: AssistantPoint[] = [];
      for (const [index, group] of groups.entries()) {
        signal.throwIfAborted();
        progress(
          `Combining the talking points (${index + 1} of ${groups.length})…`,
          index / groups.length,
        );
        if (group.length === 1) {
          reduced.push(...group);
          continue;
        }
        const ids = [...new Set(group.flatMap((p) => p.sources))];
        const reply = await rpc({
          action: 'generate',
          messages: assistantMessages(task, item.g, group, true),
          schema: resultSchema(ids),
        });
        reduced.push(...parseAssistantPoints(reply.text ?? '', ids));
      }
      if (reduced.length >= points.length)
        throw new Error('The model could not condense this chapter. Select a shorter passage.');
      points = reduced;
    }
    signal.throwIfAborted();
    return { task, points, passages, model: model.name };
  } finally {
    signal.removeEventListener('abort', stop);
  }
}
