const configured = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_URL = configured ? new URL(configured).origin : undefined;
export const description =
  'Build reading confidence in English and Afrikaans. Explore books, poems, short stories and articles and South African NSC literature, with downloadable reading voices, real definitions, automatic study and offline reading.';
export const publicUrl = (path: string) => (SITE_URL ? new URL(path, SITE_URL).href : path);
