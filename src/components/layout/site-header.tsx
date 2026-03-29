import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <BrandMark />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="#features" className="transition hover:text-foreground">
            Features
          </Link>
          <Link href="#attendance" className="transition hover:text-foreground">
            Attendance
          </Link>
          <Link href="/scan" className="transition hover:text-foreground">
            School scanner
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
