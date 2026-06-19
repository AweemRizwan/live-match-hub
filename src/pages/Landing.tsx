import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Radio, Ticket } from "lucide-react";

export default function Landing() {
  return (
    <div>
      <section className="container py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-live" />
          University Campus Streaming & Engagement
        </div>
        <h1 className="font-heading text-5xl md:text-7xl tracking-tight mb-6">
          Host. Stream. Engage.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          EventSphere is the modular platform for campus events — from talks and tournaments to live streamed ceremonies and ticketed concerts.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg"><Link to="/events">Browse events</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth">Get started</Link></Button>
        </div>
      </section>
      <section className="container grid md:grid-cols-4 gap-4 pb-20">
        {[
          { icon: Calendar, t: "Event CRUD", d: "Organizers create, schedule, and publish." },
          { icon: Ticket, t: "Ticketing", d: "Free, standard, VIP tiers with capacity." },
          { icon: Radio, t: "Live Streaming", d: "Embed streams for online attendees." },
          { icon: Users, t: "RBAC", d: "Admin, Organizer, Attendee, Sponsor." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="p-6 rounded-xl bg-card border border-border">
            <Icon className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-heading text-lg mb-1">{t}</h3>
            <p className="text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}