'use client';
import { useState } from 'react';
import {
  ArrowClockwiseIcon,
  DownloadSimpleIcon,
  WifiSlashIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useOffline } from './OfflineProvider';
import { Brand } from './Brand';

export function PwaStatus() {
  const { online, updateReady, applyUpdate } = useOffline();
  const [dismissed, setDismissed] = useState(false);
  if (online && (!updateReady || dismissed)) return null;
  return (
    <output className="glass absolute inset-x-4 bottom-[calc(100px+env(safe-area-inset-bottom))] z-10 flex items-center gap-3 rounded-2xl p-3 text-xs">
      {online ? <ArrowClockwiseIcon size={20} /> : <WifiSlashIcon size={20} />}
      <span className="flex-1">
        {online
          ? 'A fresh chapter is ready. Update when you’re ready.'
          : 'You’re offline. Your saved reads are ready.'}
      </span>
      {online && (
        <>
          <button
            aria-label="Update Leesmaat"
            title="Update Leesmaat"
            onClick={applyUpdate}
            className="grid size-11 place-items-center rounded-full bg-ink text-bg"
          >
            <ArrowClockwiseIcon size={20} />
          </button>
          <button
            aria-label="Dismiss update"
            onClick={() => setDismissed(true)}
            className="grid size-11 place-items-center"
          >
            <XIcon size={18} />
          </button>
        </>
      )}
    </output>
  );
}

export function InstallPanel() {
  const pwa = useOffline();
  const [storageMessage, setStorageMessage] = useState('');
  const protectDownloads = async () => {
    try {
      const kept = await navigator.storage?.persist?.();
      setStorageMessage(
        kept
          ? 'This browser will protect your downloads from automatic storage cleanup.'
          : 'Keep using Leesmaat regularly and keep free space on your device to retain downloads.',
      );
    } catch {
      setStorageMessage('Keep free space on your device to retain downloads.');
    }
  };
  return (
    <div className="mt-5 border-t border-ln pt-4">
      <Brand />
      <h3 className="mt-3 mb-2 text-lg font-bold">Your reading companion</h3>
      <p className="text-[13px] text-mu">
        {pwa.installed
          ? 'Leesmaat is installed. Your library opens in its own window.'
          : 'Keep Leesmaat on your home screen for a quiet, full-screen reading experience.'}
      </p>
      {!pwa.installed &&
        (pwa.installable ? (
          <button
            onClick={() => void pwa.install()}
            aria-label="Install Leesmaat"
            title="Install Leesmaat"
            className="mt-3 grid size-12 place-items-center rounded-full bg-ink text-bg"
          >
            <DownloadSimpleIcon size={24} />
          </button>
        ) : (
          <p className="mt-3 rounded-2xl bg-ln p-3 text-[13px]">
            {pwa.ios
              ? 'In Safari, tap Share, then Add to Home Screen. Turn on Open as Web App, if offered.'
              : 'Open your browser menu and choose Install app or Add to Home Screen, if offered.'}
          </p>
        ))}
      <p className="mt-3 text-xs text-mu">
        {pwa.available
          ? 'Offline reading is ready. Download a read from its reading settings.'
          : 'Open Leesmaat online once to prepare offline reading.'}{' '}
        Device voices determine whether read-aloud works offline.
      </p>
      {pwa.available && (
        <button
          onClick={() => void protectDownloads()}
          className="mt-3 rounded-full bg-ln px-4 py-2 text-[13px] font-semibold"
        >
          Protect offline downloads
        </button>
      )}
      {storageMessage && <output className="mt-2 block text-xs text-mu">{storageMessage}</output>}
      {pwa.updateReady && (
        <button
          onClick={pwa.applyUpdate}
          className="mt-3 rounded-full bg-ink px-4 py-2 text-sm text-bg"
        >
          Update Leesmaat
        </button>
      )}
      {pwa.error && (
        <p role="alert" className="mt-2 text-xs">
          {pwa.error}
        </p>
      )}
    </div>
  );
}
