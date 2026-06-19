import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("bookings")
      .select("*, events(id,title,event_date,venue), tickets(name,type)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setBookings(data ?? []));
  }, [user]);

  return (
    <div className="container py-12">
      <h1 className="font-heading text-4xl mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings yet. <Link to="/events" className="text-primary">Browse events</Link>.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
              <div>
                <Link to={`/events/${b.events?.id}`} className="font-heading text-lg hover:text-primary">
                  {b.events?.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {b.tickets?.name} · {b.events?.event_date ? new Date(b.events.event_date).toLocaleString() : ""}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={b.status === "paid" ? "default" : "secondary"}>{b.status}</Badge>
                <p className="text-sm mt-1">{b.total_cents === 0 ? "Free" : `$${(b.total_cents / 100).toFixed(2)}`}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}