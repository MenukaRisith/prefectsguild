import Link from "next/link";
import { AccountStatus, Role } from "@prisma/client";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPinned,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDateTime } from "@/lib/date";
import {
  getOverviewStats,
  getPrefectDashboardFeed,
  getRecentReminders,
  getReminderCount,
  getStaffDashboardAnalytics,
  getStaffDashboardFeed,
  getVisibleAnnouncements,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PrefectStats = Awaited<ReturnType<typeof getOverviewStats>>;
type PrefectFeed = Awaited<ReturnType<typeof getPrefectDashboardFeed>>;
type StaffFeed = Awaited<ReturnType<typeof getStaffDashboardFeed>>;
type StaffAnalytics = Awaited<ReturnType<typeof getStaffDashboardAnalytics>>;
type Reminders = Awaited<ReturnType<typeof getRecentReminders>>;
type Announcements = Awaited<ReturnType<typeof getVisibleAnnouncements>>;

type HeroAction = {
  href: string;
  label: string;
  variant?: "default" | "outline" | "secondary";
  icon: LucideIcon;
};

type HeroMetric = {
  label: string;
  value: string | number;
  detail: string;
};

type HeroBadge = {
  label: string;
  tone?: "primary" | "accent" | "soft";
};

type OverviewHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  spotlight: {
    label: string;
    value: string | number;
    detail: string;
  };
  metrics: HeroMetric[];
  actions: HeroAction[];
  badges: HeroBadge[];
};

type BreakdownItem = {
  label: string;
  value: number;
};

export default async function DashboardHomePage() {
  const user = await requireUser();
  const isPrefect = user.role === Role.PREFECT;

  const [prefectStats, reminders, announcements, reminderCount, staffAnalytics, staffFeed, prefectFeed] =
    await Promise.all([
      isPrefect ? getOverviewStats(user.id, user.role) : [],
      getRecentReminders(user.id),
      getVisibleAnnouncements(user.role),
      getReminderCount(user.id),
      isPrefect ? null : getStaffDashboardAnalytics(user.role),
      isPrefect ? null : getStaffDashboardFeed(),
      isPrefect ? getPrefectDashboardFeed(user.id) : null,
    ]);

  const { headline, description } = getDashboardCopy(user.role);
  const hasPendingVerification = user.status === AccountStatus.PENDING_VERIFICATION;
  const attendanceWarning = reminders.find(
    (reminder) => reminder.title === "Attendance reason required",
  );
  const staffAttentionCount =
    staffAnalytics == null
      ? 0
      : staffAnalytics.workload.unresolvedAttendance +
        staffAnalytics.workload.duplicateScans +
        staffAnalytics.workload.invalidScans;

  return (
    <div className="page-shell">
      <DashboardHeader title={headline} description={description} reminderCount={reminderCount} />
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
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

        {!isPrefect && staffAnalytics && (staffAnalytics.pendingVerification > 0 || staffAttentionCount > 0) ? (
          <Alert className="border-primary/20 bg-primary/6">
            <ShieldCheck className="size-4" />
            <AlertTitle>Operational attention needed</AlertTitle>
            <AlertDescription>
              {staffAnalytics.pendingVerification} pending registrations and {staffAttentionCount} attendance quality signals need review on today&apos;s board.
            </AlertDescription>
          </Alert>
        ) : null}

        {isPrefect && prefectFeed ? (
          <PrefectOverview stats={prefectStats} feed={prefectFeed} />
        ) : null}

        {!isPrefect && staffAnalytics && staffFeed ? (
          <StaffOverview
            role={user.role}
            analytics={staffAnalytics}
            feed={staffFeed}
          />
        ) : null}

        <InformationHub announcements={announcements} reminders={reminders} />
      </div>
    </div>
  );
}

