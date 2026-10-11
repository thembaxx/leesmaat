'use client';
import { useEffect } from 'react';
import { syncBrowserTheme } from '@/lib/theme';

export function ThemeBridge() {
  useEffect(() => {
    const update = () => syncBrowserTheme(document.documentElement.dataset.theme ?? '');
    update();
    const system = matchMedia('(prefers-color-scheme: dark)');
    system.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => {
      system.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);
  return null;
}
