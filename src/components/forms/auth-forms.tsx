"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ActionFeedback } from "@/components/action-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  loginAction,
  registerPrefectAction,
  requestPasswordResetAction,
  resetPasswordAction,
  setupSuperAdminAction,
} from "@/lib/actions/auth-actions";
import { initialActionState } from "@/lib/action-state";

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
      className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm shadow-sm outline-none ring-0 transition focus:border-ring"
    >
      {children}
    </select>
  );
}

export function SetupForm() {
  const [state, action] = useActionState(setupSuperAdminAction, initialActionState);

  return (
    <Card className="border-border/70 bg-card/80 shadow-xl shadow-primary/5">
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
    <Card className="border-border/70 bg-card/80 shadow-xl shadow-primary/5">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Access prefect, teacher, admin, and super admin dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/forgot-password" className="transition hover:text-foreground">
              Forgot password?
            </Link>
            <Link href="/register" className="transition hover:text-foreground">
              New prefect registration
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerPrefectAction, initialActionState);

  return (
    <Card className="border-border/70 bg-card/80 shadow-xl shadow-primary/5">
      <CardHeader>
        <CardTitle>Prefect registration</CardTitle>
        <CardDescription>
          Register once. Your dashboard becomes fully active after admin verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
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
            <Input id="register-appointedYear" name="appointedYear" type="number" defaultValue={new Date().getFullYear()} />
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
    <Card className="border-border/70 bg-card/80 shadow-xl shadow-primary/5">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          We’ll email a reset link if your account exists.
        </CardDescription>
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
    <Card className="border-border/70 bg-card/80 shadow-xl shadow-primary/5">
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
