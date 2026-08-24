import Link from "next/link";
import {
  Archive,
  BarChart3,
  BookOpenText,
  Clapperboard,
  LayoutDashboard,
  LibraryBig,
  Radio,
  Settings2,
  Sparkles,
  Subtitles,
  Tv2,
} from "lucide-react";

import { AppMark } from "@/components/layout/app-mark";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/live-service", label: "Live Service", icon: Radio },
  { href: "/presentations", label: "Presentations", icon: Clapperboard },
  { href: "/scriptures", label: "Scriptures", icon: BookOpenText },
  { href: "/lyrics", label: "Lyrics", icon: Subtitles },
  { href: "/streaming", label: "Streaming", icon: Tv2 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/library", label: "Church Library", icon: LibraryBig },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="border-border bg-sidebar hidden w-64 shrink-0 flex-col border-r lg:flex">
      <div className="p-5">
        <AppMark />
      </div>
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3 py-2">
        {navigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active && "bg-sidebar-accent text-foreground shadow-sm",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-sidebar-border border-t p-3">
        <Link
          href="/settings"
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
        >
          <Settings2 aria-hidden="true" className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
