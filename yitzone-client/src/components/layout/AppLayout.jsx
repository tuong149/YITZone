import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  Bot,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Code2,
  FileCheck2,
  Gamepad2,
  Home,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Music,
  QrCode,
  Radio,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  UserCircle2,
  Vote,
  WifiOff,
  X
} from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Button } from "@/components/ui/button";
import { ContextSwitcher } from "@/components/ui/context-switcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { NotificationMiniWindow } from "@/components/ui/notification-mini-window";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useUnsavedGuardStore } from "@/hooks/use-unsaved-changes-guard";
import { ALL_ADMIN_AUTHORITIES, hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { hasUserLocalDrafts, useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { to: "/", label: "Trang chủ", matchPrefix: "/" },
  { to: "/events", label: "Sự kiện", matchPrefix: "/events" },
  { to: "/news", label: "Bản tin", matchPrefix: "/news" },
  { to: "/sv5t", label: "SV5T", matchPrefix: "/sv5t" }
];

const UTILITY_ACADEMIC = [
  { to: "/public/honor-roll", label: "Bảng vàng SV5T", icon: Award },
  { to: "/verify", label: "Tra cứu & Xác thực", icon: ShieldCheck },
  { to: "/exams", label: "Bài thi trực tuyến", icon: FileCheck2 },
  { to: "/surveys", label: "Khảo sát", icon: ClipboardList },
  { to: "/oj", label: "Online Judge", icon: Code2 },
  { to: "/certificates", label: "E-Certificate", icon: Award, requireAuth: true },
  { to: "/portfolio", label: "E-Portfolio & CV", icon: Briefcase, requireAuth: true },
  { to: "/pwa-settings", label: "Cài đặt ứng dụng", icon: Settings, guestOnly: true }
];

const ACCOUNT_MENU_PRIMARY = [
  { to: "/profile", label: "Trang cá nhân", icon: UserCircle2 },
  { to: "/profile/info", label: "Thông tin & Đoàn – Hội", icon: User },
  { to: "/profile/security", label: "Mật khẩu & Bảo mật", icon: KeyRound }
];

const ACCOUNT_MENU_WORKSPACES = [
  { to: "/profile/calendar", label: "Lịch hoạt động", icon: CalendarDays },
  { to: "/certificates", label: "Chứng nhận & Hoạt động", icon: Award },
  { to: "/store/orders", label: "Đơn hàng của tôi", icon: Receipt },
  { to: "/portfolio", label: "E-Portfolio & CV", icon: Briefcase },
  { to: "/messenger", label: "Hộp thư BCH", icon: MessageSquare }
];

const ACCOUNT_MENU_PREFS = [
  { to: "/profile/privacy", label: "Quyền riêng tư & Dữ liệu", icon: ShieldCheck },
  { to: "/profile/app", label: "Ứng dụng & Thông báo", icon: Settings }
];

function getInitials(name, fallbackId) {
  const clean = (name || "").replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (clean) {
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (fallbackId || "SV").slice(-2).toUpperCase();
}

const UTILITY_CAMPUS = [
  { to: "/store", label: "Cửa hàng", icon: ShoppingBag },
  { to: "/store/orders", label: "Đơn hàng của tôi", icon: Receipt, requireAuth: true },
  { to: "/live-qa", label: "Live Q&A Hội trường", icon: Radio },
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

function isPrimaryActive(pathname, to, matchPrefix) {
  if (to === "/") {
    return pathname === "/";
  }
  return pathname === to || pathname.startsWith(`${matchPrefix}/`);
}

export function AppLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutWarningItems, setLogoutWarningItems] = useState([]);

  const userId = useAuthStore((s) => s.userId);
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authorities = useAuthStore((s) => s.authorities);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setSurface = useThemeStore((s) => s.setSurface);
  const initials = getInitials(fullName, userId);

  const requestLogout = () => {
    const warnings = [];
    const cartCount = useCartStore.getState().items.reduce((sum, i) => sum + i.qty, 0);
    if (cartCount > 0) warnings.push(`Giỏ hàng (${cartCount} sản phẩm)`);
    if (hasUserLocalDrafts() || useUnsavedGuardStore.getState().hasUnsavedChanges()) {
      warnings.push("Các bản nháp đang nhập (bài thi, khảo sát, bài viết hoặc sự kiện)");
    }
    if (warnings.length > 0) {
      setLogoutWarningItems(warnings);
      setLogoutConfirmOpen(true);
      return;
    }
    clearSession({ reason: "logout" });
    setMobileMenuOpen(false);
  };

  const isAuthenticated = Boolean(accessToken);
  const canAccessAdmin = isAuthenticated && hasAnyPermission(authorities, ALL_ADMIN_AUTHORITIES);

  useEffect(() => {
    setSurface("student");
  }, [setSurface]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e) => {
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
          (!item.guestOnly || !isAuthenticated) &&
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
  const activeNavKey = useMemo(() => {
    const matched = PRIMARY_NAV.find((item) =>
      isPrimaryActive(location.pathname, item.to, item.matchPrefix)
    );
    if (matched) return matched.to;
    if (utilityActive) return "__UTILITY__";
    return null;
  }, [location.pathname, utilityActive]);

  const navRef = useRef(null);
  const navItemRefs = useRef({});
  const [navPill, setNavPill] = useState({ left: 0, width: 0, visible: false, animated: false });

  useLayoutEffect(() => {
    const updatePill = () => {
      const container = navRef.current;
      const activeEl = activeNavKey ? navItemRefs.current[activeNavKey] : null;
      if (!container || !activeEl) {
        setNavPill((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const nextLeft = activeEl.offsetLeft;
      const nextWidth = activeEl.offsetWidth;
      setNavPill((prev) => ({
        left: nextLeft,
        width: nextWidth,
        visible: nextWidth > 0,
        animated: prev.visible
      }));
    };

    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [activeNavKey]);

  const hideBottomBar =
    location.pathname === "/login" ||
    location.pathname.startsWith("/auth/") ||
    /^\/verify\/.+/.test(location.pathname) ||
    location.pathname.startsWith("/p/");

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

            <nav
              ref={navRef}
              aria-label="Điều hướng chính"
              className="relative hidden lg:flex items-center gap-0.5"
            >
              {navPill.visible && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 rounded-full bg-card shadow-floating dark:bg-white/15",
                    navPill.animated &&
                      "transition-[transform,width,opacity] duration-[260ms] [transition-timing-function:var(--motion-ease-out)] motion-reduce:transition-none"
                  )}
                  style={{
                    width: `${navPill.width}px`,
                    transform: `translate3d(${navPill.left}px, 0, 0)`
                  }}
                />
              )}

              {PRIMARY_NAV.map((item) => {
                const active = activeNavKey === item.to;
                return (
                  <Link
                    key={item.to}
                    ref={(el) => {
                      navItemRefs.current[item.to] = el;
                    }}
                    to={item.to}
                    className={cn(
                      "relative z-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                      active
                        ? "text-foreground dark:text-white"
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
                    ref={(el) => {
                      navItemRefs.current.__UTILITY__ = el;
                    }}
                    type="button"
                    className={cn(
                      "group relative z-10 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none",
                      utilityActive
                        ? "text-foreground dark:text-white"
                        : "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                    )}
                  >
                    <span>Tiện ích</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-75 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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

            {isAuthenticated && <NotificationMiniWindow />}

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Tài khoản ${fullName || userId}`}
                      className={cn(
                        "group inline-flex h-9 items-center gap-2 rounded-full pl-1 pr-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-black/5 focus:outline-none dark:hover:bg-white/10",
                        location.pathname.startsWith("/profile") && "bg-primary/12 text-primary"
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        {initials}
                      </span>
                      <span className="hidden xl:inline tabular-mono">{userId}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-1.5">
                    <div className="px-2.5 py-2">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {fullName || "Tài khoản sinh viên"}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="tabular-mono font-medium text-foreground/80">{userId}</span>
                        {email ? ` · ${email}` : ""}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {canAccessAdmin && (
                      <>
                        <DropdownMenuItem asChild className="font-semibold text-primary focus:text-primary">
                          <Link to="/admin">
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                            <span>Trang Quản trị</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {ACCOUNT_MENU_PRIMARY.map((item) => {
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
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Không gian cá nhân</DropdownMenuLabel>
                    {ACCOUNT_MENU_WORKSPACES.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to}>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    {ACCOUNT_MENU_PREFS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to}>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        requestLogout();
                      }}
                      className="text-status-danger focus:bg-status-danger/10 focus:text-status-danger"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/login"
                  state={{ from: location }}
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
          className="yit-hover-hit fixed bottom-5 right-6 z-30 hidden rounded-full md:inline-block"
        >
          <span className="liquid-glass-pill yit-hover-surface inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/45">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            <span>Hỏi YITBot AI</span>
          </span>
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
            className="yit-drawer-backdrop fixed inset-0 bg-[#090d16]/55 backdrop-blur-[2px]"
          />

          <div className="liquid-glass yit-drawer-panel relative z-10 flex h-full w-[min(86vw,340px)] flex-col overflow-hidden rounded-r-[28px] border-l-0">
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

              {isAuthenticated && (
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tài khoản cá nhân
                  </div>
                  {canAccessAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center gap-3 rounded-2xl bg-primary/10 px-3.5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 dark:bg-white/12 dark:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      <span>Trang Quản trị</span>
                    </Link>
                  )}
                  {[...ACCOUNT_MENU_PRIMARY, ...ACCOUNT_MENU_PREFS].map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
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
                    onClick={requestLogout}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium text-status-danger hover:bg-status-danger/10"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Đăng xuất ({userId})</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: location }}
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
                to="/profile/calendar"
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  location.pathname.startsWith("/profile/calendar") ? "text-primary" : "text-muted-foreground"
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
                  location.pathname.startsWith("/profile") && !location.pathname.startsWith("/profile/calendar")
                    ? "text-primary"
                    : "text-muted-foreground"
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

      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
              <AlertTriangle className="h-5 w-5 text-status-warning" />
              <span>Xác nhận đăng xuất?</span>
            </DialogTitle>
            <DialogDescription>
              Đăng xuất sẽ xóa dữ liệu tạm lưu trên trình duyệt này:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 rounded-xl border border-status-warning/30 bg-status-warning/10 py-3 pl-8 pr-4 text-xs text-status-warning">
            {logoutWarningItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setLogoutConfirmOpen(false)}
            >
              Ở lại
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={() => {
                setLogoutConfirmOpen(false);
                setMobileMenuOpen(false);
                clearSession({ reason: "logout" });
              }}
            >
              Đăng xuất &amp; Xóa dữ liệu tạm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
