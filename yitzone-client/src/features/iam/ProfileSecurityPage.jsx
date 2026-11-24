import { lazy, Suspense, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Award,
  Briefcase,
  CalendarDays,
  ExternalLink,
  KeyRound,
  LayoutGrid,
  MessageSquare,
  Receipt,
  Settings,
  ShieldCheck,
  User,
  Users
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { loadOnboardingState } from "@/features/iam/data/onboarding-storage";
import { cn } from "@/lib/utils";
import { ProfileAppSettingsSection } from "./profile/ProfileAppSettingsSection";
import { ProfileInfoSection } from "./profile/ProfileInfoSection";
import { ProfileOverviewSection } from "./profile/ProfileOverviewSection";
import { ProfilePrivacySection } from "./profile/ProfilePrivacySection";
import { ProfileRolesSection } from "./profile/ProfileRolesSection";
import { ProfileSecuritySection } from "./profile/ProfileSecuritySection";

const CalendarPage = lazy(() =>
  import("@/features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage }))
);

const PROFILE_SECTIONS = [
  { key: "overview", to: "/profile", label: "Tổng quan", icon: LayoutGrid },
  { key: "calendar", to: "/profile/calendar", label: "Lịch hoạt động", icon: CalendarDays },
  { key: "info", to: "/profile/info", label: "Thông tin cá nhân", icon: User },
  { key: "security", to: "/profile/security", label: "Bảo mật & Mật khẩu", icon: KeyRound },
  { key: "roles", to: "/profile/roles", label: "Cống hiến & Vai trò", icon: Users },
  { key: "privacy", to: "/profile/privacy", label: "Quyền riêng tư", icon: ShieldCheck },
  { key: "app", to: "/profile/app", label: "Ứng dụng & Thông báo", icon: Settings }
];

const QUICK_WORKSPACES = [
  { to: "/certificates", label: "Chứng nhận & Hoạt động", icon: Award },
  { to: "/store/orders", label: "Đơn hàng của tôi", icon: Receipt },
  { to: "/portfolio", label: "E-Portfolio & CV", icon: Briefcase },
  { to: "/messenger", label: "Hộp thư BCH", icon: MessageSquare }
];

const VALID_SECTIONS = new Set(PROFILE_SECTIONS.map((s) => s.key));

function parseDisplayName(rawName) {
  const value = (rawName || "").trim();
  const match = value.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { cleanName: match[1].trim(), roleNote: match[2].trim() };
  }
  return { cleanName: value || "Nguyễn Minh Khoa", roleNote: null };
}

function getInitials(cleanName, fallbackId) {
  if (cleanName) {
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (fallbackId || "SV").slice(-2).toUpperCase();
}

export function ProfileSecurityPage() {
  const { section } = useParams();
  const activeKey = section || "overview";

  const userId = useAuthStore((s) => s.userId) ?? "22110345";
  const rawFullName = useAuthStore((s) => s.fullName) ?? "Nguyễn Minh Khoa";
  const email = useAuthStore((s) => s.email) ?? "22110345@student.hcmute.edu.vn";
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const authorities = useAuthStore((s) => s.authorities);
  const authProvider = useAuthStore((s) => s.authProvider);

  const onboardingState = loadOnboardingState(userId);

  const [accountHealth, setAccountHealth] = useState(() => ({
    backupEmail: onboardingState?.backupEmail || "minhkhoa.dev@gmail.com",
    backupEmailVerified: false,
    hasPassword:
      typeof onboardingState?.hasPassword === "boolean"
        ? onboardingState.hasPassword
        : authProvider !== "google",
    mfaEnabled: false,
    pushEnabled: Boolean(onboardingState?.pushEnabled)
  }));

  if (section && !VALID_SECTIONS.has(section)) {
    return <Navigate to="/profile" replace />;
  }

  const updateAccountHealth = (patch) => {
    setAccountHealth((prev) => ({ ...prev, ...patch }));
  };

  const { cleanName, roleNote } = parseDisplayName(rawFullName);
  const initials = getInitials(cleanName, userId);

  return (
    <div className="py-1">
      <div className="grid items-start gap-6 lg:grid-cols-[268px_minmax(0,1fr)] lg:gap-7">
        {/* Detached Floating Liquid Glass Sidebar (matches AdminLayout chrome) */}
        <aside className="space-y-3 lg:sticky lg:top-20">
          {/* Desktop Unified Liquid Glass Rail (>= lg) */}
          <div className="liquid-glass hidden rounded-[26px] p-3.5 lg:block">
            {/* Identity Header inside Glass Rail */}
            <div className="rounded-[18px] border border-white/60 bg-card/80 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="liquid-glass-btn-cobalt flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground" title={cleanName}>
                    {cleanName}
                  </div>
                  <div className="tabular-mono text-xs text-muted-foreground">{userId}</div>
                </div>
              </div>
              {roleNote && (
                <div className="mt-2.5 truncate rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {roleNote}
                </div>
              )}
              <div className="mt-3 border-t border-border/70 pt-2.5">
                <div className="truncate text-xs text-muted-foreground" title={email}>
                  {email}
                </div>
                <Link
                  to={`/p/${userId}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Hồ sơ công khai (/p/{userId})</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Primary Account Sections */}
            <nav aria-label="Điều hướng trang cá nhân" className="mt-3.5 space-y-1">
              {PROFILE_SECTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-card text-primary shadow-floating dark:bg-white/15 dark:text-white"
                        : "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary dark:text-white" : "text-muted-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Personal Workspaces */}
            <div className="mt-4 border-t border-border/70 pt-3.5">
              <div className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Không gian cá nhân
              </div>
              <nav aria-label="Không gian cá nhân liên kết" className="space-y-1">
                {QUICK_WORKSPACES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Compact Glass Identity + Scrollable Pill Nav (< lg) */}
          <div className="space-y-3 lg:hidden">
            <div className="liquid-glass flex items-center justify-between gap-3 rounded-[22px] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="liquid-glass-btn-cobalt flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{cleanName}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    <span className="tabular-mono font-medium text-foreground/80">{userId}</span>
                    {roleNote ? ` · ${roleNote}` : ""}
                  </div>
                </div>
              </div>
              <Link
                to={`/p/${userId}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card/85 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm dark:bg-white/10"
              >
                <span>CV</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <nav
              aria-label="Mục tài khoản cá nhân"
              className="liquid-glass scroll-x-pills flex gap-1 rounded-full p-1.5"
            >
              {PROFILE_SECTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-card text-primary shadow-floating dark:bg-white/15 dark:text-white"
                        : "text-foreground/75 hover:bg-black/5 dark:hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Main Content Column */}
        <section className="min-w-0">
          {activeKey === "overview" && (
            <ProfileOverviewSection
              userId={userId}
              fullName={cleanName}
              email={email}
              accountHealth={accountHealth}
              roleCount={roleScopes.length}
              onboardingState={onboardingState}
            />
          )}
          {activeKey === "calendar" && (
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded-[22px] border border-border bg-card/70" />
              }
            >
              <CalendarPage glassHeader />
            </Suspense>
          )}
          {activeKey === "info" && (
            <ProfileInfoSection
              userId={userId}
              fullName={cleanName}
              email={email}
              accountHealth={accountHealth}
              onUpdateAccountHealth={updateAccountHealth}
              onboardingState={onboardingState}
            />
          )}
          {activeKey === "security" && (
            <ProfileSecuritySection
              userId={userId}
              email={email}
              accountHealth={accountHealth}
              onUpdateAccountHealth={updateAccountHealth}
            />
          )}
          {activeKey === "roles" && (
            <ProfileRolesSection
              roleScopes={roleScopes}
              authorities={authorities}
            />
          )}
          {activeKey === "privacy" && <ProfilePrivacySection />}
          {activeKey === "app" && (
            <ProfileAppSettingsSection
              accountHealth={accountHealth}
              onUpdateAccountHealth={updateAccountHealth}
            />
          )}
        </section>
      </div>
    </div>
  );
}
