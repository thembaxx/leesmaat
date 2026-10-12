'use client';
/* oxlint-disable react/set-state-in-effect -- Load the selected public reading or archived book snapshot. */
import { useEffect, useState } from 'react';
import { readable, type Item, type BookContent } from '@/lib/data';
import { loadBook, bookSection, sectionNumber, baseId } from '@/lib/books';
import { Reader } from './Reader';
import { Sheet } from './Sheets';
import { useStore } from '@/lib/store';
export function ReadingGate({
  item,
  requested,
  onClose,
  onChoose,
}: {
  item: Item;
  requested: string;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const [book, setBook] = useState<BookContent | null>(item.book ?? null),
    [error, setError] = useState('');
  const { s, set } = useStore();
  useEffect(() => {
    if (!item.contentUrl) return;
    let live = true;
    void loadBook(item)
      .then((value) => {
        if (live) {
          setBook(value);
          setError('');
        }
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : 'Could not open the book.');
      });
    return () => {
      live = false;
    };
  }, [item]);
  if (!readable(item))
    return (
      <Sheet open onClose={onClose} title="Book details">
        <h3 className="font-serif text-2xl">{item.t}</h3>
        <p className="my-2 text-sm text-mu">
          {item.a} · {item.n}
        </p>
        {item.isbn && <p className="text-sm">ISBN {item.isbn}</p>}
        <p className="my-4 text-sm">
          A verified catalogue record. This edition’s reading text is available from its publisher
          or a library.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-ac">
          <a
            className="underline"
            target="_blank"
            rel="noreferrer"
            href={
              item.isbn
                ? `https://openlibrary.org/isbn/${item.isbn}`
                : `https://openlibrary.org/search?q=${encodeURIComponent(item.t + ' ' + item.a)}`
            }
          >
            Find a library edition
          </a>
          {item.source && (
            <a className="underline" href={item.source} target="_blank" rel="noreferrer">
              Official catalogue
            </a>
          )}
          <a
            className="underline"
            href={`https://www.annasarchive.io/search?q=${encodeURIComponent(item.isbn ?? item.t + ' ' + item.a)}`}
            target="_blank"
            rel="noreferrer"
          >
            Anna’s Archive metadata
          </a>
        </div>
        <button
          onClick={() =>
            set((old) => ({
              sv: old.sv.includes(item.id)
                ? old.sv.filter((id) => id !== item.id)
                : [...old.sv, item.id],
            }))
          }
          className="mt-5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-bg"
        >
          {s.sv.includes(item.id) ? 'Remove bookmark' : 'Bookmark title'}
        </button>
      </Sheet>
    );
  if (!item.contentUrl) return <Reader item={item} onClose={onClose} />;
  if (!book)
    return (
      <Sheet open onClose={onClose} title="Opening book">
        <h3 className="font-serif text-xl">{item.t}</h3>
        <output aria-live="polite" className="my-4 text-sm">
          {error || 'Loading the chapters…'}
        </output>
        {error && (
          <button
            className="rounded-full bg-ink px-4 py-3 text-bg"
            onClick={() => {
              setError('');
              void loadBook(item)
                .then(setBook)
                .catch((e) => setError(e.message));
            }}
          >
            Try again
          </button>
        )}
      </Sheet>
    );
  const index = requested.includes('~')
      ? sectionNumber(requested)
      : sectionNumber(
          Object.keys(s.pos)
            .filter((id) => baseId(id) === item.id)
            .at(-1) ?? requested,
        ),
    part = bookSection(item, book, index);
  return (
    <Reader
      key={part.id}
      item={part}
      onClose={onClose}
      bookNavigation={{
        sections: book.sections.map((part) => part.title),
        index: part.sectionIndex!,
        choose: (index) => onChoose(`${item.id}~${index}`),
      }}
    />
  );
}
