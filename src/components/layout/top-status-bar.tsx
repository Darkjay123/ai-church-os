import { Bell, ChevronDown, Command, Radio, ShieldCheck } from "lucide-react";

import { CommandHint } from "@/components/layout/command-hint";
import { StatusDot } from "@/components/layout/status-dot";
import { Button } from "@/components/ui/button";

export function TopStatusBar({
  organization,
  profile,
}: {
  organization: { id: string; name: string; timezone: string } | null;
  profile: { fullName: string | null; email: string } | null;
}) {
  const initials = (profile?.fullName || profile?.email || "AC")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <header className="border-border bg-background flex h-16 shrink-0 items-center justify-between border-b px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="border-border bg-card truncate rounded-md border px-2.5 py-1.5 text-xs font-medium">
          {organization?.name ?? "Church workspace"}
        </span>
        <Button aria-label="Switch organization" size="icon-xs" variant="ghost">
          <ChevronDown className="size-3.5" />
        </Button>
      </div>
      <div className="hidden items-center gap-2 xl:flex">
        <Button
          className="text-muted-foreground h-8 min-w-72 justify-between"
          variant="outline"
        >
          <span className="flex items-center gap-2">
            <Command className="size-3.5" />
            Search or run a command
          </span>
          <CommandHint>⌘ K</CommandHint>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground hidden items-center gap-2 text-xs md:flex">
          <StatusDot tone={organization ? "healthy" : "warning"} />
          {organization ? "AI Brain ready" : "Connect Supabase"}
        </span>
        <span className="text-muted-foreground hidden items-center gap-2 text-xs lg:flex">
          <Radio className="size-3.5 text-sky-400" />
          No live stream
        </span>
        <Button aria-label="Notifications" size="icon" variant="ghost">
          <Bell className="size-4" />
        </Button>
        <Button aria-label="Security status" size="icon" variant="ghost">
          <ShieldCheck className="size-4 text-emerald-400" />
        </Button>
        <span className="bg-primary/15 text-primary grid size-8 place-items-center rounded-full text-xs font-semibold">
          {initials}
        </span>
      </div>
    </header>
  );
}