function PrefectOverview({
  stats,
  feed,
}: {
  stats: PrefectStats;
  feed: PrefectFeed;
}) {
  const metrics = Object.fromEntries(stats.map((item) => [item.label, item.value])) as Record<
    string,
    number
  >;
  const spotlightValue = feed.attendanceToday ? "Checked in" : "Scan pending";

  return (
    <div className="space-y-6">
      <OverviewHero
        eyebrow="Official prefect ledger"
        title="Move through duty, attendance, and reminders from one board."
        description="Your dashboard now prioritizes what needs action first, then keeps the day plan, assignments, and event stream close at hand."
        spotlight={{
          label: "Attendance gate",
          value: spotlightValue,
          detail: feed.attendanceToday
            ? "Your QR attendance has already been recorded for today."
            : "Scan your QR pass before the school day settles into full operations.",
        }}
        metrics={[
          {
            label: "Open tasks",
            value: metrics["Open tasks"] ?? 0,
            detail: "Assignments still waiting on action.",
          },
          {
            label: "Live reminders",
            value: metrics["Live reminders"] ?? 0,
            detail: "Pending notices requiring attention.",
          },
          {
            label: "Attendance logs",
            value: metrics["Attendance logs"] ?? 0,
            detail: "Recorded scans across your history.",
          },
        ]}
        actions={[
          {
            href: "/dashboard/duties",
            label: "Review duties",
            icon: MapPinned,
          },
          {
            href: "/dashboard/attendance",
            label: "Open attendance",
            icon: QrCode,
            variant: "outline",
          },
        ]}
        badges={[
          { label: "session live", tone: "primary" },
          {
            label: feed.events.length > 0 ? `${feed.events.length} events ahead` : "calendar clear",
            tone: "accent",
          },
          {
            label: feed.tasks.some((task) => task.status === "OVERDUE")
              ? "priority pressure"
              : "steady pace",
          },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.9rem] border-border/70">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="font-heading text-2xl">Priority task board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {feed.tasks.length === 0 ? (
              <EmptyState
                title="No open tasks"
                description="New assignments from admins will appear here when the office dispatches them."
                className="min-h-36"
              />
            ) : (
              feed.tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StatusBadge value={task.status} />
                    <StatusBadge value={task.priority} />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">{task.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {task.description || "No extra note attached to this task."}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {task.dueAt ? formatDisplayDateTime(task.dueAt) : "No due date set"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[1.9rem] border-border/70">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="font-heading text-2xl">Duty and calendar preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {feed.duties.length === 0 && feed.events.length === 0 ? (
                <EmptyState
                  title="No upcoming duty cycle"
                  description="Assigned duties and calendar events will appear here when they are scheduled for you."
                  className="min-h-36"
                />
              ) : (
                <>
                  {feed.duties.map((duty) => (
                    <div
                      key={duty.id}
                      className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-primary/80">
                        Duty deployment
                      </p>
                      <h3 className="mt-2 font-heading text-xl font-semibold">{duty.title}</h3>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {duty.academicClass?.label ||
                          duty.dutyLocation?.name ||
                          "Target pending"}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {duty.notes || "No additional briefing attached yet."}
                      </p>
                    </div>
                  ))}
                  {feed.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <StatusBadge value={event.audience} />
                      </div>
                      <h3 className="font-heading text-xl font-semibold">{event.title}</h3>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {formatDisplayDateTime(event.eventDate)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {event.description || "No extra event note has been published."}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.9rem] border-primary/18 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_88%,black_12%)_0%,color-mix(in_srgb,var(--primary)_92%,var(--accent)_8%)_100%)] text-primary-foreground">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
              <HighlightStat
                label="Duties on deck"
                value={feed.duties.length}
                detail="Immediate stations in view."
              />
              <HighlightStat
                label="Calendar horizon"
                value={feed.events.length}
                detail="Events in the current preview."
              />
              <HighlightStat
                label="Response mode"
                value={feed.tasks.some((task) => task.status === "OVERDUE") ? "Urgent" : "Stable"}
                detail="Based on overdue and in-progress work."
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function StaffOverview({
  role,
  analytics,
  feed,
}: {
  role: Role;
  analytics: StaffAnalytics;
  feed: StaffFeed;
}) {
  const isTeacher = role === Role.TEACHER;
  const isSuperAdmin = role === Role.SUPER_ADMIN;
  const hero = getStaffHero(role, analytics);

  return (
    <div className="space-y-6">
      <OverviewHero {...hero} />

      <section className="grid gap-6 xl:grid-cols-3">
        <TrendCard
          title="Attendance rhythm"
          description="Seven-day prefect attendance volume, plotted for quick pattern checks."
          items={analytics.attendanceTrend}
          footer={`${analytics.presentToday}/${analytics.activePrefects} active prefects checked in today (${analytics.coverageRate}% coverage).`}
        />
        <BreakdownCard
          title="Task pressure"
          description="How the assignment queue is distributed right now."
          items={analytics.taskMix}
          emptyTitle="No active task data"
          emptyDescription="Task status changes will appear here once the office starts dispatching work."
        />
        <BreakdownCard
          title={isTeacher ? "Prefect grade spread" : "Duty allocation"}
          description={
            isTeacher
              ? "Active prefect capacity across the school by grade."
              : "Current assignment balance between classes and named locations."
          }
          items={isTeacher ? analytics.gradeMix : analytics.dutyMix}
          emptyTitle={isTeacher ? "No active prefect grades" : "No duty assignments"}
          emptyDescription={
            isTeacher
              ? "Verified prefect profiles with grade information will surface here."
              : "Assigned duty posts will surface here after deployment."
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.9rem] border-border/70">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="font-heading text-2xl">
              {isTeacher
                ? "Teacher watchlist"
                : isSuperAdmin
                  ? "Governance snapshot"
                  : "Admin response queue"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {isTeacher ? (
              <>
                <WatchRow
                  label="Pending absences"
                  value={analytics.workload.pendingAbsences}
                  detail="Student explanations waiting for review."
                  tone="warning"
                />
                <WatchRow
                  label="Missing reasons"
                  value={analytics.workload.unresolvedAttendance}
                  detail="Attendance reason reminders issued today."
                  tone={analytics.workload.unresolvedAttendance > 0 ? "danger" : "success"}
                />
                <WatchRow
                  label="Class targets"
                  value={analytics.workload.classCount}
                  detail="Configured academic duty destinations."
                />
                <WatchRow
                  label="Location posts"
                  value={analytics.workload.locationCount}
                  detail="Named duty points available for assignment."
                />
              </>
            ) : isSuperAdmin ? (
              <>
                <WatchRow
                  label="Active staff"
                  value={analytics.governance?.activeStaff ?? 0}
                  detail="Teachers and admins with live access."
                  tone="success"
                />
                <WatchRow
                  label="Suspended staff"
                  value={analytics.governance?.suspendedStaff ?? 0}
                  detail="Accounts currently blocked from the workspace."
                  tone={analytics.governance?.suspendedStaff ? "warning" : "success"}
                />
                <WatchRow
                  label="Pending prefect approvals"
                  value={analytics.pendingVerification}
                  detail="Registrations waiting on admin confirmation."
                  tone={analytics.pendingVerification > 0 ? "warning" : "success"}
                />
                <WatchRow
                  label="Audit entries (7d)"
                  value={analytics.governance?.auditEntriesLast7Days ?? 0}
                  detail="Recent administrative activity recorded by the system."
                />
              </>
            ) : (
              <>
                <WatchRow
                  label="Pending verification"
                  value={analytics.pendingVerification}
                  detail="New prefect registrations waiting for approval."
                  tone={analytics.pendingVerification > 0 ? "warning" : "success"}
                />
                <WatchRow
                  label="Open tasks"
                  value={analytics.workload.openTasks}
                  detail="Assignments still moving through the guild."
                />
                <WatchRow
                  label="Overdue tasks"
                  value={analytics.workload.overdueTasks}
                  detail="Items that need immediate intervention."
                  tone={analytics.workload.overdueTasks > 0 ? "danger" : "success"}
                />
                <WatchRow
                  label="Scan quality issues"
                  value={analytics.workload.duplicateScans + analytics.workload.invalidScans}
                  detail="Duplicate and invalid scans logged today."
                  tone={
                    analytics.workload.duplicateScans + analytics.workload.invalidScans > 0
                      ? "warning"
                      : "success"
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-border/70">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="font-heading text-2xl">Verification queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {feed.pendingPrefects.length === 0 ? (
              <EmptyState
                title="No registrations waiting"
                description="New prefect applications will appear here for rapid review."
                className="min-h-36"
              />
            ) : (
              feed.pendingPrefects.map((prefect) => (
                <div
                  key={prefect.id}
                  className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-xl font-semibold">{prefect.fullName}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {prefect.prefectProfile?.displayName || prefect.fullName} / Grade{" "}
                        {prefect.prefectProfile?.grade ?? "-"}
                      </p>
                    </div>
                    <StatusBadge value="PENDING_VERIFICATION" />
                  </div>
                </div>
              ))
            )}
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/dashboard/prefects">
                Open prefect registry
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.9rem] border-border/70">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="font-heading text-2xl">Recent scan activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {feed.recentScans.length === 0 ? (
              <EmptyState
                title="No scan activity yet"
                description="Attendance scans will land here as soon as the kiosk starts receiving prefect passes."
                className="min-h-36"
              />
            ) : (
              feed.recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium">
                        {scan.user?.fullName || "Unknown prefect"}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">{scan.message}</p>
                    </div>
                    <StatusBadge value={scan.status} />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDisplayDateTime(scan.scannedAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {isTeacher ? (
          <Card className="rounded-[1.9rem] border-border/70">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="font-heading text-2xl">Upcoming event horizon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {feed.upcomingEvents.length === 0 ? (
                <EmptyState
                  title="No upcoming events"
                  description="Published guild events for the next two weeks will appear here."
                  className="min-h-36"
                />
              ) : (
                feed.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <StatusBadge value={event.audience} />
                    </div>
                    <h3 className="font-heading text-xl font-semibold">{event.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {formatDisplayDateTime(event.eventDate)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : isSuperAdmin ? (
          <BreakdownCard
            title="Staff role mix"
            description="Current staff distribution across teacher and admin access levels."
            items={analytics.governance?.staffMix ?? []}
            emptyTitle="No staff accounts"
            emptyDescription="Teacher and admin accounts will appear here once they are provisioned."
          />
        ) : (
          <Card className="rounded-[1.9rem] border-border/70">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="font-heading text-2xl">Recent audit ledger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {analytics.governance?.recentAudits.length ? (
                analytics.governance.recentAudits.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{entry.summary}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {entry.actorName}
                        </p>
                      </div>
                      <StatusBadge value={entry.actorRole || "ADMIN"} />
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDisplayDateTime(entry.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No audit entries yet"
                  description="Administrative changes will show up here as the team starts operating."
                  className="min-h-36"
                />
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {isSuperAdmin ? (
        <Card className="rounded-[1.9rem] border-border/70">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="font-heading text-2xl">Recent audit ledger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {analytics.governance?.recentAudits.length ? (
              analytics.governance.recentAudits.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{entry.summary}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {entry.actorName}
                      </p>
                    </div>
                    <StatusBadge value={entry.actorRole || "SUPER_ADMIN"} />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDisplayDateTime(entry.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No audit entries yet"
                description="Administrative actions will show up here once the system starts recording live changes."
                className="min-h-36"
              />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InformationHub({
  announcements,
  reminders,
}: {
  announcements: Announcements;
  reminders: Reminders;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="rounded-[1.9rem] border-border/70">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle className="font-heading text-2xl">Announcement center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              description="Published guild updates will appear here once the office posts them."
              className="min-h-36"
            />
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge value={announcement.audience} />
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDisplayDateTime(announcement.publishedAt)}
                  </span>
                </div>
                <h2 className="font-heading text-2xl font-semibold">{announcement.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {announcement.body}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  By {announcement.createdBy.fullName}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.9rem] border-border/70">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle className="font-heading text-2xl">Live reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {reminders.length === 0 ? (
            <EmptyState
              title="No reminders"
              description="Due tasks, event nudges, and attendance follow-ups will surface here."
              className="min-h-36"
            />
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5"
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
                <h3 className="font-heading text-xl font-semibold">{reminder.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {reminder.message}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function OverviewHero({
  eyebrow,
  title,
  description,
  spotlight,
  metrics,
  actions,
  badges,
}: OverviewHeroProps) {
  const badgeTone = {
    primary: "border-primary/20 bg-primary/10 text-primary",
    accent: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    soft: "border-border/80 bg-background/80 text-foreground",
  } as const;

  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-primary/18 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,white_8%)_0%,color-mix(in_srgb,var(--card)_88%,var(--accent)_12%)_54%,color-mix(in_srgb,var(--card)_84%,var(--primary)_16%)_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--border)_46%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_40%,transparent)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(135deg,rgba(0,0,0,0.95),rgba(0,0,0,0.18))]" />
      <div className="relative grid gap-8 p-6 lg:grid-cols-[1.08fr_0.92fr] lg:p-8">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge.label}
                variant="secondary"
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.68rem] tracking-[0.22em]",
                  badgeTone[badge.tone ?? "soft"],
                )}
              >
                {badge.label}
              </Badge>
            ))}
          </div>

          <div className="max-w-3xl">
            <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-primary/78">
              {eyebrow}
            </p>
            <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <Button
                  key={action.href}
                  asChild
                  variant={action.variant ?? "default"}
                  className="rounded-full"
                >
                  <Link href={action.href}>
                    <Icon className="size-4" />
                    {action.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-rows-[1.1fr_0.9fr]">
          <div className="rounded-[1.85rem] border border-primary/18 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_82%,black_18%)_0%,color-mix(in_srgb,var(--primary)_90%,var(--accent)_10%)_100%)] p-6 text-primary-foreground shadow-[0_24px_60px_-34px_color-mix(in_srgb,var(--primary)_70%,transparent)]">
            <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
              {spotlight.label}
            </p>
            <p className="mt-4 font-heading text-5xl font-semibold tracking-tight">
              {spotlight.value}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-7 text-primary-foreground/78">
              {spotlight.detail}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.5rem] border border-border/65 bg-background/76 p-4 backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TrendCard({
  title,
  description,
  items,
  footer,
}: {
  title: string;
  description: string;
  items: Array<{ dayKey: string; label: string; count: number }>;
  footer: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="rounded-[1.9rem] border-border/70">
      <CardHeader className="border-b border-border/70 pb-5">
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid grid-cols-7 gap-3">
          {items.map((item) => (
            <div key={item.dayKey} className="flex flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end rounded-[1.2rem] bg-muted/55 p-2">
                <div
                  className="w-full rounded-[0.85rem] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_84%,white_16%),var(--primary))]"
                  style={{
                    height:
                      item.count === 0
                        ? "0%"
                        : `${Math.max(16, Math.round((item.count / maxValue) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {item.label}
              </p>
              <p className="font-medium">{item.count}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">{footer}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  items: BreakdownItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card className="rounded-[1.9rem] border-border/70">
      <CardHeader className="border-b border-border/70 pb-5">
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {items.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="min-h-36"
          />
        ) : (
          items.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.4rem] border border-border/60 bg-background/80 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="font-heading text-2xl font-semibold">{item.value}</p>
              </div>
              <div className="h-2 rounded-full bg-muted/70">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
                  style={{
                    width:
                      item.value === 0
                        ? "0%"
                        : `${Math.max(14, Math.round((item.value / maxValue) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function HighlightStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-[1.45rem] border border-primary-foreground/12 bg-primary-foreground/8 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/66">{label}</p>
      <p className="mt-3 font-heading text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-primary-foreground/72">{detail}</p>
    </div>
  );
}

function WatchRow({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "border-border/60 bg-background/80",
    success: "border-emerald-500/20 bg-emerald-500/8",
    warning: "border-amber-500/20 bg-amber-500/8",
    danger: "border-rose-500/20 bg-rose-500/8",
  } as const;

  return (
    <div className={cn("rounded-[1.45rem] border p-4", toneClass[tone])}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
        <p className="font-heading text-3xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function getDashboardCopy(role: Role) {
  switch (role) {
    case Role.PREFECT:
      return {
        headline: "Your prefect dashboard",
        description:
          "Track tasks, attendance, duties, reminders, and upcoming event pressure from one place.",
      };
    case Role.TEACHER:
      return {
        headline: "Teacher operations board",
        description:
          "Review attendance health, duty setup, and prefect readiness with faster classroom-side analysis.",
      };
    case Role.ADMIN:
      return {
        headline: "Admin command center",
        description:
          "Monitor verification load, assignment pressure, and daily attendance quality across the guild.",
      };
    case Role.SUPER_ADMIN:
      return {
        headline: "Super admin control room",
        description:
          "Oversee staffing, verification, audits, and operations from a single governance board.",
      };
    default:
      return {
        headline: "Guild dashboard",
        description: "Monitor the most important signals across the prefect guild.",
      };
  }
}

function getStaffHero(role: Role, analytics: StaffAnalytics): OverviewHeroProps {
  if (role === Role.TEACHER) {
    return {
      eyebrow: "Teacher desk / school floor analysis",
      title: "See coverage, queue pressure, and duty readiness before the day slips.",
      description:
        "This board turns attendance, absence, and setup data into a faster staff read so teachers can spot issues without opening three separate pages.",
      spotlight: {
        label: "Today coverage",
        value: `${analytics.coverageRate}%`,
        detail: `${analytics.presentToday} of ${analytics.activePrefects} active prefects have checked in today.`,
      },
      metrics: [
        {
          label: "Pending absences",
          value: analytics.workload.pendingAbsences,
          detail: "Waiting on review.",
        },
        {
          label: "Class targets",
          value: analytics.workload.classCount,
          detail: "Configured academic destinations.",
        },
        {
          label: "Events ahead",
          value: analytics.workload.upcomingEvents,
          detail: "Next 14 days.",
        },
      ],
      actions: [
        { href: "/dashboard/attendance", label: "Open attendance", icon: ScanLine },
        {
          href: "/dashboard/duties",
          label: "Review duties",
          icon: MapPinned,
          variant: "outline",
        },
        {
          href: "/dashboard/prefects",
          label: "View prefects",
          icon: Users,
          variant: "secondary",
        },
      ],
      badges: [
        { label: "teacher view", tone: "primary" },
        {
          label:
            analytics.workload.unresolvedAttendance > 0
              ? "attendance follow-up live"
              : "attendance flow stable",
          tone: "accent",
        },
        { label: `${analytics.workload.locationCount} active posts`, tone: "soft" },
      ],
    };
  }

  if (role === Role.SUPER_ADMIN) {
    return {
      eyebrow: "Super admin oversight / governance",
      title: "Control staffing, verification, and audit visibility from one institutional board.",
      description:
        "The home screen now surfaces operational health, audit cadence, and account governance so super admins can react faster without drilling into every module first.",
      spotlight: {
        label: "Active staff",
        value: analytics.governance?.activeStaff ?? 0,
        detail: `${analytics.governance?.auditEntriesLast7Days ?? 0} audit entries recorded in the last seven days.`,
      },
      metrics: [
        {
          label: "Pending verification",
          value: analytics.pendingVerification,
          detail: "Prefect accounts waiting on approval.",
        },
        {
          label: "Suspended staff",
          value: analytics.governance?.suspendedStaff ?? 0,
          detail: "Accounts temporarily restricted.",
        },
        {
          label: "Open tasks",
          value: analytics.workload.openTasks,
          detail: "Assignments currently moving.",
        },
      ],
      actions: [
        { href: "/dashboard/staff", label: "Manage staff", icon: ShieldCheck },
        {
          href: "/dashboard/audit",
          label: "Open activity",
          icon: Sparkles,
          variant: "outline",
        },
        {
          href: "/dashboard/settings",
          label: "System settings",
          icon: BellRing,
          variant: "secondary",
        },
      ],
      badges: [
        { label: "super admin view", tone: "primary" },
        { label: `${analytics.presentToday}/${analytics.activePrefects} attendance today`, tone: "accent" },
        { label: `${analytics.workload.recentAnnouncements} recent notices`, tone: "soft" },
      ],
    };
  }

  return {
    eyebrow: "Admin command / operations",
    title: "Keep the guild verified, assigned, and visible with less page switching.",
    description:
      "The admin home page now prioritizes verification backlog, active work pressure, and scan quality so operational issues rise to the top immediately.",
    spotlight: {
      label: "Verification queue",
      value: analytics.pendingVerification,
      detail: `${analytics.workload.overdueTasks} overdue tasks and ${analytics.workload.pendingAbsences} pending absences currently need intervention.`,
    },
    metrics: [
      {
        label: "Open tasks",
        value: analytics.workload.openTasks,
        detail: "Current assignment load.",
      },
      {
        label: "Missing reasons",
        value: analytics.workload.unresolvedAttendance,
        detail: "Attendance explanations requested today.",
      },
      {
        label: "Scan issues",
        value: analytics.workload.duplicateScans + analytics.workload.invalidScans,
        detail: "Duplicate and invalid scans today.",
      },
    ],
    actions: [
      { href: "/dashboard/prefects", label: "Review prefects", icon: Users },
      {
        href: "/dashboard/tasks",
        label: "Open tasks",
        icon: ClipboardList,
        variant: "outline",
      },
      {
        href: "/dashboard/duties",
        label: "Manage duties",
        icon: MapPinned,
        variant: "secondary",
      },
    ],
    badges: [
      { label: "admin view", tone: "primary" },
      { label: `${analytics.coverageRate}% coverage today`, tone: "accent" },
      { label: `${analytics.workload.recentAnnouncements} recent notices`, tone: "soft" },
    ],
  };
}
