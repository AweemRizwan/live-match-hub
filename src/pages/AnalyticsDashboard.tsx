import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/lib/analytics";
import { Header } from "@/components/Header";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { useMemo } from "react";

export default function AnalyticsDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: getAnalytics, refetchInterval: 30000 });

  const dailyVisitors = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Set<string>>();
    data.visits.forEach((v) => {
      const day = v.created_at.slice(0, 10);
      if (!map.has(day)) map.set(day, new Set());
      map.get(day)!.add(v.visitor_id);
    });
    return Array.from(map.entries())
      .map(([date, visitors]) => ({ date, visitors: visitors.size, views: data.visits.filter((v) => v.created_at.startsWith(date)).length }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const matchViewCounts = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { title: string; views: number }>();
    data.matchViews.forEach((v: any) => {
      const id = v.match_id;
      const title = v.matches?.title ?? "Unknown";
      if (!map.has(id)) map.set(id, { title, views: 0 });
      map.get(id)!.views++;
    });
    return Array.from(map.values()).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [data]);

  const totalVisitors = useMemo(() => {
    if (!data) return 0;
    return new Set(data.visits.map((v) => v.visitor_id)).size;
  }, [data]);

  const peakViewers = useMemo(() => {
    if (!dailyVisitors.length) return 0;
    return Math.max(...dailyVisitors.map((d) => d.visitors));
  }, [dailyVisitors]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Analytics Dashboard</h1>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Visitors", value: totalVisitors },
                { label: "Peak Daily Viewers", value: peakViewers },
                { label: "Total Page Views", value: data?.visits.length ?? 0 },
                { label: "Total Ad Impressions", value: data?.ads.reduce((s, a) => s + a.impressions_count, 0) ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-heading font-bold text-primary">{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Daily visitors chart */}
            <div className="rounded-lg border border-border bg-card p-6 mb-8">
              <h2 className="font-heading text-xl font-semibold text-card-foreground mb-4">Daily Visitors & Page Views</h2>
              {dailyVisitors.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyVisitors}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
                    <XAxis dataKey="date" stroke="hsl(215 12% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 12% 55%)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 11%)", border: "1px solid hsl(220 14% 20%)", borderRadius: 8, color: "hsl(210 20% 95%)" }} />
                    <Line type="monotone" dataKey="visitors" stroke="hsl(145 72% 40%)" strokeWidth={2} name="Unique Visitors" />
                    <Line type="monotone" dataKey="views" stroke="hsl(34 100% 50%)" strokeWidth={2} name="Page Views" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No data yet</p>
              )}
            </div>

            {/* Match views chart */}
            <div className="rounded-lg border border-border bg-card p-6 mb-8">
              <h2 className="font-heading text-xl font-semibold text-card-foreground mb-4">Views Per Match</h2>
              {matchViewCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={matchViewCounts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
                    <XAxis dataKey="title" stroke="hsl(215 12% 55%)" fontSize={11} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(215 12% 55%)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 11%)", border: "1px solid hsl(220 14% 20%)", borderRadius: 8, color: "hsl(210 20% 95%)" }} />
                    <Bar dataKey="views" fill="hsl(145 72% 40%)" radius={[4, 4, 0, 0]} name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No match views yet</p>
              )}
            </div>

            {/* Ad impressions */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-heading text-xl font-semibold text-card-foreground mb-4">Ad Impressions</h2>
              {data && data.ads.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.ads}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
                    <XAxis dataKey="title" stroke="hsl(215 12% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 12% 55%)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 11%)", border: "1px solid hsl(220 14% 20%)", borderRadius: 8, color: "hsl(210 20% 95%)" }} />
                    <Bar dataKey="impressions_count" fill="hsl(34 100% 50%)" radius={[4, 4, 0, 0]} name="Impressions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No ads yet</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
