import { siteConfig } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>{siteConfig.name}</p>
        <p className="tracking-[0.16em] uppercase">{siteConfig.footerLabel}</p>
      </div>
    </footer>
  );
}
