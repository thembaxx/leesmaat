'use client';
import { useEffect, useRef, useState } from 'react';
import { DownloadSimpleIcon, QuotesIcon } from '@phosphor-icons/react';
import type { Item } from '@/lib/data';
import {
  EXAM_RUBRIC,
  MAX_QUOTATION,
  emptyExamDraft,
  examPrompt,
  examResponseText,
  examSourceVersion,
  loadExamDraft,
  quoteFromSelection,
  removeExamDraft,
  saveExamDraft,
  type ExamDraft,
} from '@/lib/exam-response';
import { chip } from './Sheets';

const deviceStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};

export function ExamResponse({ item }: { item: Item }) {
  const [draft, setDraft] = useState<ExamDraft | null>(null);
  const [loadedText, setLoadedText] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [olderVersions, setOlderVersions] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [preview, setPreview] = useState(false);
  const writable = useRef(false);
  const source = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let cancelled = false;
    writable.current = false;
    void examSourceVersion(item)
      .then((version) => {
        if (cancelled) return;
        const loaded = loadExamDraft(deviceStorage, item, version);
        setLoadedText(item.x);
        setSelection(null);
        setPreview(false);
        setDraft(loaded.draft);
        setError(loaded.error);
        setOlderVersions(loaded.olderVersions);
        setStatus(
          loaded.draft.claim || loaded.draft.explanation
            ? 'Saved response restored on this device.'
            : 'Your response stays on this device.',
        );
        writable.current = !loaded.error;
      })
      .catch(() => {
        if (!cancelled)
          setError(
            'The source version could not be prepared. Use a secure browser connection and try again.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, [item]);

  if (!item.x.trim())
    return (
      <p className="my-4 text-sm text-mu">
        Open a readable passage or chapter to practise a source-anchored response.
      </p>
    );
  if (!draft || draft.itemId !== item.id || loadedText !== item.x)
    return (
      <p role={error ? 'alert' : 'status'} className="my-4 text-sm text-mu">
        {error || 'Preparing source-anchored practice…'}
      </p>
    );
  const update = (changes: Partial<ExamDraft>) => {
    const next = { ...draft, ...changes, updatedAt: new Date().toISOString() };
    setDraft(next);
    if (!writable.current) {
      setStatus('Changes are only in this open screen. Download a copy to keep them.');
      return;
    }
    const saved = saveExamDraft(deviceStorage, next, item);
    setError(saved.error);
    setStatus(
      saved.ok
        ? 'Saved on this device.'
        : 'Changes are only in this open screen. Download a copy to keep them.',
    );
  };
  const quote = selection && quoteFromSelection(item, selection.start, selection.end);
  const download = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([examResponseText(item, draft)], { type: 'text/plain;charset=utf-8' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `leesmaat-response-${item.id.replace(/[^a-z0-9-]/gi, '-').slice(0, 60)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Response download prepared.');
    } catch {
      setError('The download could not be prepared. Keep this screen open and copy your response.');
    }
  };
  return (
    <section
      className="my-6 rounded-2xl border border-ln p-4"
      aria-label="Source-anchored response practice"
    >
      <h2 className="font-serif text-2xl">Explain it with evidence</h2>
      <p className="my-3 text-sm text-mu">
        Practise a short response using this exact passage. The checklist is your own review; no
        essay score or XP is assigned.
      </p>
      <p className="my-3 text-sm font-semibold">{examPrompt(item)}</p>
      <p className="mb-3 text-xs text-mu">
        {item.t} · {item.a}
        {item.sectionTitle ? ` · ${item.sectionTitle}` : ''}
      </p>
      {olderVersions > 0 && (
        <p className="my-3 text-sm text-mu">
          Responses to {olderVersions} earlier text{' '}
          {olderVersions === 1 ? 'version remain' : 'versions remain'} saved separately. They have
          not been replaced.
        </p>
      )}
      <label className="my-4 block text-sm font-semibold">
        Source passage — select a short quotation
        <textarea
          ref={source}
          readOnly
          value={item.x}
          rows={8}
          onSelect={(event) => {
            setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            });
          }}
          className="mt-2 block w-full rounded-xl bg-ln p-3 font-serif font-normal"
        />
      </label>
      <button
        type="button"
        className={chip(false)}
        disabled={!quote}
        onClick={() => {
          if (quote) {
            update({ quotation: quote, reviewed: [] });
            setStatus('Exact quotation linked to this passage.');
          }
        }}
      >
        <QuotesIcon size={18} className="mr-2 inline" aria-hidden="true" />
        Use selected quotation
      </button>
      <p className="mt-2 text-xs text-mu">
        Select up to {MAX_QUOTATION} characters with a pointer or Shift + arrow keys in the passage.
      </p>
      {draft.quotation && (
        <blockquote className="my-4 whitespace-pre-wrap rounded-xl bg-ln p-3 font-serif">
          “{draft.quotation.text}”
          <cite className="mt-2 block text-xs not-italic text-mu">
            Source characters {draft.quotation.start}–{draft.quotation.end} ·{' '}
            <button
              type="button"
              className="underline"
              onClick={() => {
                source.current?.focus();
                source.current?.setSelectionRange(draft.quotation!.start, draft.quotation!.end);
              }}
            >
              Find in passage
            </button>
          </cite>
        </blockquote>
      )}
      <label className="my-4 block text-sm font-semibold">
        Your claim
        <textarea
          rows={3}
          maxLength={1200}
          value={draft.claim}
          onChange={(event) => update({ claim: event.target.value, reviewed: [] })}
          className="mt-2 block w-full rounded-xl bg-ln p-3 font-normal"
        />
      </label>
      <label className="my-4 block text-sm font-semibold">
        Explain how the words support your claim
        <textarea
          rows={5}
          maxLength={6000}
          value={draft.explanation}
          onChange={(event) => update({ explanation: event.target.value, reviewed: [] })}
          className="mt-2 block w-full rounded-xl bg-ln p-3 font-normal"
        />
      </label>
      <fieldset className="my-4 space-y-3 rounded-xl border border-ln p-3">
        <legend className="px-1 text-sm font-semibold">Your self-review</legend>
        {EXAM_RUBRIC.map((entry) => (
          <label key={entry.id} className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.reviewed.includes(entry.id)}
              onChange={(event) =>
                update({
                  reviewed: event.target.checked
                    ? [...draft.reviewed, entry.id]
                    : draft.reviewed.filter((id) => id !== entry.id),
                })
              }
            />
            {entry[item.g]}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={chip(false)}
          onClick={() => setPreview(!preview)}
          aria-expanded={preview}
        >
          {preview ? 'Hide response preview' : 'Preview response'}
        </button>
        <button type="button" className={chip(true)} onClick={download}>
          <DownloadSimpleIcon size={18} className="mr-2 inline" aria-hidden="true" />
          Download response
        </button>
      </div>
      {preview && (
        <pre className="my-4 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-ln p-3 font-sans text-sm">
          {examResponseText(item, draft)}
        </pre>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm">
          {error}
        </p>
      )}
      <output aria-live="polite" className="mt-3 block text-xs text-mu">
        {status}
      </output>
      <p className="mt-3 text-xs text-mu">
        Up to twenty responses are kept locally. These drafts are separate from reading progress and
        do not sync or enter the existing reading backup.
      </p>
      <button
        type="button"
        className={`${chip(false)} mt-3`}
        onClick={() => {
          if (
            !window.confirm(
              'Remove this version’s saved response? Download a copy first if you want to keep it.',
            )
          )
            return;
          const removed = removeExamDraft(deviceStorage, draft.itemId, draft.sourceVersion);
          setError(removed.error);
          if (removed.ok) {
            writable.current = true;
            setDraft(emptyExamDraft(item, draft.sourceVersion));
            setStatus('This response was removed. Other texts and versions were kept.');
          }
        }}
      >
        Remove this saved response
      </button>
    </section>
  );
}
