import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { StageLayout } from "@/components/layout/StageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArtsAdminPage } from "@/features/arts/ArtsAdminPage";
import { ArtsPortalPage } from "@/features/arts/ArtsPortalPage";
import { AttendanceReviewPage } from "@/features/attendance/AttendanceReviewPage";
import { OfflineScannerPage } from "@/features/attendance/OfflineScannerPage";
import { StudentCheckinPage } from "@/features/attendance/StudentCheckinPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { OAuth2CallbackPage } from "@/features/auth/OAuth2CallbackPage";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { CertificateAdminPage } from "@/features/certificates/CertificateAdminPage";
import { CertificateVerifyPage } from "@/features/certificates/CertificateVerifyPage";
import { MyCertificatesPage } from "@/features/certificates/MyCertificatesPage";
import { YitBotAdminPage } from "@/features/chatbot/YitBotAdminPage";
import { YitBotPage } from "@/features/chatbot/YitBotPage";
import { CmsAdminPage } from "@/features/cms/CmsAdminPage";
import { NewsComposePage } from "@/features/cms/NewsComposePage";
import { NewsDetailPage } from "@/features/cms/NewsDetailPage";
import { NewsPage } from "@/features/cms/NewsPage";
import { DesignSystemPage } from "@/features/design-system/DesignSystemPage";
import { EventAdminPage } from "@/features/events/EventAdminPage";
import { EventCreatePage } from "@/features/events/EventCreatePage";
import { EventDetailPage } from "@/features/events/EventDetailPage";
import { EventManagePage } from "@/features/events/EventManagePage";
import { EventsCatalogPage } from "@/features/events/EventsCatalogPage";
import { EventsPage } from "@/features/events/EventsPage";
import { ExamAdminPage } from "@/features/exam/ExamAdminPage";
import { ExamTakePage } from "@/features/exam/ExamTakePage";
import { OrgRbacAdminPage } from "@/features/iam/OrgRbacAdminPage";
import { PrivacyCenterPage } from "@/features/iam/PrivacyCenterPage";
import { ProfileSecurityPage } from "@/features/iam/ProfileSecurityPage";
import { RestructuringPage } from "@/features/iam/RestructuringPage";
import { RosterMajorAdminPage } from "@/features/iam/RosterMajorAdminPage";
import { UnitHrPage } from "@/features/iam/UnitHrPage";
import { LiveQaAdminPage } from "@/features/liveqa/LiveQaAdminPage";
import { LiveQaAudiencePage } from "@/features/liveqa/LiveQaAudiencePage";
import { LiveQaStagePage } from "@/features/liveqa/LiveQaStagePage";
import { MinigamePlayerPage } from "@/features/minigame/MinigamePlayerPage";
import { MinigameStagePage } from "@/features/minigame/MinigameStagePage";
import { ModuleDirectoryPage } from "@/features/modules/ModuleDirectoryPage";
import { OfficeAdminPage } from "@/features/office/OfficeAdminPage";
import { OfficeDutyPage } from "@/features/office/OfficeDutyPage";
import { OjAdminPage } from "@/features/oj/OjAdminPage";
import { OjHomePage } from "@/features/oj/OjHomePage";
import { OjProblemDetailPage } from "@/features/oj/OjProblemDetailPage";
import { PortfolioEditorPage } from "@/features/portfolio/PortfolioEditorPage";
import { PublicPortfolioPage } from "@/features/portfolio/PublicPortfolioPage";
import { PublicPortalPage } from "@/features/public/PublicPortalPage";
import { PwaSettingsPage } from "@/features/pwa/PwaSettingsPage";
import { InboxAdminPage } from "@/features/qachat/InboxAdminPage";
import { MessengerPage } from "@/features/qachat/MessengerPage";
import { StoreAdminPage } from "@/features/store/StoreAdminPage";
import { StoreCartPage } from "@/features/store/StoreCartPage";
import { StoreCheckoutPage } from "@/features/store/StoreCheckoutPage";
import { StoreOrdersPage } from "@/features/store/StoreOrdersPage";
import { StorePage } from "@/features/store/StorePage";
import { SurveyAdminPage } from "@/features/surveys/SurveyAdminPage";
import { SurveyTakePage } from "@/features/surveys/SurveyTakePage";
import { HonorRollPage } from "@/features/sv5t/HonorRollPage";
import { Sv5tAdminPage } from "@/features/sv5t/Sv5tAdminPage";
import { Sv5tPortalPage } from "@/features/sv5t/Sv5tPortalPage";
import { AuditLogAdminPage } from "@/features/system/AuditLogAdminPage";
import { NotificationsPage } from "@/features/system/NotificationsPage";
import { VotingAdminPage } from "@/features/voting/VotingAdminPage";
import { VotingKioskPage } from "@/features/voting/VotingKioskPage";
import { VotingPage } from "@/features/voting/VotingPage";
import { VotingStagePage } from "@/features/voting/VotingStagePage";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/permissions";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});

