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
        <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_22%),radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_30%),linear-gradient(180deg,color-mix(in_srgb,var(--background)_98%,white_2%)_0%,color-mix(in_srgb,var(--background)_96%,var(--primary)_4%)_100%)]">
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--border)_34%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_28%,transparent)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(circle_at_top,rgba(0,0,0,0.7),transparent_78%)]" />
          <div className="relative">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
