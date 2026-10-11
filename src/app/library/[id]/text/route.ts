import { LIBRARY } from '@/lib/data';
export const dynamic = 'force-static';
export function generateStaticParams() {
  return LIBRARY.map(({ id }) => ({ id }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = LIBRARY.find((entry) => entry.id === id);
  if (!item) return new Response('Title not found', { status: 404 });
  const text = `# ${item.t}\n\n${item.a} · ${item.g === 'af' ? 'Afrikaans' : 'English'} · ${item.k}\n\nRights: ${item.rights}\n${item.rights === 'Original study note' ? 'Original companion notes, not the full setwork.\n' : ''}\n${item.x}\n\n${item.source ? `Curriculum: ${item.source}\n` : ''}${item.textSource ? `Full text: ${item.textSource}\n` : ''}`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
