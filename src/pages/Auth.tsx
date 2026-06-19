import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"attendee" | "organizer" | "sponsor">("attendee");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav("/dashboard"); }, [user, nav]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    nav("/dashboard");
  };

  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { name, role } },
    });
    setBusy(false);
    if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    toast({ title: "Welcome to EventSphere", description: "Account created." });
    nav("/dashboard");
  };

  return (
    <div className="container max-w-md py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="font-heading text-3xl mb-1">EventSphere</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in or create your account.</p>
        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 pt-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button onClick={signIn} disabled={busy} className="w-full">Sign in</Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 pt-4">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div>
              <Label>I am a</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendee">Attendee</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={signUp} disabled={busy} className="w-full">Create account</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}