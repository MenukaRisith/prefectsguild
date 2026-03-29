import { BrandMark } from "@/components/brand-mark";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-16 sm:px-6">
      <div className="w-full space-y-8">
        <BrandMark />
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
