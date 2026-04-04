import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Ad = Tables<"ads">;
export type AdPosition = "top_banner" | "side_banner";

export async function fetchActiveAds(position?: AdPosition) {
  let query = supabase.from("ads").select("*").eq("is_active", true);
  if (position) query = query.eq("position", position);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchAllAds() {
  const { data, error } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAd(ad: { title: string; image_url: string; position: AdPosition; display_duration_seconds: number }) {
  const { data, error } = await supabase.from("ads").insert(ad).select().single();
  if (error) throw error;
  return data;
}

export async function updateAd(id: string, updates: Partial<Ad>) {
  const { data, error } = await supabase.from("ads").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAd(id: string) {
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementImpressions(adId: string) {
  await supabase.rpc("increment_ad_impressions", { ad_id: adId });
}

export async function uploadAdImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("ads").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("ads").getPublicUrl(path);
  return data.publicUrl;
}
