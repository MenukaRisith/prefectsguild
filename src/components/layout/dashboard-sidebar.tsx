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
import type { SiteIdentity } from "@/lib/system-settings";
import { logoutAction } from "@/lib/actions/auth-actions";

export function DashboardSidebar({
  user,
  reminderCount,
  siteIdentity,
}: {
  user: NonNullable<SessionUser>;
  reminderCount: number;
  siteIdentity?: SiteIdentity;
}) {
  const pathname = usePathname();
  const items = dashboardNav.filter((item) => item.roles.includes(user.role as Role));

  return (
    <Sidebar
      variant="inset"
      className="p-3 lg:p-4 [&_[data-sidebar=sidebar]]:overflow-hidden [&_[data-sidebar=sidebar]]:rounded-[1.9rem] [&_[data-sidebar=sidebar]]:border [&_[data-sidebar=sidebar]]:border-sidebar-border/70 [&_[data-sidebar=sidebar]]:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sidebar)_94%,white_6%)_0%,color-mix(in_srgb,var(--sidebar)_92%,var(--accent)_8%)_100%)] [&_[data-sidebar=sidebar]]:shadow-[0_28px_60px_-42px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
    >
      <SidebarHeader className="gap-4 px-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <BrandMark compact siteIdentity={siteIdentity} guildOnly />
          <ThemeToggle />
        </div>
        <div className="rounded-[1.5rem] border border-border/70 bg-card/82 p-4 shadow-[0_18px_40px_-34px_color-mix(in_srgb,var(--primary)_45%,transparent)] backdrop-blur">
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/78">
            Institutional ledger
          </p>
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
          <SidebarGroupLabel>Command deck</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      size="lg"
                      className="rounded-[1.35rem] px-3 text-[0.95rem] data-active:bg-primary data-active:text-primary-foreground data-active:shadow-[0_18px_35px_-26px_color-mix(in_srgb,var(--primary)_80%,transparent)] hover:bg-sidebar-accent/80"
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
        <Button asChild variant="secondary" className="w-full rounded-full">
          <Link href={siteIdentity?.supportWhatsappHref || "#"} target="_blank" rel="noreferrer">
            Support
          </Link>
        </Button>
        <form action={logoutAction} className="w-full">
          <Button type="submit" variant="outline" className="w-full rounded-full">
            Sign out
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
