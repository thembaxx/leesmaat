import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LIBRARY, type BookContent } from '@/lib/data';
import { summaryText } from '@/lib/summaries';
export const dynamic = 'force-static';
export function generateStaticParams() {
  return LIBRARY.map(({ id }) => ({ id }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = LIBRARY.find((entry) => entry.id === id);
  if (!item) return new Response('Title not found', { status: 404 });
  const book: BookContent | null = item.contentUrl
    ? JSON.parse(await readFile(join(process.cwd(), 'public', item.contentUrl), 'utf8'))
    : null;
  const content = book
    ? book.sections.map((part) => `## ${part.title}\n\n${part.x}`).join('\n\n')
    : item.x;
  const text = `# ${item.t}\n\n${item.a} · ${item.g === 'af' ? 'Afrikaans' : 'English'} · ${item.k}\n\nRights: ${item.rights}\n${item.editionNote ?? ''}\n${item.rights === 'Catalogue metadata' ? 'Catalogue record; reading text is available from a publisher or library.\n' : ''}\n${book ? '' : summaryText(item)}${content}\n\n${item.source ? `Source: ${item.source}\n` : ''}${item.textSource ? `Text edition: ${item.textSource}\n` : ''}`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
