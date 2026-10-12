'use client';
import { useEffect, useRef } from 'react';
import type { Item } from './data';

type AudioActions = { play: () => void; pause: () => void; next: () => void; previous: () => void };
export function useNativeAudio(item: Item, playing: boolean, actions: AudioActions) {
  const current = useRef(actions);
  useEffect(() => {
    current.current = actions;
  }, [actions]);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.t,
      artist: item.a,
      album: 'Leesmaat',
      artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
    const bindings = {
      play: () => current.current.play(),
      pause: () => current.current.pause(),
      nexttrack: () => current.current.next(),
      previoustrack: () => current.current.previous(),
    };
    for (const [action, handler] of Object.entries(bindings)) {
      try {
        navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler);
      } catch {
        /* Action support varies by browser. */
      }
    }
    return () => {
      for (const action of Object.keys(bindings)) {
        try {
          navigator.mediaSession.setActionHandler(action as MediaSessionAction, null);
        } catch {
          /* Unsupported action. */
        }
      }
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.metadata = null;
    };
  }, [item.id, item.t, item.a]);
  useEffect(() => {
    if ('mediaSession' in navigator)
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    if (!playing || !('wakeLock' in navigator)) return;
    let live = true;
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      if (document.hidden || (lock && !lock.released)) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (!live) await next.release();
        else lock = next;
      } catch {
        /* Reading still works when the device declines a wake lock. */
      }
    };
    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release().catch(() => {});
    };
  }, [playing]);
}

export async function shareRead(item: Item) {
  const url = new URL(`/library/${item.bookId ?? item.id}`, location.origin).href;
  if (navigator.share) {
    try {
      await navigator.share({ title: item.t, text: `Read ${item.t} with Leesmaat`, url });
      return '';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return '';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'Reading link copied.';
  } catch {
    return `Share this reading link: ${url}`;
  }
}
