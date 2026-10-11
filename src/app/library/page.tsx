import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { LIBRARY, LEVELS } from '@/lib/data';
import { SITE_URL, publicUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'English & Afrikaans reading library',
  description:
    'Explore short stories, poems, articles and verified South African literature study notes for Grades 10–12.',
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
        Short reads for a daily habit, and study notes to accompany South African literature. Modern
        setworks are original study notes; public-domain selections are labelled excerpts.
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
            {LIBRARY.filter((item) => item.g === language).map((item) => (
              <Link
                key={item.id}
                href={`/library/${item.id}`}
                prefetch={false}
                className="group block"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-[6px_18px_18px_6px] bg-ac shadow-lg transition-transform group-hover:-translate-y-1">
                  <Image
                    unoptimized
                    src={item.art!}
                    alt={`Original Leesmaat illustration for ${item.t}`}
                    width="400"
                    height="600"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/80 p-3 text-white"
                  >
                    <span className="font-serif text-sm leading-tight">{item.t}</span>
                    <span className="text-[10px]">{item.a}</span>
                  </div>
                </div>
                <h3 lang={item.g} className="mt-3 font-serif text-sm font-semibold leading-snug">
                  {item.t}
                </h3>
                <p className="mt-1 text-xs text-mu">
                  {item.rights === 'Original study note' ? 'Study note' : item.k} · {LEVELS[item.v]}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <footer className="mt-14 border-t border-ln pt-5 text-xs text-mu">
        Original illustrations by Leesmaat. Curriculum metadata is attributed on each title page.
        Confirm your school’s setworks with your teacher.
      </footer>
    </main>
  );
}
