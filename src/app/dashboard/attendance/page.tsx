import Link from "next/link";
import { Role } from "@prisma/client";
import { AbsenceRequestForm } from "@/components/forms/dashboard-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { reviewAbsenceAction } from "@/lib/actions/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const user = await requireUser();
  const [reminderCount, attendanceRecords, absences, reminders] = await Promise.all([
    getReminderCount(user.id),
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
    db.reminder.findMany({
      where: {
        recipientId: user.id,
        title: "Attendance reason required",
      },
      orderBy: { dueAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Attendance"
        description="Review school attendance scans, absence reasons, and follow-up actions."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 md:px-8">
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
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/scan">Open live scanner</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/api/reports/attendance">Export attendance CSV</Link>
            </Button>
          </div>
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
                      {formatDisplayDate(record.date)} / {formatDisplayDateTime(record.scannedAt)}
                    </p>
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
                      <div className="mt-4 flex flex-wrap gap-2">
                        <form action={reviewAbsenceAction}>
                          <input type="hidden" name="absenceId" value={absence.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <Button type="submit" className="rounded-full">
                            Approve
                          </Button>
                        </form>
                        <form action={reviewAbsenceAction}>
                          <input type="hidden" name="absenceId" value={absence.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <Button type="submit" variant="outline" className="rounded-full">
                            Reject
                          </Button>
                        </form>
                      </div>
                    ) : absence.reviewedBy ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Reviewed by {absence.reviewedBy.fullName}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
