import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getReminderCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const [reminderCount, settings] = await Promise.all([
    getReminderCount(user.id),
    getSystemSettings(),
  ]);

  return (
    <SidebarProvider defaultOpen>
      <DashboardSidebar
        user={user}
        reminderCount={reminderCount}
        siteIdentity={settings}
      />
      <SidebarInset className="min-h-svh bg-transparent">
        <div className="min-h-svh bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_22%),radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_28%),linear-gradient(180deg,transparent,color-mix(in_srgb,var(--primary)_3%,transparent))]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
