"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error); // visible in browser dev tools only; users never see internals
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-blush-50 px-4 text-center">
      <h1 className="text-5xl font-semibold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted">
        Sorry about that. Please try again, and if it keeps happening, contact us.
      </p>
      {error.digest && <p className="mt-2 text-xs text-muted">Reference: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-rose-500 px-6 py-2.5 font-medium text-white transition hover:bg-rose-600"
      >
        Try again
      </button>
    </main>
  );
}

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-4">
      <div className="h-9 w-48 rounded-xl bg-blush-100" />
      <div className="h-64 rounded-card bg-blush-100" />
    </div>
  );
}

