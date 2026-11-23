import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code2,
  FileCheck2,
  Gamepad2,
  Inbox,
  LayoutDashboard,
  Menu,
  MonitorPlay,
  Music,
  QrCode,
  Radio,
  ScrollText,
  Search,
  ShoppingBag,
  Users,
  X
} from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Button } from "@/components/ui/button";
import { ContextSwitcher } from "@/components/ui/context-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  keywords: string;
  requiredAuthorities?: readonly string[];
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const ADMIN_GROUPS: AdminNavGroup[] = [
  {
    label: "Điều hành chung",
    items: [
      { to: "/admin", label: "Tổng quan vận hành", icon: LayoutDashboard, keywords: "dashboard tong quan" },
      { to: "/admin/calendar", label: "Lịch Hoạt động", icon: CalendarDays, keywords: "lich hoat dong calendar ics" }
    ]
  },
  {
    label: "IAM & RBAC",
    items: [
      {
        to: "/admin/iam/roster",
        label: "Roster & Khoa–Ngành",
        icon: FileCheck2,
        keywords: "roster csv khoa nganh mssv cddn",
        requiredAuthorities: PERMISSIONS.ADMIN_IAM_ROSTER
      },
      {
        to: "/admin/iam/rbac",
        label: "Tổ chức & 20 Gói RBAC",
        icon: Users,
        keywords: "rbac quyen 4 ban 9 to thu hoi",
        requiredAuthorities: PERMISSIONS.ADMIN_IAM_RBAC
      },
      {
        to: "/admin/iam/unit-hr",
        label: "Nhân sự 3 Tầng & CTV",
        icon: ClipboardCheck,
        keywords: "ctv nhan su ban giao tai san",
        requiredAuthorities: PERMISSIONS.ADMIN_IAM_UNIT_HR
      },
      {
        to: "/admin/iam/restructuring",
        label: "Kiện toàn Bộ máy",
        icon: QrCode,
        keywords: "kien toan diff batch",
        requiredAuthorities: PERMISSIONS.ADMIN_IAM_RESTRUCTURING
      }
    ]
  },
  {
    label: "Sự kiện, Điểm danh & E-Cert",
    items: [
      {
        to: "/admin/events",
        label: "Sự kiện & No-show",
        icon: CalendarDays,
        keywords: "su kien no-show duyet btv",
        requiredAuthorities: PERMISSIONS.ADMIN_EVENTS
      },
      {
        to: "/admin/attendance",
        label: "Điểm danh & Hậu kiểm 48h",
        icon: QrCode,
        keywords: "diem danh qr hau kiem 48h",
        requiredAuthorities: PERMISSIONS.ADMIN_ATTENDANCE
      },
      {
        to: "/staff/scanner",
        label: "Máy Soát vé Hiện trường",
        icon: QrCode,
        keywords: "soat ve ma vach hid offline scanner the sv",
        requiredAuthorities: PERMISSIONS.ADMIN_ATTENDANCE
      },
      {
        to: "/admin/certificates",
        label: "Chốt kết quả & E-Cert",
        icon: Award,
        keywords: "chung nhan e-cert ctsv thu hoi",
        requiredAuthorities: PERMISSIONS.ADMIN_CERTIFICATES
      },
      {
        to: "/admin/audit",
        label: "Audit Log Hash-chain",
        icon: ScrollText,
        keywords: "audit log hash chain worm",
        requiredAuthorities: PERMISSIONS.ADMIN_AUDIT
      }
    ]
  },
  {
    label: "Nghiệp vụ Chuyên môn & Hội trường",
    items: [
      {
        to: "/admin/cms",
        label: "Tòa soạn & Blog",
        icon: ScrollText,
        keywords: "cms blog ban tin truyen thong emfit",
        requiredAuthorities: PERMISSIONS.ADMIN_CMS
      },
      {
        to: "/admin/sv5t",
        label: "Hội đồng SV5T",
        icon: Award,
        keywords: "sv5t sinh vien 5 tot bang vang phuc khao",
        requiredAuthorities: PERMISSIONS.ADMIN_SV5T
      },
      {
        to: "/admin/surveys",
        label: "Khảo sát & AI",
        icon: ClipboardCheck,
        keywords: "khao sat an danh pii ai survey",
        requiredAuthorities: PERMISSIONS.ADMIN_SURVEYS
      },
      {
        to: "/admin/live-qa",
        label: "Live Q&A & Từ điển",
        icon: Radio,
        keywords: "live qa hoi truong unmask tu dien",
        requiredAuthorities: PERMISSIONS.ADMIN_LIVEQA
      },
      {
        to: "/admin/voting",
        label: "Bình chọn & BGK",
        icon: MonitorPlay,
        keywords: "voting binh chon bau cu freeze mode kiosk",
        requiredAuthorities: PERMISSIONS.ADMIN_VOTING
      },
      {
        to: "/admin/office",
        label: "Trực VP & Kiểm kê",
        icon: ClipboardCheck,
        keywords: "ofit truc van phong kiem ke",
        requiredAuthorities: PERMISSIONS.ADMIN_OFFICE
      },
      {
        to: "/admin/store",
        label: "Cửa hàng & COD",
        icon: ShoppingBag,
        keywords: "cua hang cod vietqr gay quy",
        requiredAuthorities: PERMISSIONS.ADMIN_STORE
      },
      {
        to: "/admin/exams",
        label: "Thi Trắc nghiệm",
        icon: ClipboardCheck,
        keywords: "thi trac nghiem exam ngan hang cau hoi coi thi",
        requiredAuthorities: PERMISSIONS.ADMIN_EXAMS_MINIGAME
      },
      {
        to: "/admin/minigame",
        label: "Minigame Hội trường",
        icon: Gamepad2,
        keywords: "minigame hoi truong pin led",
        requiredAuthorities: PERMISSIONS.ADMIN_EXAMS_MINIGAME
      },
      {
        to: "/admin/yitbot",
        label: "YITBot RAG & AI",
        icon: Bot,
        keywords: "yitbot ai rag faq ngan sach circuit breaker",
        requiredAuthorities: PERMISSIONS.ADMIN_YITBOT
      },
      {
        to: "/admin/arts",
        label: "Văn nghệ ARTIT",
        icon: Music,
        keywords: "artit van nghe tiet muc san khau beat led",
        requiredAuthorities: PERMISSIONS.ADMIN_ARTS
      },
      {
        to: "/admin/inbox",
        label: "Hộp thư SLA 24h",
        icon: Inbox,
        keywords: "messenger hop thu sla ghi chu noi bo",
        requiredAuthorities: PERMISSIONS.ADMIN_INBOX
      },
      {
        to: "/admin/oj",
        label: "Online Judge & ICPC",
        icon: Code2,
        keywords: "oj online judge icpc ioi rejudge ast",
        requiredAuthorities: PERMISSIONS.ADMIN_OJ
      },
      {
        to: "/stage",
        label: "Màn chiếu LED 16:9",
        icon: MonitorPlay,
        keywords: "led stage man chieu hoi truong 16:9 qr live qa voting minigame",
        requiredAuthorities: PERMISSIONS.STAGE_CONTROL
      }
    ]
  }
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const authorities = useAuthStore((s) => s.authorities);
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const setSurface = useThemeStore((s) => s.setSurface);

  const activeScopeLabel = useMemo(() => {
    const matched = roleScopes.find((s) => s.scopeId === activeScopeId);
    if (matched) return matched.label.replace(/\s*\(FACULTY\)/gi, "");
    if (activeScopeId === "FACULTY") return "Toàn Khoa CNTT";
    return activeScopeId;
  }, [roleScopes, activeScopeId]);

  const scopeBadgeTone = useMemo(() => {
    if (activeScopeId === "OFIT") return "text-cal-office";
    if (activeScopeId === "EMFIT" || activeScopeId === "ARTIT") return "text-cal-dept";
    return "text-brand-cyan";
  }, [activeScopeId]);

  useEffect(() => {
    setSurface("admin");
  }, [setSurface]);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Filter sidebar groups strictly by granted authorities — zero hardcoded role names
  const visibleGroups = useMemo(
    () =>
      ADMIN_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => hasAnyPermission(authorities, item.requiredAuthorities))
      })).filter((group) => group.items.length > 0),
    [authorities]
  );

  const flatSearchItems = useMemo(
    () => visibleGroups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label }))),
    [visibleGroups]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      } else if (e.key === "Escape") {
        setSearchFocused(false);
        setMobileDrawerOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const normalizeVi = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/đ/g, "d");

    const q = normalizeVi(searchQuery.trim());
    if (!q) return flatSearchItems.slice(0, 6);
    return flatSearchItems
      .filter(
        (item) =>
          normalizeVi(item.label).includes(q) ||
          normalizeVi(item.group).includes(q) ||
          normalizeVi(item.keywords).includes(q)
      )
      .slice(0, 8);
  }, [searchQuery, flatSearchItems]);

  const handleSelectResult = (to: string) => {
    setSearchFocused(false);
    setSearchQuery("");
    void navigate(to);
  };

  return (
    <div className="yit-ambient-canvas flex min-h-screen text-foreground">
      {/* Detached Floating Liquid Glass Sidebar */}
      <aside
        className={cn(
          "liquid-glass sticky top-3 m-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-[24px] transition-all duration-200 lg:flex",
          collapsed ? "w-[74px]" : "w-[268px]"
        )}
      >
        <div
          className={cn(
            "flex items-center px-3.5 pt-3 pb-2",
            collapsed ? "flex-col gap-2" : "h-14 justify-between pt-0 pb-0"
          )}
        >
          <Link to="/admin" className="flex items-center justify-center overflow-hidden">
            <BrandLockup
              showWordmark={!collapsed}
              logoClassName={collapsed ? "h-8 w-8" : "h-7 w-7"}
              wordmarkClassName="h-[18px]"
            />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className={cn("pb-3", collapsed ? "px-2" : "px-3")}>
          <ContextSwitcher
            iconOnly={collapsed}
            className={collapsed ? "bg-white/60 dark:bg-white/10" : "rounded-xl bg-white/60 dark:bg-white/10"}
          />
        </div>

        <nav
          aria-label="Điều hướng quản trị"
          className={cn(
            "no-scrollbar flex-1 overflow-y-auto pb-4",
            collapsed ? "space-y-2.5 px-2" : "space-y-4 px-3"
          )}
        >
          {visibleGroups.map((group, groupIdx) => (
            <div key={group.label} className="space-y-1">
              {!collapsed ? (
                <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
              ) : (
                groupIdx > 0 && <div className="mx-auto my-2 h-px w-6 bg-border/80" />
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-full text-sm font-medium transition-all",
                      collapsed ? "mx-auto h-10 w-10 justify-center p-0" : "gap-2.5 px-3 py-2",
                      active
                        ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                        : "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col p-3 lg:pl-1">
        {/* Multi-Island Floating Liquid Glass Admin Topbar */}
        <header className="sticky top-3 z-30 flex items-center justify-between gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Mở danh mục quản trị"
            aria-expanded={mobileDrawerOpen}
            className="liquid-glass inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative min-w-0 flex-1 max-w-xl">
            <div className="liquid-glass flex h-11 items-center gap-2 rounded-full px-3.5 sm:gap-2.5 sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults[0]) {
                    e.preventDefault();
                    handleSelectResult(searchResults[0].to);
                  }
                }}
                placeholder="Tìm phân hệ, MSSV, quy chế..."
                aria-label="Tìm nhanh phân hệ quản trị"
                className="min-w-0 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-sm"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="rounded-full p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    searchInputRef.current?.focus();
                    setSearchFocused(true);
                  }}
                  className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-border bg-card/80 px-2.5 py-0.5 tabular-mono text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Ctrl K
                </button>
              )}
            </div>

            {searchFocused && (
              <div className="liquid-glass absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl p-1.5">
                {searchResults.length === 0 ? (
                  <div className="px-3.5 py-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy mục nào khớp &ldquo;{searchQuery}&rdquo; trong phạm vi quyền hiện tại.
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {searchResults.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`${item.group}-${item.label}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectResult(item.to);
                          }}
                          className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-primary/12 hover:text-primary"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.label}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span>{item.group}</span>
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "liquid-glass hidden md:inline-flex h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold",
                scopeBadgeTone
              )}
              title={`Đang thao tác dưới tư cách: ${activeScopeLabel}`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Đang thao tác: {activeScopeLabel}</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 pt-5 pb-8 px-1 sm:px-2">
          <Outlet />
        </main>
      </div>

      {/* Mobile & Tablet Admin Sidebar Drawer (< lg) */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Thanh điều hướng quản trị"
        >
          <button
            type="button"
            aria-label="Đóng thanh điều hướng quản trị"
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-[#090d16]/55 backdrop-blur-[2px]"
          />

          <aside className="liquid-glass relative z-10 flex h-full w-[min(86vw,320px)] flex-col overflow-hidden rounded-r-[28px] border-l-0">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
              <Link to="/admin" onClick={() => setMobileDrawerOpen(false)} className="flex items-center">
                <BrandLockup logoClassName="h-7 w-7" wordmarkClassName="h-[18px]" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Đóng thanh điều hướng"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 border-b border-border/60 px-3.5 py-3">
              <ContextSwitcher className="rounded-xl bg-white/60 dark:bg-white/10" />
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold text-brand-cyan">
                <Radio className="h-3 w-3" />
                <span>Đơn vị: {activeScopeLabel}</span>
              </div>
            </div>

            <nav
              aria-label="Điều hướng quản trị di động"
              className="no-scrollbar flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 pb-8"
            >
              {visibleGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={cn(
                          "flex min-h-[44px] items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium transition-all",
                          active
                            ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                            : "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
