import { BrandMark } from "@/components/brand-mark";
import { ResetPasswordForm } from "@/components/forms/auth-forms";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16">
      <div className="w-full space-y-8">
        <BrandMark />
        <ResetPasswordForm token={params.token} />
      </div>
    </main>
  );
}
