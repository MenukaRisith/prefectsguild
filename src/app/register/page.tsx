import { Clock3, ShieldCheck, Upload } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/forms/auth-forms";
import { siteConfig } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const registrationNotes = [
  {
    icon: Upload,
    label: "Submit your profile",
    description: "Add your personal details, WhatsApp contact, and profile picture in one registration flow.",
  },
  {
    icon: Clock3,
    label: "Wait for verification",
    description: "Your dashboard stays restricted until an admin confirms your prefect record and activates the account.",
  },
  {
    icon: ShieldCheck,
    label: "Receive your pass",
    description: "After approval, the system issues your prefect ID, QR pass, and full guild access.",
  },
];

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="hero-orbit mx-auto min-h-screen w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <div className="space-y-8 motion-rise">
          <BrandMark />
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.24em] text-primary">
              {siteConfig.motto}
            </div>
            <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
              New prefect onboarding
            </p>
            <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Register once, then move through verification with a clear next step.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              Profile pictures stay on the school server. Until verification is complete, your dashboard remains limited and your QR pass is not issued.
            </p>
          </div>
          <div className="grid gap-4">
            {registrationNotes.map((item, index) => {
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
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-semibold">{item.label}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
