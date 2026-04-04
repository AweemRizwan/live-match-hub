import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMatches, type MatchSport } from "@/lib/matches";
import { trackPageVisit } from "@/lib/analytics";
import { MatchCard } from "@/components/MatchCard";
import { SportFilter } from "@/components/SportFilter";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";

export default function Index() {
  const [sport, setSport] = useState<MatchSport | null>(null);
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches", sport],
    queryFn: () => fetchMatches(sport ?? undefined),
  });

  useEffect(() => { trackPageVisit("home"); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground mb-2">
            Live & Upcoming Matches
          </h1>
          <p className="text-muted-foreground">Watch your favorite sports live, all in one place.</p>
        </div>
        <div className="mb-6">
          <SportFilter selected={sport} onChange={setSport} />
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : matches?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No matches found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches?.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </main>
    </div>
  );
}
