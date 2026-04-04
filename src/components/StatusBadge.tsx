import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/lib/matches";

const config: Record<MatchStatus, { label: string; className: string }> = {
  live: { label: "● LIVE", className: "bg-live/20 text-live animate-pulse-live" },
  upcoming: { label: "UPCOMING", className: "bg-upcoming/20 text-upcoming" },
  finished: { label: "FINISHED", className: "bg-finished/20 text-finished" },
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-heading font-semibold uppercase tracking-wider", c.className)}>
      {c.label}
    </span>
  );
}
