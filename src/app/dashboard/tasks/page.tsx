import { Role, TaskStatus } from "@prisma/client";
import { CreateTaskForm } from "@/components/forms/dashboard-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { safeRead } from "@/lib/runtime-safety";
import { requireUser } from "@/lib/session";
import { updateTaskStatusAction } from "@/lib/actions/dashboard-actions";

export const dynamic = "force-dynamic";

const statusOptions: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.OVERDUE,
];

export default async function TasksPage() {
  const user = await requireUser();
  const [reminderCount, prefects, tasks] = await Promise.all([
    getReminderCount(user.id),
    safeRead(
      "dashboard.tasks.prefects",
      () =>
        db.user.findMany({
          where: { role: Role.PREFECT, status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        }),
      () => [],
    ),
    safeRead(
      "dashboard.tasks.tasks",
      () =>
        db.task.findMany({
          where:
            user.role === Role.PREFECT
              ? {
                  assigneeId: user.id,
                }
              : undefined,
          include: {
            assignee: { select: { fullName: true } },
          },
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        }),
      () => [],
    ),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Tasks"
        description="Assign prefect responsibilities, track progress, and keep deadlines visible."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) ? (
          <CreateTaskForm prefects={prefects} />
        ) : null}

        <Card className="rounded-[1.75rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {user.role === Role.PREFECT ? "Your assigned tasks" : "All task assignments"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Tasks will appear here after an admin assigns them."
              />
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-3xl border border-border/60 bg-background/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <StatusBadge value={task.status} />
                        <StatusBadge value={task.priority} />
                      </div>
                      <h2 className="font-heading text-xl font-semibold">{task.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {task.description || "No description provided."}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{task.assignee.fullName}</p>
                      <p>{task.dueAt ? formatDisplayDateTime(task.dueAt) : "No due date"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <form action={updateTaskStatusAction} key={status}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="status" value={status} />
                        <Button
                          type="submit"
                          variant={task.status === status ? "default" : "outline"}
                          className="rounded-full"
                        >
                          {status.replaceAll("_", " ")}
                        </Button>
                      </form>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
