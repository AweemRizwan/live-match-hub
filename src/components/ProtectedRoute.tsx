import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Role = "admin" | "organizer" | "attendee" | "sponsor";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, roles: userRoles, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.some((r) => userRoles.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}