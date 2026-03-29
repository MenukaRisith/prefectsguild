import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";
import type { SiteIdentity } from "@/lib/system-settings";

export function BrandMark({
  className,
  compact = false,
  siteIdentity,
}: {
  className?: string;
  compact?: boolean;
  siteIdentity?: SiteIdentity;
}) {
  const identity = siteIdentity ?? {
    schoolName: siteConfig.name,
    shortName: siteConfig.shortName,
    motto: siteConfig.motto,
    footerLabel: siteConfig.footerLabel,
    supportWhatsappNumber: siteConfig.supportWhatsappNumber,
    supportWhatsappHref: siteConfig.supportWhatsappHref,
  };

  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <div className="flex size-12 items-center justify-center overflow-hidden rounded-[1rem] border border-border/70 bg-card/90 shadow-[0_16px_30px_-24px_color-mix(in_srgb,var(--primary)_60%,transparent)]">
        <Image
          src="/logo.png"
          alt="Kekirawa Central College Prefects Guild logo"
          width={48}
          height={48}
          className="size-full object-contain"
          priority
        />
      </div>
      <div className={cn("space-y-0.5", compact && "hidden sm:block")}>
        <p className="max-w-[16rem] text-xs uppercase tracking-[0.2em] text-muted-foreground sm:max-w-[20rem]">
          {identity.schoolName}
        </p>
        <p className="font-heading text-lg font-semibold tracking-tight">
          {identity.shortName}
        </p>
        {!compact ? (
          <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-primary/85">
            {identity.motto}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
