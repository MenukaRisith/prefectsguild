import Link from "next/link";
import { ArrowRight, CalendarDays, QrCode, ShieldCheck } from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

const featureRows = [
  {
    icon: ShieldCheck,
    title: "Verification",
    description: "New prefects register once and stay restricted until staff approval is complete.",
  },
  {
    icon: QrCode,
    title: "Attendance",
    description: "Verified prefects use printed QR passes for fast school entry and reliable daily logs.",
  },
  {
    icon: CalendarDays,
    title: "Duties and reminders",
    description: "Staff can assign work, publish events, and keep prefect responsibilities visible.",
  },
];

const steps = [
  "Register the prefect profile and verify it from the staff dashboard.",
  "Issue the QR pass and scan it at the gate to mark attendance.",
  "Review absence reasons and unresolved attendance warnings from the dashboard.",
];

export default async function HomePage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSystemSettings(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader siteIdentity={settings} />
      <main>
        <section id="features" className="border-b border-border/70">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:py-24">
            <div className="max-w-3xl space-y-6">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                {settings.schoolName}
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Attendance, duties, and prefect coordination in one place.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                A simple school management system for prefect registration, staff verification, QR attendance, duty assignments, reminders, and daily follow-up.
              </p>
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
                    Attendance
                  </p>
                  <p className="mt-2 text-lg font-semibold">QR scan with timestamps</p>
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                    Reminders
                  </p>
                  <p className="mt-2 text-lg font-semibold">Tasks, events, follow-up</p>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="space-y-5">
                <div className="border-b border-border/70 pb-4">
                  <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-primary/85">
                    {settings.motto}
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">
                    Daily workflow
                  </h2>
                </div>
                <div className="space-y-4">
                  {featureRows.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="flex items-start gap-4">
                        <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="attendance" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-xl space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                What the system handles
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Straightforward tools for school prefect operations.
              </h2>
              <p className="text-base leading-8 text-muted-foreground">
                The focus is clarity: one dashboard for staff, one clear workflow for prefects, and a simple attendance process at school entry points.
              </p>
            </div>
            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-[1rem] border border-border/70 bg-card/70 px-5 py-5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter siteIdentity={settings} />
    </div>
  );
}
