"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useActionState } from "react";
import { ActionFeedback } from "@/components/action-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import {
  loginAction,
  registerPrefectAction,
  requestPasswordResetAction,
  resetPasswordAction,
  setupSuperAdminAction,
} from "@/lib/actions/auth-actions";
import { siteConfig } from "@/lib/constants";

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  const message = errors?.[name]?.[0];

  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>;
}

function NativeSelect({
  children,
  name,
  defaultValue,
}: {
  children: React.ReactNode;
  name: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="flex h-11 w-full rounded-xl border border-input bg-input/60 px-3.5 text-sm text-foreground outline-none transition focus:border-primary/35 focus:bg-background focus:ring-3 focus:ring-ring/20"
    >
      {children}
    </select>
  );
}

function IssueHelpLink() {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/45 px-4 py-3 text-sm text-muted-foreground">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <MessageCircle className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Need help with account access?</p>
          <p>
            Contact support on{" "}
            <a
              href={siteConfig.supportWhatsappHref}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              WhatsApp {siteConfig.supportWhatsappNumber}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export function SetupForm() {
  const [state, action] = useActionState(setupSuperAdminAction, initialActionState);

  return (
    <Card className="motion-rise">
      <CardHeader>
        <CardTitle>Create the first super admin</CardTitle>
        <CardDescription>
          This page is only available until the first super admin is created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionFeedback state={state} />
          <div className="space-y-2">
            <Label htmlFor="setup-fullName">Full name</Label>
            <Input id="setup-fullName" name="fullName" placeholder="Guild Administrator" />
            <FieldError errors={state.errors} name="fullName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-email">Email</Label>
            <Input id="setup-email" name="email" type="email" placeholder="admin@kccguild.edu" />
            <FieldError errors={state.errors} name="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-whatsapp">WhatsApp number</Label>
            <Input id="setup-whatsapp" name="whatsappNumber" placeholder="+94 7X XXX XXXX" />
            <FieldError errors={state.errors} name="whatsappNumber" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-password">Password</Label>
            <Input id="setup-password" name="password" type="password" placeholder="Create a strong password" />
            <FieldError errors={state.errors} name="password" />
          </div>
          <SubmitButton className="w-full rounded-full" pendingLabel="Creating account...">
            Create super admin
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialActionState);

  return (
    <Card className="motion-rise motion-rise-delay-1">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Access prefect, teacher, admin, and super admin dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <ActionFeedback state={state} />
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" name="email" type="email" placeholder="name@example.com" />
            <FieldError errors={state.errors} name="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" name="password" type="password" placeholder="Enter your password" />
            <FieldError errors={state.errors} name="password" />
          </div>
          <SubmitButton className="w-full rounded-full" pendingLabel="Signing in...">
            Sign in
          </SubmitButton>
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="transition hover:text-foreground">
              Forgot password?
            </Link>
            <Link href="/register" className="transition hover:text-foreground">
              New prefect registration
            </Link>
          </div>
          <IssueHelpLink />
        </form>
      </CardContent>
    </Card>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerPrefectAction, initialActionState);

  return (
    <Card className="motion-rise motion-rise-delay-1">
      <CardHeader>
        <CardTitle>Prefect registration</CardTitle>
        <CardDescription>
          Register once. Your dashboard becomes fully active after admin verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <ActionFeedback state={state} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-fullName">Full name</Label>
            <Input id="register-fullName" name="fullName" placeholder="Full legal name" />
            <FieldError errors={state.errors} name="fullName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-displayName">Display name</Label>
            <Input id="register-displayName" name="displayName" placeholder="Preferred name" />
            <FieldError errors={state.errors} name="displayName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input id="register-email" name="email" type="email" placeholder="school-prefect@example.com" />
            <FieldError errors={state.errors} name="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <Input id="register-password" name="password" type="password" placeholder="Create a secure password" />
            <FieldError errors={state.errors} name="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-grade">Grade</Label>
            <NativeSelect name="grade" defaultValue="11">
              {[6, 7, 8, 9, 10, 11, 12, 13].map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={state.errors} name="grade" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-section">Section / class</Label>
            <Input id="register-section" name="section" placeholder="A / Science / Commerce" />
            <FieldError errors={state.errors} name="section" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-appointedYear">Year appointed</Label>
            <Input
              id="register-appointedYear"
              name="appointedYear"
              type="number"
              defaultValue={new Date().getFullYear()}
            />
            <FieldError errors={state.errors} name="appointedYear" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-whatsappNumber">WhatsApp number</Label>
            <Input id="register-whatsappNumber" name="whatsappNumber" placeholder="+94 7X XXX XXXX" />
            <FieldError errors={state.errors} name="whatsappNumber" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="register-profileImage">Profile picture</Label>
            <Input id="register-profileImage" name="profileImage" type="file" accept="image/png,image/jpeg,image/webp" />
            <p className="text-xs leading-5 text-muted-foreground">
              Upload a clear headshot. It will be stored on the school server and used for your profile and pass.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="register-bio">Short note</Label>
            <Textarea
              id="register-bio"
              name="bio"
              placeholder="Add anything useful for the admin verification team."
            />
            <FieldError errors={state.errors} name="bio" />
          </div>
          <div className="md:col-span-2">
            <IssueHelpLink />
          </div>
          <div className="md:col-span-2">
            <SubmitButton className="w-full rounded-full" pendingLabel="Submitting registration...">
              Submit registration
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initialActionState);

  return (
    <Card className="motion-rise">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>We&apos;ll email a reset link if your account exists.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionFeedback state={state} />
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" name="email" type="email" placeholder="name@example.com" />
            <FieldError errors={state.errors} name="email" />
          </div>
          <SubmitButton className="w-full rounded-full" pendingLabel="Sending link...">
            Send reset link
          </SubmitButton>
          <Button asChild variant="ghost" className="w-full rounded-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const [state, action] = useActionState(resetPasswordAction, initialActionState);

  return (
    <Card className="motion-rise">
      <CardHeader>
        <CardTitle>Create a new password</CardTitle>
        <CardDescription>Use a strong password you do not reuse elsewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionFeedback state={state} />
          <input type="hidden" name="token" value={token ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input id="reset-password" name="password" type="password" placeholder="New secure password" />
            <FieldError errors={state.errors} name="password" />
          </div>
          <SubmitButton className="w-full rounded-full" pendingLabel="Resetting password...">
            Reset password
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
