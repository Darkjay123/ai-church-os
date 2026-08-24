import { Church } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg shadow-[0_0_20px_rgba(43,127,255,0.25)]">
        <Church aria-hidden="true" className="size-4" strokeWidth={2.4} />
      </span>
      <span className="leading-none">
        <span className="block text-sm font-semibold tracking-tight">AI Church OS</span>
        <span className="text-muted-foreground mt-1 block text-[10px] font-medium tracking-[0.16em] uppercase">
          Production Console
        </span>
      </span>
    </div>
  );
}
