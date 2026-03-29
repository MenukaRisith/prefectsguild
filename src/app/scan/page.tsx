import { BrandMark } from "@/components/brand-mark";
import { QrScanner } from "@/components/scanner/qr-scanner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAttendanceScanWindow } from "@/lib/attendance-windows";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const settings = await getSystemSettings();
  const windowState = getAttendanceScanWindow(settings);

  return (
    <main className="hero-orbit page-shell">
      <div className="page-shell-inner max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <Card className="motion-rise overflow-hidden rounded-[2.2rem] border-primary/16 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,white_8%)_0%,color-mix(in_srgb,var(--card)_88%,var(--accent)_12%)_56%,color-mix(in_srgb,var(--card)_84%,var(--primary)_16%)_100%)]">
          <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.08fr_0.92fr] lg:p-8">
            <div className="space-y-5">
              <BrandMark siteIdentity={settings} />
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-primary"
                >
                  {settings.motto}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[0.68rem] tracking-[0.22em]"
                >
                  Weekday scanner
                </Badge>
              </div>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                  School attendance kiosk
                </p>
                <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                  Arrival and leaving scans with one controlled kiosk.
                </h1>
                <p className="text-base leading-8 text-muted-foreground">
                  The scanner follows weekday-only windows, records entry in the morning, then switches to leaving mode in the afternoon. Super admins can adjust both times from settings.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.7rem] border border-primary/16 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_82%,black_18%)_0%,color-mix(in_srgb,var(--primary)_90%,var(--accent)_10%)_100%)] p-5 text-primary-foreground">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/68">
                  Live status
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold">
                  {windowState.activeWindowLabel}
                </p>
                <p className="mt-3 text-sm leading-7 text-primary-foreground/78">
                  {windowState.message}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Arrival
                  </p>
                  <p className="mt-3 font-heading text-2xl font-semibold">
                    {windowState.checkInLabel}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Leaving
                  </p>
                  <p className="mt-3 font-heading text-2xl font-semibold">
                    {windowState.checkOutLabel}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <QrScanner schedule={settings} />
        </div>
      </div>
    </main>
  );
}
