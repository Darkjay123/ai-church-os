import { Bell, ChevronDown, Command, Radio, ShieldCheck } from "lucide-react";

import { CommandHint } from "@/components/layout/command-hint";
import { StatusDot } from "@/components/layout/status-dot";
import { Button } from "@/components/ui/button";

export function TopStatusBar() {
  return (
    <header className="border-border bg-background flex h-16 shrink-0 items-center justify-between border-b px-5">
      <div className="flex items-center gap-3">
        <span className="border-border bg-card rounded-md border px-2.5 py-1.5 text-xs font-medium">
          Grace Community Church
        </span>
        <Button variant="ghost" size="icon-xs" aria-label="Switch organization">
          <ChevronDown className="size-3.5" />
        </Button>
      </div>
      <div className="hidden items-center gap-2 xl:flex">
        <Button
          variant="outline"
          className="text-muted-foreground h-8 min-w-72 justify-between"
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
          <StatusDot tone="healthy" />
          AI Brain ready
        </span>
        <span className="text-muted-foreground hidden items-center gap-2 text-xs lg:flex">
          <Radio className="size-3.5 text-sky-400" />
          No live stream
        </span>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Security status">
          <ShieldCheck className="size-4 text-emerald-400" />
        </Button>
        <span className="bg-primary/15 text-primary grid size-8 place-items-center rounded-full text-xs font-semibold">
          GC
        </span>
      </div>
    </header>
  );
}
