import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  requiredAuthority?: string;
}

export function ProtectedRoute({ requiredAuthority }: ProtectedRouteProps) {
  const { hasAuthority } = useAuthStore();

  if (requiredAuthority && !hasAuthority(requiredAuthority)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
