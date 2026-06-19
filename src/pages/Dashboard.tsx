import { useAuth } from "@/hooks/useAuth";
import OrganizerEvents from "./organizer/OrganizerEvents";
import AdminEvents from "./admin/AdminEvents";
import MyBookings from "./attendee/MyBookings";

export default function Dashboard() {
  const { roles, loading } = useAuth();
  if (loading) return <div className="container py-12 text-muted-foreground">Loading…</div>;
  if (roles.includes("admin")) return <AdminEvents />;
  if (roles.includes("organizer")) return <OrganizerEvents />;
  return <MyBookings />;
}