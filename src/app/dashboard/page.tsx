import { AccountStatus, Role } from "@prisma/client";
import { AlertTriangle, CheckCircle2, Clock3, QrCode, ScanLine } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/date";
import {
  getOverviewStats,
  getPrefectDashboardFeed,
  getReminderCount,
  getStaffDashboardFeed,
  getStaffOperationsSnapshot,
  getVisibleAnnouncements,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const user = await requireUser();
  const [stats, reminders, announcements, reminderCount, staffSnapshot, staffFeed, prefectFeed] =
    await Promise.all([
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
    user.role === Role.PREFECT ? null : getStaffOperationsSnapshot(),
    user.role === Role.PREFECT ? null : getStaffDashboardFeed(),
    user.role === Role.PREFECT ? getPrefectDashboardFeed(user.id) : null,
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
          {user.role === Role.PREFECT && prefectFeed ? (
            <Card className="rounded-[1.75rem] border-border/70">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Your next responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <QrCode className="size-4" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Attendance today
                    </p>
                    <p className="mt-2 font-medium">
                      {prefectFeed.attendanceToday ? "Marked present" : "Not yet scanned"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Open tasks
                    </p>
                    <p className="mt-2 font-medium">{prefectFeed.tasks.length}</p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Active duties
                    </p>
                    <p className="mt-2 font-medium">{prefectFeed.duties.length}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-medium">Priority tasks</h3>
                    {prefectFeed.tasks.length === 0 ? (
                      <EmptyState
                        title="No open tasks"
                        description="New assignments from admins will appear here."
                        className="min-h-32"
                      />
                    ) : (
                      prefectFeed.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-3xl border border-border/60 bg-background/70 p-4"
                        >
                          <div className="mb-2 flex flex-wrap gap-2">
                            <StatusBadge value={task.status} />
                            <StatusBadge value={task.priority} />
                          </div>
                          <p className="font-medium">{task.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {task.dueAt
                              ? formatDisplayDateTime(task.dueAt)
                              : "No due date set"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-medium">Duty and calendar preview</h3>
                    {prefectFeed.duties.length === 0 && prefectFeed.events.length === 0 ? (
                      <EmptyState
                        title="No upcoming activity"
                        description="Duties and events will appear here when they are assigned."
                        className="min-h-32"
                      />
                    ) : (
                      <>
                        {prefectFeed.duties.map((duty) => (
                          <div
                            key={duty.id}
                            className="rounded-3xl border border-border/60 bg-background/70 p-4"
                          >
                            <p className="font-medium">{duty.title}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {duty.academicClass?.label ||
                                duty.dutyLocation?.name ||
                                "Target pending"}
                            </p>
                          </div>
                        ))}
                        {prefectFeed.events.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-3xl border border-border/60 bg-background/70 p-4"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <StatusBadge value={event.audience} />
                            </div>
                            <p className="font-medium">{event.title}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {formatDisplayDateTime(event.eventDate)}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {user.role !== Role.PREFECT && staffSnapshot && staffFeed ? (
            <Card className="rounded-[1.75rem] border-border/70">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Today&apos;s guild operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Present today
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSnapshot.presentToday}/{staffSnapshot.activePrefects}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Covered absences
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSnapshot.coveredAbsences}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Unresolved warnings
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSnapshot.unresolvedAttendance}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-3">
                    <h3 className="font-medium">
                      Verification queue ({staffSnapshot.pendingVerification})
                    </h3>
                    {staffFeed.pendingPrefects.length === 0 ? (
                      <EmptyState
                        title="No pending prefect approvals"
                        description="New registrations will appear here for fast review."
                        className="min-h-32"
                      />
                    ) : (
                      staffFeed.pendingPrefects.map((prefect) => (
                        <div
                          key={prefect.id}
                          className="rounded-3xl border border-border/60 bg-background/70 p-4"
                        >
                          <p className="font-medium">{prefect.fullName}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {prefect.prefectProfile?.displayName || prefect.fullName} / Grade{" "}
                            {prefect.prefectProfile?.grade ?? "-"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Scan and event watch</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                        <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <ScanLine className="size-4" />
                        </div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Duplicate scans
                        </p>
                        <p className="mt-2 font-medium">{staffSnapshot.duplicateScans}</p>
                      </div>
                      <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                        <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                          <AlertTriangle className="size-4" />
                        </div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Invalid scans
                        </p>
                        <p className="mt-2 font-medium">{staffSnapshot.invalidScans}</p>
                      </div>
                    </div>
                    {staffFeed.upcomingEvents.length > 0 ? (
                      staffFeed.upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-3xl border border-border/60 bg-background/70 p-4"
                        >
                          <p className="font-medium">{event.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {formatDisplayDateTime(event.eventDate)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No upcoming events"
                        description="Published calendar events for the next two weeks will appear here."
                        className="min-h-32"
                      />
                    )}
                  </div>
                </div>

                {staffFeed.recentScans.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-medium">Recent scan activity</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {staffFeed.recentScans.map((scan) => (
                        <div
                          key={scan.id}
                          className="rounded-3xl border border-border/60 bg-background/70 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="font-medium">
                              {scan.user?.fullName || "Unknown prefect"}
                            </p>
                            <StatusBadge value={scan.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">{scan.message}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                            {formatDisplayDateTime(scan.scannedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

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
