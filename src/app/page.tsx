import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { publicHighlights, siteConfig } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const commandLanes = [
  {
    icon: ShieldCheck,
    title: "Controlled verification",
    description:
      "New prefects register once, move into a restricted workspace, and only unlock full access after staff approval.",
  },
  {
    icon: QrCode,
    title: "Attendance without guesswork",
    description:
      "Signed QR passes, kiosk scanning, duplicate protection, and absence follow-up keep the school day accountable.",
  },
  {
    icon: CalendarDays,
    title: "Clear duty execution",
    description:
      "Teachers and super admins manage duty locations while admins coordinate task deadlines, reminders, and schedules.",
  },
  {
    icon: UserRoundCheck,
    title: "One system for every role",
    description:
      "Prefects, teachers, admins, and super admins each get a precise workspace with only the controls they need.",
  },
];

const attendanceFlow = [
  "Verify the prefect account and issue the printed QR pass.",
  "Scan the pass at the school kiosk to mark attendance with the exact time.",
  "If a prefect is absent, collect and review the reason before the warning stays active.",
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="hero-orbit border-b border-border/70">
          <div className="mx-auto grid min-h-[72vh] w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
            <div className="space-y-8 motion-rise">
              <div className="inline-flex rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.24em] text-primary">
                {siteConfig.motto}
              </div>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
                  {siteConfig.name}
                </p>
                <h1 className="max-w-4xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Professional prefect management with a cleaner command flow.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  Built for verification, QR attendance, duty coordination, reminders, and day-to-day guild control without the clutter of a generic dashboard template.
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
              <div className="grid gap-3 sm:grid-cols-3">
                {publicHighlights.map((item, index) => (
                  <div
                    key={item}
                    className={`rounded-[1.1rem] border border-border/70 bg-card/70 px-4 py-4 text-sm leading-6 text-muted-foreground motion-rise ${
                      index === 0
                        ? "motion-rise-delay-1"
                        : index === 1
                          ? "motion-rise-delay-2"
                          : "motion-rise-delay-3"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Card className="motion-rise motion-rise-delay-2">
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                  <div>
                    <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-primary/85">
                      Operational preview
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold">
                      Built around daily school execution.
                    </h2>
                  </div>
                  <div className="rounded-full border border-border/70 bg-muted/45 px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                    KCC
                  </div>
                </div>

                <div className="grid gap-4">
                  {commandLanes.slice(0, 3).map((lane) => {
                    const Icon = lane.icon;

                    return (
                      <div
                        key={lane.title}
                        className="rounded-[1.1rem] border border-border/70 bg-background/70 px-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <h3 className="font-heading text-lg font-semibold">{lane.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {lane.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground">
                      Roles
                    </p>
                    <p className="mt-2 text-lg font-semibold">4 workspaces</p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground">
                      Attendance
                    </p>
                    <p className="mt-2 text-lg font-semibold">QR + audit ready</p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground">
                      Operations
                    </p>
                    <p className="mt-2 text-lg font-semibold">Duties and reminders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="section-rule mb-10 max-w-2xl motion-rise">
            <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
              Platform lanes
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              One disciplined system for prefect coordination.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {commandLanes.map((lane, index) => {
              const Icon = lane.icon;

              return (
                <Card
                  key={lane.title}
                  className={`motion-rise ${
                    index % 2 === 0 ? "motion-rise-delay-1" : "motion-rise-delay-2"
                  }`}
                >
                  <CardContent className="space-y-4">
                    <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-2xl font-semibold">{lane.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {lane.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="attendance" className="border-y border-border/70 bg-muted/20">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-20">
            <div className="section-rule motion-rise">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                Attendance flow
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                From printed pass to reviewed absence reason.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">
                The platform is designed for real school routines: fast scanning at the gate, reliable attendance records, and clear accountability when someone is absent.
              </p>
            </div>
            <div className="grid gap-4">
              {attendanceFlow.map((step, index) => (
                <div
                  key={step}
                  className={`rounded-[1.1rem] border border-border/70 bg-card/75 px-5 py-5 motion-rise ${
                    index === 0
                      ? "motion-rise-delay-1"
                      : index === 1
                        ? "motion-rise-delay-2"
                        : "motion-rise-delay-3"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
