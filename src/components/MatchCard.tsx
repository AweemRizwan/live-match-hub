import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { Match } from "@/lib/matches";
import { SPORTS } from "@/lib/matches";
import { StatusBadge } from "./StatusBadge";

export function MatchCard({ match }: { match: Match }) {
  const sport = SPORTS.find((s) => s.value === match.sport);
  return (
    <Link
      to={`/match/${match.id}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{sport?.icon} {sport?.label}</span>
        <StatusBadge status={match.status} />
      </div>
      <h3 className="font-heading text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
        {match.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-1">
        {match.team_home} <span className="text-primary font-semibold">vs</span> {match.team_away}
      </p>
      <p className="text-xs text-muted-foreground">
        {format(new Date(match.match_date), "PPP · p")}
      </p>
    </Link>
  );
}
