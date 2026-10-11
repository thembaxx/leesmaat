import Link from 'next/link';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ac" aria-label="Leesmaat">
      <svg aria-hidden="true" width="32" height="32" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 51C24 44 14 43 6 45V16c10-2 19 1 26 7 7-6 16-9 26-7v29c-8-2-18-1-26 6Z"
          fill="currentColor"
        />
        <path
          d="M32 24v22M12 22c6 0 11 2 15 5m10 0c4-3 9-5 15-5"
          stroke="var(--bg, #fbfaf7)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="m32 3 2.8 6.2L41 12l-6.2 2.8L32 21l-2.8-6.2L23 12l6.2-2.8L32 3Z"
          fill="currentColor"
        />
      </svg>
      {!compact && (
        <span className="font-serif text-xl font-semibold tracking-tight">
          leesmaat<span className="text-fl">.</span>
        </span>
      )}
    </span>
  );
}

export function AppLoading() {
  return (
    <main className="app-frame grid place-items-center p-8 text-center">
      <div className="animate-rise">
        <Brand />
        <h1 className="mt-7 font-serif text-2xl">
          A little reading.
          <br />A bigger world.
        </h1>
        <p className="mt-3 text-sm text-mu">
          Stories, poems and learning in English and Afrikaans.
        </p>
        <output className="mt-8 block text-xs text-mu">Opening your library…</output>
        <div
          aria-hidden="true"
          className="mx-auto mt-4 h-1 w-20 overflow-hidden rounded-full bg-ln"
        >
          <span className="loading-line block h-full w-1/2 rounded-full bg-ac" />
        </div>
        <Link href="/library" className="mt-8 inline-block text-sm text-ac underline">
          Explore the library
        </Link>
      </div>
    </main>
  );
}
