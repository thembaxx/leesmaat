'use client';
import { useEffect, useRef, useState } from 'react';
import {
  PlayIcon,
  StopIcon,
  DownloadSimpleIcon,
  TrashIcon,
  CheckIcon,
  SpeakerHighIcon,
} from '@phosphor-icons/react';
import {
  VOICES,
  filesFor,
  formatBytes,
  countryName,
  stopAudio,
  unlockAudio,
  synthesize,
  playAudio,
  audioTicket,
} from '@/lib/voices';
import type { Lang } from '@/lib/data';
import { useVoices } from './VoiceProvider';

export function VoicePanel({ language }: { language: Lang }) {
  const voice = useVoices();
  const [gender, setGender] = useState('all'),
    [country, setCountry] = useState('all');
  const [custom, setCustom] = useState('');
  useEffect(
    () => () => {
      stopAudio();
      window.speechSynthesis?.cancel();
    },
    [],
  );
  const profiles = VOICES.filter(
    (v) =>
      v.language === language &&
      (gender === 'all' || v.gender === gender) &&
      (country === 'all' || v.country === country),
  );
  const countries = [
    ...new Set(VOICES.filter((v) => v.language === language).map((v) => v.country)),
  ];
  const current = voice.preferences[language];
  return (
    <section aria-label="Voice library" className="mt-5 border-t border-ln pt-4">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <SpeakerHighIcon size={22} aria-hidden="true" />
        Reading voice
      </h3>
      <p className="my-2 text-[13px] text-mu">
        Preview a small audio sample, then download a voice to read offline. Downloaded packs render
        your reading text on this device.
      </p>
      <button
        aria-pressed={!current}
        onClick={() => voice.select(language, '')}
        className={`mb-3 w-full rounded-xl border p-3 text-left text-sm ${!current ? 'border-ac' : 'border-ln'}`}
      >
        Device default{' '}
        <span className="block text-xs text-mu">Browser or system default; no app download.</span>
      </button>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-mu">
          Voice style
          <select
            aria-label="Voice gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 block w-full rounded-xl bg-ln p-2 text-ink"
          >
            <option value="all">All voices</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <label className="text-xs text-mu">
          Country
          <select
            aria-label="Voice country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 block w-full rounded-xl bg-ln p-2 text-ink"
          >
            <option value="all">All countries</option>
            {countries.map((code) => (
              <option value={code} key={code}>
                {countryName(code)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {profiles.map((profile) => {
        const stored = voice.installed.includes(profile.id),
          selected = current === 'pack:' + profile.id;
        const runtime = filesFor(profile)
            .filter((f) => !profile.files.includes(f))
            .reduce((sum, f) => sum + f.bytes, 0),
          model = profile.files.reduce((sum, f) => sum + f.bytes, 0);
        const active = voice.busy?.id === profile.id;
        return (
          <div
            key={profile.id}
            className={`mb-3 rounded-2xl border bg-sf p-3 ${selected ? 'border-ac' : 'border-ln'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold">{profile.name}</h4>
                <p className="mt-0.5 text-xs text-mu">
                  {countryName(profile.country)} · {profile.gender} · {profile.style}
                </p>
              </div>
              {selected && (
                <CheckIcon size={20} className="shrink-0 text-ac" aria-label="Selected voice" />
              )}
            </div>
            <p className="mt-2 text-xs text-mu">
              {model
                ? `${formatBytes(model)} voice + ${formatBytes(runtime)} shared engine`
                : `${formatBytes(runtime)} shared Afrikaans pack`}
              {stored ? ' · Downloaded' : ''}
            </p>
            {profile.engine === 'espeak' && (
              <p className="mt-1 text-xs text-mu">
                Both Afrikaans tones use the same compact pack.
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                aria-label={`Preview ${profile.name}`}
                title="Preview voice"
                onClick={() => voice.preview(profile, language)}
                className="grid size-11 place-items-center rounded-full bg-ln text-ac"
              >
                {voice.previewing === profile.id ? (
                  <StopIcon size={20} weight="fill" />
                ) : (
                  <PlayIcon size={20} weight="fill" />
                )}
              </button>
              {stored ? (
                <>
                  <button
                    onClick={() => voice.select(language, 'pack:' + profile.id)}
                    disabled={selected}
                    className="min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-bg"
                  >
                    {selected ? 'Selected' : 'Choose'}
                  </button>
                  <button
                    aria-label={`Remove ${profile.name}`}
                    title="Remove voice pack"
                    disabled={!!voice.busy}
                    onClick={() => void voice.remove(profile)}
                    className="ml-auto grid size-11 place-items-center rounded-full bg-ln"
                  >
                    <TrashIcon size={20} />
                  </button>
                </>
              ) : (
                <button
                  aria-label={`Download ${profile.name}`}
                  title="Download voice"
                  disabled={!!voice.busy}
                  onClick={() => void voice.download(profile)}
                  className="ml-auto grid size-11 place-items-center rounded-full bg-ink text-bg"
                >
                  <DownloadSimpleIcon size={20} />
                </button>
              )}
            </div>
            {active && (
              <div className="mt-3">
                <progress
                  aria-label={`Downloading ${profile.name}`}
                  value={voice.busy!.loaded}
                  max={voice.busy!.total || 1}
                  className="h-2 w-full accent-ac"
                />
                <output className="mt-1 text-xs text-mu">
                  {voice.busy!.total
                    ? `${formatBytes(voice.busy!.loaded)} / ${formatBytes(voice.busy!.total)}`
                    : 'Preparing download…'}
                </output>
                <button onClick={voice.cancel} className="mt-1 min-h-11 text-sm underline">
                  Cancel download
                </button>
              </div>
            )}
            <a
              href={profile.source}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[11px] text-mu underline"
            >
              Source &amp; licence · {profile.licence}
            </a>
          </div>
        );
      })}
      {voice.devices.filter((v) => v.lang.toLowerCase().startsWith(language)).length > 0 && (
        <details className="my-3 rounded-xl bg-ln p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            Installed device voices
          </summary>
          <p className="mt-2 text-xs text-mu">
            Your system manages downloads and storage. Browsers do not report their file size or
            gender.
          </p>
          {voice.devices
            .filter((v) => v.lang.toLowerCase().startsWith(language))
            .map((device) => (
              <div key={device.voiceURI} className="mt-3 flex items-center gap-2">
                <button
                  aria-label={`Preview ${device.name}`}
                  title="Preview device voice"
                  onClick={() => voice.preview(device, language)}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-sf"
                >
                  <PlayIcon size={18} />
                </button>
                <button
                  aria-pressed={current === 'device:' + device.voiceURI}
                  onClick={() => voice.select(language, 'device:' + device.voiceURI)}
                  className="min-h-11 flex-1 text-left text-sm"
                >
                  <span className="block font-semibold">{device.name}</span>
                  <span className="text-xs text-mu">
                    {device.lang} · {device.localService ? 'On device' : 'Online voice'}
                  </span>
                </button>
              </div>
            ))}
        </details>
      )}
      <details className="my-3 rounded-xl bg-ln p-3">
        <summary className="cursor-pointer text-sm font-semibold">Try your own text</summary>
        <label className="mt-2 block text-xs text-mu">
          Preview text
          <textarea
            aria-label="Voice preview text"
            maxLength={180}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="mt-1 block w-full rounded-xl bg-sf p-3 text-ink"
          />
        </label>
        <p className="mt-1 text-xs text-mu">Choose a downloaded voice to preview your own text.</p>
        <CustomPreview text={custom} language={language} />
      </details>
      {voice.error && (
        <p role="alert" className="my-2 rounded-xl bg-ln p-3 text-sm">
          {voice.error}
        </p>
      )}
    </section>
  );
}
function CustomPreview({ text, language }: { text: string; language: Lang }) {
  const voice = useVoices();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const token = useRef(0);
  useEffect(
    () => () => {
      token.current++;
      stopAudio();
    },
    [],
  );
  const preview = async () => {
    const id = ++token.current;
    stopAudio();
    if (busy) {
      setBusy(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const ticket = audioTicket();
      await unlockAudio();
      const selected = VOICES.find((v) => 'pack:' + v.id === voice.preferences[language]);
      if (!selected) throw new Error('Choose a downloaded voice first.');
      const audio = await synthesize(selected, text);
      if (id === token.current) {
        if (ticket === audioTicket())
          playAudio(
            audio,
            () => setBusy(false),
            () => setBusy(false),
          );
        else setBusy(false);
      }
    } catch (e) {
      if (id === token.current) {
        setBusy(false);
        setError(e instanceof Error ? e.message : 'Could not play speech.');
      }
    }
  };
  return (
    <>
      <button
        aria-label={busy ? 'Stop custom preview' : 'Preview custom text'}
        title="Preview your text"
        disabled={!busy && (!text.trim() || !voice.preferences[language].startsWith('pack:'))}
        onClick={() => void preview()}
        className="mt-2 grid size-11 place-items-center rounded-full bg-ink text-bg"
      >
        {busy ? <StopIcon size={20} weight="fill" /> : <PlayIcon size={20} weight="fill" />}
      </button>
      {busy && <output className="mt-1 block text-xs text-mu">Preparing or playing speech…</output>}
      {error && (
        <p role="alert" className="text-xs">
          {error}
        </p>
      )}
    </>
  );
}
