'use client';
/* oxlint-disable react/set-state-in-effect -- Synchronize local voice preferences and browser voice availability. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '@/lib/data';
import {
  installedVoices,
  readVoicePreferences,
  downloadVoice,
  removeVoice,
  playPreview,
  stopAudio,
  releaseVoiceWorkers,
  type VoiceProfile,
} from '@/lib/voices';
type VoiceContext = {
  preferences: Record<Lang, string>;
  installed: string[];
  devices: SpeechSynthesisVoice[];
  select: (language: Lang, id: string) => void;
  busy: { id: string; loaded: number; total: number } | null;
  download: (voice: VoiceProfile) => Promise<void>;
  remove: (voice: VoiceProfile) => Promise<void>;
  cancel: () => void;
  preview: (voice: VoiceProfile | SpeechSynthesisVoice, language: Lang) => void;
  previewing: string | null;
  error: string;
};
const Context = createContext<VoiceContext | null>(null);
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Record<Lang, string>>({ en: '', af: '' });
  const [installed, setInstalled] = useState<string[]>([]),
    [devices, setDevices] = useState<SpeechSynthesisVoice[]>([]);
  const [busy, setBusy] = useState<VoiceContext['busy']>(null),
    [previewing, setPreviewing] = useState<string | null>(null),
    [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null),
    previewToken = useRef(0);
  const refresh = async () => setInstalled(await installedVoices());
  useEffect(() => {
    setPreferences(readVoicePreferences());
    void refresh().catch(() => setError('This browser could not open voice storage.'));
    const voices = () => setDevices(window.speechSynthesis?.getVoices() ?? []);
    voices();
    window.speechSynthesis?.addEventListener('voiceschanged', voices);
    const storage = (event: StorageEvent) => {
      if (event.key === 'lm-voices') setPreferences(readVoicePreferences());
    };
    window.addEventListener('storage', storage);
    return () => {
      controller.current?.abort();
      stopAudio();
      releaseVoiceWorkers();
      window.speechSynthesis?.removeEventListener('voiceschanged', voices);
      window.removeEventListener('storage', storage);
    };
  }, []);
  const select = (language: Lang, id: string) => {
    if (id.startsWith('pack:') && !installed.includes(id.slice(5))) {
      setError('Download this voice before choosing it.');
      return;
    }
    const next = { ...preferences, [language]: id };
    setPreferences(next);
    setError('');
    try {
      localStorage.setItem('lm-voices', JSON.stringify(next));
    } catch {
      setError('Your browser could not save this voice preference.');
    }
  };
  const download = async (voice: VoiceProfile) => {
    if (controller.current) return;
    setError('');
    const abort = new AbortController();
    controller.current = abort;
    setBusy({ id: voice.id, loaded: 0, total: 0 });
    try {
      await downloadVoice(voice, abort.signal, (loaded, total) =>
        setBusy({ id: voice.id, loaded, total }),
      );
      await refresh();
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        setError(e instanceof Error ? e.message : 'Voice download failed.');
    } finally {
      controller.current = null;
      setBusy(null);
    }
  };
  const remove = async (voice: VoiceProfile) => {
    setError('');
    stopAudio();
    releaseVoiceWorkers();
    try {
      await removeVoice(voice);
      const remaining = await installedVoices();
      setInstalled(remaining);
      const next = { ...preferences };
      for (const language of ['en', 'af'] as const)
        if (next[language].startsWith('pack:') && !remaining.includes(next[language].slice(5)))
          next[language] = '';
      setPreferences(next);
      localStorage.setItem('lm-voices', JSON.stringify(next));
    } catch {
      setError('This voice could not be removed. Try again.');
    }
  };
  const preview = (voice: VoiceProfile | SpeechSynthesisVoice, language: Lang) => {
    previewToken.current++;
    stopAudio();
    window.speechSynthesis?.cancel();
    setError('');
    const id = 'engine' in voice ? voice.id : voice.voiceURI;
    if (previewing === id) {
      setPreviewing(null);
      return;
    }
    setPreviewing(id);
    const token = previewToken.current;
    const done = () => {
      if (previewToken.current === token) setPreviewing(null);
    };
    if ('engine' in voice) {
      void playPreview(voice.preview, done).catch((e) => {
        if (previewToken.current === token) {
          done();
          setError(e instanceof Error ? e.message : 'The preview could not play.');
        }
      });
    } else {
      const u = new SpeechSynthesisUtterance(
        language === 'af'
          ? '’n Bietjie lees maak ’n groter wêreld oop.'
          : 'A little reading opens a bigger world.',
      );
      u.voice = voice;
      u.lang = voice.lang;
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    }
  };
  return (
    <Context
      value={{
        preferences,
        installed,
        devices,
        busy,
        download,
        remove,
        select,
        preview,
        previewing,
        error,
        cancel: () => controller.current?.abort(),
      }}
    >
      {children}
    </Context>
  );
}
export function useVoices() {
  const value = useContext(Context);
  if (!value) throw new Error('VoiceProvider missing');
  return value;
}
