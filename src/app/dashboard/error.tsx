"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Dashboard route error", error);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Dashboard fallback
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
          This page hit a temporary issue.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Reload this section first. The rest of the account and session should stay intact.
        </p>
        <div className="mt-6">
          <Button type="button" onClick={reset} className="rounded-full">
            Reload page
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-4 text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
