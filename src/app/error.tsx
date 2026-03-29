"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-xl space-y-4 rounded-[2rem] border border-border/70 bg-card p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-primary/80">System error</p>
          <h1 className="font-heading text-3xl font-semibold">Something interrupted the workflow.</h1>
          <p className="text-sm leading-7 text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
          <Button onClick={() => reset()} className="rounded-full">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
