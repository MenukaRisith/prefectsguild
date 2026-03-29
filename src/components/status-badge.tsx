import { Badge } from "@/components/ui/badge";

const variants = {
  PENDING_VERIFICATION:
    "border-amber-500/25 bg-amber-500/12 text-amber-800 dark:text-amber-200",
  ACTIVE: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  SUSPENDED: "border-rose-500/25 bg-rose-500/12 text-rose-800 dark:text-rose-200",
  TEACHER: "border-border/80 bg-muted/70 text-foreground",
  ADMIN: "border-yellow-500/25 bg-yellow-500/14 text-yellow-900 dark:text-yellow-200",
  SUPER_ADMIN: "border-primary/25 bg-primary/12 text-primary dark:text-primary-foreground",
  PREFECT: "border-border/80 bg-background/80 text-foreground",
  SUBMITTED: "border-primary/25 bg-primary/12 text-primary dark:text-primary-foreground",
  APPROVED: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  REJECTED: "border-rose-500/25 bg-rose-500/12 text-rose-800 dark:text-rose-200",
  REQUIRES_REASON:
    "border-amber-500/25 bg-amber-500/12 text-amber-800 dark:text-amber-200",
  ACCEPTED: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  DUPLICATE: "border-amber-500/25 bg-amber-500/12 text-amber-800 dark:text-amber-200",
  INVALID: "border-rose-500/25 bg-rose-500/12 text-rose-800 dark:text-rose-200",
  TODO: "border-border/80 bg-background/80 text-foreground",
  IN_PROGRESS: "border-primary/25 bg-primary/12 text-primary dark:text-primary-foreground",
  COMPLETED: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  OVERDUE: "border-rose-500/25 bg-rose-500/12 text-rose-800 dark:text-rose-200",
  LOW: "border-border/80 bg-background/80 text-foreground",
  MEDIUM: "border-yellow-500/25 bg-yellow-500/14 text-yellow-900 dark:text-yellow-200",
  HIGH: "border-rose-500/25 bg-rose-500/12 text-rose-800 dark:text-rose-200",
  ALL_PREFECTS: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  STAFF_ONLY: "border-border/80 bg-muted/70 text-foreground",
  CUSTOM: "border-primary/25 bg-primary/12 text-primary dark:text-primary-foreground",
  ALL: "border-border/80 bg-background/80 text-foreground",
  STAFF: "border-border/80 bg-muted/70 text-foreground",
  ADMINS: "border-primary/25 bg-primary/12 text-primary dark:text-primary-foreground",
  QR_KIOSK: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  MANUAL: "border-yellow-500/25 bg-yellow-500/14 text-yellow-900 dark:text-yellow-200",
  PENDING: "border-amber-500/25 bg-amber-500/12 text-amber-800 dark:text-amber-200",
  SENT: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  FAILED: "border-rose-500/25 bg-rose-500/12 text-rose-800 dark:text-rose-200",
} as const;

export function StatusBadge({ value }: { value: string }) {
  const label = value.replaceAll("_", " ").toLowerCase();

  return (
    <Badge
      variant="secondary"
      className={variants[value as keyof typeof variants] ?? "border-border/80 bg-muted/70 text-foreground"}
    >
      {label}
    </Badge>
  );
}
