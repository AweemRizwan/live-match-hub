import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Match = Tables<"matches">;
export type MatchSport = "cricket" | "football" | "basketball";
export type MatchStatus = "upcoming" | "live" | "finished";

export const SPORTS: { value: MatchSport; label: string; icon: string }[] = [
  { value: "cricket", label: "Cricket", icon: "🏏" },
  { value: "football", label: "Football", icon: "⚽" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
];

export const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

export async function fetchMatches(sport?: MatchSport) {
  let query = supabase.from("matches").select("*").order("match_date", { ascending: false });
  if (sport) query = query.eq("sport", sport);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchMatch(id: string) {
  const { data, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMatch(match: Omit<Match, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("matches").insert(match).select().single();
  if (error) throw error;
  return data;
}

export async function updateMatch(id: string, updates: Partial<Match>) {
  const { data, error } = await supabase.from("matches").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMatch(id: string) {
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw error;
}

export function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/))([^?&\s]+)/);
  return match ? match[1] : null;
}
