import { Role } from "@prisma/client";
import {
  PlatformSettingsForm,
  SmtpSettingsForm,
} from "@/components/forms/settings-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { getReminderCount } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireRole([Role.SUPER_ADMIN]);
  const [reminderCount, settings] = await Promise.all([
    getReminderCount(user.id),
    getSystemSettings(),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Settings"
        description="Manage live platform details, support contact, and SMTP delivery without touching the deployment for every small change."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Email mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={settings.smtpConfigured ? "ACTIVE" : "PENDING"} />
                <StatusBadge value={settings.useCustomSmtp ? "CUSTOM" : "STAFF_ONLY"} />
              </div>
              <p>
                {settings.useCustomSmtp
                  ? "Email delivery is using the SMTP values saved from this dashboard."
                  : "Email delivery is currently falling back to the deployment environment values."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="break-all text-foreground">{settings.appUrl}</p>
              <p>Password reset emails and public-facing links use this address.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Upload directory: <code>{settings.uploadDir}</code>
              </p>
              <p>Profile pictures and generated files continue to use the server-mounted storage path.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
          <PlatformSettingsForm settings={settings} />
          <SmtpSettingsForm settings={settings} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deployment-managed items</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-7 text-muted-foreground md:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Environment-only secrets</p>
              <p>Database URL, auth secret, QR signing secret, and cron secret stay on the server for safety.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Scheduled jobs</p>
              <p>
                Daily attendance audit: <code>/api/jobs/daily-audit</code>
              </p>
              <p>
                Reminder dispatch: <code>/api/jobs/reminders</code>
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Fallback environment URL</p>
              <p>{env.APP_URL}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Server-managed upload path</p>
              <p>{env.UPLOAD_DIR}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
