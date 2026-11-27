import { lazy, Suspense, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Banknote,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Inbox,
  MonitorPlay,
  QrCode,
  ScanLine,
  ShieldAlert
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { FieldLayout } from "@/components/layout/FieldLayout";
import { StageLayout } from "@/components/layout/StageLayout";
import { AppToaster } from "@/components/ui/app-toaster";
import { NotificationPopup } from "@/components/ui/notification-popup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventsPage } from "@/features/events/EventsPage";
import { ForbiddenPage } from "@/features/system/ForbiddenPage";
import { NotFoundPage } from "@/features/system/NotFoundPage";
import { apiClient } from "@/lib/api-client";
import { ALL_ADMIN_AUTHORITIES, PERMISSIONS } from "@/lib/permissions";
import { queryClient } from "@/lib/query-client";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/stores/auth-store";

// Lazy-loaded pages (route-level code splitting for mobile PWA performance)
const ArtsAdminPage = lazy(() => import("@/features/arts/ArtsAdminPage").then((m) => ({ default: m.ArtsAdminPage })));
const ArtsPortalPage = lazy(() => import("@/features/arts/ArtsPortalPage").then((m) => ({ default: m.ArtsPortalPage })));
const AttendanceReviewPage = lazy(() => import("@/features/attendance/AttendanceReviewPage").then((m) => ({ default: m.AttendanceReviewPage })));
const OfflineScannerPage = lazy(() => import("@/features/attendance/OfflineScannerPage").then((m) => ({ default: m.OfflineScannerPage })));
const StudentCheckinPage = lazy(() => import("@/features/attendance/StudentCheckinPage").then((m) => ({ default: m.StudentCheckinPage })));
const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const OAuth2CallbackPage = lazy(() => import("@/features/auth/OAuth2CallbackPage").then((m) => ({ default: m.OAuth2CallbackPage })));
const OnboardingWizardPage = lazy(() => import("@/features/auth/OnboardingWizardPage").then((m) => ({ default: m.OnboardingWizardPage })));
const CalendarPage = lazy(() => import("@/features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const CertificateAdminPage = lazy(() => import("@/features/certificates/CertificateAdminPage").then((m) => ({ default: m.CertificateAdminPage })));
const CertificateVerifyPage = lazy(() => import("@/features/certificates/CertificateVerifyPage").then((m) => ({ default: m.CertificateVerifyPage })));
const MyCertificatesPage = lazy(() => import("@/features/certificates/MyCertificatesPage").then((m) => ({ default: m.MyCertificatesPage })));
const VerifyLookupPage = lazy(() => import("@/features/certificates/VerifyLookupPage").then((m) => ({ default: m.VerifyLookupPage })));
const YitBotAdminPage = lazy(() => import("@/features/chatbot/YitBotAdminPage").then((m) => ({ default: m.YitBotAdminPage })));
const YitBotPage = lazy(() => import("@/features/chatbot/YitBotPage").then((m) => ({ default: m.YitBotPage })));
const CmsAdminPage = lazy(() => import("@/features/cms/CmsAdminPage").then((m) => ({ default: m.CmsAdminPage })));
const NewsComposePage = lazy(() => import("@/features/cms/NewsComposePage").then((m) => ({ default: m.NewsComposePage })));
const NewsDetailPage = lazy(() => import("@/features/cms/NewsDetailPage").then((m) => ({ default: m.NewsDetailPage })));
const NewsPage = lazy(() => import("@/features/cms/NewsPage").then((m) => ({ default: m.NewsPage })));
const EventAdminPage = lazy(() => import("@/features/events/EventAdminPage").then((m) => ({ default: m.EventAdminPage })));
const EventCreatePage = lazy(() => import("@/features/events/EventCreatePage").then((m) => ({ default: m.EventCreatePage })));
const EventDetailPage = lazy(() => import("@/features/events/EventDetailPage").then((m) => ({ default: m.EventDetailPage })));
const EventManagePage = lazy(() => import("@/features/events/EventManagePage").then((m) => ({ default: m.EventManagePage })));
const EventsCatalogPage = lazy(() => import("@/features/events/EventsCatalogPage").then((m) => ({ default: m.EventsCatalogPage })));
const ExamAdminPage = lazy(() => import("@/features/exam/ExamAdminPage").then((m) => ({ default: m.ExamAdminPage })));
const ExamTakePage = lazy(() => import("@/features/exam/ExamTakePage").then((m) => ({ default: m.ExamTakePage })));
const ExamListPage = lazy(() => import("@/features/FirstEntryPages").then((m) => ({ default: m.ExamListPage })));
const LiveQaJoinPage = lazy(() => import("@/features/FirstEntryPages").then((m) => ({ default: m.LiveQaJoinPage })));
const SurveyListPage = lazy(() => import("@/features/FirstEntryPages").then((m) => ({ default: m.SurveyListPage })));
const AccountAdminPage = lazy(() => import("@/features/iam/AccountAdminPage").then((m) => ({ default: m.AccountAdminPage })));
const OrgRbacAdminPage = lazy(() => import("@/features/iam/OrgRbacAdminPage").then((m) => ({ default: m.OrgRbacAdminPage })));
const PrivacyCenterPage = lazy(() => import("@/features/iam/PrivacyCenterPage").then((m) => ({ default: m.PrivacyCenterPage })));
const ProfileSecurityPage = lazy(() => import("@/features/iam/ProfileSecurityPage").then((m) => ({ default: m.ProfileSecurityPage })));
const RestructuringPage = lazy(() => import("@/features/iam/RestructuringPage").then((m) => ({ default: m.RestructuringPage })));
const RosterMajorAdminPage = lazy(() => import("@/features/iam/RosterMajorAdminPage").then((m) => ({ default: m.RosterMajorAdminPage })));
const UnitHrPage = lazy(() => import("@/features/iam/UnitHrPage").then((m) => ({ default: m.UnitHrPage })));
const LiveQaAdminPage = lazy(() => import("@/features/liveqa/LiveQaAdminPage").then((m) => ({ default: m.LiveQaAdminPage })));
const LiveQaAudiencePage = lazy(() => import("@/features/liveqa/LiveQaAudiencePage").then((m) => ({ default: m.LiveQaAudiencePage })));
const LiveQaStagePage = lazy(() => import("@/features/liveqa/LiveQaStagePage").then((m) => ({ default: m.LiveQaStagePage })));
const MinigamePlayerPage = lazy(() => import("@/features/minigame/MinigamePlayerPage").then((m) => ({ default: m.MinigamePlayerPage })));
const MinigameStagePage = lazy(() => import("@/features/minigame/MinigameStagePage").then((m) => ({ default: m.MinigameStagePage })));
const OfficeAdminPage = lazy(() => import("@/features/office/OfficeAdminPage").then((m) => ({ default: m.OfficeAdminPage })));
const OfficeDutyPage = lazy(() => import("@/features/office/OfficeDutyPage").then((m) => ({ default: m.OfficeDutyPage })));
const OjAdminPage = lazy(() => import("@/features/oj/OjAdminPage").then((m) => ({ default: m.OjAdminPage })));
const OjHomePage = lazy(() => import("@/features/oj/OjHomePage").then((m) => ({ default: m.OjHomePage })));
const OjProblemDetailPage = lazy(() => import("@/features/oj/OjProblemDetailPage").then((m) => ({ default: m.OjProblemDetailPage })));
const PortfolioEditorPage = lazy(() => import("@/features/portfolio/PortfolioEditorPage").then((m) => ({ default: m.PortfolioEditorPage })));
const PublicPortfolioPage = lazy(() => import("@/features/portfolio/PublicPortfolioPage").then((m) => ({ default: m.PublicPortfolioPage })));
const PwaSettingsPage = lazy(() => import("@/features/pwa/PwaSettingsPage").then((m) => ({ default: m.PwaSettingsPage })));
const InboxAdminPage = lazy(() => import("@/features/qachat/InboxAdminPage").then((m) => ({ default: m.InboxAdminPage })));
const MessengerPage = lazy(() => import("@/features/qachat/MessengerPage").then((m) => ({ default: m.MessengerPage })));
const StageHubPage = lazy(() => import("@/features/stage/StageHubPage").then((m) => ({ default: m.StageHubPage })));
const StoreAdminPage = lazy(() => import("@/features/store/StoreAdminPage").then((m) => ({ default: m.StoreAdminPage })));
const StoreBoothPage = lazy(() => import("@/features/store/StoreBoothPage").then((m) => ({ default: m.StoreBoothPage })));
const StoreCartPage = lazy(() => import("@/features/store/StoreCartPage").then((m) => ({ default: m.StoreCartPage })));
const StoreCheckoutPage = lazy(() => import("@/features/store/StoreCheckoutPage").then((m) => ({ default: m.StoreCheckoutPage })));
const StoreOrdersPage = lazy(() => import("@/features/store/StoreOrdersPage").then((m) => ({ default: m.StoreOrdersPage })));
const StorePage = lazy(() => import("@/features/store/StorePage").then((m) => ({ default: m.StorePage })));
const StoreProductDetailPage = lazy(() => import("@/features/store/StoreProductDetailPage").then((m) => ({ default: m.StoreProductDetailPage })));
const SurveyAdminPage = lazy(() => import("@/features/surveys/SurveyAdminPage").then((m) => ({ default: m.SurveyAdminPage })));
const SurveyTakePage = lazy(() => import("@/features/surveys/SurveyTakePage").then((m) => ({ default: m.SurveyTakePage })));
const HonorRollPage = lazy(() => import("@/features/sv5t/HonorRollPage").then((m) => ({ default: m.HonorRollPage })));
const Sv5tAdminPage = lazy(() => import("@/features/sv5t/Sv5tAdminPage").then((m) => ({ default: m.Sv5tAdminPage })));
const Sv5tPortalPage = lazy(() => import("@/features/sv5t/Sv5tPortalPage").then((m) => ({ default: m.Sv5tPortalPage })));
const AuditLogAdminPage = lazy(() => import("@/features/system/AuditLogAdminPage").then((m) => ({ default: m.AuditLogAdminPage })));
const NotificationsPage = lazy(() => import("@/features/system/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const VotingAdminPage = lazy(() => import("@/features/voting/VotingAdminPage").then((m) => ({ default: m.VotingAdminPage })));
const VotingKioskPage = lazy(() => import("@/features/voting/VotingKioskPage").then((m) => ({ default: m.VotingKioskPage })));
const VotingPage = lazy(() => import("@/features/voting/VotingPage").then((m) => ({ default: m.VotingPage })));
const VotingStagePage = lazy(() => import("@/features/voting/VotingStagePage").then((m) => ({ default: m.VotingStagePage })));

function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-5xl space-y-4 py-8"
    >
      <div className="h-24 w-full animate-pulse rounded-panel border border-border/60 bg-card/70" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-44 animate-pulse rounded-card border border-border/60 bg-card/70" />
        <div className="h-44 animate-pulse rounded-card border border-border/60 bg-card/70" />
      </div>
      <span className="sr-only">Đang tải nội dung trang...</span>
    </div>
  );
}

const TIME_BOUND_QUEUES = [
  {
    key: "attendance-review",
    to: "/admin/attendance",
    title: "Hậu kiểm Điểm danh 48 giờ",
    description: "Rà soát các lượt điểm danh gắn cờ cảnh báo trước khi khóa sổ cấp E-Certificate.",
    badgeLabel: "Cửa sổ 48h",
    badgeVariant: "outline",
    badgeIcon: Clock,
    icon: QrCode,
    count: 0,
    unit: "ca",
    actionLabel: "Mở Hậu kiểm 48h"
  },
  {
    key: "student-inbox-sla",
    to: "/admin/inbox",
    title: "Hộp thư Sinh viên & SLA",
    description: "Theo dõi và phản hồi các hội thoại Q&A Messenger từ sinh viên đúng cam kết 24 giờ.",
    badgeLabel: "SLA 24h",
    badgeVariant: "outline",
    badgeIcon: AlertTriangle,
    icon: Inbox,
    count: 0,
    unit: "hội thoại",
    actionLabel: "Mở Hộp thư SLA 24h"
  },
  {
    key: "cod-handover",
    to: "/admin/store",
    title: "Phiếu Tiền mặt COD Chờ Bàn giao",
    description: "Đối soát tiền mặt thu hộ tại bàn trực và xác nhận bàn giao cho Thủ quỹ cuối ca.",
    badgeLabel: "Cuối ca trực",
    badgeVariant: "outline",
    badgeIcon: ShieldAlert,
    icon: Banknote,
    count: 0,
    unit: "phiếu",
    actionLabel: "Đối soát & Bàn giao COD"
  }
];

const APPROVAL_QUEUES = [
  {
    key: "event-approval",
    to: "/admin/events",
    title: "Sự kiện Chờ Duyệt Xuất bản",
    description: "Thẩm định kế hoạch sự kiện và nhãn quyền lợi Cộng ĐRL, CTXH, CĐDN trước khi mở cổng đăng ký.",
    badgeLabel: "Phê duyệt BTV",
    badgeVariant: "info",
    badgeIcon: null,
    icon: CalendarCheck2,
    count: 0,
    unit: "sự kiện",
    actionLabel: "Thẩm định & Xuất bản"
  },
  {
    key: "sv5t-review",
    to: "/admin/sv5t",
    title: "Hồ sơ SV5T & Đơn Phúc khảo",
    description: "Rà soát minh chứng 5 tiêu chí và giải quyết đơn phúc khảo trong cửa sổ công bố kết quả.",
    badgeLabel: "Đợt xét cấp Khoa",
    badgeVariant: "secondary",
    badgeIcon: null,
    icon: Award,
    count: 0,
    unit: "hồ sơ",
    actionLabel: "Mở Hội đồng SV5T"
  }
];

function OperationalQueueRow({ item }) {
  const Icon = item.icon;
  const BadgeIcon = item.badgeIcon;
  const hasPending = item.count > 0;

  return (
    <li>
      <Link
        to={item.to}
        className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/45 focus-visible:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-foreground/80 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {item.title}
              </span>
              <Badge variant={item.badgeVariant} className="gap-1">
                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                <span>{item.badgeLabel}</span>
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 pl-[54px] sm:flex-col sm:items-end sm:justify-center sm:gap-1 sm:pl-0">
          <span
            className={`tabular-mono text-base font-semibold ${
              hasPending ? "text-primary" : "text-foreground"
            }`}
          >
            {item.count} {item.unit}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <span>{item.actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * Actionable Operational Dashboard for /admin (fixes A5)
 */
function AdminOverviewPage() {
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const activeScopeLabel =
    roleScopes.find((s) => s.scopeId === activeScopeId)?.label.replace(/\s*\(FACULTY\)/gi, "") ??
    (activeScopeId === "FACULTY" ? "Toàn Khoa CNTT" : activeScopeId);

  const timeBoundTotal = TIME_BOUND_QUEUES.reduce((sum, item) => sum + item.count, 0);
  const approvalTotal = APPROVAL_QUEUES.reduce((sum, item) => sum + item.count, 0);
  const activeQueueCount = [...TIME_BOUND_QUEUES, ...APPROVAL_QUEUES].filter(
    (item) => item.count > 0
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Đơn vị đang thao tác: {activeScopeLabel}</Badge>
          </div>
          <h1 className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl">
            Việc Cần Xử lý
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tổng hợp các đầu việc vận hành ưu tiên, cảnh báo SLA 24h và hàng đợi phê duyệt theo phạm vi đơn vị.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/staff/scanner">
              <ScanLine className="h-4 w-4 text-primary" />
              <span>Máy Soát vé Hiện trường</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/stage">
              <MonitorPlay className="h-4 w-4 text-primary" />
              <span>Màn chiếu LED 16:9</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Grouped Operational Queues: Time-bound SLA (7 cols) + Approvals (5 cols) */}
      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        <section
          aria-labelledby="queue-sla-heading"
          className="overflow-hidden rounded-[20px] border border-border bg-card shadow-sm lg:col-span-7"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
            <div className="min-w-0">
              <h2 id="queue-sla-heading" className="text-sm font-semibold text-foreground">
                Hàng đợi theo thời hạn &amp; SLA
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ưu tiên xử lý trong cửa sổ 24h – 48h và đối soát cuối ca trực.
              </p>
            </div>
            <Badge variant={timeBoundTotal > 0 ? "warning" : "secondary"} className="tabular-mono shrink-0">
              {timeBoundTotal} cần xử lý
            </Badge>
          </header>

          <ul className="divide-y divide-border/80">
            {TIME_BOUND_QUEUES.map((item) => (
              <OperationalQueueRow key={item.key} item={item} />
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="queue-approval-heading"
          className="overflow-hidden rounded-[20px] border border-border bg-card shadow-sm lg:col-span-5"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
            <div className="min-w-0">
              <h2 id="queue-approval-heading" className="text-sm font-semibold text-foreground">
                Phê duyệt &amp; Hội đồng
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Thẩm định cấp BTV và xét duyệt hồ sơ theo đợt.
              </p>
            </div>
            <Badge variant={approvalTotal > 0 ? "info" : "secondary"} className="tabular-mono shrink-0">
              {approvalTotal} chờ duyệt
            </Badge>
          </header>

          <ul className="divide-y divide-border/80">
            {APPROVAL_QUEUES.map((item) => (
              <OperationalQueueRow key={item.key} item={item} />
            ))}
          </ul>

          <footer className="flex items-center justify-between gap-3 border-t border-border/80 bg-muted/35 px-5 py-3.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
              <span>
                {activeQueueCount === 0
                  ? "Tất cả 5 hàng đợi vận hành đang sạch."
                  : `Còn ${activeQueueCount}/5 hàng đợi có đầu việc cần xử lý.`}
              </span>
            </div>
            <span className="tabular-mono shrink-0 font-semibold text-foreground">
              {activeQueueCount}/5 hàng đợi
            </span>
          </footer>
        </section>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}

export function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const syncFromMe = useAuthStore((s) => s.syncFromMe);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let active = true;
    void apiClient
      .get("/iam/me")
      .then((res) => {
        if (!active || !res.data.success) return;
        syncFromMe({
          activeScopeId: res.data.data.activeScopeId,
          authorities: res.data.data.authorities
        });
      })
      .catch(() => {
        // 401 is handled by apiClient response interceptor
      });
    return () => {
      active = false;
    };
  }, [accessToken, syncFromMe]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <AppToaster />
          <NotificationPopup />
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Dedicated Mobile-First Field Shell for on-site CTV/BTC operations (L2, L3) */}
              <Route element={<ProtectedRoute requireAuth={true} />}>
                <Route element={<FieldLayout />}>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_ATTENDANCE} />}>
                    <Route path="/staff/scanner" element={<OfflineScannerPage />} />
                    <Route path="/admin/scanner" element={<OfflineScannerPage />} />
                    <Route path="/protected-scanner" element={<OfflineScannerPage />} />
                  </Route>
                  <Route path="/staff/store-booth" element={<StoreBoothPage />} />
                </Route>
              </Route>

              {/* Protected Admin Workspace — every route enforces auth + module permissions */}
              <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={ALL_ADMIN_AUTHORITIES} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminOverviewPage />} />
                  <Route path="/admin/calendar" element={<CalendarPage />} />

                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_IAM_ROSTER} />}>
                    <Route path="/admin/iam/roster" element={<RosterMajorAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_IAM_RBAC} />}>
                    <Route path="/admin/iam/accounts" element={<AccountAdminPage />} />
                    <Route path="/admin/iam/rbac" element={<OrgRbacAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_IAM_UNIT_HR} />}>
                    <Route path="/admin/iam/unit-hr" element={<UnitHrPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_IAM_RESTRUCTURING} />}>
                    <Route path="/admin/iam/restructuring" element={<RestructuringPage />} />
                  </Route>

                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_EVENTS} />}>
                    <Route path="/admin/events" element={<EventAdminPage />} />
                    <Route path="/admin/events/new" element={<EventCreatePage />} />
                    <Route path="/admin/events/:eventId/edit" element={<EventCreatePage />} />
                    <Route path="/admin/events/:eventId" element={<EventManagePage />} />
                  </Route>

                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_ATTENDANCE} />}>
                    <Route path="/admin/attendance" element={<AttendanceReviewPage />} />
                  </Route>

                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_CERTIFICATES} />}>
                    <Route path="/admin/certificates" element={<CertificateAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_AUDIT} />}>
                    <Route path="/admin/audit" element={<AuditLogAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_CMS} />}>
                    <Route path="/admin/cms" element={<CmsAdminPage />} />
                    <Route path="/admin/cms/compose" element={<NewsComposePage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_SV5T} />}>
                    <Route path="/admin/sv5t" element={<Sv5tAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_SURVEYS} />}>
                    <Route path="/admin/surveys" element={<SurveyAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_LIVEQA} />}>
                    <Route path="/admin/live-qa" element={<LiveQaAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_VOTING} />}>
                    <Route path="/admin/voting" element={<VotingAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_OFFICE} />}>
                    <Route path="/admin/office" element={<OfficeAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_STORE} />}>
                    <Route path="/admin/store" element={<StoreAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_EXAMS_MINIGAME} />}>
                    <Route path="/admin/exams" element={<ExamAdminPage mode="exam" />} />
                    <Route path="/admin/minigame" element={<ExamAdminPage mode="minigame" />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_YITBOT} />}>
                    <Route path="/admin/yitbot" element={<YitBotAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_ARTS} />}>
                    <Route path="/admin/arts" element={<ArtsAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_INBOX} />}>
                    <Route path="/admin/inbox" element={<InboxAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_OJ} />}>
                    <Route path="/admin/oj" element={<OjAdminPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Protected 16:9 LED Stage & Kiosk Shell (A1, M1, M3) */}
              <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.STAGE_CONTROL} />}>
                <Route element={<StageLayout />}>
                  <Route path="/stage" element={<StageHubPage mode="hub" />} />
                  <Route path="/stage/checkin" element={<StageHubPage mode="checkin" />} />
                  <Route path="/stage/qa" element={<LiveQaStagePage />} />
                  <Route path="/stage/live-qa" element={<LiveQaStagePage />} />
                  <Route path="/stage/voting" element={<VotingStagePage />} />
                  <Route path="/stage/minigame" element={<MinigameStagePage />} />
                  <Route path="/kiosk/voting" element={<VotingKioskPage />} />
                </Route>
              </Route>

              <Route element={<AppLayout />}>
                <Route path="/" element={<EventsPage />} />
                <Route path="/public" element={<Navigate to="/verify" replace />} />
                <Route path="/verify" element={<VerifyLookupPage />} />
                <Route path="/verify/:certCode" element={<CertificateVerifyPage />} />
                <Route path="/p/:username" element={<PublicPortfolioPage />} />
                <Route path="/public/honor-roll" element={<HonorRollPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:slug" element={<NewsDetailPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/store/products/:productId" element={<StoreProductDetailPage />} />
                <Route path="/store/cart" element={<StoreCartPage />} />
                <Route path="/events" element={<EventsCatalogPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/sv5t" element={<Sv5tPortalPage />} />
                <Route path="/surveys" element={<SurveyListPage />} />
                <Route path="/live-qa" element={<LiveQaJoinPage />} />
                <Route path="/live-qa/:pin" element={<LiveQaAudiencePage />} />
                <Route path="/minigame" element={<MinigamePlayerPage />} />
                <Route path="/exams" element={<ExamListPage />} />
                <Route path="/oj" element={<OjHomePage />} />
                <Route path="/oj/problems/:id" element={<OjProblemDetailPage />} />
                <Route path="/calendar" element={<Navigate to="/profile/calendar" replace />} />
                <Route path="/pwa-settings" element={<PwaSettingsPage />} />
                <Route path="/privacy" element={<PrivacyCenterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<OAuth2CallbackPage />} />
                <Route path="/yitbot" element={<YitBotPage />} />

                {/* Authenticated Personal, Activity & Contributor Routes */}
                <Route element={<ProtectedRoute requireAuth={true} />}>
                  <Route path="/onboarding" element={<OnboardingWizardPage />} />
                  <Route path="/store/checkout" element={<StoreCheckoutPage />} />
                  <Route path="/store/orders" element={<StoreOrdersPage />} />
                  <Route path="/scanner" element={<StudentCheckinPage />} />
                  <Route path="/voting" element={<VotingPage />} />
                  <Route path="/surveys/:id" element={<SurveyTakePage />} />
                  <Route path="/exam/:id" element={<ExamTakePage />} />
                  <Route path="/news/compose" element={<NewsComposePage />} />
                  <Route path="/messenger" element={<MessengerPage />} />
                  <Route path="/portfolio" element={<PortfolioEditorPage />} />
                  <Route path="/office-duty" element={<OfficeDutyPage />} />
                  <Route path="/certificates" element={<MyCertificatesPage />} />
                  <Route path="/me/certificates" element={<MyCertificatesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfileSecurityPage />} />
                  <Route path="/profile/:section" element={<ProfileSecurityPage />} />
                </Route>

                <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ARTS_LEAD_PORTAL} />}>
                  <Route path="/arts" element={<ArtsPortalPage />} />
                </Route>

                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
