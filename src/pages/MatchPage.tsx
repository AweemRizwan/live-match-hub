import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMatch, extractYoutubeId, SPORTS } from "@/lib/matches";
import { StatusBadge } from "@/components/StatusBadge";
import { Header } from "@/components/Header";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: () => fetchMatch(id!),
    enabled: !!id,
  });

  const videoId = match ? extractYoutubeId(match.youtube_link) : null;
  const sport = match ? SPORTS.find((s) => s.value === match.sport) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to matches
        </Link>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !match ? (
          <p className="text-center py-20 text-muted-foreground text-lg">Match not found.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground">{sport?.icon} {sport?.label}</span>
              <StatusBadge status={match.status} />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              {match.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-1">
              {match.team_home} <span className="text-primary font-semibold">vs</span> {match.team_away}
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              {format(new Date(match.match_date), "PPPP · p")}
            </p>
            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-card">
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  title={match.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Invalid video link
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
