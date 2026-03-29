"use client";

import { useActionState } from "react";
import { ActionFeedback } from "@/components/action-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import {
  formatMinutesAsTime,
  minutesToTimeInput,
} from "@/lib/attendance-windows";
import {
  updatePlatformSettingsAction,
  updateSmtpSettingsAction,
} from "@/lib/actions/dashboard-actions";
import type { EffectiveSystemSettings } from "@/lib/system-settings";

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

export function PlatformSettingsForm({
  settings,
}: {
  settings: EffectiveSystemSettings;
}) {
  const [state, action] = useActionState(
    updatePlatformSettingsAction,
    initialActionState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform settings</CardTitle>
        <CardDescription>
          Update the school identity, public links, support contact, and weekday scanner windows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ActionFeedback state={state} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-schoolName">School / platform name</Label>
            <Input id="settings-schoolName" name="schoolName" defaultValue={settings.schoolName} />
            <FieldError errors={state.errors} name="schoolName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-shortName">Short name</Label>
            <Input id="settings-shortName" name="shortName" defaultValue={settings.shortName} />
            <FieldError errors={state.errors} name="shortName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-motto">Motto</Label>
            <Input id="settings-motto" name="motto" defaultValue={settings.motto} />
            <FieldError errors={state.errors} name="motto" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-footerLabel">Footer label</Label>
            <Input
              id="settings-footerLabel"
              name="footerLabel"
              defaultValue={settings.footerLabel}
            />
            <FieldError errors={state.errors} name="footerLabel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-supportWhatsappNumber">Support WhatsApp</Label>
            <Input
              id="settings-supportWhatsappNumber"
              name="supportWhatsappNumber"
              defaultValue={settings.supportWhatsappNumber}
            />
            <FieldError errors={state.errors} name="supportWhatsappNumber" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-attendanceCheckInStartTime">Arrival starts</Label>
            <Input
              id="settings-attendanceCheckInStartTime"
              name="attendanceCheckInStartTime"
              type="time"
              defaultValue={minutesToTimeInput(settings.attendanceCheckInStartMinute)}
            />
            <FieldError errors={state.errors} name="attendanceCheckInStartTime" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-attendanceCheckInEndTime">Arrival ends</Label>
            <Input
              id="settings-attendanceCheckInEndTime"
              name="attendanceCheckInEndTime"
              type="time"
              defaultValue={minutesToTimeInput(settings.attendanceCheckInEndMinute)}
            />
            <FieldError errors={state.errors} name="attendanceCheckInEndTime" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-attendanceCheckOutStartTime">Leaving starts</Label>
            <Input
              id="settings-attendanceCheckOutStartTime"
              name="attendanceCheckOutStartTime"
              type="time"
              defaultValue={minutesToTimeInput(settings.attendanceCheckOutStartMinute)}
            />
            <FieldError errors={state.errors} name="attendanceCheckOutStartTime" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-attendanceCheckOutEndTime">Leaving ends</Label>
            <Input
              id="settings-attendanceCheckOutEndTime"
              name="attendanceCheckOutEndTime"
              type="time"
              defaultValue={minutesToTimeInput(settings.attendanceCheckOutEndMinute)}
            />
            <FieldError errors={state.errors} name="attendanceCheckOutEndTime" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="settings-appUrl">Public app URL</Label>
            <Input id="settings-appUrl" name="appUrl" type="url" defaultValue={settings.appUrl} />
            <p className="text-xs leading-5 text-muted-foreground">
              Password reset links, public references, and secure-cookie fallback use this URL.
            </p>
            <FieldError errors={state.errors} name="appUrl" />
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-muted/35 px-4 py-4 text-sm text-muted-foreground lg:col-span-2">
            <p className="font-medium text-foreground">Weekday scanner schedule</p>
            <p className="mt-2 leading-6">
              Arrival window: {formatMinutesAsTime(settings.attendanceCheckInStartMinute)} to{" "}
              {formatMinutesAsTime(settings.attendanceCheckInEndMinute)}. Leaving window:{" "}
              {formatMinutesAsTime(settings.attendanceCheckOutStartMinute)} to{" "}
              {formatMinutesAsTime(settings.attendanceCheckOutEndMinute)}.
            </p>
            <p className="mt-2 text-xs leading-5">
              The scanner accepts QR scans Monday to Friday only. Outside these windows it stays read-only and shows the next valid session.
            </p>
          </div>
          <div className="lg:col-span-2">
            <SubmitButton className="rounded-full" pendingLabel="Saving platform settings...">
              Save platform settings
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SmtpSettingsForm({
  settings,
}: {
  settings: EffectiveSystemSettings;
}) {
  const [state, action] = useActionState(updateSmtpSettingsAction, initialActionState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email delivery</CardTitle>
        <CardDescription>
          Use dashboard-managed SMTP or fall back to the server environment configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ActionFeedback state={state} />
          </div>
          <div className="lg:col-span-2 rounded-[1rem] border border-border/70 bg-muted/35 px-4 py-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="useCustomSmtp"
                defaultChecked={settings.useCustomSmtp}
                className="mt-1 size-4 rounded border-border accent-[var(--primary)]"
              />
              <span className="space-y-1">
                <span className="block font-medium text-foreground">Use dashboard-managed SMTP</span>
                <span className="block text-sm leading-6 text-muted-foreground">
                  Leave this off to use the deployment environment values instead.
                </span>
              </span>
            </label>
          </div>
          <input
            type="hidden"
            name="existingPasswordConfigured"
            value={settings.smtpPasswordConfigured ? "true" : "false"}
          />
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP host</Label>
            <Input id="smtp-host" name="smtpHost" defaultValue={settings.useCustomSmtp ? settings.smtpHost : ""} />
            <FieldError errors={state.errors} name="smtpHost" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-port">SMTP port</Label>
            <Input
              id="smtp-port"
              name="smtpPort"
              type="number"
              min={1}
              max={65535}
              defaultValue={settings.smtpPort}
            />
            <FieldError errors={state.errors} name="smtpPort" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-user">SMTP username</Label>
            <Input id="smtp-user" name="smtpUser" defaultValue={settings.useCustomSmtp ? settings.smtpUser : ""} />
            <FieldError errors={state.errors} name="smtpUser" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-from">From address</Label>
            <Input id="smtp-from" name="smtpFrom" defaultValue={settings.useCustomSmtp ? settings.smtpFrom : ""} />
            <FieldError errors={state.errors} name="smtpFrom" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="smtp-pass">SMTP password</Label>
            <Input id="smtp-pass" name="smtpPass" type="password" placeholder={settings.smtpPasswordConfigured ? "Leave blank to keep the saved password" : "Enter SMTP password"} />
            <p className="text-xs leading-5 text-muted-foreground">
              {settings.smtpPasswordConfigured
                ? "A password is already stored. Leave this blank if it should stay unchanged."
                : "No saved SMTP password yet."}
            </p>
            <FieldError errors={state.errors} name="smtpPass" />
          </div>
          <div className="lg:col-span-2 rounded-[1rem] border border-border/70 bg-muted/35 px-4 py-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="smtpSecure"
                defaultChecked={settings.smtpSecure}
                className="mt-1 size-4 rounded border-border accent-[var(--primary)]"
              />
              <span className="space-y-1">
                <span className="block font-medium text-foreground">Use implicit TLS / secure SMTP</span>
                <span className="block text-sm leading-6 text-muted-foreground">
                  Turn this on for providers that expect secure SMTP from the first connection, commonly on port 465.
                </span>
              </span>
            </label>
          </div>
          <div className="lg:col-span-2">
            <SubmitButton className="rounded-full" pendingLabel="Saving email settings...">
              Save email settings
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
