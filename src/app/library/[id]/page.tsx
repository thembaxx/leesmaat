import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { PublicSummary } from '@/components/ReadingSummary';
import { summarize } from '@/lib/summaries';
import { LIBRARY, LEVELS } from '@/lib/data';
import { SITE_URL, publicUrl } from '@/lib/site';

type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return LIBRARY.map(({ id }) => ({ id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = LIBRARY.find((entry) => entry.id === id);
  if (!item) return {};
  const path = `/library/${item.id}`;
  return {
    title: item.t,
    description: item.summary,
    ...(SITE_URL
      ? {
          alternates: { canonical: publicUrl(path) },
          openGraph: {
            title: item.t,
            description: item.summary,
            type: 'article',
            url: publicUrl(path),
            locale: item.g === 'af' ? 'af_ZA' : 'en_ZA',
            images: [{ url: publicUrl('/social.png'), width: 1200, height: 630 }],
          },
        }
      : {}),
  };
}
export default async function TitlePage({ params }: Props) {
  const { id } = await params;
  const item = LIBRARY.find((entry) => entry.id === id);
  if (!item) notFound();
  const study = item.rights === 'Original study note';
  const digest = summarize(item);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: study ? `${item.t} — Leesmaat study notes` : item.t,
    description: item.summary,
    inLanguage: item.g === 'af' ? 'af-ZA' : 'en-ZA',
    author: {
      '@type': study || item.rights === 'Original Leesmaat writing' ? 'Organization' : 'Person',
      name: study || item.rights === 'Original Leesmaat writing' ? 'Leesmaat' : item.a,
    },
    genre: item.genre ?? item.k,
    ...(SITE_URL ? { url: publicUrl(`/library/${item.id}`), image: publicUrl(item.art!) } : {}),
    ...(study
      ? { about: { '@type': 'Book', name: item.t, author: { '@type': 'Person', name: item.a } } }
      : {}),
  };
  return (
    <main className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Open Leesmaat">
          <Brand />
        </Link>
        <Link href="/library" className="text-sm text-ac underline">
          Library
        </Link>
      </header>
      <div className="mt-10 grid gap-7 sm:grid-cols-[150px_1fr]">
        <Image
          unoptimized
          src={item.art!}
          alt={`Original Leesmaat illustration for ${item.t}`}
          width="400"
          height="600"
          className="w-32 rounded-2xl shadow-lg sm:w-full"
        />
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ac">
            {study ? 'Study notes' : item.k} · {item.g === 'af' ? 'Afrikaans' : 'English'}
          </p>
          <h1 lang={item.g} className="font-serif text-4xl leading-tight">
            {item.t}
          </h1>
          <p className="mt-3 text-sm text-mu">
            {item.a} · {LEVELS[item.v]} · {item.m} min
            {item.grade ? ` · Grade ${item.grade} ${item.course}` : ''}
          </p>
          <Link
            href={`/?read=${item.id}`}
            className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-bg"
          >
            Read in Leesmaat
          </Link>
        </div>
      </div>
      <p className="my-7 rounded-2xl bg-ln p-4 text-sm">
        {item.rights}
        {study
          ? '. These original notes support your reading of the setwork; use your own copy of the text.'
          : item.textSource
            ? '. This is a selected opening excerpt. Find the full text at the source below.'
            : '. A complete short read created for Leesmaat.'}
      </p>
      {digest && <PublicSummary item={item} summary={digest} />}
      <article lang={item.g} className="max-w-prose font-serif text-lg leading-relaxed">
        {item.x.split('\n\n').map((paragraph, index) => (
          <p
            id={`passage-${index}`}
            key={index}
            className={`mb-6 scroll-mt-6 ${item.k === 'Poem' ? 'whitespace-pre-line' : ''}`}
          >
            {paragraph}
          </p>
        ))}
      </article>
      <footer className="mt-8 flex flex-wrap gap-5 border-t border-ln pt-5 text-sm text-ac">
        {item.source && (
          <a href={item.source} rel="noreferrer" target="_blank" className="underline">
            Curriculum source
          </a>
        )}
        {item.textSource && (
          <a href={item.textSource} rel="noreferrer" target="_blank" className="underline">
            Full text source
          </a>
        )}
        <a href={`/library/${item.id}/text`} className="underline">
          Plain text
        </a>
      </footer>
    </main>
  );
}
