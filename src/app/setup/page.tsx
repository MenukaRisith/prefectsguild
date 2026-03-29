import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { SetupForm } from "@/components/forms/auth-forms";
import { db } from "@/lib/db";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const [hasSuperAdmin, settings] = await Promise.all([
    db.user.count({
      where: { role: "SUPER_ADMIN" },
    }),
    getSystemSettings(),
  ]);

  if (hasSuperAdmin > 0) {
    redirect("/login");
  }

  return (
    <main className="hero-orbit page-shell">
      <div className="page-shell-inner flex min-h-screen max-w-7xl items-center px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.88fr] lg:items-center">
          <div className="space-y-8 motion-rise">
            <BrandMark siteIdentity={settings} />
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.24em] text-primary">
                {settings.motto}
              </div>
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                Initial platform setup
              </p>
              <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                Create the first super admin account.
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground">
                This step is available only once. After setup, all teacher and admin accounts are created from inside the dashboard by the super admin.
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-border/70 bg-card/70 px-4 py-4 motion-rise motion-rise-delay-1">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Once this account exists, further staff management moves inside the secure guild dashboard.
                </p>
              </div>
            </div>
          </div>
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
