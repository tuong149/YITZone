import { Link } from "react-router-dom";
import { Home, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export function ForbiddenPage() {
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const fullName = useAuthStore((s) => s.fullName);

  return (
    <div className="mx-auto flex min-h-[68vh] max-w-xl items-center justify-center py-12">
      <div
        role="alert"
        className="liquid-glass-card w-full space-y-5 rounded-panel p-8 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-danger/15 text-status-danger">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <p className="tabular-mono text-sm font-semibold tracking-wider text-status-danger">403</p>
          <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
            Không đủ quyền truy cập phân hệ này
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tài khoản <strong className="text-foreground">{fullName ?? "hiện tại"}</strong> (phạm vi{" "}
            <span className="tabular-mono font-semibold text-foreground">{activeScopeId}</span>) chưa được cấp gói quyền phù hợp cho trang này.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <Button asChild className="rounded-full">
            <Link to="/">
              <Home className="h-4 w-4" />
              <span>Về Trang chủ</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              <span>Đổi tài khoản</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
