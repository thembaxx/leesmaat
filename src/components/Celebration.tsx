'use client';
/* oxlint-disable react/set-state-in-effect -- Synchronize the once-per-session celebration with sessionStorage. */
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { today } from '@/lib/text';
export function Celebration() {
  const { s } = useStore();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (s.done !== today() || sessionStorage.getItem('lm-celebrated') === s.done) return;
    sessionStorage.setItem('lm-celebrated', s.done);
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), 5000);
    return () => window.clearTimeout(timer);
  }, [s.done]);
  if (!show) return null;
  return (
    <output className="pointer-events-none absolute inset-x-4 top-8 z-50 animate-rise rounded-3xl bg-ink p-5 text-center text-bg shadow-xl">
      <span aria-hidden="true" className="mb-1 block animate-pop text-3xl">
        ✦
      </span>
      <b>Five minutes, well spent.</b>
      <p className="mt-1 text-sm">Daily goal complete · +20 XP</p>
    </output>
  );
}
