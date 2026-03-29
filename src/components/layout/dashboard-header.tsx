import { format } from "date-fns";
import { BellRing, CalendarDays } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { getSystemSettings } from "@/lib/system-settings";

export async function DashboardHeader({
  title,
  description,
  reminderCount,
}: {
  title: string;
  description: string;
  reminderCount: number;
}) {
  const settings = await getSystemSettings();
  const todayLabel = format(new Date(), "EEEE, dd MMM");

  return (
    <div className="sticky top-0 z-20 px-4 py-4 sm:px-6 lg:px-8">
      <div className="rounded-[1.85rem] border border-border/70 bg-background/86 p-4 shadow-[0_18px_40px_-32px_color-mix(in_srgb,var(--primary)_45%,transparent)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-1 lg:hidden" />
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-primary"
                >
                  {settings.motto}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-muted-foreground"
                >
                  <CalendarDays className="size-3.5" />
                  {todayLabel}
                </Badge>
              </div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-[2.1rem]">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="w-fit shrink-0 rounded-full border border-primary/18 bg-background/85 px-3.5 py-1.5 text-[0.72rem] tracking-[0.2em]"
          >
            <BellRing className="size-3.5" />
            {reminderCount} live reminders
          </Badge>
        </div>
      </div>
    </div>
  );
}
