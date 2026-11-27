import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BellRing,
  Briefcase,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Mail,
  MessageSquare,
  Receipt,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFacultyDisplayName } from "@/features/iam/data/faculty-major-catalog";

const PERSONAL_WORKSPACES = [
  {
    to: "/certificates",
    title: "Chứng nhận & Hoạt động",
    description: "Lịch sử tham gia sự kiện, nhãn quyền lợi ĐRL / CTXH / CĐDN và tải E-Certificate.",
    meta: "Tra cứu & tải PDF xác thực",
    icon: Award
  },
  {
    to: "/store/orders",
    title: "Đơn hàng của tôi",
    description: "Theo dõi đơn vật phẩm Khoa, mã QR nhận hàng tại bàn trực và hóa đơn gây quỹ.",
    meta: "Theo dõi trạng thái đơn hàng",
    icon: Receipt
  },
  {
    to: "/portfolio",
    title: "E-Portfolio & Xuất CV",
    description: "Quản lý hồ sơ năng lực số, dự án cá nhân và xuất CV có mã QR xác thực.",
    meta: "Hồ sơ năng lực & QR kiểm chứng",
    icon: Briefcase
  },
  {
    to: "/messenger",
    title: "Hộp thư Hỏi – Đáp BCH",
    description: "Trao đổi trực tiếp với Ban Chấp hành về sự kiện, SV5T hoặc điều chỉnh thông tin Roster.",
    meta: "Phản hồi SLA ≤ 24h",
    icon: MessageSquare
  }
];

