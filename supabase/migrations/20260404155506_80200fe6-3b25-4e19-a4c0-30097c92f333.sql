
CREATE TYPE public.match_sport AS ENUM ('cricket', 'football', 'basketball');
CREATE TYPE public.match_status AS ENUM ('upcoming', 'live', 'finished');

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sport match_sport NOT NULL,
  title TEXT NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  youtube_link TEXT NOT NULL,
  status match_status NOT NULL DEFAULT 'upcoming',
  match_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update matches"
  ON public.matches FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete matches"
  ON public.matches FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
