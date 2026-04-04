
-- Ads table
CREATE TYPE public.ad_position AS ENUM ('top_banner', 'side_banner');

CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  position ad_position NOT NULL DEFAULT 'top_banner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  impressions_count INTEGER NOT NULL DEFAULT 0,
  display_duration_seconds INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ads viewable by everyone" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ads" ON public.ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ads" ON public.ads FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ads" ON public.ads FOR DELETE USING (true);

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Page visits for analytics
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visits viewable by everyone" ON public.page_visits FOR SELECT USING (true);
CREATE POLICY "Anyone can log visits" ON public.page_visits FOR INSERT WITH CHECK (true);

CREATE INDEX idx_page_visits_created ON public.page_visits(created_at);
CREATE INDEX idx_page_visits_match ON public.page_visits(match_id);

-- Match viewers for real-time presence
CREATE TABLE public.match_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, viewer_id)
);

ALTER TABLE public.match_viewers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewers viewable by everyone" ON public.match_viewers FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert viewers" ON public.match_viewers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update viewers" ON public.match_viewers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete viewers" ON public.match_viewers FOR DELETE USING (true);

-- Increment ad impressions function
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ads SET impressions_count = impressions_count + 1 WHERE id = ad_id;
$$;

-- Count active viewers (last seen within 30 seconds)
CREATE OR REPLACE FUNCTION public.get_active_viewer_count(p_match_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.match_viewers
  WHERE match_id = p_match_id AND last_seen > now() - interval '30 seconds';
$$;

-- Storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true);

CREATE POLICY "Ad images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'ads');
CREATE POLICY "Anyone can upload ad images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ads');
CREATE POLICY "Anyone can update ad images" ON storage.objects FOR UPDATE USING (bucket_id = 'ads');
CREATE POLICY "Anyone can delete ad images" ON storage.objects FOR DELETE USING (bucket_id = 'ads');