function AdminOverviewPage(){
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
        <Card>
          <CardHeader>
            <CardTitle>UI Kit &amp; Audit Dialog</CardTitle>
            <CardDescription>Kiểm thử bảng dữ liệu và thành phần kiểm toán</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/design-system">Mở UI Kit</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StagePreviewPage(){
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

export function App(){
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken || accessToken === "demo-local-offline-token") {
      return;
    }
    void apiClient
.get<ApiResponse<{ userId: string; activeScopeId: string; authorities: string[] }>>("/iam/me")
.catch(() => {
        // 401 is handled by apiClient response interceptor
      });
  }, [accessToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/public" element={<PublicPortalPage />} />
            <Route path="/verify/:certCode" element={<CertificateVerifyPage />} />
            <Route path="/p/:username" element={<PublicPortfolioPage />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/iam/roster" element={<RosterMajorAdminPage />} />
            <Route path="/admin/iam/rbac" element={<OrgRbacAdminPage />} />
            <Route path="/admin/iam/unit-hr" element={<UnitHrPage />} />
            <Route path="/admin/iam/restructuring" element={<RestructuringPage />} />
            <Route path="/admin/events" element={<EventAdminPage />} />
            <Route path="/admin/events/new" element={<EventCreatePage />} />
            <Route path="/admin/events/:eventId/edit" element={<EventCreatePage />} />
            <Route path="/admin/events/:eventId" element={<EventManagePage />} />
            <Route path="/admin/attendance" element={<AttendanceReviewPage />} />
            <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_ATTENDANCE} />}>
              <Route path="/admin/scanner" element={<OfflineScannerPage />} />
            </Route>
            <Route path="/admin/certificates" element={<CertificateAdminPage />} />
            <Route path="/admin/audit" element={<AuditLogAdminPage />} />
            <Route path="/admin/cms" element={<CmsAdminPage />} />
            <Route path="/admin/sv5t" element={<Sv5tAdminPage />} />
            <Route path="/admin/surveys" element={<SurveyAdminPage />} />
            <Route path="/admin/live-qa" element={<LiveQaAdminPage />} />
            <Route path="/admin/voting" element={<VotingAdminPage />} />
            <Route path="/admin/office" element={<OfficeAdminPage />} />
            <Route path="/admin/store" element={<StoreAdminPage />} />
            <Route path="/admin/exams" element={<ExamAdminPage />} />
            <Route path="/admin/yitbot" element={<YitBotAdminPage />} />
            <Route path="/admin/arts" element={<ArtsAdminPage />} />
            <Route path="/admin/inbox" element={<InboxAdminPage />} />
            <Route path="/admin/oj" element={<OjAdminPage />} />
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
            <Route path="/news/compose" element={<NewsComposePage />} />
            <Route path="/sv5t" element={<Sv5tPortalPage />} />
            <Route path="/surveys/:id" element={<SurveyTakePage />} />
            <Route path="/live-qa/:pin" element={<LiveQaAudiencePage />} />
            <Route path="/kiosk/voting" element={<VotingKioskPage />} />
            <Route path="/minigame" element={<MinigamePlayerPage />} />
            <Route path="/exam/:id" element={<ExamTakePage />} />
            <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ARTS_LEAD_PORTAL} />}>
              <Route path="/arts" element={<ArtsPortalPage />} />
            </Route>
            <Route path="/messenger" element={<MessengerPage />} />
            <Route path="/oj" element={<OjHomePage />} />
            <Route path="/oj/problems/:id" element={<OjProblemDetailPage />} />
            <Route path="/portfolio" element={<PortfolioEditorPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/office-duty" element={<OfficeDutyPage />} />
            <Route path="/certificates" element={<MyCertificatesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/pwa-settings" element={<PwaSettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<OAuth2CallbackPage />} />
            <Route path="/profile" element={<ProfileSecurityPage />} />
            <Route path="/privacy" element={<PrivacyCenterPage />} />
            <Route path="/scanner" element={<StudentCheckinPage />} />
            <Route path="/voting" element={<VotingPage />} />
            <Route path="/yitbot" element={<YitBotPage />} />
            <Route path="/modules" element={<ModuleDirectoryPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route element={<ProtectedRoute requireAuth={true} requiredAuthorities={PERMISSIONS.ADMIN_ATTENDANCE} />}>
              <Route path="/protected-scanner" element={<OfflineScannerPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
