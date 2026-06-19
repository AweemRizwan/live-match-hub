import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EventTickets() {
  const { id } = useParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", type: "standard", price: "", quantity: "" });

  const load = () => {
    if (!id) return;
    supabase.from("tickets").select("*").eq("event_id", id).order("price_cents")
      .then(({ data }) => setTickets(data ?? []));
  };
  useEffect(load, [id]);

  const add = async () => {
    if (!id) return;
    const { error } = await supabase.from("tickets").insert({
      event_id: id,
      name: form.name,
      type: form.type as any,
      price_cents: Math.round(Number(form.price || 0) * 100),
      quantity: Number(form.quantity || 0),
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ name: "", type: "standard", price: "", quantity: "" });
    load();
  };

  const remove = async (tid: string) => {
    const { error } = await supabase.from("tickets").delete().eq("id", tid);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-heading text-3xl mb-6">Manage Tickets</h1>
      <div className="rounded-xl border border-border bg-card p-5 mb-6 grid sm:grid-cols-5 gap-3 items-end">
        <div className="sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label>Qty</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
        <Button onClick={add} disabled={!form.name || !form.quantity} className="sm:col-span-5">Add tier</Button>
      </div>
      <div className="space-y-2">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{t.name} <span className="text-xs text-accent uppercase ml-2">{t.type}</span></p>
              <p className="text-sm text-muted-foreground">
                {t.price_cents === 0 ? "Free" : `$${(t.price_cents / 100).toFixed(2)}`} · {t.sold}/{t.quantity} sold
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}