import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { safeRead } from "@/lib/runtime-safety";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
  const [reminderCount, logs] = await Promise.all([
    getReminderCount(user.id),
    safeRead(
      "dashboard.audit.logs",
      () =>
        db.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            actor: {
              select: {
                fullName: true,
              },
            },
          },
          take: 40,
        }),
      () => [],
    ),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Activity log"
        description="Review important system actions including verification, status changes, scans, and password resets."
        reminderCount={reminderCount}
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="rounded-[1.75rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Recent audit entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.length === 0 ? (
              <EmptyState
                title="No audit entries yet"
                description="Tracked platform actions will appear here once users start working in the system."
              />
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-3xl border border-border/60 bg-background/70 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{log.summary}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.action} / {log.targetType}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDisplayDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {log.actor?.fullName || "System"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
