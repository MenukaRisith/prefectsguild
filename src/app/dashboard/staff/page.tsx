import { Role } from "@prisma/client";
import { CreateStaffForm } from "@/components/forms/dashboard-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getReminderCount } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { toggleSuspensionAction } from "@/lib/actions/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const actor = await requireRole([Role.SUPER_ADMIN]);
  const [reminderCount, staff] = await Promise.all([
    getReminderCount(actor.id),
    db.user.findMany({
      where: {
        role: {
          in: [Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN],
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Staff"
        description="Provision teacher and admin accounts, then manage their access from one place."
        reminderCount={reminderCount}
      />
      <div className="grid gap-6 px-4 py-6 md:px-8 xl:grid-cols-[0.95fr_1.05fr]">
        <CreateStaffForm />
        <Card className="rounded-[1.75rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Current staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staff.length === 0 ? (
              <EmptyState
                title="No staff accounts yet"
                description="Create the first teacher or admin account from this page."
              />
            ) : (
              staff.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-background/70 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h2 className="font-medium">{member.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge value={member.role} />
                      <StatusBadge value={member.status} />
                    </div>
                  </div>
                  {member.id !== actor.id ? (
                    <form action={toggleSuspensionAction}>
                      <input type="hidden" name="userId" value={member.id} />
                      <Button type="submit" variant="outline" className="rounded-full">
                        {member.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
