import { BrandMark } from "@/components/brand-mark";
import { QrScanner } from "@/components/scanner/qr-scanner";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const settings = await getSystemSettings();

  return (
    <main className="hero-orbit page-shell">
      <div className="page-shell-inner max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4 motion-rise">
            <BrandMark siteIdentity={settings} />
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.24em] text-primary">
                {settings.motto}
              </div>
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                School attendance kiosk
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                Scan prefect QR passes.
              </h1>
              <p className="text-base leading-8 text-muted-foreground">
                Allow camera access once. The scanner starts automatically and stays ready for the next prefect.
              </p>
            </div>
          </div>
        </div>
        <QrScanner />
      </div>
    </main>
  );
}
