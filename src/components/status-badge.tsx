import { Badge } from "@/components/ui/badge";

const variants = {
  PENDING_VERIFICATION: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  SUSPENDED: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  TEACHER: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  ADMIN: "bg-violet-500/15 text-violet-700 dark:text-violet-200",
  SUPER_ADMIN: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200",
  PREFECT: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  SUBMITTED: "bg-blue-500/15 text-blue-700 dark:text-blue-200",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  REQUIRES_REASON:
    "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  ACCEPTED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  DUPLICATE: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  INVALID: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  TODO: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  IN_PROGRESS: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  OVERDUE: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  LOW: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  MEDIUM: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  HIGH: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  ALL_PREFECTS: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  STAFF_ONLY: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  CUSTOM: "bg-violet-500/15 text-violet-700 dark:text-violet-200",
  ALL: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  STAFF: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  ADMINS: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200",
  QR_KIOSK: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  MANUAL: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  SENT: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  FAILED: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
} as const;

export function StatusBadge({ value }: { value: string }) {
  const label = value.replaceAll("_", " ").toLowerCase();

  return (
    <Badge
      variant="secondary"
      className={variants[value as keyof typeof variants] ?? "bg-muted text-foreground"}
    >
      {label}
    </Badge>
  );
}
