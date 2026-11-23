import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Award,
  Bell,
  Bot,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Code2,
  Gamepad2,
  Home,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Music,
  QrCode,
  ShoppingBag,
  Sparkles,
  User,
  Vote,
  WifiOff,
  X
} from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { ContextSwitcher } from "@/components/ui/context-switcher";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

interface NavItemConfig {
  to: string;
  label: string;
  icon: typeof Award;
  requireAuth?: boolean;
  requiredAuthorities?: readonly string[];
}

const PRIMARY_NAV = [
  { to: "/", label: "Trang chủ", matchPrefix: "/" },
  { to: "/events", label: "Sự kiện", matchPrefix: "/events" },
  { to: "/news", label: "Bản tin", matchPrefix: "/news" },
  { to: "/calendar", label: "Lịch", matchPrefix: "/calendar" },
  { to: "/sv5t", label: "SV5T", matchPrefix: "/sv5t" }
];

const UTILITY_ACADEMIC: NavItemConfig[] = [
  { to: "/public/honor-roll", label: "Bảng vàng SV5T", icon: Award },
  { to: "/oj", label: "Online Judge", icon: Code2 },
  { to: "/certificates", label: "E-Certificate", icon: Award, requireAuth: true },
  { to: "/portfolio", label: "E-Portfolio & CV", icon: Briefcase, requireAuth: true },
  { to: "/profile", label: "Hồ sơ & Bảo mật", icon: User, requireAuth: true }
];

const UTILITY_CAMPUS: NavItemConfig[] = [
  { to: "/store", label: "Cửa hàng", icon: ShoppingBag },
  { to: "/minigame", label: "Minigame", icon: Gamepad2 },
  { to: "/voting", label: "Bình chọn & Bầu cử", icon: Vote },
  {
    to: "/arts",
    label: "Văn nghệ ARTIT",
    icon: Music,
    requireAuth: true,
    requiredAuthorities: PERMISSIONS.ARTS_LEAD_PORTAL
  },
  {
    to: "/office-duty",
    label: "Trực Văn phòng",
    icon: ClipboardCheck,
    requireAuth: true,
    requiredAuthorities: PERMISSIONS.OFFICE_DUTY_PORTAL
  },
  { to: "/messenger", label: "Hộp thư BCH", icon: MessageSquare, requireAuth: true }
];

function isPrimaryActive(pathname: string, to: string, matchPrefix: string) {
  if (to === "/") {
    return pathname === "/";
  }
  return pathname === to || pathname.startsWith(`${matchPrefix}/`);
}

