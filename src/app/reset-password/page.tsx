import { BrandMark } from "@/components/brand-mark";
import { ResetPasswordForm } from "@/components/forms/auth-forms";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [params, settings] = await Promise.all([
    searchParams,
    getSystemSettings(),
  ]);

  return (
    <main className="hero-orbit page-shell">
      <div className="page-shell-inner flex min-h-screen max-w-4xl items-center px-4 py-16 sm:px-6">
        <div className="w-full space-y-8">
          <div className="space-y-4 motion-rise">
            <BrandMark siteIdentity={settings} />
            <div className="inline-flex rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.24em] text-primary">
              {settings.motto}
            </div>
          </div>
          <ResetPasswordForm token={params.token} />
        </div>
      </div>
    </main>
  );
}
