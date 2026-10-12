import { LIBRARY, type Item, type BookContent } from './data';
const inFlight = new Map<string, Promise<BookContent>>();
export const baseId = (id: string) => id.split('~')[0]!;
export const sectionNumber = (id: string) => {
  const value = Number(id.split('~')[1] ?? 0);
  return Number.isInteger(value) && value >= 0 ? value : 0;
};
export async function loadBook(item: Item): Promise<BookContent> {
  if (item.book) return item.book;
  if (!item.contentUrl) throw new Error('This title has no downloadable reading text.');
  if (!inFlight.has(item.id))
    inFlight.set(
      item.id,
      (async () => {
        const response = await fetch(item.contentUrl!);
        if (!response.ok)
          throw new Error('The book could not load. Reconnect or open a downloaded copy.');
        const bytes = await response.arrayBuffer();
        if (item.contentHash) {
          const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
            .map((value) => value.toString(16).padStart(2, '0'))
            .join('');
          if (hash !== item.contentHash)
            throw new Error('The book files changed. Update the app and try again.');
        }
        const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
        if (
          !payload ||
          typeof payload !== 'object' ||
          !('sections' in payload) ||
          !Array.isArray(payload.sections) ||
          !payload.sections.length ||
          !payload.sections.every(
            (part) =>
              part && typeof part.title === 'string' && typeof part.x === 'string' && part.x.trim(),
          )
        )
          throw new Error('The book file is incomplete.');
        return payload as BookContent;
      })().catch((error) => {
        inFlight.delete(item.id);
        throw error;
      }),
    );
  return inFlight.get(item.id)!;
}
export async function completeDownload(item: Item): Promise<Item> {
  const id = item.bookId ?? item.id;
  const parent = LIBRARY.find((entry) => entry.id === id) ?? item;
  return parent.contentUrl
    ? { ...parent, book: await loadBook(item.book ? { ...parent, book: item.book } : parent) }
    : item;
}
export function bookSection(parent: Item, book: BookContent, index: number): Item {
  const bounded = Math.max(0, Math.min(index, book.sections.length - 1)),
    part = book.sections[bounded]!;
  return {
    ...parent,
    id: `${parent.id}~${bounded}`,
    bookId: parent.id,
    sectionIndex: bounded,
    sectionTitle: part.title,
    book,
    x: part.x,
    a: part.author ?? parent.a,
    m: Math.max(1, Math.ceil(part.x.split(/\s+/).length / 180)),
  };
}
