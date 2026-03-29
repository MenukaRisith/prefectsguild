import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants";
import type { SiteIdentity } from "@/lib/system-settings";

export function SiteHeader({ siteIdentity }: { siteIdentity?: SiteIdentity }) {
  const identity = siteIdentity ?? {
    schoolName: siteConfig.name,
    shortName: siteConfig.shortName,
    motto: siteConfig.motto,
    footerLabel: siteConfig.footerLabel,
    supportWhatsappNumber: siteConfig.supportWhatsappNumber,
    supportWhatsappHref: siteConfig.supportWhatsappHref,
  };

  return (
    <header className="sticky top-0 z-30 px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[1.85rem] border border-border/70 bg-background/84 px-4 py-4 shadow-[0_18px_40px_-32px_color-mix(in_srgb,var(--primary)_45%,transparent)] backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-4">
          <BrandMark siteIdentity={identity} guildOnly />
          <Badge
            variant="secondary"
            className="hidden rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-primary lg:inline-flex"
          >
            {identity.motto}
          </Badge>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="#features" className="transition hover:text-foreground">
            Overview
          </Link>
          <Link href="#schedule" className="transition hover:text-foreground">
            Scanner windows
          </Link>
          <Link href="/scan" className="transition hover:text-foreground">
            School scanner
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
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
