import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/78 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <BrandMark />
          <div className="hidden rounded-full border border-border/70 bg-muted/45 px-3 py-1 text-[0.68rem] font-semibold tracking-[0.22em] text-primary lg:inline-flex">
            {siteConfig.motto}
          </div>
        </div>
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
