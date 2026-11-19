import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  requiredAuthority?: string;
  requireAuth?: boolean;
}

export function ProtectedRoute({ requiredAuthority, requireAuth = true }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasAuthority = useAuthStore((s) => s.hasAuthority);

  if (requireAuth && !accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (requiredAuthority && !hasAuthority(requiredAuthority)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
