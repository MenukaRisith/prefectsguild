import { ArrowRight, ShieldCheck, QrCode, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/forms/auth-forms";
import { siteConfig } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const loginHighlights = [
  {
    icon: ShieldCheck,
    label: "Role-safe access",
    description: "Only the controls for your role appear after sign-in.",
  },
  {
    icon: QrCode,
    label: "Attendance ready",
    description: "Open QR passes, scan logs, and attendance follow-up from one workspace.",
  },
  {
    icon: Users,
    label: "Guild coordination",
    description: "Track prefect tasks, duties, reminders, and announcements without switching tools.",
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="hero-orbit mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-14 sm:px-6 lg:py-20">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.88fr] lg:items-center">
        <div className="space-y-8 motion-rise">
          <BrandMark />
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.24em] text-primary">
              {siteConfig.motto}
            </div>
            <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
              Dashboard access
            </p>
            <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Sign in to manage prefect operations with a cleaner workflow.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              One secure login opens attendance tracking, duty planning, QR pass printing, reminders, and administration for the Kekirawa Central College Prefects Guild.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {loginHighlights.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`rounded-[1.1rem] border border-border/70 bg-card/70 px-4 py-4 motion-rise ${
                    index === 0
                      ? "motion-rise-delay-1"
                      : index === 1
                        ? "motion-rise-delay-2"
                        : "motion-rise-delay-3"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Icon className="size-4" />
                    </div>
                    <p className="text-sm font-semibold">{item.label}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ArrowRight className="size-4" />
            Professional access for prefects, teachers, admins, and super admins.
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
