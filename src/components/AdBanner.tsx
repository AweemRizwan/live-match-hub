import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveAds, incrementImpressions, type Ad, type AdPosition } from "@/lib/ads";

interface Props {
  position: AdPosition;
  className?: string;
}

export function AdBanner({ position, className = "" }: Props) {
  const { data: ads } = useQuery({
    queryKey: ["ads", position],
    queryFn: () => fetchActiveAds(position),
    refetchInterval: 60000,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [impressionTracked, setImpressionTracked] = useState<string | null>(null);

  const activeAds = ads ?? [];

  const trackImpression = useCallback(
    async (ad: Ad) => {
      if (impressionTracked !== ad.id) {
        setImpressionTracked(ad.id);
        await incrementImpressions(ad.id);
      }
    },
    [impressionTracked]
  );

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const current = activeAds[currentIndex];
    if (!current) return;

    const timer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % activeAds.length);
      setImpressionTracked(null);
    }, current.display_duration_seconds * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, activeAds]);

  useEffect(() => {
    const ad = activeAds[currentIndex];
    if (ad) trackImpression(ad);
  }, [currentIndex, activeAds, trackImpression]);

  if (activeAds.length === 0) return null;

  const ad = activeAds[currentIndex];
  if (!ad) return null;

  const isTop = position === "top_banner";

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-card ${className}`}
    >
      <div className="relative">
        <span className="absolute top-1 left-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
          Ad
        </span>
        <img
          src={ad.image_url}
          alt={ad.title}
          className={`w-full object-cover ${isTop ? "h-20 md:h-28" : "h-auto max-h-64"}`}
        />
      </div>
    </div>
  );
}
