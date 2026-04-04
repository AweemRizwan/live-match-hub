import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMatches, createMatch, updateMatch, deleteMatch, SPORTS, STATUS_OPTIONS, type Match, type MatchSport, type MatchStatus } from "@/lib/matches";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { format } from "date-fns";

function MatchForm({ match, onDone }: { match?: Match; onDone: () => void }) {
  const qc = useQueryClient();
  const [sport, setSport] = useState<MatchSport>(match?.sport ?? "football");
  const [title, setTitle] = useState(match?.title ?? "");
  const [teamHome, setTeamHome] = useState(match?.team_home ?? "");
  const [teamAway, setTeamAway] = useState(match?.team_away ?? "");
  const [youtubeLink, setYoutubeLink] = useState(match?.youtube_link ?? "");
  const [status, setStatus] = useState<MatchStatus>(match?.status ?? "upcoming");
  const [matchDate, setMatchDate] = useState(match?.match_date ? match.match_date.slice(0, 16) : new Date().toISOString().slice(0, 16));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { sport, title, team_home: teamHome, team_away: teamAway, youtube_link: youtubeLink, status, match_date: new Date(matchDate).toISOString() };
      return match ? updateMatch(match.id, payload) : createMatch(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast.success(match ? "Match updated" : "Match created");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Sport</label>
        <Select value={sport} onValueChange={(v) => setSport(v as MatchSport)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SPORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Match title" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Home Team</label>
          <Input value={teamHome} onChange={(e) => setTeamHome(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Away Team</label>
          <Input value={teamAway} onChange={(e) => setTeamAway(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">YouTube Link</label>
        <Input value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as MatchStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Date & Time</label>
          <Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {match ? "Update Match" : "Create Match"}
      </Button>
    </form>
  );
}

export default function AdminPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Match | undefined>();
  const qc = useQueryClient();

  const { data: matches, isLoading } = useQuery({ queryKey: ["matches"], queryFn: () => fetchMatches() });

  const del = useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches"] }); toast.success("Deleted"); },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin Panel</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Match</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading">{editing ? "Edit Match" : "New Match"}</DialogTitle></DialogHeader>
              <MatchForm match={editing} onDone={() => { setOpen(false); setEditing(undefined); }} />
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {matches?.map((m) => {
              const sport = SPORTS.find((s) => s.value === m.sport);
              return (
                <div key={m.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">{sport?.icon}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="font-medium text-card-foreground truncate">{m.title}</p>
                    <p className="text-sm text-muted-foreground">{m.team_home} vs {m.team_away} · {format(new Date(m.match_date), "PP")}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              );
            })}
            {matches?.length === 0 && <p className="text-center py-10 text-muted-foreground">No matches yet. Add one!</p>}
          </div>
        )}
      </main>
    </div>
  );
}
