'use client';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="app-frame grid place-items-center p-8 text-center">
      <div>
        <Brand />
        <h1 className="mt-6 font-serif text-2xl">Let’s turn this page again.</h1>
        <p className="mt-3 text-sm text-mu">
          Something interrupted the app. Your saved reading stays on this device.
        </p>
        <button onClick={reset} className="mt-6 rounded-full bg-ink px-6 py-3 text-bg">
          Try again
        </button>
        <Link href="/" className="mt-4 block text-sm underline">
          Open Leesmaat
        </Link>
      </div>
    </main>
  );
}
