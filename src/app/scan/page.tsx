import { BrandMark } from "@/components/brand-mark";
import { QrScanner } from "@/components/scanner/qr-scanner";

export default function ScanPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <BrandMark />
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/80">
              School attendance kiosk
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Scan prefect QR passes as they arrive.
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              Use the camera-based kiosk at school gates or switch to a hardware scanner by pasting the token manually.
            </p>
          </div>
        </div>
      </div>
      <QrScanner />
    </main>
  );
}
