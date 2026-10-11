import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import { App } from '@/components/App';

export const metadata: Metadata = { ...(SITE_URL ? { alternates: { canonical: SITE_URL } } : {}) };

export default function Page() {
  return <App />;
}
