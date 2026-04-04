import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMatch, extractYoutubeId, SPORTS } from "@/lib/matches";
import { trackPageVisit } from "@/lib/analytics";
import { StatusBadge } from "@/components/StatusBadge";
import { AdBanner } from "@/components/AdBanner";
import { ViewerCount } from "@/components/ViewerCount";
import { Header } from "@/components/Header";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: () => fetchMatch(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (id) trackPageVisit("match", id);
  }, [id]);

  const videoId = match ? extractYoutubeId(match.youtube_link) : null;
  const sport = match ? SPORTS.find((s) => s.value === match.sport) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
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
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {/* Top banner ad */}
              <AdBanner position="top_banner" className="mb-6" />

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-muted-foreground">{sport?.icon} {sport?.label}</span>
                <StatusBadge status={match.status} />
                {match.status === "live" && <ViewerCount matchId={match.id} />}
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
                {match.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-1">
                {match.team_home} <span className="text-primary font-semibold">vs</span> {match.team_away}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
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
            </div>
            {/* Side banner ad */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <AdBanner position="side_banner" className="sticky top-20" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
