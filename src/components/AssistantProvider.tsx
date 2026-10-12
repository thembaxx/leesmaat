'use client';
/* oxlint-disable react/set-state-in-effect -- Reconcile device capabilities and offline model storage after hydration. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Item } from '@/lib/data';
import {
  ASSISTANT_MODELS,
  assistantSupport,
  assistantBytes,
  missingAssistantFiles,
  downloadAssistant,
  removeAssistant,
  type AssistantModel,
} from '@/lib/assistant-downloads';
import { runAssistant, stopAssistant } from '@/lib/assistant-client';
import type { AssistantTask, AssistantRange, AssistantResult } from '@/lib/assistant-source';
type Operation = {
  kind: 'download' | 'run';
  modelId: string;
  message: string;
  loaded: number;
  total: number;
};
type ContextValue = {
  capability: string | null;
  installed: string[];
  missing: Record<string, number>;
  partial: Record<string, boolean>;
  selected: string;
  busy: Operation | null;
  error: string;
  select: (model: AssistantModel) => void;
  download: (model: AssistantModel) => Promise<void>;
  remove: (model: AssistantModel) => Promise<void>;
  cancel: () => void;
  run: (item: Item, task: AssistantTask, range?: AssistantRange) => Promise<AssistantResult>;
};
const Context = createContext<ContextValue | null>(null);
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [capability, setCapability] = useState<string | null>(null),
    [installed, setInstalled] = useState<string[]>([]),
    [missing, setMissing] = useState<Record<string, number>>({}),
    [partial, setPartial] = useState<Record<string, boolean>>({}),
    [selected, setSelected] = useState(''),
    [busy, setBusy] = useState<Operation | null>(null),
    [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null),
    idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = async () => {
    const sizes: Record<string, number> = {};
    const parts: Record<string, boolean> = {};
    const ids: string[] = [];
    if ('caches' in window)
      for (const model of ASSISTANT_MODELS) {
        const absent = await missingAssistantFiles(model);
        sizes[model.id] = absent.reduce((sum, f) => sum + f.bytes, 0);
        parts[model.id] = model.files.some(
          (file) => !absent.some((missing) => missing.url === file.url),
        );
        if (sizes[model.id] === 0) ids.push(model.id);
      }
    setMissing(sizes);
    setPartial(parts);
    setInstalled(ids);
    return ids;
  };
  useEffect(() => {
    let live = true;
    void assistantSupport().then((value) => {
      if (live) setCapability(value);
    });
    void refresh()
      .then((ids) => {
        if (!live) return;
        const saved = localStorage.getItem('lm-assistant-model');
        setSelected(saved && ids.includes(saved) ? saved : (ids[0] ?? ''));
      })
      .catch(() => {
        if (live) setError('The browser could not open model storage.');
      });
    return () => {
      live = false;
      controller.current?.abort();
      if (idle.current) clearTimeout(idle.current);
      stopAssistant();
    };
  }, []);
  const select = (model: AssistantModel) => {
    if (!installed.includes(model.id)) return;
    stopAssistant();
    setSelected(model.id);
    setError('');
    try {
      localStorage.setItem('lm-assistant-model', model.id);
    } catch {
      setError('The browser could not save your model preference.');
    }
  };
  const download = async (model: AssistantModel) => {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setError('');
    setBusy({
      kind: 'download',
      modelId: model.id,
      message: 'Checking the device…',
      loaded: 0,
      total: assistantBytes(model),
    });
    try {
      const support = await assistantSupport();
      abort.signal.throwIfAborted();
      if (support) {
        setCapability(support);
        return;
      }
      await downloadAssistant(model, abort.signal, (loaded, total) =>
        setBusy({
          kind: 'download',
          modelId: model.id,
          message: 'Downloading model…',
          loaded,
          total,
        }),
      );
      await refresh();
      setSelected(model.id);
      localStorage.setItem('lm-assistant-model', model.id);
    } catch (e) {
      if (!abort.signal.aborted)
        setError(e instanceof Error ? e.message : 'The model download failed.');
      await refresh().catch(() => {});
    } finally {
      controller.current = null;
      setBusy(null);
    }
  };
  const remove = async (model: AssistantModel) => {
    if (controller.current) return;
    stopAssistant();
    setError('');
    try {
      await removeAssistant(model);
      const ids = await refresh();
      const next = selected === model.id ? (ids[0] ?? '') : selected;
      setSelected(next);
      localStorage.setItem('lm-assistant-model', next);
    } catch {
      setError('This model could not be removed. Try again.');
    }
  };
  const run = async (item: Item, task: AssistantTask, range?: AssistantRange) => {
    if (controller.current) throw new Error('Finish or cancel the current assistant task first.');
    const model = ASSISTANT_MODELS.find((m) => m.id === selected);
    if (!model || !installed.includes(model.id))
      throw new Error('Download a reading assistant first.');
    if (capability !== '') throw new Error(capability || 'The device check is still running.');
    const abort = new AbortController();
    controller.current = abort;
    setError('');
    if (idle.current) clearTimeout(idle.current);
    try {
      return await runAssistant(model, item, task, range, abort.signal, (message, progress) =>
        setBusy({ kind: 'run', modelId: model.id, message, loaded: progress, total: 1 }),
      );
    } catch (e) {
      if (!abort.signal.aborted)
        setError(e instanceof Error ? e.message : 'The assistant could not answer.');
      stopAssistant();
      await refresh().catch(() => {});
      throw e;
    } finally {
      controller.current = null;
      setBusy(null);
      idle.current = setTimeout(stopAssistant, 30000);
    }
  };
  return (
    <Context
      value={{
        capability,
        installed,
        missing,
        partial,
        selected,
        busy,
        error,
        select,
        download,
        remove,
        run,
        cancel: () => {
          controller.current?.abort();
          stopAssistant();
        },
      }}
    >
      {children}
    </Context>
  );
}
export function useAssistant() {
  const value = useContext(Context);
  if (!value) throw new Error('AssistantProvider missing');
  return value;
}
