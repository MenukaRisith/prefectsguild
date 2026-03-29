import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/date";
import { getReminderCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const reminderCount = await getReminderCount(user.id);

  return (
    <div>
      <DashboardHeader
        title="Profile"
        description="View the account and prefect profile data currently stored in the system."
        reminderCount={reminderCount}
      />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <Card className="rounded-[1.75rem] border-border/70">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
            <UserAvatar
              fullName={user.fullName}
              imagePath={user.prefectProfile?.profileImagePath}
            />
            <div className="space-y-2">
              <h2 className="font-heading text-3xl font-semibold">{user.fullName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={user.role} />
                <StatusBadge value={user.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <span className="text-muted-foreground">WhatsApp</span>
                <span>{user.whatsappNumber || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <span className="text-muted-foreground">Last login</span>
                <span>
                  {user.lastLoginAt ? formatDisplayDate(user.lastLoginAt) : "No login history"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Joined</span>
                <span>{formatDisplayDate(user.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70">
            <CardHeader>
              <CardTitle>Prefect profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {user.prefectProfile ? (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">Display name</span>
                    <span>{user.prefectProfile.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">Grade</span>
                    <span>Grade {user.prefectProfile.grade}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">Section</span>
                    <span>{user.prefectProfile.section || "Not specified"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">Appointed year</span>
                    <span>{user.prefectProfile.appointedYear}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Prefect ID</span>
                    <span>{user.prefectProfile.prefectIdentifier || "Issued after verification"}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No prefect-specific profile is attached to this account.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
