import type { MetadataRoute } from 'next';
import { LIBRARY } from '@/lib/data';
import { SITE_URL, publicUrl } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_URL) return [];
  return ['/', '/library', ...LIBRARY.map((item) => `/library/${item.id}`)].map((path) => ({
    url: publicUrl(path),
  }));
}
