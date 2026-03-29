import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl space-y-4 rounded-[2rem] border border-border/70 bg-card p-8 text-center shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-primary/80">404</p>
        <h1 className="font-heading text-3xl font-semibold">This page does not exist.</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          The requested route could not be found in the prefect management system.
        </p>
        <Button asChild className="rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
