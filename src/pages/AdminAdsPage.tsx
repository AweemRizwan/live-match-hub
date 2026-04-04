import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllAds, createAd, updateAd, deleteAd, uploadAdImage, type Ad, type AdPosition } from "@/lib/ads";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Image, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function AdForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState<AdPosition>("top_banner");
  const [duration, setDuration] = useState("10");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select an image"); return; }
    setUploading(true);
    try {
      const imageUrl = await uploadAdImage(file);
      await createAd({ title, image_url: imageUrl, position, display_duration_seconds: parseInt(duration) || 10 });
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
      toast.success("Ad created");
      onDone();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ad title" required />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Position</label>
        <Select value={position} onValueChange={(v) => setPosition(v as AdPosition)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="top_banner">Top Banner</SelectItem>
            <SelectItem value="side_banner">Side Banner</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Display Duration (seconds)</label>
        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="3" max="120" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Image</label>
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </div>
      <Button type="submit" disabled={uploading} className="w-full">
        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Upload & Create Ad
      </Button>
    </form>
  );
}

export default function AdminAdsPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data: ads, isLoading } = useQuery({ queryKey: ["admin-ads"], queryFn: fetchAllAds });

  const toggleActive = useMutation({
    mutationFn: (ad: Ad) => updateAd(ad.id, { is_active: !ad.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ads"] }),
  });

  const del = useMutation({
    mutationFn: deleteAd,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ads"] }); toast.success("Deleted"); },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Ad Management</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Ad</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading">Create Advertisement</DialogTitle></DialogHeader>
              <AdForm onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {ads?.map((ad) => (
              <div key={ad.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                <div className="h-16 w-24 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground truncate">{ad.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {ad.position === "top_banner" ? "Top Banner" : "Side Banner"} · {ad.display_duration_seconds}s · {ad.impressions_count} impressions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{ad.is_active ? "Active" : "Inactive"}</span>
                  <Switch checked={ad.is_active} onCheckedChange={() => toggleActive.mutate(ad)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(ad.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {ads?.length === 0 && <p className="text-center py-10 text-muted-foreground">No ads yet.</p>}
          </div>
        )}
      </main>
    </div>
  );
}
