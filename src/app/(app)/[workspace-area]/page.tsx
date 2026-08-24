import { Construction } from "lucide-react";

const plannedAreas: Record<
  string,
  { title: string; sprint: string; description: string }
> = {
  presentations: {
    title: "Presentations",
    sprint: "Sprint 3",
    description: "Presentation editing, slides, media, themes, and display controls.",
  },
  scriptures: {
    title: "Scriptures",
    sprint: "Sprint 4",
    description:
      "Fast scripture lookup, translations, favourites, history, and display.",
  },
  lyrics: {
    title: "Lyrics",
    sprint: "Sprint 9",
    description:
      "Worship library, playlists, recognition, and operator-led lyric control.",
  },
  streaming: {
    title: "Streaming",
    sprint: "Sprint 5",
    description: "OBS connection health, overlays, and broadcast outputs.",
  },
  "ai-assistant": {
    title: "AI Assistant",
    sprint: "Sprint 11",
    description:
      "One central AI Brain interface for contextual commands and suggestions.",
  },
  library: {
    title: "Church Library",
    sprint: "Sprint 10",
    description:
      "Searchable ministry media, sermons, songs, books, and teaching series.",
  },
  archive: {
    title: "Archive",
    sprint: "Sprint 12",
    description: "Automatic, searchable sermon archives and intelligence.",
  },
  analytics: {
    title: "Analytics",
    sprint: "Sprint 13",
    description:
      "Service history, intelligence accuracy, latency, and streaming metrics.",
  },
};

export function generateStaticParams() {
  return Object.keys(plannedAreas).map((workspaceArea) => ({ workspaceArea }));
}

export default async function PlannedWorkspaceArea({
  params,
}: {
  params: Promise<{ workspaceArea: string }>;
}) {
  const { workspaceArea } = await params;
  const area = plannedAreas[workspaceArea] ?? {
    title: "Workspace",
    sprint: "Roadmap",
    description: "This protected workspace area is not available yet.",
  };
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center p-8">
      <div className="border-border bg-card w-full rounded-xl border p-8">
        <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-lg">
          <Construction className="size-5" />
        </span>
        <p className="text-primary mt-6 text-sm font-medium">{area.sprint}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{area.title}</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
          {area.description}
        </p>
        <p className="border-border text-muted-foreground mt-8 border-t pt-5 text-sm">
          This area stays visible in the persistent workspace navigation so teams know
          what is coming, while production functionality ships in roadmap order.
        </p>
      </div>
    </section>
  );
}
