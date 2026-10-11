import type { Metadata, Viewport } from 'next';
import { Inter, Literata } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const literata = Literata({ subsets: ['latin', 'latin-ext'], variable: '--font-literata' });

export const metadata: Metadata = {
  title: 'Leesmaat',
  description: 'Read a little. Understand a lot.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'Leesmaat', statusBarStyle: 'default' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2f6b4f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en" className={`${inter.variable} ${literata.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem('lm')||'{}'),r=document.documentElement;if(['paper','sepia','night'].includes(s.theme))r.dataset.theme=s.theme;if(s.mono)r.setAttribute('data-mono','');if(s.fs>=15&&s.fs<=30)r.style.setProperty('--fs',s.fs+'px')}catch{}`,
          }}
        />
      </head>
      <body className="bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
