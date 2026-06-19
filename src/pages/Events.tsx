import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Radio } from "lucide-react";

type EventRow = {
  id: string; title: string; description: string | null;
  event_date: string; venue: string | null; is_online: boolean;
  banner_url: string | null;
  categories?: { name: string } | null;
};

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("events")
      .select("id,title,description,event_date,venue,is_online,banner_url,categories(name)")
      .eq("status", "approved")
      .order("event_date", { ascending: true })
      .then(({ data }) => { setEvents((data as any) ?? []); setLoading(false); });
  }, []);

  return (
    <div className="container py-12">
      <h1 className="font-heading text-4xl mb-2">Upcoming Events</h1>
      <p className="text-muted-foreground mb-8">Browse approved campus events.</p>
      {loading ? <p className="text-muted-foreground">Loading…</p> :
        events.length === 0 ? <p className="text-muted-foreground">No approved events yet.</p> :
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className="rounded-xl bg-card border border-border overflow-hidden hover:border-primary transition">
              <div className="aspect-video bg-secondary flex items-center justify-center">
                {e.banner_url
                  ? <img src={e.banner_url} alt={e.title} className="w-full h-full object-cover" />
                  : <Calendar className="h-10 w-10 text-muted-foreground" />}
              </div>
              <div className="p-5 space-y-2">
                {e.categories?.name && <span className="text-xs text-accent">{e.categories.name}</span>}
                <h3 className="font-heading text-xl">{e.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(e.event_date).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1">
                    {e.is_online ? <><Radio className="h-3 w-3" />Online</> : <><MapPin className="h-3 w-3" />{e.venue}</>}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      }
    </div>
  );
}