export function AppLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userId = useAuthStore((s) => s.userId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authorities = useAuthStore((s) => s.authorities);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setSurface = useThemeStore((s) => s.setSurface);

  const isAuthenticated = Boolean(accessToken);

  useEffect(() => {
    setSurface("student");
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

  const visibleAcademic = useMemo(
    () =>
      UTILITY_ACADEMIC.filter(
        (item) =>
          (!item.requireAuth || isAuthenticated) &&
          hasAnyPermission(authorities, item.requiredAuthorities)
      ),
    [isAuthenticated, authorities]
  );

  const visibleCampus = useMemo(
    () =>
      UTILITY_CAMPUS.filter(
        (item) =>
          (!item.requireAuth || isAuthenticated) &&
          hasAnyPermission(authorities, item.requiredAuthorities)
      ),
    [isAuthenticated, authorities]
  );

  const visibleUtilityRoutes = useMemo(
    () => [...visibleAcademic, ...visibleCampus].map((i) => i.to),
    [visibleAcademic, visibleCampus]
  );

  const utilityActive = visibleUtilityRoutes.some(
    (route) => location.pathname === route || location.pathname.startsWith(`${route}/`)
  );
  const notifActive = location.pathname.startsWith("/notifications");
  const hideBottomBar = location.pathname === "/login" || location.pathname.startsWith("/auth/");

  return (
    <div
      className={cn(
        "yit-ambient-canvas flex min-h-screen flex-col overflow-x-clip text-foreground",
        hideBottomBar ? "pb-8" : "pb-24 md:pb-12"
      )}
    >
      {/* Fixed Multi-Island Liquid Glass Navbar — Unified h-11 across all islands */}
      <header className="pointer-events-none fixed left-0 right-0 top-3 z-30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-2.5 sm:px-6">
          {/* Island 1: Mobile Menu Trigger + Brand Logo + 5 Primary Tabs + Permission-aware Tiện ích Popover */}
          <div className="liquid-glass pointer-events-auto flex h-11 items-center gap-1.5 rounded-full px-2 sm:gap-2.5 sm:px-3.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/85 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex shrink-0 items-center pr-1 sm:pl-0.5 sm:pr-0">
              <BrandLockup
                logoClassName="h-7 w-7"
                wordmarkClassName="hidden sm:block h-[18px]"
              />
            </Link>

            <div className="hidden h-5 w-px bg-border/80 lg:block" />

            <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-0.5">
              {PRIMARY_NAV.map((item) => {
                const active = isPrimaryActive(location.pathname, item.to, item.matchPrefix);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                        : "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none",
                      utilityActive
                        ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                        : "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                    )}
                  >
                    <span>Tiện ích</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-75" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className={cn("p-2", visibleAcademic.length > 0 ? "w-[430px]" : "w-64")}
                >
                  <div className={cn("grid gap-1", visibleAcademic.length > 0 ? "grid-cols-2" : "grid-cols-1")}>
                    {visibleAcademic.length > 0 && (
                      <div>
                        <DropdownMenuLabel>Học thuật &amp; Hồ sơ</DropdownMenuLabel>
                        {visibleAcademic.map((item) => {
                          const Icon = item.icon;
                          return (
                            <DropdownMenuItem key={item.to} asChild>
                              <Link to={item.to}>
                                <Icon className="h-4 w-4 text-primary" />
                                <span>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    )}
                    {visibleCampus.length > 0 && (
                      <div>
                        <DropdownMenuLabel>Hoạt động &amp; Hội trường</DropdownMenuLabel>
                        {visibleCampus.map((item) => {
                          const Icon = item.icon;
                          return (
                            <DropdownMenuItem key={item.to} asChild>
                              <Link to={item.to}>
                                <Icon className="h-4 w-4 text-primary" />
                                <span>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* Right Islands (All h-11): Context | Notifications (Auth) | Theme | QR (Auth) & Auth */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            <ContextSwitcher compact className="liquid-glass max-w-[126px] border-transparent px-2.5 sm:max-w-[190px] sm:px-3.5" />

            {isAuthenticated && (
              <Link
                to="/notifications"
                aria-label="Thông báo"
                title="Thông báo"
                className={cn(
                  "liquid-glass relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
                  notifActive ? "text-primary" : "text-foreground/80 hover:text-foreground"
                )}
              >
                <Bell className="h-4 w-4" />
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary ring-2 ring-card"
                />
              </Link>
            )}

            <ThemeToggle />

            <div className="liquid-glass flex h-11 items-center gap-1 rounded-full p-1">
              {isAuthenticated && (
                <Link
                  to="/scanner"
                  className="liquid-glass-btn-cobalt hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-transform active:scale-[0.98]"
                >
                  <span>Quét QR</span>
                  <QrCode className="h-3.5 w-3.5" />
                </Link>
              )}

              {userId ? (
                <button
                  type="button"
                  onClick={clearSession}
                  title={`Đang đăng nhập: ${userId}`}
                  aria-label="Đăng xuất"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:px-3"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline tabular-mono">{userId}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="liquid-glass-btn-cobalt inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-transform active:scale-[0.98] sm:px-4"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden min-[380px]:inline">Đăng nhập</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-20 sm:px-6">
        {!isOnline && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-status-warning/30 bg-status-warning/12 px-4 py-1.5 text-xs font-medium text-status-warning">
            <WifiOff className="h-3.5 w-3.5" />
            <span>
              Chế độ Ngoại tuyến PWA · Phiếu khảo sát, Live Q&amp;A và nhật ký trực sẽ tự đồng bộ khi có mạng.
            </span>
          </div>
        )}
        <Outlet />
      </main>

      <SiteFooter />

      {/* Floating Desktop YITBot Liquid Glass Pill */}
      {location.pathname !== "/yitbot" && (
        <Link
          to="/yitbot"
          className="liquid-glass-pill fixed bottom-5 right-6 z-30 hidden md:inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
        >
          <Sparkles className="h-4 w-4 text-brand-cyan" />
          <span>Hỏi YITBot AI</span>
        </Link>
      )}

      {/* Mobile & Tablet Slide-over Navigation Drawer (< lg) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng YITZone"
        >
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#090d16]/55 backdrop-blur-[2px]"
          />

          <div className="liquid-glass relative z-10 flex h-full w-[min(86vw,340px)] flex-col overflow-hidden rounded-r-[28px] border-l-0">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                <BrandLockup logoClassName="h-7 w-7" wordmarkClassName="h-[18px]" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu điều hướng"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav
              aria-label="Danh mục đầy đủ"
              className="no-scrollbar flex-1 space-y-5 overflow-y-auto overscroll-contain px-3.5 py-4 pb-8"
            >
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Điều hướng chính
                </div>
                {PRIMARY_NAV.map((item) => {
                  const active = isPrimaryActive(location.pathname, item.to, item.matchPrefix);
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
              </div>

              {visibleAcademic.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Học thuật &amp; Hồ sơ
                  </div>
                  {visibleAcademic.map((item) => {
                    const Icon = item.icon;
                    const active =
                      location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                            : "text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {visibleCampus.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Hoạt động &amp; Hội trường
                  </div>
                  {visibleCampus.map((item) => {
                    const Icon = item.icon;
                    const active =
                      location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                            : "text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2 border-t border-border/60 pt-4">
                <Link
                  to="/yitbot"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center gap-3 rounded-2xl bg-primary/10 px-3.5 py-2.5 text-sm font-semibold text-primary"
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Hỏi YITBot AI</span>
                </Link>
                {userId ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearSession();
                      setMobileMenuOpen(false);
                    }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium text-status-danger hover:bg-status-danger/10"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Đăng xuất ({userId})</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="liquid-glass-btn-cobalt flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Đăng nhập YITZone</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Floating Mobile PWA Bottom Liquid Glass Pill Bar (hidden on /login & /auth/*) */}
      {!hideBottomBar && (
        <nav
          aria-label="Điều hướng di động PWA"
          className="fixed bottom-3 left-3 right-3 z-30 md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {isAuthenticated ? (
            <div className="liquid-glass grid h-16 grid-cols-5 items-center rounded-full px-1.5">
              <Link
                to="/"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  isPrimaryActive(location.pathname, "/", "/") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Home className="h-5 w-5" />
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/calendar"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  location.pathname.startsWith("/calendar") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <CalendarDays className="h-5 w-5" />
                <span>Lịch</span>
              </Link>

              <div className="flex justify-center">
                <Link
                  to="/scanner"
                  aria-label="Quét QR điểm danh nhanh"
                  className="liquid-glass-btn-cobalt flex h-12 w-12 -translate-y-2 items-center justify-center rounded-full transition-transform active:scale-95"
                >
                  <QrCode className="h-5 w-5" />
                </Link>
              </div>

              <Link
                to="/yitbot"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  location.pathname.startsWith("/yitbot") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Bot className="h-5 w-5" />
                <span>YITBot</span>
              </Link>

              <Link
                to="/profile"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  location.pathname.startsWith("/profile") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <User className="h-5 w-5" />
                <span>Cá nhân</span>
              </Link>
            </div>
          ) : (
            <div className="liquid-glass grid h-16 grid-cols-4 items-center rounded-full px-2">
              <Link
                to="/"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  isPrimaryActive(location.pathname, "/", "/") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Home className="h-5 w-5" />
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/events"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  location.pathname.startsWith("/events") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <CalendarDays className="h-5 w-5" />
                <span>Sự kiện</span>
              </Link>

              <Link
                to="/yitbot"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  location.pathname.startsWith("/yitbot") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Bot className="h-5 w-5" />
                <span>YITBot</span>
              </Link>

              <Link
                to="/login"
                className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-primary"
              >
                <LogIn className="h-5 w-5" />
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
