import { cn } from "@/lib/utils";

type StatusTone = "healthy" | "warning" | "danger" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  healthy: "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]",
  warning: "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]",
  danger: "bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.12)]",
  neutral: "bg-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,0.12)]",
};

export function StatusDot({
  tone = "neutral",
  className,
}: {
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-1.5 rounded-full", toneClasses[tone], className)}
    />
  );
}
