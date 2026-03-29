import Link from "next/link";
import { ArrowRight, CalendarDays, QrCode, ShieldCheck, UserRoundCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { publicHighlights, siteConfig } from "@/lib/constants";
import { PublicFooter } from "@/components/layout/public-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Role-safe management",
    description:
      "Teachers, admins, super admins, and prefects each get a focused workspace with the right controls.",
  },
  {
    icon: QrCode,
    title: "QR attendance",
    description:
      "Verified prefects receive a printable QR pass and the school kiosk records attendance instantly.",
  },
  {
    icon: CalendarDays,
    title: "Tasks and reminders",
    description:
      "Assignments, calendar events, and email-backed reminders stay visible across the guild.",
  },
  {
    icon: UserRoundCheck,
    title: "Verification workflow",
    description:
      "New prefects register once, then wait in a restricted dashboard until the guild office verifies them.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="surface-grid relative overflow-hidden">
          <div className="mx-auto grid min-h-[70vh] w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
            <div className="relative z-10 space-y-8">
              <div className="inline-flex rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
                Professional prefect operations
              </div>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.26em] text-primary/80">
                  {siteConfig.name}
                </p>
                <h1 className="max-w-4xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Minimal, modern control for attendance, duties, and prefect coordination.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  A self-hosted management system built for guild verification, QR-based school attendance, duty assignment, reminders, and role-aware dashboards.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? "Open dashboard" : "Register as prefect"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                  <Link href="/scan">Open school scanner</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {publicHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-border/70 bg-card/75 px-4 py-4 text-sm leading-6 text-muted-foreground shadow-sm backdrop-blur"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-card/85 shadow-2xl shadow-primary/10">
              <CardHeader className="border-b border-border/70 pb-6">
                <CardTitle className="font-heading text-2xl">Operational snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;

                  return (
                    <div
                      key={pillar.title}
                      className="rounded-3xl border border-border/60 bg-background/70 p-5"
                    >
                      <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Icon className="size-5" />
                      </div>
                      <h2 className="font-heading text-xl font-semibold">{pillar.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {pillar.description}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/80">
              Built for guild execution
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Every core prefect workflow in one clean system.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="rounded-[2rem] border-border/70">
                <CardContent className="p-6">
                  <h3 className="font-heading text-2xl font-semibold">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
