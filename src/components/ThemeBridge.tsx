'use client';
/* oxlint-disable react/set-state-in-effect -- Follow the browser's resolved reading theme. */
import { useEffect, useState } from 'react';
import { syncBrowserTheme, THEME_COLORS } from '@/lib/theme';
import { SPLASH_DEVICES, splashLinks } from '@/lib/splash';

function resolvedTheme() {
  const preference = document.documentElement.dataset.theme;
  return preference === 'paper' || preference === 'sepia' || preference === 'night'
    ? preference
    : matchMedia('(prefers-color-scheme: dark)').matches
      ? 'night'
      : 'paper';
}

export function ThemeBridge() {
  // The head script has already applied this preference to the server's tags.
  // Match those attributes on the first client render so React reuses them.
  const [theme, setTheme] = useState<keyof typeof THEME_COLORS | null>(() =>
    typeof document === 'undefined' ? null : resolvedTheme(),
  );
  useEffect(() => {
    const update = () => {
      const preference = document.documentElement.dataset.theme ?? '';
      syncBrowserTheme(preference);
      setTheme(resolvedTheme());
    };
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
  return (
    <>
      <meta
        name="color-scheme"
        content={theme ? (theme === 'night' ? 'dark' : 'light') : 'light dark'}
      />
      {(['paper', 'night'] as const).map((fallback) => (
        <meta
          key={fallback}
          name="theme-color"
          content={THEME_COLORS[theme ?? fallback]}
          media={
            theme ? undefined : `(prefers-color-scheme: ${fallback === 'night' ? 'dark' : 'light'})`
          }
        />
      ))}
      <link
        rel="manifest"
        href={theme ? `/manifest.webmanifest?theme=${theme}` : '/manifest.webmanifest'}
      />
      {SPLASH_DEVICES.flatMap((device) =>
        splashLinks(device).map(({ href, media }) => (
          <link
            key={href}
            rel="apple-touch-startup-image"
            href={theme ? href.replace(/-(paper|night)\.png$/, `-${theme}.png`) : href}
            media={media}
          />
        )),
      )}
    </>
  );
}
