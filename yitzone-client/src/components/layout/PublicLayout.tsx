import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LogIn, Menu, QrCode, X } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { ContextSwitcher } from "@/components/ui/context-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

const PUBLIC_NAV = [
  { to: "/public", label: "Khám phá" },
  { to: "/news", label: "Bản tin" },
  { to: "/public/honor-roll", label: "Bảng vàng SV5T" },
  { to: "/store", label: "Cửa hàng" }
];

export function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const setSurface = useThemeStore((s) => s.setSurface);

  useEffect(() => {
    setSurface("public");
  }, [setSurface]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="yit-ambient-canvas flex min-h-screen flex-col overflow-x-clip text-foreground">
      {/* Fixed Multi-Island Liquid Glass Navbar */}
      <header className="pointer-events-none fixed left-0 right-0 top-3 z-30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-2.5 sm:px-6">
          {/* Island 1: Mobile Trigger + Logo + Public Navigation — Unified h-11 */}
          <div className="liquid-glass pointer-events-auto flex h-11 items-center gap-1.5 rounded-full px-2 sm:gap-3 sm:px-3.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng công khai"
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/85 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/public" className="flex shrink-0 items-center pr-1 sm:pl-0.5 sm:pr-0">
              <BrandLockup
                logoClassName="h-7 w-7"
                wordmarkClassName="hidden sm:block h-[18px]"
              />
            </Link>

            <div className="hidden h-5 w-px bg-border/80 md:block" />

            <nav aria-label="Điều hướng công khai" className="hidden md:flex items-center gap-0.5">
              {PUBLIC_NAV.map((item) => {
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/public" && location.pathname.startsWith(`${item.to}/`));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
: "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Islands: Context Switcher | Theme Toggle | QR & Auth */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            <ContextSwitcher compact className="liquid-glass max-w-[126px] border-transparent px-2.5 sm:max-w-[190px] sm:px-3.5" />
            <ThemeToggle />
            <div className="liquid-glass flex h-11 items-center gap-1 rounded-full p-1">
              {isAuthenticated && (
                <Link
                  to="/scanner"
                  className="liquid-glass-btn-cobalt hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                >
                  <span>Quét QR</span>
                  <QrCode className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                to="/login"
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors sm:px-3.5",
                  isAuthenticated
                    ? "text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    : "liquid-glass-btn-cobalt"
                )}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{isAuthenticated ? "Tài khoản" : "Đăng nhập"}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer (< md) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Cổng Công khai"
        >
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#090d16]/55 backdrop-blur-[2px]"
          />

          <div className="liquid-glass relative z-10 flex h-full w-[min(84vw,320px)] flex-col overflow-hidden rounded-r-[28px] border-l-0">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
              <Link to="/public" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                <BrandLockup logoClassName="h-7 w-7" wordmarkClassName="h-[18px]" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Điều hướng công khai di động" className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-4">
              {PUBLIC_NAV.map((item) => {
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/public" && location.pathname.startsWith(`${item.to}/`));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex min-h-[44px] items-center rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                        : "text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="space-y-2 border-t border-border/60 pt-4">
                {isAuthenticated && (
                  <Link
                    to="/scanner"
                    onClick={() => setMobileMenuOpen(false)}
                    className="liquid-glass-btn-cobalt flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Quét QR điểm danh</span>
                  </Link>
                )}
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold",
                    isAuthenticated
                      ? "border border-border bg-card/80 text-foreground"
                      : "liquid-glass-btn-cobalt"
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isAuthenticated ? "Tài khoản" : "Đăng nhập YITZone"}</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-20 pb-8 sm:px-6">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
