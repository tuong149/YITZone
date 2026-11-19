import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Bot,
  CalendarDays,
  LayoutGrid,
  LogIn,
  LogOut,
  QrCode,
  ShieldCheck,
  Vote,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Sự kiện", icon: CalendarDays },
  { to: "/scanner", label: "Soát vé & Barcode", icon: QrCode },
  { to: "/voting", label: "Bình chọn LED", icon: Vote },
  { to: "/yitbot", label: "YITBot AI", icon: Bot },
  { to: "/modules", label: "22 Phân hệ", icon: LayoutGrid }
];

export function AppLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const setActiveScopeId = useAuthStore((s) => s.setActiveScopeId);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const userId = useAuthStore((s) => s.userId);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Deduplicate scope options and only render scopes the user actually possesses (+ public FACULTY scope)
  const availableScopes = useMemo(() => {
    const map = new Map<string, string>();
    map.set("FACULTY", "Toàn Khoa CNTT (FACULTY)");
    for (const scope of roleScopes) {
      if (!map.has(scope.scopeId)) {
        map.set(scope.scopeId, scope.label);
      }
    }
    return Array.from(map.entries()).map(([scopeId, label]) => ({ scopeId, label }));
  }, [roleScopes]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>YITZone</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                PWA
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Chuyển ngữ cảnh đơn vị (X-Active-Scope-Id)"
              value={activeScopeId}
              onChange={(e) => setActiveScopeId(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium"
            >
              {availableScopes.map((scope) => (
                <option key={scope.scopeId} value={scope.scopeId}>
                  {scope.label}
                </option>
              ))}
            </select>

            {userId ? (
              <button
                type="button"
                onClick={clearSession}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                title={`Đang đăng nhập: ${userId}`}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{userId}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )}

            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                isOnline ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              )}
            >
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isOnline ? "Online" : "Offline Mode"}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      {/* Mobile bottom navigation bar for PWA smartphone users */}
      <nav
        aria-label="Điều hướng di động"
        className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-border bg-card/95 py-1.5 backdrop-blur"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
