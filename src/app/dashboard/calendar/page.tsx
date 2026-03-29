import { Role } from "@prisma/client";
import { CreateEventForm } from "@/components/forms/dashboard-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requireUser();
  const [reminderCount, events] = await Promise.all([
    getReminderCount(user.id),
    db.calendarEvent.findMany({
      orderBy: { eventDate: "asc" },
      include: { createdBy: { select: { fullName: true } } },
    }),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Calendar"
        description="Coordinate prefect events, briefings, and reminder-backed dates."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) ? <CreateEventForm /> : null}

        <Card className="rounded-[1.75rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Upcoming events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.length === 0 ? (
              <EmptyState
                title="No calendar events yet"
                description="Publish a guild event to start using the calendar and reminder system."
              />
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-3xl border border-border/60 bg-background/70 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-heading text-xl font-semibold">{event.title}</h2>
                    <StatusBadge value={event.audience} />
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {event.description || "No additional event description."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{formatDisplayDateTime(event.eventDate)}</span>
                    <span>{event.location || "No location"}</span>
                    <span>Created by {event.createdBy.fullName}</span>
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
