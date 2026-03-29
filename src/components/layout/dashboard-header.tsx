import { BellRing } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export function DashboardHeader({
  title,
  description,
  reminderCount,
}: {
  title: string;
  description: string;
  reminderCount: number;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <SidebarTrigger className="mt-1 md:hidden" />
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full bg-background px-3 py-1 shadow-sm"
        >
          <BellRing className="size-3.5" />
          {reminderCount} live reminders
        </Badge>
      </div>
    </div>
  );
}
