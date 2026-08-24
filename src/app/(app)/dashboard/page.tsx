import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CirclePlay,
  LayoutTemplate,
  Mic2,
  Plus,
  Radio,
  Sparkles,
  Subtitles,
  Waves,
} from "lucide-react";

const quickActions = [
  {
    href: "/live-service",
    label: "Start live service",
    detail: "Open the control room",
    icon: Radio,
    primary: true,
  },
  {
    href: "/presentations",
    label: "New presentation",
    detail: "Build a service deck",
    icon: LayoutTemplate,
  },
  {
    href: "/scriptures",
    label: "Search scripture",
    detail: "Fast lookup and display",
    icon: Sparkles,
  },
];

const systemCards = [
  {
    label: "AI Brain",
    value: "Foundation ready",
    detail: "Central service boundary is in place",
    icon: Sparkles,
    tone: "text-emerald-300",
  },
  {
    label: "Streaming",
    value: "Not connected",
    detail: "OBS integration arrives in Sprint 5",
    icon: Waves,
    tone: "text-sky-300",
  },
  {
    label: "Subtitles",
    value: "Standby",
    detail: "Live transcription arrives in Sprint 6",
    icon: Subtitles,
    tone: "text-amber-300",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-primary text-sm font-medium">Your workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Live Service Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Your calm control room for preparing, running, and preserving every service.
          </p>
        </div>
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition"
          href="/live-service"
        >
          <Plus className="size-4" />
          Create service
        </Link>
      </div>
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {quickActions.map(({ href, label, detail, icon: Icon, primary }) => (
          <Link
            className={
              primary
                ? "group border-primary bg-primary text-primary-foreground flex min-h-36 flex-col rounded-xl border p-5 text-left shadow-[0_12px_38px_rgba(43,127,255,0.18)]"
                : "group border-border bg-card hover:border-primary/40 hover:bg-card/80 flex min-h-36 flex-col rounded-xl border p-5 text-left transition"
            }
            href={href}
            key={label}
          >
            <Icon className="size-5" />
            <span className="mt-auto flex w-full items-end justify-between">
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span
                  className={
                    primary
                      ? "text-primary-foreground/70 mt-1 block text-xs"
                      : "text-muted-foreground mt-1 block text-xs"
                  }
                >
                  {detail}
                </span>
              </span>
              <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="border-border bg-card rounded-xl border">
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Next service</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Service scheduling begins in Sprint 2.
              </p>
            </div>
            <CalendarClock className="text-muted-foreground size-4" />
          </div>
          <div className="flex min-h-60 flex-col items-center justify-center p-6 text-center">
            <span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-full">
              <CirclePlay className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">
              Your first service starts here
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
              The foundation is ready. Service scheduling, presentation assets, and live
              controls will arrive in roadmap order.
            </p>
            <Link
              className="border-border bg-background hover:bg-muted mt-5 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition"
              href="/live-service"
            >
              <Radio className="size-4" />
              View live control room
            </Link>
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Foundation status</h2>
              <p className="text-muted-foreground mt-1 text-xs">Sprint 0 delivery</p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Ready for config
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {systemCards.map(({ label, value, detail, icon: Icon, tone }) => (
              <div className="flex gap-3" key={label}>
                <span className="bg-muted grid size-8 shrink-0 place-items-center rounded-lg">
                  <Icon className={`size-4 ${tone}`} />
                </span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    <span className={`text-xs ${tone}`}>{value}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <InfoCard
          title="Presentation engine"
          detail="Sprint 3 · Slides, themes, media, and display controls."
          icon={LayoutTemplate}
        />
        <InfoCard
          title="Scripture engine"
          detail="Sprint 4 · Fast lookup, translations, favourites, and history."
          icon={Mic2}
        />
        <InfoCard
          title="Archive intelligence"
          detail="Sprint 12 · Searchable sermon records, summaries, and exports."
          icon={Subtitles}
        />
      </section>
    </div>
  );
}

function InfoCard({
  title,
  detail,
  icon: Icon,
}: {
  title: string;
  detail: string;
  icon: typeof LayoutTemplate;
}) {
  return (
    <div className="border-border bg-card/55 rounded-xl border p-4">
      <Icon className="text-primary size-4" />
      <h3 className="mt-4 text-sm font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-xs leading-5">{detail}</p>
    </div>
  );
}
