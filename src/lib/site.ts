export function parseSiteOrigin(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const url = new URL(value.trim());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.',
    );
  }
  return url.origin;
}
export const SITE_URL = parseSiteOrigin(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leesmaat.vercel.app',
);
export const siteTitle = 'Leesmaat — English & Afrikaans reading companion';
export const description =
  'Build English and Afrikaans reading confidence with books, poems, South African NSC literature, read-aloud voices, dictionary definitions and offline study.';
export const publicUrl = (path: string) => (SITE_URL ? new URL(path, SITE_URL).href : path);

export function siteSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Leesmaat',
        description,
        inLanguage: ['en-ZA', 'af-ZA'],
        ...(SITE_URL ? { '@id': publicUrl('/#website'), url: publicUrl('/') } : {}),
      },
      {
        '@type': 'WebApplication',
        name: 'Leesmaat',
        description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web browser',
        inLanguage: ['en-ZA', 'af-ZA'],
        featureList: [
          'English and Afrikaans reading',
          'Attributed public library',
          'Downloadable read-aloud voices',
          'Dictionary definitions',
          'Offline reading and study',
        ],
        ...(SITE_URL ? { '@id': publicUrl('/#application'), url: publicUrl('/') } : {}),
      },
    ],
  };
}
