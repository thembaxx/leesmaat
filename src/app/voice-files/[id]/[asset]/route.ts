import { fetchPublicSource } from '@/lib/upstream';
import { VOICES } from '@/lib/voices';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; asset: string }> },
) {
  const { id, asset } = await params;
  const voice = VOICES.find((voice) => voice.id === id);
  const file = voice?.files.find((file) =>
    new URL(file.url, 'https://leesmaat.local').pathname.endsWith('/' + asset),
  );
  const version = new URL(request.url).searchParams.get('v');
  if (!file?.remote || (version && version !== file.sha256))
    return new Response('Voice file not found', { status: 404 });
  try {
    const upstream = await fetchPublicSource(file.remote, {
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(120000)]),
      cache: 'no-store',
    });
    if (!upstream.ok || !upstream.body)
      return new Response('Voice provider unavailable. Try again later.', { status: 502 });
    return new Response(upstream.body, {
      headers: {
        'Content-Type': asset === 'config' ? 'application/json' : 'application/octet-stream',
        'Content-Length': String(file.bytes),
        'Cache-Control': version ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Voice provider unavailable. Try again later.', { status: 502 });
  }
}
