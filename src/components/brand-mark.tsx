import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
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
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Kekirawa Central College
        </p>
        <p className="font-heading text-lg font-semibold tracking-tight">
          {siteConfig.shortName}
        </p>
        {!compact ? (
          <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-primary/85">
            {siteConfig.motto}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
