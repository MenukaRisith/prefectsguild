import { siteConfig } from "@/lib/constants";
import type { SiteIdentity } from "@/lib/system-settings";

export function PublicFooter({ siteIdentity }: { siteIdentity?: SiteIdentity }) {
  const identity = siteIdentity ?? {
    schoolName: siteConfig.name,
    shortName: siteConfig.shortName,
    motto: siteConfig.motto,
    footerLabel: siteConfig.footerLabel,
    supportWhatsappNumber: siteConfig.supportWhatsappNumber,
    supportWhatsappHref: siteConfig.supportWhatsappHref,
  };

  return (
    <footer className="border-t border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{identity.schoolName}</p>
          <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-primary/85">
            {identity.motto}
          </p>
        </div>
        <p className="tracking-[0.16em] uppercase">{identity.footerLabel}</p>
      </div>
    </footer>
  );
}
