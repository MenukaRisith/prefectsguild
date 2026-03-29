import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { getReminderCount } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireRole([Role.SUPER_ADMIN]);
  const reminderCount = await getReminderCount(user.id);

  return (
    <div>
      <DashboardHeader
        title="Settings"
        description="Operational notes, cron endpoints, storage, and deployment requirements for the self-hosted installation."
        reminderCount={reminderCount}
      />
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Runtime requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              The app expects a writable upload directory at <code>{env.UPLOAD_DIR}</code>.
            </p>
            <p>
              Daily attendance audits should call <code>/api/jobs/daily-audit</code> with the cron bearer secret.
            </p>
            <p>
              Reminder dispatch should call <code>/api/jobs/reminders</code> on a schedule.
            </p>
            <p>
              SMTP-backed reminders activate only when the email environment variables are populated.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Operational notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>Profile pictures are stored on the local filesystem and served through a protected file route.</p>
            <p>QR tokens are signed and can be invalidated by increasing each prefect pass token version.</p>
            <p>Attendance is limited to one accepted QR scan per prefect per day; later scans are logged as duplicates.</p>
            <p>Export the attendance CSV from the attendance page for reporting and archival.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
