import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-14">
      <div className="mb-10 space-y-6">
        <BrandMark />
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-primary/80">
            New prefect onboarding
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Register once, then wait for verification.
          </h1>
          <p className="text-base leading-8 text-muted-foreground">
            Your profile picture is stored locally on the server, and your dashboard stays restricted until an admin verifies your account and issues your QR pass.
          </p>
        </div>
      </div>
      <RegisterForm />
    </main>
  );
}
