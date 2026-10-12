'use client';
import { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  DownloadSimpleIcon,
  SparkleIcon,
  StopIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { ASSISTANT_MODELS, assistantBytes } from '@/lib/assistant-downloads';
import { formatBytes } from '@/lib/voices';
import type { Item } from '@/lib/data';
import type { SummaryPoint } from '@/lib/summaries';
import type { AssistantRange, AssistantResult, AssistantTask } from '@/lib/assistant-source';
import { useAssistant } from './AssistantProvider';

export function AssistantDownloadPanel() {
  const assistant = useAssistant();
  return (
    <section aria-label="Offline reading assistant" className="mt-5 border-t border-ln pt-4">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <SparkleIcon size={22} aria-hidden="true" />
        Offline reading assistant
      </h3>
      <p className="my-2 text-[13px] text-mu">
        Optional local AI for passage explanations and chapter talking points. Download once;
        reading text stays on this device.
      </p>
      <output className="my-3 block rounded-xl bg-ln p-3 text-xs text-mu">
        {assistant.capability === null
          ? 'Checking this device…'
          : assistant.capability ||
            'This browser supports local AI. Keep about 1.1 GB of working memory available; larger devices work best.'}
      </output>
      {ASSISTANT_MODELS.map((model) => {
        const stored = assistant.installed.includes(model.id),
          selected = assistant.selected === model.id;
        const size = assistantBytes(model),
          remaining = assistant.missing[model.id] ?? size;
        const active = assistant.busy?.kind === 'download' && assistant.busy.modelId === model.id;
        return (
          <div
            key={model.id}
            className={`mb-3 rounded-2xl border p-3 ${selected ? 'border-ac' : 'border-ln'}`}
          >
            <h4 className="text-sm font-semibold">{model.name}</h4>
            <p className="mt-1 text-xs text-mu">
              {model.id.startsWith('Qwen') ? 'Qwen 2.5 · 0.5B' : 'Llama 3.2 · 1B'} ·{' '}
              {formatBytes(size)} download
            </p>
            <p className="mt-1 text-xs text-mu">
              {stored
                ? 'Downloaded · available offline'
                : remaining < size
                  ? `${formatBytes(size - remaining)} stored · ${formatBytes(remaining)} remaining`
                  : 'Downloaded only when you choose it.'}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {stored ? (
                <>
                  <button
                    aria-label={selected ? `Selected ${model.name}` : `Choose ${model.name}`}
                    disabled={!!assistant.busy}
                    aria-pressed={selected}
                    onClick={() => assistant.select(model)}
                    className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-bg"
                  >
                    {selected ? <CheckIcon size={18} aria-hidden="true" /> : 'Choose'}
                  </button>
                  <button
                    aria-label={`Remove ${model.name}`}
                    title="Remove model"
                    disabled={!!assistant.busy}
                    onClick={() => void assistant.remove(model)}
                    className="ml-auto grid size-11 place-items-center rounded-full bg-ln"
                  >
                    <TrashIcon size={20} />
                  </button>
                </>
              ) : (
                <button
                  aria-label={`Download ${model.name}`}
                  title="Download model"
                  disabled={assistant.capability !== '' || !!assistant.busy}
                  onClick={() => void assistant.download(model)}
                  className="grid size-11 place-items-center rounded-full bg-ink text-bg"
                >
                  <DownloadSimpleIcon size={20} />
                </button>
              )}
              {!stored && assistant.partial[model.id] && (
                <button
                  aria-label={`Remove partial ${model.name}`}
                  title="Remove partial download"
                  disabled={!!assistant.busy}
                  onClick={() => void assistant.remove(model)}
                  className="ml-auto grid size-11 place-items-center rounded-full bg-ln"
                >
                  <TrashIcon size={20} />
                </button>
              )}
            </div>
            {active && (
              <div className="mt-3">
                <progress
                  aria-label={`Downloading ${model.name}`}
                  value={assistant.busy!.loaded}
                  max={assistant.busy!.total || 1}
                  className="h-2 w-full accent-ac"
                />
                <output className="mt-1 block text-xs text-mu">
                  {formatBytes(assistant.busy!.loaded)} / {formatBytes(assistant.busy!.total)}
                </output>
                <button onClick={assistant.cancel} className="mt-1 min-h-11 text-sm underline">
                  Cancel model download
                </button>
              </div>
            )}
            <a
              href={model.source}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[11px] text-mu underline"
            >
              Model source &amp; licence · {model.licence}
            </a>
            {model.id.startsWith('Llama') && (
              <p className="mt-1 text-[11px] text-mu">Built with Llama</p>
            )}
          </div>
        );
      })}
      <p className="my-2 text-xs text-mu">
        AI answers can miss details. Source links let you check each point. Your real dictionary and
        existing summaries remain available.
      </p>
      {assistant.error && (
        <p role="alert" className="my-2 rounded-xl bg-ln p-3 text-sm">
          {assistant.error}
        </p>
      )}
    </section>
  );
}

export function AssistantReadingPanel({
  item,
  task,
  range,
  onPassage,
}: {
  item: Item;
  task: AssistantTask;
  range?: AssistantRange;
  onPassage: (point: SummaryPoint) => void;
}) {
  const assistant = useAssistant();
  const [result, setResult] = useState<AssistantResult | null>(null),
    [error, setError] = useState('');
  const alive = useRef(true),
    running = useRef(false),
    cancel = useRef(assistant.cancel);
  useEffect(() => {
    cancel.current = assistant.cancel;
  }, [assistant.cancel]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (running.current) cancel.current();
    };
  }, []);
  const generate = async () => {
    if (running.current) return;
    running.current = true;
    setResult(null);
    setError('');
    try {
      const answer = await assistant.run(item, task, range);
      if (alive.current) setResult(answer);
    } catch (e) {
      if (alive.current && !(e instanceof DOMException && e.name === 'AbortError'))
        setError(e instanceof Error ? e.message : 'The assistant could not answer.');
    } finally {
      running.current = false;
    }
  };
  const selected = assistant.installed.includes(assistant.selected),
    busy = assistant.busy?.kind === 'run';
  return (
    <div>
      <p className="text-xs text-mu">
        {item.t}
        {item.sectionTitle ? ' · ' + item.sectionTitle : ''}
      </p>
      <h3 className="my-3 font-serif text-2xl">
        {task === 'explain'
          ? 'Explain this passage'
          : item.sectionTitle
            ? 'Chapter summary and talking points'
            : 'Reading summary and talking points'}
      </h3>
      <p className="mb-4 text-sm text-mu">
        {task === 'explain'
          ? 'A simpler explanation of the selected text.'
          : item.sectionTitle
            ? 'The model reads every passage in this chapter or scene before combining its talking points.'
            : 'The model reads this available text before combining its talking points.'}{' '}
        Generated locally; check the supporting text.
      </p>
      {range && (
        <blockquote className="mb-4 max-h-40 overflow-auto whitespace-pre-line rounded-2xl bg-ln p-4 font-serif text-base">
          {item.x.slice(range.start, range.end)}
        </blockquote>
      )}
      {selected && assistant.capability === '' ? (
        <button
          aria-label={busy ? 'Stop assistant' : undefined}
          disabled={!!assistant.busy && !busy}
          onClick={() => (busy ? assistant.cancel() : void generate())}
          className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-bg"
        >
          {busy ? (
            <StopIcon size={18} aria-hidden="true" />
          ) : result ? (
            'Generate again'
          ) : task === 'explain' ? (
            'Explain passage'
          ) : (
            'Generate summary'
          )}
        </button>
      ) : (
        <AssistantDownloadPanel />
      )}
      {busy && (
        <output className="my-4 block text-sm text-mu">
          {assistant.busy!.message}
          <progress
            aria-label="Assistant progress"
            value={assistant.busy!.loaded}
            max={1}
            className="mt-2 block h-2 w-full accent-ac"
          />
        </output>
      )}
      {error && (
        <p role="alert" className="my-3 rounded-xl bg-ln p-3 text-sm">
          {error}
        </p>
      )}
      {result && (
        <section aria-label="Generated reading explanation" lang={item.g} className="mt-6">
          <p className="mb-3 text-xs text-mu">
            AI generated · {result.model} ·{' '}
            {task === 'explain'
              ? 'Selected passage'
              : item.sectionTitle
                ? 'This chapter or scene'
                : 'This available text'}
          </p>
          <ol className="space-y-3">
            {result.points.map((point, index) => (
              <li key={index} className="rounded-2xl border border-ln p-4">
                <p className="text-sm leading-relaxed">{point.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {point.sources.map((id) => {
                    const passage = result.passages.find((p) => p.id === id)!;
                    return (
                      <button
                        key={id}
                        aria-label={`Open supporting passage ${id}`}
                        onClick={() => onPassage({ ...passage, text: point.text })}
                        className="min-h-11 rounded-full bg-ln px-3 text-xs text-ac"
                      >
                        Source {id}
                      </button>
                    );
                  })}
                </div>
                <details className="mt-2 text-xs text-mu">
                  <summary className="min-h-8 cursor-pointer py-2">Supporting text</summary>
                  {point.sources.map((id) => (
                    <blockquote key={id} className="mt-2 whitespace-pre-line font-serif text-sm">
                      {result.passages.find((p) => p.id === id)!.quote}
                    </blockquote>
                  ))}
                </details>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
