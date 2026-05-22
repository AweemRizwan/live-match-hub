export default function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">EventSphere</h1>
        <p className="text-lg text-muted-foreground">
          University Campus Streaming & Engagement Ecosystem.
        </p>
        <p className="text-sm text-muted-foreground">
          Database schema is provisioned. UI build is paused for architecture review —
          see the architecture document, then ask me to resume building Auth, RBAC,
          Events, Tickets, and Stripe checkout.
        </p>
      </div>
    </main>
  );
}