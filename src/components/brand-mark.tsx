import Link from "next/link";
import { Shield } from "lucide-react";
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
      <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-primary text-primary-foreground shadow-sm shadow-primary/10">
        <Shield className="size-5" />
      </div>
      <div className={cn("space-y-0.5", compact && "hidden sm:block")}>
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Kekirawa Central College
        </p>
        <p className="font-heading text-lg font-semibold tracking-tight">
          {siteConfig.shortName}
        </p>
      </div>
    </Link>
  );
}
