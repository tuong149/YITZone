import { Link, useNavigate } from "react-router-dom";
import { Home, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

const SCOPE_LABELS = {
  FACULTY: "Toàn Khoa CNTT",
  OFIT: "Ban Văn phòng (OFIT)",
  EMFIT: "Ban Truyền thông – Sự kiện (EMFIT)",
  ARTIT: "Ban Văn nghệ (ARTIT)"
};

export function ForbiddenPage() {
  const navigate = useNavigate();
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const fullName = useAuthStore((s) => s.fullName);
  const clearSession = useAuthStore((s) => s.clearSession);

  const scopeLabel =
    roleScopes.find((s) => s.scopeId === activeScopeId)?.label.replace(/\s*\(FACULTY\)/gi, "") ??
    SCOPE_LABELS[activeScopeId] ??
    activeScopeId;

  const handleSwitchAccount = () => {
    clearSession({ reason: "logout" });
    void navigate("/login", { replace: true });
  };

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
            Không đủ quyền truy cập mục này
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tài khoản <strong className="text-foreground">{fullName ?? "hiện tại"}</strong> (đơn vị{" "}
            <strong className="text-foreground">{scopeLabel}</strong>) chưa được phân quyền cho trang này.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Nếu bạn cần quyền quản trị hoặc hỗ trợ sự kiện, vui lòng liên hệ Văn phòng Đoàn – Hội Khoa CNTT hoặc Trưởng ban phụ trách.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <Button asChild className="rounded-full">
            <Link to="/">
              <Home className="h-4 w-4" />
              <span>Về Trang chủ</span>
            </Link>
          </Button>
          <Button type="button" variant="outline" className="rounded-full" onClick={handleSwitchAccount}>
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất &amp; Đổi tài khoản</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
