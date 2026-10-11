import base from '@/lib/manifest-base.json';
import { THEME_COLORS } from '@/lib/theme';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  const theme =
    new URL(request.url).searchParams.get('theme') ??
    request.headers.get('cookie')?.match(/(?:^|; )leesmaat-theme=([^;]+)/)?.[1];
  const color =
    theme === 'night'
      ? THEME_COLORS.night
      : theme === 'sepia'
        ? THEME_COLORS.sepia
        : THEME_COLORS.paper;
  return Response.json(
    { ...base, background_color: color, theme_color: color },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'private, no-store',
        Vary: 'Cookie',
      },
    },
  );
}
