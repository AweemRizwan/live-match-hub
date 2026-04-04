import { cn } from "@/lib/utils";
import { SPORTS, type MatchSport } from "@/lib/matches";

interface Props {
  selected: MatchSport | null;
  onChange: (sport: MatchSport | null) => void;
}

export function SportFilter({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium transition-colors border",
          !selected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
        )}
      >
        All Sports
      </button>
      {SPORTS.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors border",
            selected === s.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
          )}
        >
          {s.icon} {s.label}
        </button>
      ))}
    </div>
  );
}
