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
    <footer className="px-4 pb-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-[1.8rem] border border-border/70 bg-background/82 px-5 py-8 text-sm text-muted-foreground backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{identity.schoolName}</p>
          <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-primary/85">
            {identity.motto}
          </p>
        </div>
        <div className="space-y-1 md:text-right">
          <p className="tracking-[0.16em] uppercase">{identity.footerLabel}</p>
          <a
            href={identity.supportWhatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex font-medium text-primary underline-offset-4 hover:underline"
          >
            Support on WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
