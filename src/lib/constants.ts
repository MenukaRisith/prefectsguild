import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
  MapPinned,
  ScrollText,
  Settings,
  UserRound,
} from "lucide-react";
import type { Role } from "@prisma/client";

export const siteConfig = {
  name: "Kekirawa Central College Prefects Guild",
  shortName: "KCC Prefects Guild",
  footerLabel: "Built by RAWANZ PREFECTS GUILD",
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

export const dashboardNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["PREFECT", "TEACHER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: UserRound,
    roles: ["PREFECT", "TEACHER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/prefects",
    label: "Prefects",
    icon: Users,
    roles: ["TEACHER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/staff",
    label: "Staff",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN"],
  },
  {
    href: "/dashboard/duties",
    label: "Duties",
    icon: MapPinned,
    roles: ["PREFECT", "TEACHER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    icon: ClipboardList,
    roles: ["PREFECT", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    icon: CalendarDays,
    roles: ["PREFECT", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/attendance",
    label: "Attendance",
    icon: ScanLine,
    roles: ["PREFECT", "TEACHER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/pass",
    label: "QR Pass",
    icon: QrCode,
    roles: ["PREFECT", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/announcements",
    label: "Announcements",
    icon: BellRing,
    roles: ["PREFECT", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/audit",
    label: "Activity",
    icon: ScrollText,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    roles: ["SUPER_ADMIN"],
  },
];

export const publicHighlights = [
  "Role-based dashboards for prefects, teachers, admins, and super admins.",
  "Secure QR attendance with printable ID passes and absence follow-up.",
  "Duty, task, reminder, and calendar coordination built for school operations.",
];

export const attendanceWarningMessage =
  "Your attendance was missing for today. Submit a reason so the guild office can review it.";
