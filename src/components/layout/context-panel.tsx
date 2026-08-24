import { Check, CircleHelp, Cpu, LockKeyhole } from "lucide-react";

import { StatusDot } from "@/components/layout/status-dot";

const checks = [
  "Protected route gate",
  "Organisation scope",
  "Realtime transport",
  "Audit readiness",
];

export function ContextPanel() {
  return (
    <aside className="border-border bg-card/40 hidden w-72 shrink-0 border-l p-5 2xl:block">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">System context</h2>
        <CircleHelp className="text-muted-foreground size-4" />
      </div>
      <div className="border-border bg-background mt-5 rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
            <Cpu className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">AI Brain</p>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
              <StatusDot tone="healthy" />
              Foundation online
            </p>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-xs leading-5">
          Centralised intelligence is reserved for live-service modules. No
          feature-level AI logic is permitted.
        </p>
      </div>
      <div className="mt-5">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
          Sprint 0 checks
        </p>
        <ul className="mt-3 space-y-3">
          {checks.map((check) => (
            <li
              key={check}
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <Check className="size-3.5 text-emerald-400" />
              {check}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-primary/20 bg-primary/5 mt-7 rounded-xl border p-4">
        <LockKeyhole className="text-primary size-4" />
        <p className="mt-2 text-sm font-medium">Tenant-safe by default</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Church data is designed to remain isolated at the database layer through RLS.
        </p>
      </div>
    </aside>
  );
}
