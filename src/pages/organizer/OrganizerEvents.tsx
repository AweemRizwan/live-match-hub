import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket } from "lucide-react";

export default function OrganizerEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("events").select("*").eq("organizer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setEvents(data ?? []));
  }, [user]);

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-4xl">My Events</h1>
          <p className="text-muted-foreground">Create and manage your events.</p>
        </div>
        <Button asChild><Link to="/organizer/events/new"><Plus className="h-4 w-4" />New event</Link></Button>
      </div>
      {events.length === 0 ? (
        <p className="text-muted-foreground">No events yet. Create your first one.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading text-lg">{e.title}</h3>
                  <Badge variant="outline">{e.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{new Date(e.event_date).toLocaleString()} · {e.venue || "Online"}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline"><Link to={`/organizer/events/${e.id}/tickets`}><Ticket className="h-4 w-4" />Tickets</Link></Button>
                <Button asChild size="sm" variant="ghost"><Link to={`/organizer/events/${e.id}`}>Edit</Link></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}