import { Role } from "@prisma/client";
import {
  AssignDutyForm,
  CreateClassForm,
  CreateLocationForm,
} from "@/components/forms/dashboard-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDate } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { safeRead } from "@/lib/runtime-safety";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DutiesPage() {
  const user = await requireUser();
  const [reminderCount, prefects, classes, locations, assignments] = await Promise.all([
    getReminderCount(user.id),
    safeRead(
      "dashboard.duties.prefects",
      () =>
        db.user.findMany({
          where: { role: Role.PREFECT, status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        }),
      () => [],
    ),
    safeRead(
      "dashboard.duties.classes",
      () => db.academicClass.findMany({ orderBy: [{ grade: "asc" }, { section: "asc" }] }),
      () => [],
    ),
    safeRead(
      "dashboard.duties.locations",
      () => db.dutyLocation.findMany({ orderBy: { name: "asc" } }),
      () => [],
    ),
    safeRead(
      "dashboard.duties.assignments",
      () =>
        db.dutyAssignment.findMany({
          where:
            user.role === Role.PREFECT
              ? {
                  assigneeId: user.id,
                }
              : undefined,
          include: {
            assignee: { select: { fullName: true } },
            academicClass: true,
            dutyLocation: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      () => [],
    ),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Duties"
        description="Manage class targets, named duty locations, and prefect duty assignments."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {user.role !== Role.PREFECT ? (
          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
            {(user.role === Role.TEACHER || user.role === Role.SUPER_ADMIN) ? (
              <>
                <CreateClassForm />
                <CreateLocationForm />
              </>
            ) : null}
            {(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) ? (
              <AssignDutyForm
                prefects={prefects}
                classes={classes.map((item) => ({ id: item.id, label: item.label }))}
                locations={locations.map((item) => ({ id: item.id, name: item.name }))}
              />
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Duty masters</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 2xl:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-medium">Academic classes</h3>
                {classes.length === 0 ? (
                  <EmptyState
                    title="No classes yet"
                    description="Teachers and super admins can add class targets here."
                  />
                ) : (
                  classes.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        Grade {item.grade} / Section {item.section}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-3">
                <h3 className="font-medium">Named locations</h3>
                {locations.length === 0 ? (
                  <EmptyState
                    title="No locations yet"
                    description="Add spaces such as Main Gate, Office, or Hallway points."
                  />
                ) : (
                  locations.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description || "No description"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">
                {user.role === Role.PREFECT ? "Your duty list" : "Assigned duties"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments.length === 0 ? (
                <EmptyState
                  title="No duties assigned"
                  description="Assignments will appear here once an admin links prefects to a class or location."
                />
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-3xl border border-border/60 bg-background/70 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium">{assignment.title}</h3>
                      {user.role !== Role.PREFECT ? (
                        <span className="text-sm text-muted-foreground">
                          {assignment.assignee.fullName}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {assignment.academicClass?.label || assignment.dutyLocation?.name || "No target"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {assignment.notes || "No notes"}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      Added {formatDisplayDate(assignment.createdAt)}
                    </p>
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
