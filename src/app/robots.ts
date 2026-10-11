import type { MetadataRoute } from 'next';
import { SITE_URL, publicUrl } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/?read=', '/?tab=', '/api/'] },
    ...(SITE_URL ? { sitemap: publicUrl('/sitemap.xml') } : {}),
  };
}
