import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, Radio, ScanLine, ShoppingBag, Wifi, WifiOff } from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";

/**
 * FieldLayout — Dedicated Mobile-First Field Shell for on-site CTV/BTC operations
 * (/staff/scanner and /staff/store-booth).
 * Uses YITZone's Detached Floating Liquid Glass Pill Navbar + yit-ambient-canvas (DESIGN.md).
 */
export function FieldLayout() {
  const { pathname } = useLocation();
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const roleScopes = useAuthStore((s) => s.roleScopes);

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const activeScopeLabel =
    roleScopes.find((r) => r.scopeId === activeScopeId)?.label.replace(/\s*\(FACULTY\)/gi, "") ??
    (activeScopeId === "FACULTY" ? "Toàn Khoa CNTT" : activeScopeId);

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

  useEffect(() => {
    let sentinel = null;
    const requestWakeLock = async () => {
      try {
        const nav = navigator;
        if (nav.wakeLock) {
          sentinel = await nav.wakeLock.request("screen");
          setWakeLockActive(true);
        }
      } catch {
        setWakeLockActive(false);
      }
    };
    void requestWakeLock();
    return () => {
      void sentinel?.release?.();
    };
  }, []);

  const isStoreBooth = pathname.startsWith("/staff/store-booth");

  return (
    <div className="yit-ambient-canvas flex min-h-screen flex-col text-foreground">
      {/* Detached Floating Liquid Glass Pill Navbar — Single-line crisp items, zero wrapping */}
      <div className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-2.5">
          <div className="liquid-glass flex h-11 min-w-0 items-center gap-2.5 rounded-full px-3.5 sm:px-4">
            <BrandLockup logoClassName="h-6 w-6 shrink-0" wordmarkClassName="hidden h-4 sm:block" />
            <div className="h-4 w-px shrink-0 bg-border" />
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-primary">
              {isStoreBooth ? (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                  <span>Bàn Giao Vật phẩm</span>
                </>
              ) : (
                <>
                  <ScanLine className="h-3.5 w-3.5 shrink-0" />
                  <span>Soát vé Hiện trường</span>
                </>
              )}
            </span>
            <span className="hidden truncate text-xs text-muted-foreground lg:inline max-w-[240px]">
              · {activeScopeLabel}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="liquid-glass hidden h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold sm:inline-flex">
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-status-success">
                  <Wifi className="h-3.5 w-3.5 shrink-0" />
                  <span>Trực tuyến</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-status-warning">
                  <WifiOff className="h-3.5 w-3.5 shrink-0" />
                  <span>Ngoại tuyến</span>
                </span>
              )}
              {wakeLockActive && (
                <>
                  <span className="h-3.5 w-px bg-border" />
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Radio className="h-3 w-3 shrink-0 text-status-success" />
                    <span>Giữ sáng</span>
                  </span>
                </>
              )}
            </div>

            <ThemeToggle />

            <Link
              to={isStoreBooth ? "/office-duty" : "/admin/attendance"}
              className="liquid-glass inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-semibold text-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Thoát hiện trường</span>
            </Link>
          </div>
        </header>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
