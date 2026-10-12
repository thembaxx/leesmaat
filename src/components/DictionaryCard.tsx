'use client';
/* oxlint-disable react/set-state-in-effect -- Resolve an abortable dictionary lookup when the selected word changes. */
import { useEffect, useRef, useState } from 'react';
import { SpeakerHighIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { Lang } from '@/lib/data';
import { lookupDictionary, type DictionaryEntry } from '@/lib/dictionary';
import { VOICES, unlockAudio, synthesize, playAudio, stopAudio } from '@/lib/voices';
import { useVoices } from './VoiceProvider';
export function DictionaryCard({
  text,
  language,
  onEntry,
}: {
  text: string;
  language: Lang;
  onEntry?: (entry: DictionaryEntry | null) => void;
}) {
  const [word, setWord] = useState(text),
    [entry, setEntry] = useState<DictionaryEntry | null>(null),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [audioError, setAudioError] = useState('');
  const voices = useVoices();
  const audioToken = useRef(0);
  useEffect(() => {
    const abort = new AbortController();
    let live = true;
    setEntry(null);
    setError('');
    onEntry?.(null);
    void lookupDictionary(word, language, abort.signal)
      .then((value) => {
        if (live) {
          setEntry(value);
          onEntry?.(value);
        }
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : 'Could not look up this word.');
      });
    return () => {
      live = false;
      abort.abort();
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- This is a cancellation counter, not a DOM ref.
      audioToken.current++;
      stopAudio();
      window.speechSynthesis?.cancel();
    };
  }, [word, language, onEntry]);
  const listen = () => {
    setAudioError('');
    const token = ++audioToken.current;
    stopAudio();
    const preference = voices.preferences[language],
      pack = VOICES.find((v) => 'pack:' + v.id === preference);
    if (pack) {
      void unlockAudio()
        .then(() => synthesize(pack, entry!.word))
        .then((audio) => {
          if (token === audioToken.current) playAudio(audio);
        })
        .catch((e) => {
          if (token === audioToken.current) setAudioError(e.message);
        });
      return;
    }
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      setAudioError('Pronunciation is unavailable on this device.');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(entry!.word);
    const options = window.speechSynthesis.getVoices();
    const selected =
      options.find((v) => 'device:' + v.voiceURI === preference) ??
      options.find((v) => v.lang.toLowerCase().startsWith(language));
    u.lang = language === 'af' ? 'af-ZA' : 'en-ZA';
    if (selected) u.voice = selected;
    u.onerror = () =>
      setAudioError('Pronunciation could not play. Choose a reading voice in Settings.');
    window.speechSynthesis.speak(u);
  };
  return (
    <section
      aria-label="Dictionary"
      className="dictionary-card rounded-2xl border border-ln bg-sf p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-wide text-mu">
          Dictionary · {language === 'af' ? 'Afrikaans · English definitions' : 'English'}
        </p>
        <MagnifyingGlassIcon size={17} className="shrink-0 text-mu" aria-hidden="true" />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim()) {
            setWord(query.trim());
            setQuery('');
          }
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          aria-label="Dictionary word"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Look up another word"
          className="min-w-0 flex-1 rounded-full bg-ln px-3 py-2 text-sm"
        />
        <button
          aria-label="Look up word"
          title="Look up"
          disabled={!query.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ln"
        >
          <MagnifyingGlassIcon size={18} />
        </button>
      </form>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="dictionary-headword break-words text-[34px] leading-tight">
            {entry?.word ?? word}
          </h3>
          {entry?.requested && entry.requested !== entry.word && (
            <p className="mt-1 text-xs text-mu">From “{entry.requested}”</p>
          )}
          {entry?.phonetics[0] && (
            <p className="mt-2 text-base text-mu">{entry.phonetics[0].text}</p>
          )}
        </div>
        {entry && (
          <button
            aria-label={`Pronounce ${entry.word}`}
            title="Hear pronunciation"
            onClick={listen}
            className="mt-1 grid size-11 shrink-0 place-items-center rounded-full border border-ln text-ac"
          >
            <SpeakerHighIcon size={22} />
          </button>
        )}
      </div>
      {!entry && !error && (
        <output className="my-4 text-sm text-mu">Looking up the dictionary…</output>
      )}
      {error && <output className="my-4 text-sm text-mu">{error}</output>}
      {entry?.meanings.map((meaning, index) => (
        <div key={index} className="mt-5">
          <h4 className="mb-2 text-[15px] italic text-mu">{meaning.partOfSpeech}</h4>
          <ol className="list-decimal space-y-3 pl-5">
            {meaning.definitions.slice(0, 4).map((definition, index) => (
              <li key={index} className="pl-1 text-[15px] leading-relaxed">
                <p>{definition.definition}</p>
                {definition.example && <p className="mt-1 text-mu">“{definition.example}”</p>}
                {definition.synonyms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-xs text-mu">Similar:</span>
                    {definition.synonyms.slice(0, 5).map((synonym) => (
                      <button
                        key={synonym}
                        onClick={() => setWord(synonym)}
                        className="rounded-full border border-ln px-2.5 py-1 text-xs text-ac"
                      >
                        {synonym}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
      {entry && (
        <footer className="mt-5 border-t border-ln pt-3 text-[11px] text-mu">
          <a className="underline" href={entry.source} target="_blank" rel="noreferrer">
            {entry.provider}
          </a>
          {' · '}
          <a className="underline" href={entry.licenceUrl} target="_blank" rel="noreferrer">
            {entry.licence}
          </a>
          <p className="mt-1">Looked-up definitions are saved for offline reading.</p>
        </footer>
      )}
      {audioError && (
        <p role="alert" className="mt-2 text-xs">
          {audioError}
        </p>
      )}
    </section>
  );
}
