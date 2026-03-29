import { AccountStatus, Role } from "@prisma/client";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/date";
import { getOverviewStats, getReminderCount, getVisibleAnnouncements } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const user = await requireUser();
  const [stats, reminders, announcements, reminderCount] = await Promise.all([
    getOverviewStats(user.id, user.role),
    db.reminder.findMany({
      where: {
        recipientId: user.id,
      },
      orderBy: {
        dueAt: "desc",
      },
      take: 5,
    }),
    getVisibleAnnouncements(user.role),
    getReminderCount(user.id),
  ]);

  const headline =
    user.role === Role.PREFECT
      ? "Your prefect dashboard"
      : "Guild operations dashboard";

  const description =
    user.role === Role.PREFECT
      ? "Track your tasks, attendance, absence requests, and QR pass status."
      : "Monitor registrations, attendance, duties, reminders, and announcements across the guild.";

  const hasPendingVerification = user.status === AccountStatus.PENDING_VERIFICATION;
  const attendanceWarning = reminders.find(
    (reminder) => reminder.title === "Attendance reason required",
  );

  return (
    <div>
      <DashboardHeader title={headline} description={description} reminderCount={reminderCount} />
      <div className="space-y-8 px-4 py-6 md:px-8">
        {hasPendingVerification ? (
          <Alert className="border-amber-500/30 bg-amber-500/8">
            <AlertTriangle className="size-4" />
            <AlertTitle>Verification pending</AlertTitle>
            <AlertDescription>
              Your prefect account is registered, but an admin still needs to verify it before QR attendance and assignments become active.
            </AlertDescription>
          </Alert>
        ) : null}

        {attendanceWarning ? (
          <Alert className="border-rose-500/30 bg-rose-500/8">
            <AlertTriangle className="size-4" />
            <AlertTitle>Attendance follow-up required</AlertTitle>
            <AlertDescription>{attendanceWarning.message}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <Card key={item.label} className="rounded-[1.75rem] border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-4xl font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Announcement center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.length === 0 ? (
                <EmptyState
                  title="No announcements yet"
                  description="Published guild updates will appear here."
                />
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="rounded-3xl border border-border/60 bg-background/70 p-5"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <StatusBadge value={announcement.audience} />
                      <span className="text-xs text-muted-foreground">
                        {formatDisplayDateTime(announcement.publishedAt)}
                      </span>
                    </div>
                    <h2 className="font-heading text-xl font-semibold">
                      {announcement.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {announcement.body}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      By {announcement.createdBy.fullName}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Live reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reminders.length === 0 ? (
                <EmptyState
                  title="No reminders"
                  description="Due tasks, events, and attendance follow-ups will surface here."
                />
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-3xl border border-border/60 bg-background/70 p-5"
                  >
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      {reminder.title.toLowerCase().includes("attendance") ? (
                        <AlertTriangle className="size-4 text-rose-500" />
                      ) : reminder.status === "SENT" ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <Clock3 className="size-4 text-sky-500" />
                      )}
                      <span>{formatDisplayDateTime(reminder.dueAt)}</span>
                    </div>
                    <h3 className="font-medium">{reminder.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {reminder.message}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
