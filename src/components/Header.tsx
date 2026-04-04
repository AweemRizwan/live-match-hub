import { Link } from "react-router-dom";
import { Tv } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Tv className="h-6 w-6 text-primary" />
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            LIVE<span className="text-primary">SPORTS</span>
          </span>
        </Link>
        <Link
          to="/admin"
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Admin Panel
        </Link>
      </div>
    </header>
  );
}
