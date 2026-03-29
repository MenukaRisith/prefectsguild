import Link from "next/link";
import { AttendanceScanStatus, Role } from "@prisma/client";
import { AbsenceRequestForm } from "@/components/forms/dashboard-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDate, formatDisplayDateTime, toDayKey } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { safeRead } from "@/lib/runtime-safety";
import { requireUser } from "@/lib/session";
import { reviewAbsenceAction } from "@/lib/actions/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const user = await requireUser();
  const todayKey = toDayKey(new Date());

  const [reminderCount, attendanceRecords, absences, reminders, scanLogs, staffSummary] =
    await Promise.all([
      getReminderCount(user.id),
      safeRead(
        "dashboard.attendance.records",
        () =>
          db.attendanceRecord.findMany({
            where: user.role === Role.PREFECT ? { userId: user.id } : undefined,
            include: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
            orderBy: { scannedAt: "desc" },
            take: 30,
          }),
        () => [],
      ),
      safeRead(
        "dashboard.attendance.absences",
        () =>
          db.absenceRequest.findMany({
            where: user.role === Role.PREFECT ? { userId: user.id } : undefined,
            include: {
              user: {
                select: {
                  fullName: true,
                },
              },
              reviewedBy: {
                select: {
                  fullName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 30,
          }),
        () => [],
      ),
      safeRead(
        "dashboard.attendance.reminders",
        () =>
          db.reminder.findMany({
            where: {
              recipientId: user.id,
              title: "Attendance reason required",
            },
            orderBy: { dueAt: "desc" },
            take: 5,
          }),
        () => [],
      ),
      user.role === Role.PREFECT
        ? []
        : safeRead(
            "dashboard.attendance.scanLogs",
            () =>
              db.attendanceScanLog.findMany({
                where: {
                  dayKey: todayKey,
                },
                include: {
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                },
                orderBy: { scannedAt: "desc" },
                take: 20,
              }),
            () => [],
          ),
      user.role === Role.PREFECT
        ? null
        : Promise.all([
            safeRead(
              "dashboard.attendance.summary.accepted",
              () =>
                db.attendanceRecord.count({
                  where: {
                    dayKey: todayKey,
                  },
                }),
              () => 0,
            ),
            safeRead(
              "dashboard.attendance.summary.duplicates",
              () =>
                db.attendanceScanLog.count({
                  where: {
                    dayKey: todayKey,
                    status: AttendanceScanStatus.DUPLICATE,
                  },
                }),
              () => 0,
            ),
            safeRead(
              "dashboard.attendance.summary.invalid",
              () =>
                db.attendanceScanLog.count({
                  where: {
                    dayKey: todayKey,
                    status: AttendanceScanStatus.INVALID,
                  },
                }),
              () => 0,
            ),
            safeRead(
              "dashboard.attendance.summary.pendingAbsences",
              () =>
                db.absenceRequest.count({
                  where: {
                    status: "SUBMITTED",
                  },
                }),
              () => 0,
            ),
            safeRead(
              "dashboard.attendance.summary.missingReasons",
              () =>
                db.reminder.count({
                  where: {
                    title: "Attendance reason required",
                    dueAt: {
                      gte: new Date(`${todayKey}T00:00:00.000Z`),
                      lte: new Date(`${todayKey}T23:59:59.999Z`),
                    },
                  },
                }),
              () => 0,
            ),
          ]),
    ]);

  return (
    <div>
      <DashboardHeader
        title="Attendance"
        description="Review school attendance scans, absence reasons, and follow-up actions."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {user.role === Role.PREFECT ? (
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <AbsenceRequestForm />
            <Card className="rounded-[1.75rem] border-border/70">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Attendance follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reminders.length === 0 ? (
                  <EmptyState
                    title="No attendance warnings"
                    description="If a day is missed without an approved absence, you will see a warning here."
                  />
                ) : (
                  reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="rounded-3xl border border-rose-500/30 bg-rose-500/8 p-5"
                    >
                      <p className="font-medium">{reminder.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {reminder.message}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        {formatDisplayDateTime(reminder.dueAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="/scan">Open live scanner</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/api/reports/attendance">Export attendance CSV</Link>
              </Button>
            </div>

            {staffSummary ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <Card className="rounded-[1.5rem] border-border/70">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Accepted today
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSummary[0]}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-border/70">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Duplicate scans
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSummary[1]}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-border/70">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Invalid scans
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSummary[2]}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-border/70">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Pending absences
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSummary[3]}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-border/70">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Missing reasons
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold">
                      {staffSummary[4]}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Attendance log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceRecords.length === 0 ? (
                <EmptyState
                  title="No attendance records"
                  description="Attendance scans will appear once prefect QR passes are used at school."
                />
              ) : (
                attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-3xl border border-border/60 bg-background/70 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-medium">{record.user.fullName}</h2>
                      <StatusBadge value={record.source} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDisplayDate(record.date)} / In: {formatDisplayDateTime(record.scannedAt)}
                    </p>
                    {record.checkedOutAt ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Out: {formatDisplayDateTime(record.checkedOutAt)}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Absence requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {absences.length === 0 ? (
                <EmptyState
                  title="No absence requests"
                  description="Submitted absence reasons will appear here for prefects and staff."
                />
              ) : (
                absences.map((absence) => (
                  <div
                    key={absence.id}
                    className="rounded-3xl border border-border/60 bg-background/70 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="font-medium">{absence.user.fullName}</h2>
                        <p className="text-sm text-muted-foreground">
                          {formatDisplayDate(absence.startDate)} to {formatDisplayDate(absence.endDate)}
                        </p>
                      </div>
                      <StatusBadge value={absence.status} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {absence.reason}
                    </p>
                    {user.role !== Role.PREFECT ? (
                      <form action={reviewAbsenceAction} className="mt-4 space-y-3">
                        <input type="hidden" name="absenceId" value={absence.id} />
                        <textarea
                          name="reviewNote"
                          placeholder="Optional review note for the prefect"
                          defaultValue={absence.reviewNote ?? ""}
                          className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="submit"
                            name="status"
                            value="APPROVED"
                            className="rounded-full"
                          >
                            Approve
                          </Button>
                          <Button
                            type="submit"
                            name="status"
                            value="REJECTED"
                            variant="outline"
                            className="rounded-full"
                          >
                            Reject
                          </Button>
                        </div>
                      </form>
                    ) : absence.reviewedBy ? (
                      <>
                        <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                          Reviewed by {absence.reviewedBy.fullName}
                        </p>
                        {absence.reviewNote ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Note: {absence.reviewNote}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {user.role !== Role.PREFECT ? (
          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Today&apos;s scan quality log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanLogs.length === 0 ? (
                <EmptyState
                  title="No scan activity yet"
                  description="Once the kiosk starts scanning prefect passes, accepted, duplicate, and invalid entries will appear here."
                />
              ) : (
                scanLogs.map((scan) => (
                  <div
                    key={scan.id}
                    className="rounded-3xl border border-border/60 bg-background/70 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{scan.user?.fullName || "Unknown prefect"}</p>
                        <p className="text-sm text-muted-foreground">
                          {scan.scannerLabel || "School scanner"}
                        </p>
                      </div>
                      <StatusBadge value={scan.status} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{scan.message}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {formatDisplayDateTime(scan.scannedAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
