import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([]);

  const load = () =>
    supabase.from("events").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setEvents(data ?? []));

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("events").update({ status: status as any }).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `Event ${status}` });
    load();
  };

  return (
    <div className="container py-12">
      <h1 className="font-heading text-4xl mb-2">Admin · Event Approvals</h1>
      <p className="text-muted-foreground mb-6">Review submitted events.</p>
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
              <Button size="sm" onClick={() => setStatus(e.id, "approved")}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(e.id, "rejected")}>Reject</Button>
              <Button size="sm" variant="destructive" onClick={() => setStatus(e.id, "cancelled")}>Cancel</Button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-muted-foreground">No events.</p>}
      </div>
    </div>
  );
}