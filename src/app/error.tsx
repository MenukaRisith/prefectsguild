"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global application error", error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-[1.5rem] border border-border/70 bg-card/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              System stability guard
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
              Something went wrong, but the system stayed online.
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Retry this screen first. If the same issue keeps happening, go back to the login page
              and try again.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={reset} className="rounded-full">
                Retry
              </Button>
              <Button asChild type="button" variant="outline" className="rounded-full">
                <Link href="/login">Back to login</Link>
              </Button>
            </div>
            {error.digest ? (
              <p className="mt-4 text-xs text-muted-foreground">Reference: {error.digest}</p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
