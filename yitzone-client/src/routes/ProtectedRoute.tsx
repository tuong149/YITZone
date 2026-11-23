import { Navigate, Outlet } from "react-router-dom";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  requiredAuthority?: string;
  requiredAuthorities?: readonly string[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  requiredAuthority,
  requiredAuthorities,
  requireAuth = true
}: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const authorities = useAuthStore((s) => s.authorities);

  if (requireAuth && !accessToken) {
    return <Navigate to="/login" replace />;
  }

  const requiredList = requiredAuthorities ?? (requiredAuthority ? [requiredAuthority] : undefined);
  if (requiredList && !hasAnyPermission(authorities, requiredList)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
