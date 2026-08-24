import type { ReactNode } from "react";

import { AppMark } from "@/components/layout/app-mark";
import { StatusDot } from "@/components/layout/status-dot";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="border-border relative hidden overflow-hidden border-r bg-[radial-gradient(circle_at_15%_15%,rgba(43,127,255,0.18),transparent_34%),linear-gradient(150deg,#090c12_0%,#101722_100%)] p-10 lg:flex lg:flex-col">
        <AppMark />
        <div className="my-auto max-w-xl">
          <p className="text-primary mb-5 text-xs font-semibold tracking-[0.18em] uppercase">
            The operating system for modern churches
          </p>
          <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight text-white">
            Run every moment of your service with clarity.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
            Presentations, scripture, lyrics, livestream production, and sermon
            intelligence—connected through one operator-first AI Brain.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <StatusDot tone="healthy" />
          Production foundation · Secure by design
        </div>
      </section>
      <section className="flex min-h-screen flex-col px-6 py-7 sm:px-12 lg:px-16">
        <AppMark className="lg:hidden" />
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">
          {children}
        </div>
        <p className="text-muted-foreground text-center text-xs">
          AI Church OS · Built for the people serving behind the scenes.
        </p>
      </section>
    </main>
  );
}