export function ProfileOverviewSection({
  userId,
  studentCode,
  fullName,
  email,
  accountHealth,
  roleCount,
  onboardingState
}) {
  const academic = onboardingState?.academicIdentity;
  const academicConfirmed = Boolean(onboardingState?.completed && academic);
  const facultyBadgeText = academic?.isGuestOrAlumni
    ? "Cựu SV / Khách mời"
    : academic?.facultyName
      ? `${formatFacultyDisplayName(academic.facultyName)} · Mã ngành ${academic.majorCode}${academic.fitFaculty ? " (CĐDN)" : ""}`
      : "Chưa xác nhận Khoa – Ngành";

  const checklist = [
    {
      id: "onboarding-academic",
      label: "Xác nhận Khoa quản lý & Thiết lập ban đầu",
      detail: academicConfirmed
        ? academic.isGuestOrAlumni
          ? "Đã xác nhận chế độ Cựu sinh viên / Khách mời"
          : `Đã xác nhận ${formatFacultyDisplayName(academic.facultyName)} · ${academic.majorName} (${academic.majorCode})`
        : "Chưa xác nhận Khoa quản lý (cần thiết để tính đúng quyền lợi CĐDN)",
      done: academicConfirmed,
      to: "/onboarding",
      actionLabel: academicConfirmed ? "Xem lại" : "Thiết lập ngay",
      icon: GraduationCap
    },
    {
      id: "backup-email",
      label: "Email cá nhân dự phòng",
      detail: accountHealth.backupEmailVerified
        ? `Đã xác thực ${accountHealth.backupEmail}`
        : "Chưa xác thực · Cần thiết để giữ tài khoản sau khi tốt nghiệp",
      done: accountHealth.backupEmailVerified,
      to: "/profile/info",
      actionLabel: accountHealth.backupEmailVerified ? "Xem" : "Xác thực ngay",
      icon: Mail
    },
    {
      id: "password",
      label: "Mật khẩu đăng nhập độc lập",
      detail: accountHealth.hasPassword
        ? "Đã thiết lập mật khẩu song song với Google Workspace"
        : "Nên đặt thêm mật khẩu dự phòng khi đăng nhập không qua SSO",
      done: accountHealth.hasPassword,
      to: "/profile/security",
      actionLabel: accountHealth.hasPassword ? "Đổi mật khẩu" : "Thiết lập",
      icon: KeyRound
    },
    {
      id: "mfa",
      label: "Xác thực 2 lớp (TOTP MFA)",
      detail: accountHealth.mfaEnabled
        ? "Đang bảo vệ tài khoản bằng mã 6 số Authenticator"
        : "Bắt buộc đối với BTV / Admin; khuyến nghị cho cán bộ Ban/Tổ",
      done: accountHealth.mfaEnabled,
      to: "/profile/security",
      actionLabel: accountHealth.mfaEnabled ? "Quản lý" : "Kích hoạt",
      icon: ShieldCheck
    },
    {
      id: "push",
      label: "Thông báo đẩy Web Push (PWA)",
      detail: accountHealth.pushEnabled
        ? "Đang bật nhận nhắc ca trực, đôn Waitlist và phản hồi BCH"
        : "Chưa bật trên trình duyệt này",
      done: accountHealth.pushEnabled,
      to: "/profile/app",
      actionLabel: accountHealth.pushEnabled ? "Cài đặt" : "Bật ngay",
      icon: BellRing
    }
  ];

  const completedCount = checklist.filter((item) => item.done).length;
  const portfolioHref = userId ? `/p/${encodeURIComponent(userId)}` : "/portfolio";

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col justify-between gap-4 rounded-[26px] p-6 sm:flex-row sm:items-center sm:px-7">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Tổng quan tài khoản
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý định danh sinh viên, mức độ bảo mật và truy cập nhanh các không gian cá nhân của bạn.
          </p>
        </div>
        <Button asChild variant="glass" className="shrink-0 self-start sm:self-center">
          <Link to={portfolioHref}>
            <span>Xem E-Portfolio công khai</span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      </section>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Thông tin định danh chính thức</CardTitle>
            <Badge variant={academic?.fitFaculty ? "verified" : "secondary"}>
              {facultyBadgeText}
            </Badge>
          </div>
          <CardDescription>
            Đồng bộ tự động từ Danh sách Chính thức (Roster) của Nhà trường. Các trường này được khóa để đảm bảo tính chính xác khi điểm danh và cấp chứng nhận.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Họ và tên</dt>
              <dd className="mt-0.5 font-medium text-foreground">{fullName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Mã số sinh viên</dt>
              <dd className="mt-0.5 tabular-mono font-semibold text-foreground">{studentCode || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Email trường</dt>
              <dd className="mt-0.5 truncate text-foreground" title={email || undefined}>
                {email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Trạng thái &amp; Vai trò</dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="success">Đang hoạt động</Badge>
                {roleCount > 0 && (
                  <Badge variant="secondary" className="tabular-mono">
                    {roleCount} vai trò
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Mức độ sẵn sàng tài khoản</CardTitle>
              <CardDescription className="mt-0.5">
                Hoàn tất các thiết lập bên dưới để bảo vệ tài khoản và giữ trọn vẹn E-Certificate sau tốt nghiệp.
              </CardDescription>
            </div>
            <Badge variant={completedCount === checklist.length ? "success" : "info"} className="tabular-mono rounded-full">
              {completedCount}/{checklist.length} hoàn tất
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border border-t border-border">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-3 px-5 py-3.5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        {item.done ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Hoàn tất
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-warning">
                            <CircleDashed className="h-3.5 w-3.5" />
                            Chưa thiết lập
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant={item.done ? "ghost" : "outline"} className="shrink-0 self-start sm:self-center">
                    <Link to={item.to}>
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Không gian cá nhân liên kết</CardTitle>
          <CardDescription>
            Các phân hệ tác nghiệp chuyên sâu được tách riêng trang để tối ưu không gian làm việc, truy cập nhanh từ đây hoặc từ menu tài khoản.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-y-0">
            {PERSONAL_WORKSPACES.map((space, idx) => {
              const Icon = space.icon;
              return (
                <Link
                  key={space.to}
                  to={space.to}
                  className={`group flex items-start justify-between gap-3 p-5 transition-colors hover:bg-muted/45 ${
                    idx % 2 === 1 ? "sm:border-l sm:border-border" : ""
                  } ${idx >= 2 ? "sm:border-t sm:border-border" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {space.title}
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {space.description}
                      </p>
                      <div className="pt-0.5 text-xs font-medium text-foreground/80">
                        {space.meta}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
