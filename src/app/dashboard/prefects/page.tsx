import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDate } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import {
  toggleSuspensionAction,
  verifyPrefectAction,
} from "@/lib/actions/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function PrefectsPage() {
  const actor = await requireRole([Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN]);
  const [reminderCount, prefects] = await Promise.all([
    getReminderCount(actor.id),
    db.user.findMany({
      where: {
        role: Role.PREFECT,
      },
      include: {
        _count: {
          select: {
            attendanceRecords: true,
            absenceRequests: true,
          },
        },
        prefectProfile: true,
        qrPass: true,
        assignedDuties: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Prefects"
        description="Review registrations, verification status, issued QR passes, and current prefect profiles."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 md:px-8">
        {prefects.length === 0 ? (
          <EmptyState
            title="No prefect registrations yet"
            description="New prefect applications will appear here for staff review."
          />
        ) : (
          prefects.map((prefect) => (
            <Card key={prefect.id} className="rounded-[1.75rem] border-border/70">
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      fullName={prefect.fullName}
                      imagePath={prefect.prefectProfile?.profileImagePath}
                    />
                    <div>
                      <h2 className="font-heading text-2xl font-semibold">{prefect.fullName}</h2>
                      <p className="text-sm text-muted-foreground">{prefect.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge value={prefect.status} />
                        <StatusBadge value={prefect.role} />
                        {prefect.qrPass ? <StatusBadge value="APPROVED" /> : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prefect.status === "PENDING_VERIFICATION" && actor.role !== Role.TEACHER ? (
                      <form action={verifyPrefectAction}>
                        <input type="hidden" name="userId" value={prefect.id} />
                        <Button type="submit" className="rounded-full">
                          Verify prefect
                        </Button>
                      </form>
                    ) : null}
                    {prefect.status === "ACTIVE" ? (
                      <Button asChild variant="outline" className="rounded-full">
                        <a
                          href={`/api/pass/${prefect.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Print QR pass
                        </a>
                      </Button>
                    ) : null}
                    {actor.role === Role.SUPER_ADMIN ? (
                      <form action={toggleSuspensionAction}>
                        <input type="hidden" name="userId" value={prefect.id} />
                        <Button type="submit" variant="outline" className="rounded-full">
                          {prefect.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Display name
                    </p>
                    <p className="mt-2 font-medium">
                      {prefect.prefectProfile?.displayName || prefect.fullName}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Grade</p>
                    <p className="mt-2 font-medium">
                      Grade {prefect.prefectProfile?.grade || "-"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Prefect ID
                    </p>
                    <p className="mt-2 font-medium">
                      {prefect.qrPass?.prefectIdentifier || "Pending verification"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Assigned duties
                    </p>
                    <p className="mt-2 font-medium">{prefect.assignedDuties.length}</p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Attendance logs
                    </p>
                    <p className="mt-2 font-medium">{prefect._count.attendanceRecords}</p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Absence requests
                    </p>
                    <p className="mt-2 font-medium">{prefect._count.absenceRequests}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Section
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {prefect.prefectProfile?.section || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Appointed year
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {prefect.prefectProfile?.appointedYear || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Registered
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDisplayDate(prefect.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
