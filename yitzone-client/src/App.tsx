import { lazy, Suspense, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { StageLayout } from "@/components/layout/StageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventsPage } from "@/features/events/EventsPage";
import { ForbiddenPage } from "@/features/system/ForbiddenPage";
import { NotFoundPage } from "@/features/system/NotFoundPage";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { ALL_ADMIN_AUTHORITIES, PERMISSIONS } from "@/lib/permissions";
import { queryClient } from "@/lib/query-client";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

// Lazy-loaded pages (route-level code splitting for mobile PWA performance)
const ArtsAdminPage = lazy(() => import("@/features/arts/ArtsAdminPage").then((m) => ({ default: m.ArtsAdminPage })));
const ArtsPortalPage = lazy(() => import("@/features/arts/ArtsPortalPage").then((m) => ({ default: m.ArtsPortalPage })));
const AttendanceReviewPage = lazy(() => import("@/features/attendance/AttendanceReviewPage").then((m) => ({ default: m.AttendanceReviewPage })));
const OfflineScannerPage = lazy(() => import("@/features/attendance/OfflineScannerPage").then((m) => ({ default: m.OfflineScannerPage })));
const StudentCheckinPage = lazy(() => import("@/features/attendance/StudentCheckinPage").then((m) => ({ default: m.StudentCheckinPage })));
const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const OAuth2CallbackPage = lazy(() => import("@/features/auth/OAuth2CallbackPage").then((m) => ({ default: m.OAuth2CallbackPage })));
const CalendarPage = lazy(() => import("@/features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const CertificateAdminPage = lazy(() => import("@/features/certificates/CertificateAdminPage").then((m) => ({ default: m.CertificateAdminPage })));
const CertificateVerifyPage = lazy(() => import("@/features/certificates/CertificateVerifyPage").then((m) => ({ default: m.CertificateVerifyPage })));
const MyCertificatesPage = lazy(() => import("@/features/certificates/MyCertificatesPage").then((m) => ({ default: m.MyCertificatesPage })));
const YitBotAdminPage = lazy(() => import("@/features/chatbot/YitBotAdminPage").then((m) => ({ default: m.YitBotAdminPage })));
const YitBotPage = lazy(() => import("@/features/chatbot/YitBotPage").then((m) => ({ default: m.YitBotPage })));
const CmsAdminPage = lazy(() => import("@/features/cms/CmsAdminPage").then((m) => ({ default: m.CmsAdminPage })));
const NewsComposePage = lazy(() => import("@/features/cms/NewsComposePage").then((m) => ({ default: m.NewsComposePage })));
const NewsDetailPage = lazy(() => import("@/features/cms/NewsDetailPage").then((m) => ({ default: m.NewsDetailPage })));
const NewsPage = lazy(() => import("@/features/cms/NewsPage").then((m) => ({ default: m.NewsPage })));
const DesignSystemPage = lazy(() => import("@/features/design-system/DesignSystemPage").then((m) => ({ default: m.DesignSystemPage })));
const EventAdminPage = lazy(() => import("@/features/events/EventAdminPage").then((m) => ({ default: m.EventAdminPage })));
const EventCreatePage = lazy(() => import("@/features/events/EventCreatePage").then((m) => ({ default: m.EventCreatePage })));
const EventDetailPage = lazy(() => import("@/features/events/EventDetailPage").then((m) => ({ default: m.EventDetailPage })));
const EventManagePage = lazy(() => import("@/features/events/EventManagePage").then((m) => ({ default: m.EventManagePage })));
const EventsCatalogPage = lazy(() => import("@/features/events/EventsCatalogPage").then((m) => ({ default: m.EventsCatalogPage })));
const ExamAdminPage = lazy(() => import("@/features/exam/ExamAdminPage").then((m) => ({ default: m.ExamAdminPage })));
const ExamTakePage = lazy(() => import("@/features/exam/ExamTakePage").then((m) => ({ default: m.ExamTakePage })));
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
const ModuleDirectoryPage = lazy(() => import("@/features/modules/ModuleDirectoryPage").then((m) => ({ default: m.ModuleDirectoryPage })));
const OfficeAdminPage = lazy(() => import("@/features/office/OfficeAdminPage").then((m) => ({ default: m.OfficeAdminPage })));
const OfficeDutyPage = lazy(() => import("@/features/office/OfficeDutyPage").then((m) => ({ default: m.OfficeDutyPage })));
const OjAdminPage = lazy(() => import("@/features/oj/OjAdminPage").then((m) => ({ default: m.OjAdminPage })));
const OjHomePage = lazy(() => import("@/features/oj/OjHomePage").then((m) => ({ default: m.OjHomePage })));
const OjProblemDetailPage = lazy(() => import("@/features/oj/OjProblemDetailPage").then((m) => ({ default: m.OjProblemDetailPage })));
const PortfolioEditorPage = lazy(() => import("@/features/portfolio/PortfolioEditorPage").then((m) => ({ default: m.PortfolioEditorPage })));
const PublicPortfolioPage = lazy(() => import("@/features/portfolio/PublicPortfolioPage").then((m) => ({ default: m.PublicPortfolioPage })));
const PublicPortalPage = lazy(() => import("@/features/public/PublicPortalPage").then((m) => ({ default: m.PublicPortalPage })));
const PwaSettingsPage = lazy(() => import("@/features/pwa/PwaSettingsPage").then((m) => ({ default: m.PwaSettingsPage })));
const InboxAdminPage = lazy(() => import("@/features/qachat/InboxAdminPage").then((m) => ({ default: m.InboxAdminPage })));
const MessengerPage = lazy(() => import("@/features/qachat/MessengerPage").then((m) => ({ default: m.MessengerPage })));
const StoreAdminPage = lazy(() => import("@/features/store/StoreAdminPage").then((m) => ({ default: m.StoreAdminPage })));
const StoreCartPage = lazy(() => import("@/features/store/StoreCartPage").then((m) => ({ default: m.StoreCartPage })));
const StoreCheckoutPage = lazy(() => import("@/features/store/StoreCheckoutPage").then((m) => ({ default: m.StoreCheckoutPage })));
const StoreOrdersPage = lazy(() => import("@/features/store/StoreOrdersPage").then((m) => ({ default: m.StoreOrdersPage })));
const StorePage = lazy(() => import("@/features/store/StorePage").then((m) => ({ default: m.StorePage })));
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

function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-foreground">
          Không gian Quản trị BCH / BTV / 4 Ban – 9 Tổ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shell quản trị mật độ cao với Context &amp; Unit Switcher cố định trên Sidebar để cô lập dữ liệu đúng đơn vị.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Hậu kiểm Điểm danh 48h</CardTitle>
            <CardDescription>Chấm điểm rủi ro trọng số</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/scanner">Mở màn hình Soát vé</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Điều phối 20 Phân hệ</CardTitle>
            <CardDescription>Theo dõi lộ trình P0 → P3 theo USECASE_YITZone</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/modules">Xem danh mục phân hệ</Link>
            </Button>
          </CardContent>
        </Card>
        {import.meta.env.DEV && (
          <Card>
            <CardHeader>
              <CardTitle>UI Kit &amp; Audit Dialog</CardTitle>
              <CardDescription>Kiểm thử bảng dữ liệu và thành phần kiểm toán (Dev)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link to="/design-system">Mở UI Kit</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StagePreviewPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#0e1529] p-8 lg:col-span-8">
        <div>
          <span className="inline-flex rounded-full border border-sky-400/40 bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-300">
            LIVE Q&amp;A · ĐANG GIẢI ĐÁP
          </span>
          <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-white lg:text-5xl">
            Sinh viên chuyển ngành vào Khoa CNTT nhưng giữ MSSV cũ có được ghi nhận chuẩn CĐDN không?
          </h1>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-slate-300">
          <span>Sinh viên Khoa CNTT (Ẩn danh)</span>
          <span className="tabular-mono text-lg font-semibold text-sky-300">42 lượt ủng hộ</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-white/15 bg-[#0e1529] p-8 text-center lg:col-span-4">
        <div className="rounded-lg bg-white p-4">
          <div className="flex h-44 w-44 items-center justify-center rounded border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-600">
            VÙNG MÃ QR ĐỘNG 10s
          </div>
        </div>
        <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Mã PIN Tham gia
        </div>
        <div className="mt-1 tabular-mono text-4xl font-semibold tracking-widest text-white">
          482 910
        </div>
      </div>
    </div>
  );
}

function SharedSurfaceLayout() {
  const surface = useThemeStore((s) => s.surface);
  return surface === "public" ? <PublicLayout /> : <AppLayout />;
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
    if (!accessToken || accessToken === "demo-local-offline-token") {
      return;
    }
    let active = true;
    void apiClient
      .get<ApiResponse<{ userId: string; activeScopeId: string; authorities: string[] }>>("/iam/me")
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
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/public" element={<PublicPortalPage />} />
                <Route path="/verify/:certCode" element={<CertificateVerifyPage />} />
                <Route path="/p/:username" element={<PublicPortfolioPage />} />
              </Route>

              {/* Protected Admin Workspace — every route enforces auth + module permissions */}
              <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={ALL_ADMIN_AUTHORITIES} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminOverviewPage />} />

                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_IAM_ROSTER} />}>
                    <Route path="/admin/iam/roster" element={<RosterMajorAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_IAM_RBAC} />}>
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
                    <Route path="/admin/scanner" element={<OfflineScannerPage />} />
                  </Route>

                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_CERTIFICATES} />}>
                    <Route path="/admin/certificates" element={<CertificateAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_AUDIT} />}>
                    <Route path="/admin/audit" element={<AuditLogAdminPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_CMS} />}>
                    <Route path="/admin/cms" element={<CmsAdminPage />} />
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
                    <Route path="/admin/exams" element={<ExamAdminPage />} />
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

              <Route element={<StageLayout />}>
                <Route path="/stage" element={<StagePreviewPage />} />
                <Route path="/stage/qa" element={<LiveQaStagePage />} />
                <Route path="/stage/voting" element={<VotingStagePage />} />
                <Route path="/stage/minigame" element={<MinigameStagePage />} />
              </Route>

              <Route element={<SharedSurfaceLayout />}>
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:slug" element={<NewsDetailPage />} />
                <Route path="/public/honor-roll" element={<HonorRollPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/store/cart" element={<StoreCartPage />} />
                <Route path="/store/checkout" element={<StoreCheckoutPage />} />
                <Route path="/store/orders" element={<StoreOrdersPage />} />
              </Route>

              <Route element={<AppLayout />}>
                <Route path="/" element={<EventsPage />} />
                <Route path="/events" element={<EventsCatalogPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/sv5t" element={<Sv5tPortalPage />} />
                <Route path="/surveys/:id" element={<SurveyTakePage />} />
                <Route path="/live-qa/:pin" element={<LiveQaAudiencePage />} />
                <Route path="/kiosk/voting" element={<VotingKioskPage />} />
                <Route path="/minigame" element={<MinigamePlayerPage />} />
                <Route path="/exam/:id" element={<ExamTakePage />} />
                <Route path="/oj" element={<OjHomePage />} />
                <Route path="/oj/problems/:id" element={<OjProblemDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/pwa-settings" element={<PwaSettingsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<OAuth2CallbackPage />} />
                <Route path="/scanner" element={<StudentCheckinPage />} />
                <Route path="/voting" element={<VotingPage />} />
                <Route path="/yitbot" element={<YitBotPage />} />
                <Route path="/modules" element={<ModuleDirectoryPage />} />
                {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystemPage />} />}

                {/* Authenticated Personal & Contributor Routes */}
                <Route element={<ProtectedRoute requireAuth={true} />}>
                  <Route path="/news/compose" element={<NewsComposePage />} />
                  <Route path="/messenger" element={<MessengerPage />} />
                  <Route path="/portfolio" element={<PortfolioEditorPage />} />
                  <Route path="/office-duty" element={<OfficeDutyPage />} />
                  <Route path="/certificates" element={<MyCertificatesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfileSecurityPage />} />
                  <Route path="/privacy" element={<PrivacyCenterPage />} />
                </Route>

                <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ARTS_LEAD_PORTAL} />}>
                  <Route path="/arts" element={<ArtsPortalPage />} />
                </Route>
                <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_ATTENDANCE} />}>
                  <Route path="/protected-scanner" element={<OfflineScannerPage />} />
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
