import type { Metadata, Viewport } from 'next';
import { Inter, Literata, Roboto, Noto_Serif } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { themeBoot } from '@/lib/theme';
import { SITE_URL, description, siteTitle, siteSchema } from '@/lib/site';
import { ThemeBridge } from '@/components/ThemeBridge';
import { SPLASH_DEVICES } from '@/lib/splash';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const literata = Literata({ subsets: ['latin', 'latin-ext'], variable: '--font-literata' });

const dictionaryBody = Roboto({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dictionary-body',
});
const dictionaryWord = Noto_Serif({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dictionary-word',
});

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: { default: siteTitle, template: '%s | Leesmaat' },
  description,
  applicationName: 'Leesmaat',
  category: 'education',
  robots: { index: Boolean(SITE_URL), follow: true },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Leesmaat', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    siteName: 'Leesmaat',
    title: siteTitle,
    description,
    ...(SITE_URL
      ? {
          url: SITE_URL,
          images: [
            {
              url: '/social.png',
              width: 1200,
              height: 630,
              alt: 'Leesmaat: a little reading, a bigger world',
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description,
    ...(SITE_URL ? { images: ['/social.png'] } : {}),
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${inter.variable} ${literata.variable} ${dictionaryBody.variable} ${dictionaryWord.variable}`}
    >
      <head>
        <link rel="describedby" type="text/plain" href="/llms.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteSchema()).replace(/</g, '\\u003c'),
          }}
        />
        <meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        {SPLASH_DEVICES.flatMap(([width, height, ratio]) =>
          ['paper', 'night'].map((theme) => (
            <link
              key={`${width}-${height}-${theme}`}
              rel="apple-touch-startup-image"
              href={`/brand/splash/${width}-${height}-${theme}.png`}
              media={`(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait) and (prefers-color-scheme: ${theme === 'night' ? 'dark' : 'light'})`}
            />
          )),
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: themeBoot,
          }}
        />
      </head>
      <body className="bg-bg font-sans text-ink antialiased">
        <ThemeBridge />
        {children}
      </body>
    </html>
  );
}
