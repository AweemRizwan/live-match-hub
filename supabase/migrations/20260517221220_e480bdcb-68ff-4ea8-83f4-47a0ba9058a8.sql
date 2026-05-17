
-- ============ CLEANUP OLD SPORTS APP ============
DROP TABLE IF EXISTS public.match_viewers CASCADE;
DROP TABLE IF EXISTS public.page_visits CASCADE;
DROP TABLE IF EXISTS public.ads CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TYPE IF EXISTS public.match_sport CASCADE;
DROP TYPE IF EXISTS public.match_status CASCADE;
DROP TYPE IF EXISTS public.ad_position CASCADE;
DROP FUNCTION IF EXISTS public.increment_ad_impressions(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_viewer_count(uuid) CASCADE;

-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer', 'attendee', 'sponsor');
CREATE TYPE public.event_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.ticket_type AS ENUM ('free', 'standard', 'vip', 'premium');
CREATE TYPE public.booking_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- ============ UTIL ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'attendee'::app_role)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
INSERT INTO public.categories (name, slug) VALUES
  ('Tech', 'tech'), ('Gaming', 'gaming'), ('Education', 'education'),
  ('Business', 'business'), ('Music', 'music');

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  event_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  stream_url TEXT,
  capacity INTEGER,
  banner_url TEXT,
  status event_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_category ON public.events(category_id);
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TICKETS ============
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type ticket_type NOT NULL DEFAULT 'standard',
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tickets_event ON public.tickets(event_id);

-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_event ON public.bookings(event_id);
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payments_booking ON public.payments(booking_id);

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- categories
CREATE POLICY "Anyone reads categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- events
CREATE POLICY "Public reads approved events" ON public.events FOR SELECT
  USING (
    status = 'approved'
    OR organizer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Organizers create events" ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id
    AND (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Organizers update own events" ON public.events FOR UPDATE
  USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Organizers delete own events" ON public.events FOR DELETE
  USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- tickets
CREATE POLICY "Public reads tickets" ON public.tickets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id
      AND (e.status = 'approved' OR e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "Organizers manage event tickets" ON public.tickets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

-- bookings
CREATE POLICY "Users view own bookings" ON public.bookings FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );
CREATE POLICY "Users create own bookings" ON public.bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own bookings" ON public.bookings FOR UPDATE
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- payments
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

-- storage policies for event-banners
CREATE POLICY "Public reads event banners" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-banners');
CREATE POLICY "Authed users upload event banners" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-banners' AND auth.uid() IS NOT NULL);
CREATE POLICY "Owners update event banners" ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-banners' AND owner = auth.uid());
CREATE POLICY "Owners delete event banners" ON storage.objects FOR DELETE
  USING (bucket_id = 'event-banners' AND owner = auth.uid());
