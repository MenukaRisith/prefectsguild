import { Role } from "@prisma/client";
import { CreateAnnouncementForm } from "@/components/forms/dashboard-forms";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDateTime } from "@/lib/date";
import { getReminderCount, getVisibleAnnouncements } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await requireUser();
  const [reminderCount, announcements] = await Promise.all([
    getReminderCount(user.id),
    getVisibleAnnouncements(user.role),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Announcements"
        description="Publish updates for prefects and staff, then surface them across the dashboard."
        reminderCount={reminderCount}
      />
      <div className="grid gap-6 px-4 py-6 md:px-8 xl:grid-cols-[0.9fr_1.1fr]">
        {(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) ? (
          <CreateAnnouncementForm />
        ) : null}
        <Card className="rounded-[1.75rem] border-border/70">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Published feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <EmptyState
                title="Nothing published yet"
                description="Announcements will appear here once an admin posts them."
              />
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-3xl border border-border/60 bg-background/70 p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StatusBadge value={announcement.audience} />
                    <span className="text-xs text-muted-foreground">
                      {formatDisplayDateTime(announcement.publishedAt)}
                    </span>
                  </div>
                  <h2 className="font-heading text-xl font-semibold">{announcement.title}</h2>
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
      </div>
    </div>
  );
}
