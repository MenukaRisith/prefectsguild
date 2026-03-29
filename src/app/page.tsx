import Link from "next/link";
import { ArrowRight, CalendarDays, QrCode, ShieldCheck, Users } from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAttendanceScanWindow } from "@/lib/attendance-windows";
import { getCurrentUser } from "@/lib/session";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

const featureRows = [
  {
    icon: ShieldCheck,
    title: "Verified access lanes",
    description: "Prefects register once, then stay restricted until the guild office approves them.",
  },
  {
    icon: QrCode,
    title: "Timed QR attendance",
    description: "Weekday-only arrival and leaving windows keep the school kiosk strict and predictable.",
  },
  {
    icon: CalendarDays,
    title: "Operational command board",
    description: "Teachers, admins, and super admins see analytics, queues, and activity in role-specific dashboards.",
  },
];

const roleLanes = [
  {
    title: "Prefects",
    description: "Track duties, reminders, attendance, and upcoming events from one personal board.",
  },
  {
    title: "Teachers",
    description: "See attendance pressure, absence follow-up, and duty setup without hunting across modules.",
  },
  {
    title: "Admins",
    description: "Watch verification backlog, task pressure, scan quality, and audit activity in one workflow.",
  },
];

export default async function HomePage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSystemSettings(),
  ]);
  const windowState = getAttendanceScanWindow(settings);

  return (
    <div className="min-h-screen">
      <SiteHeader siteIdentity={settings} />
      <main className="hero-orbit w-full">
        <section id="features" className="mx-auto w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:pb-18">
          <Card className="overflow-hidden rounded-[2.25rem] border-primary/16 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,white_8%)_0%,color-mix(in_srgb,var(--card)_88%,var(--accent)_12%)_56%,color-mix(in_srgb,var(--card)_84%,var(--primary)_16%)_100%)]">
            <CardContent className="grid gap-10 p-6 lg:grid-cols-[1.08fr_0.92fr] lg:p-8">
              <div className="max-w-3xl space-y-6">
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
                    Institutional duty system
                  </Badge>
                </div>
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                    {settings.schoolName}
                  </p>
                  <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                    School attendance, duty control, and prefect operations in one ledger.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                    The platform now uses the same institutional dashboard language across public pages, scanner screens, and staff analytics so the whole system feels like one product.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link href={user ? "/dashboard" : "/register"}>
                      {user ? "Open dashboard" : "Register as prefect"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                    <Link href="/scan">Open school scanner</Link>
                  </Button>
                </div>
                <div className="grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                      Roles
                    </p>
                    <p className="mt-2 text-lg font-semibold">Prefects, teachers, admins</p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                      Arrival
                    </p>
                    <p className="mt-2 text-lg font-semibold">{windowState.checkInLabel}</p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                      Leaving
                    </p>
                    <p className="mt-2 text-lg font-semibold">{windowState.checkOutLabel}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.75rem] border border-primary/16 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_82%,black_18%)_0%,color-mix(in_srgb,var(--primary)_90%,var(--accent)_10%)_100%)] p-5 text-primary-foreground">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary-foreground/68">
                    Scanner status
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold">
                    {windowState.activeWindowLabel}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-primary-foreground/78">
                    {windowState.summaryLabel}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {featureRows.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-[1.35rem] border border-border/70 bg-background/80 p-4"
                      >
                        <div className="flex size-11 items-center justify-center rounded-[1rem] bg-secondary text-secondary-foreground">
                          <Icon className="size-4" />
                        </div>
                        <h2 className="mt-4 font-heading text-xl font-semibold">{item.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="schedule" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <Card className="rounded-[1.9rem] border-border/70">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Scanner discipline
                </p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Controlled windows for entry and exit.
                </h2>
                <p className="text-base leading-8 text-muted-foreground">
                  The kiosk works on weekdays only. Morning scans register arrival, and the afternoon window records leaving so staff can see the full school-day movement more clearly.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-[1.9rem] border-border/70">
                <CardContent className="space-y-3 p-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/80">
                    Arrival window
                  </p>
                  <p className="font-heading text-3xl font-semibold">{windowState.checkInLabel}</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    QR check-in is accepted only during the morning school-entry period.
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-[1.9rem] border-border/70">
                <CardContent className="space-y-3 p-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/80">
                    Leaving window
                  </p>
                  <p className="font-heading text-3xl font-semibold">{windowState.checkOutLabel}</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Afternoon scans mark the supervised leaving record before the prefect exits campus.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="grid gap-4 md:grid-cols-3">
            {roleLanes.map((lane) => (
              <Card key={lane.title} className="rounded-[1.85rem] border-border/70">
                <CardContent className="space-y-3 p-6">
                  <div className="flex size-11 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                    <Users className="size-4" />
                  </div>
                  <h2 className="font-heading text-2xl font-semibold">{lane.title}</h2>
                  <p className="text-sm leading-7 text-muted-foreground">{lane.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter siteIdentity={settings} />
    </div>
  );
}
