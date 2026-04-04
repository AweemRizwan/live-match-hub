import { supabase } from "@/integrations/supabase/client";

function getVisitorId(): string {
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

export async function trackPageVisit(page: string, matchId?: string) {
  const visitor_id = getVisitorId();
  await supabase.from("page_visits").insert({
    page,
    match_id: matchId ?? null,
    visitor_id,
  });
}

export async function upsertViewer(matchId: string) {
  const viewer_id = getVisitorId();
  await supabase.from("match_viewers").upsert(
    { match_id: matchId, viewer_id, last_seen: new Date().toISOString() },
    { onConflict: "match_id,viewer_id" }
  );
}

export async function removeViewer(matchId: string) {
  const viewer_id = getVisitorId();
  await supabase.from("match_viewers").delete().eq("match_id", matchId).eq("viewer_id", viewer_id);
}

export async function getActiveViewerCount(matchId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_active_viewer_count", { p_match_id: matchId });
  if (error) return 0;
  return data ?? 0;
}

export async function getAnalytics() {
  // Daily visitors (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: visits } = await supabase
    .from("page_visits")
    .select("created_at, page, match_id, visitor_id")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: true });

  // Total ad impressions
  const { data: ads } = await supabase.from("ads").select("id, title, impressions_count");

  // Match view counts
  const { data: matchViews } = await supabase
    .from("page_visits")
    .select("match_id, matches(title)")
    .not("match_id", "is", null);

  return { visits: visits ?? [], ads: ads ?? [], matchViews: matchViews ?? [] };
}
