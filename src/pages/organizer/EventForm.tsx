import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function EventForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    title: "", description: "", category_id: "", event_date: "",
    venue: "", is_online: false, stream_url: "", capacity: "", banner_url: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => setCategories(data ?? []));
    if (!isNew && id) {
      supabase.from("events").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (data) setForm({
          ...data,
          event_date: data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : "",
          capacity: data.capacity ?? "",
        });
      });
    }
  }, [id, isNew]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const payload: any = {
      title: form.title,
      description: form.description || null,
      category_id: form.category_id || null,
      event_date: new Date(form.event_date).toISOString(),
      venue: form.venue || null,
      is_online: form.is_online,
      stream_url: form.stream_url || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      banner_url: form.banner_url || null,
    };
    let error;
    if (isNew) {
      payload.organizer_id = user.id;
      payload.status = "pending";
      ({ error } = await supabase.from("events").insert(payload));
    } else {
      ({ error } = await supabase.from("events").update(payload).eq("id", id!));
    }
    setBusy(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: isNew ? "Event submitted for approval" : "Event updated" });
    nav("/dashboard");
  };

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="font-heading text-3xl mb-6">{isNew ? "New Event" : "Edit Event"}</h1>
      <div className="space-y-4 rounded-xl bg-card border border-border p-6">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <Label>Category</Label>
          <Select value={form.category_id || undefined} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Date & time</Label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
        <div className="flex items-center justify-between">
          <Label>Online event</Label>
          <Switch checked={form.is_online} onCheckedChange={(v) => setForm({ ...form, is_online: v })} />
        </div>
        {form.is_online ? (
          <div><Label>Stream URL</Label><Input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} /></div>
        ) : (
          <div><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          <div><Label>Banner URL</Label><Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} /></div>
        </div>
        <Button onClick={save} disabled={busy || !form.title || !form.event_date} className="w-full">
          {isNew ? "Submit for approval" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}