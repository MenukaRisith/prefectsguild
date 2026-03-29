import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-16 sm:px-6">
      <div className="grid w-full gap-12 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <BrandMark />
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/80">
              Dashboard access
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Sign in to manage prefect operations.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              One secure login unlocks attendance tracking, duty planning, QR pass printing, reminders, and administration.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
