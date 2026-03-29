import Image from "next/image";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReminderCount } from "@/lib/queries";
import { createQrDataUrl, signQrToken } from "@/lib/qr";
import { requireUser } from "@/lib/session";
import { ensureQrPassForUser } from "@/lib/workflows";

export const dynamic = "force-dynamic";

export default async function PassPage() {
  const user = await requireUser();
  const reminderCount = await getReminderCount(user.id);

  if (user.role !== Role.PREFECT) {
    return (
      <div>
        <DashboardHeader
          title="QR pass"
          description="QR passes are issued to active prefect accounts after verification."
          reminderCount={reminderCount}
        />
        <div className="px-4 py-6 md:px-8">
          <EmptyState
            title="No personal QR pass for this role"
            description="Use the attendance and reports pages to manage prefect QR activity."
          />
        </div>
      </div>
    );
  }

  if (user.status !== "ACTIVE") {
    return (
      <div>
        <DashboardHeader
          title="QR pass"
          description="Your pass becomes available once an admin verifies your prefect registration."
          reminderCount={reminderCount}
        />
        <div className="px-4 py-6 md:px-8">
          <EmptyState
            title="Verification still pending"
            description="Your printable pass and QR code will be generated as soon as your account is verified."
          />
        </div>
      </div>
    );
  }

  const { qrPass } = await ensureQrPassForUser(user.id);
  const token = await signQrToken(user.id, {
    prefectId: qrPass.prefectIdentifier,
    tokenVersion: qrPass.tokenVersion,
  });
  const qrDataUrl = await createQrDataUrl(token);

  return (
    <div>
      <DashboardHeader
        title="QR pass"
        description="Download and print the QR pass used for school attendance scanning."
        reminderCount={reminderCount}
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="mx-auto max-w-3xl rounded-[2rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Prefect QR pass</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 p-6 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.25em] text-primary/80">
                {qrPass.prefectIdentifier}
              </p>
              <h2 className="font-heading text-3xl font-semibold">{user.fullName}</h2>
              <p className="text-base leading-7 text-muted-foreground">
                Print this pass and keep it ready for the school gate scanner. Duplicate scans on the same day are logged automatically.
              </p>
              <Button asChild size="lg" className="rounded-full">
                <a href="/api/pass/me" target="_blank" rel="noreferrer">
                  Download PDF pass
                </a>
              </Button>
            </div>
            <div className="rounded-[2rem] border border-border/70 bg-background/70 p-6 shadow-inner">
              <Image
                src={qrDataUrl}
                alt="Prefect QR code"
                width={320}
                height={320}
                unoptimized
                className="mx-auto w-full max-w-xs rounded-3xl"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
