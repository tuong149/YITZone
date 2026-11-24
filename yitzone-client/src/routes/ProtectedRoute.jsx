import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute({
  requiredAuthority,
  requiredAuthorities,
  requireAuth = true
}) {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authorities = useAuthStore((s) => s.authorities);

  if (requireAuth && !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const requiredList = requiredAuthorities ?? (requiredAuthority ? [requiredAuthority] : undefined);
  if (requiredList && !hasAnyPermission(authorities, requiredList)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
