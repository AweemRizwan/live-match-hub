import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Radio, Ticket as TicketIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EventDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("events").select("*, categories(name)").eq("id", id).maybeSingle()
      .then(({ data }) => setEvent(data));
    supabase.from("tickets").select("*").eq("event_id", id).order("price_cents")
      .then(({ data }) => setTickets(data ?? []));
  }, [id]);

  const book = async (ticket: any) => {
    if (!user) return nav("/auth");
    setBusy(ticket.id);
    const isFree = ticket.price_cents === 0;
    const { error } = await supabase.from("bookings").insert({
      event_id: event.id,
      ticket_id: ticket.id,
      user_id: user.id,
      quantity: 1,
      total_cents: ticket.price_cents,
      status: isFree ? "paid" : "pending",
    });
    setBusy(null);
    if (error) return toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    if (isFree) {
      toast({ title: "Booked!", description: "Free ticket reserved." });
      nav("/dashboard");
    } else {
      toast({
        title: "Booking pending",
        description: "Stripe checkout will be wired in once payments are enabled. Your booking is on hold.",
      });
      nav("/dashboard");
    }
  };

  if (!event) return <div className="container py-12 text-muted-foreground">Loading…</div>;

  return (
    <div className="container py-12 max-w-4xl">
      <div className="aspect-video bg-secondary rounded-2xl overflow-hidden mb-6">
        {event.banner_url
          ? <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Calendar className="h-16 w-16 text-muted-foreground" /></div>}
      </div>
      {event.categories?.name && <span className="text-sm text-accent">{event.categories.name}</span>}
      <h1 className="font-heading text-4xl mt-2 mb-4">{event.title}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(event.event_date).toLocaleString()}</span>
        <span className="inline-flex items-center gap-1.5">
          {event.is_online ? <><Radio className="h-4 w-4" />Online stream</> : <><MapPin className="h-4 w-4" />{event.venue}</>}
        </span>
        {event.capacity && <span>Capacity: {event.capacity}</span>}
      </div>
      <p className="text-foreground/80 mb-10 whitespace-pre-wrap">{event.description}</p>

      <h2 className="font-heading text-2xl mb-4">Tickets</h2>
      {tickets.length === 0 ? (
        <p className="text-muted-foreground">No tickets available.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {tickets.map((t) => {
            const soldOut = t.sold >= t.quantity;
            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-xl">{t.name}</h3>
                  <span className="text-xs uppercase text-accent">{t.type}</span>
                </div>
                <p className="text-2xl font-semibold mb-2">
                  {t.price_cents === 0 ? "Free" : `$${(t.price_cents / 100).toFixed(2)}`}
                </p>
                <p className="text-xs text-muted-foreground mb-3">{t.sold} / {t.quantity} sold</p>
                <Button onClick={() => book(t)} disabled={soldOut || busy === t.id} className="w-full">
                  <TicketIcon className="h-4 w-4" />
                  {soldOut ? "Sold out" : t.price_cents === 0 ? "Reserve" : "Book"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}