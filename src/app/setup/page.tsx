import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { SetupForm } from "@/components/forms/auth-forms";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const hasSuperAdmin = await db.user.count({
    where: { role: "SUPER_ADMIN" },
  });

  if (hasSuperAdmin > 0) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-16">
      <div className="grid w-full gap-12 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <BrandMark />
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/80">
              Initial platform setup
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Create the first super admin account.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              This step is available only once. After setup, all teacher and admin accounts are created from inside the dashboard by the super admin.
            </p>
          </div>
        </div>
        <SetupForm />
      </div>
    </main>
  );
}
