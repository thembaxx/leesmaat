import type { Metadata } from 'next';
import Link from 'next/link';
import { EditionCover } from '@/components/EditionCover';
import { Brand } from '@/components/Brand';
import { BROWSABLE_LIBRARY, KINDS, LEVELS } from '@/lib/data';
import { SITE_URL, publicUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'English & Afrikaans reading library',
  description:
    'Read complete books, poems, short stories and essays, with verified South African literature catalogue records.',
  ...(SITE_URL ? { alternates: { canonical: publicUrl('/library') } } : {}),
};

export default function LibraryPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8 pb-16">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Open Leesmaat">
          <Brand />
        </Link>
        <Link href="/" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-bg">
          Open app
        </Link>
      </header>
      <h1 className="mt-12 font-serif text-4xl tracking-tight">A world on your bookshelf.</h1>
      <p className="mt-4 max-w-xl text-mu">
        Complete books, then poems, short stories and essays. Reading texts retain their source
        attribution. Modern school setworks have verified catalogue records with library links.
      </p>
      <nav aria-label="Library languages" className="my-7 flex gap-5 text-sm text-ac">
        <a href="#english" className="underline">
          English
        </a>
        <a href="#afrikaans" className="underline">
          Afrikaans
        </a>
      </nav>
      {(['en', 'af'] as const).map((language) => (
        <section key={language} id={language === 'en' ? 'english' : 'afrikaans'} className="mt-10">
          <h2 className="mb-6 font-serif text-3xl">
            {language === 'en' ? 'English' : 'Afrikaans'}
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {BROWSABLE_LIBRARY.filter((item) => item.g === language)
              .sort(
                (a, b) =>
                  KINDS.indexOf(a.k) - KINDS.indexOf(b.k) ||
                  Number(!!b.published) - Number(!!a.published),
              )
              .map((item) => (
                <Link
                  key={item.id}
                  href={`/library/${item.id}`}
                  prefetch={false}
                  className="group block"
                >
                  <EditionCover item={item} />
                  <h3 lang={item.g} className="mt-3 font-serif text-sm font-semibold leading-snug">
                    {item.t}
                  </h3>
                  <p className="mt-1 text-xs text-mu">
                    {item.k} ·{' '}
                    {item.contentUrl
                      ? 'Complete book'
                      : item.published
                        ? LEVELS[item.v]
                        : 'Catalogue'}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      ))}
      <footer className="mt-14 border-t border-ln pt-5 text-xs text-mu">
        Reading texts and source-edition covers are attributed on each title page. Confirm your
        school’s setworks with your teacher.
      </footer>
    </main>
  );
}
