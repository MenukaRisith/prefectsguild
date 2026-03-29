"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { dashboardNav } from "@/lib/constants";
import type { SessionUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth-actions";

export function DashboardSidebar({
  user,
  reminderCount,
}: {
  user: NonNullable<SessionUser>;
  reminderCount: number;
}) {
  const pathname = usePathname();
  const items = dashboardNav.filter((item) => item.roles.includes(user.role as Role));

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="gap-4 px-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <BrandMark compact />
          <ThemeToggle />
        </div>
        <div className="rounded-3xl border border-border/70 bg-background/60 p-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              fullName={user.fullName}
              imagePath={user.prefectProfile?.profileImagePath}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.fullName}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge value={user.role} />
            <StatusBadge value={user.status} />
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                      {item.href === "/dashboard" && reminderCount > 0 ? (
                        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {reminderCount}
                        </span>
                      ) : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 pb-4">
        <form action={logoutAction} className="w-full">
          <Button type="submit" variant="outline" className="w-full rounded-full">
            Sign out
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
