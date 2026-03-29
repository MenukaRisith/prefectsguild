import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getReminderCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const reminderCount = await getReminderCount(user.id);

  return (
    <SidebarProvider defaultOpen>
      <DashboardSidebar user={user} reminderCount={reminderCount} />
      <SidebarInset className="min-h-svh bg-transparent">
        <div className="min-h-svh bg-[radial-gradient(circle_at_top_right,rgba(181,161,92,0.12),transparent_25%),linear-gradient(to_bottom,transparent,rgba(20,32,38,0.03))]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
