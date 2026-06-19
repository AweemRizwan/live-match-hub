import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutDashboard, LogOut, Ticket } from "lucide-react";

export default function Layout() {
  const { user, roles, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Ticket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl tracking-wide">EventSphere</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/events" className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm hover:bg-secondary ${isActive ? "text-primary" : ""}`
            }>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />Events</span>
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm hover:bg-secondary ${isActive ? "text-primary" : ""}`
              }>
                <span className="inline-flex items-center gap-1.5"><LayoutDashboard className="h-4 w-4" />Dashboard</span>
              </NavLink>
            )}
            {user ? (
              <>
                <span className="hidden sm:inline text-xs text-muted-foreground px-2">
                  {roles.join(", ") || "attendee"}
                </span>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/"); }}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => nav("/auth")}>Sign in</Button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        EventSphere — University Campus Streaming & Engagement Ecosystem
      </footer>
    </div>
  );
}