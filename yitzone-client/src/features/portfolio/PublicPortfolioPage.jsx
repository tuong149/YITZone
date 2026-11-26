import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  EyeOff,
  Loader2,
  Lock,
  QrCode,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVerifyPortfolioToken } from "./api";

export function PublicPortfolioPage() {
  const { username = "" } = useParams();
  const [searchParams] = useSearchParams();
  const initialQrMode = searchParams.get("mode") === "cv-verify";

  const [viewMode, setViewMode] = useState(initialQrMode ? "CV_QR_VERIFY" : "PUBLIC");
  const [projectHiddenByBtv, setProjectHiddenByBtv] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);

  const { data: verifyApi, isLoading, isError } = useVerifyPortfolioToken(username);
  const verifyUrl = `${
    typeof window !== "undefined" ? window.location.origin : "https://yitzone.fit.hcmute.edu.vn"
  }/p/${encodeURIComponent(username)}?mode=cv-verify`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Card className="rounded-[24px]">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Đang tải và đối soát hồ sơ năng lực số <span className="tabular-mono">{username}</span>...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!username || isError || !verifyApi || verifyApi.valid === false) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Card className="rounded-[24px]">
          <CardContent className="space-y-4 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-medium text-foreground">
                Chưa tìm thấy hoặc chưa công khai hồ sơ {username ? `"${username}"` : ""}
              </h1>
              <p className="mx-auto max-w-lg text-sm text-muted-foreground">
                Hồ sơ E-Portfolio này hiện đang ở chế độ Riêng tư, chưa được khởi tạo hoặc dịch vụ đối soát máy chủ chưa phản hồi.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/verify">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Về cổng Tra cứu &amp; Xác thực</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/portfolio">Mở trình biên tập Hồ sơ của tôi</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = verifyApi.fullName || `Hồ sơ Năng lực Số · ${username}`;
  const verifiedItems = Array.isArray(verifyApi.verifiedCertificates)
    ? verifyApi.verifiedCertificates
    : [];

  return (
    <div className="space-y-6">
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-6 sm:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <VerifiedBadge />
              <Badge variant="secondary" className="rounded-full tabular-mono">
                Định danh {username} · Đã xác thực
              </Badge>
            </div>
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              {displayName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {verifyApi.facultyName || "Khoa Công nghệ Thông tin · Trường ĐH Sư phạm Kỹ thuật TP.HCM (HCM-UTE)"}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "PUBLIC" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setViewMode("PUBLIC")}
            >
              Chế độ Công khai
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "CV_QR_VERIFY" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setViewMode("CV_QR_VERIFY")}
            >
              <QrCode className="h-3.5 w-3.5" />
              Kiểm chứng QR từ CV (Riêng tư)
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/portfolio">Biên tập Hồ sơ</Link>
            </Button>
          </div>
        </div>
      </section>

      {viewMode === "CV_QR_VERIFY" && (
        <div className="flex items-start gap-3 rounded-2xl border border-status-success/35 bg-status-success/10 px-4 py-3 text-sm text-status-success">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Xác thực độc lập từ Mã QR trên CV PDF thành công</div>
            <p className="mt-0.5 text-xs">
              Hệ thống chỉ hiển thị danh sách thành tích và chứng nhận đã được Đoàn - Hội Khoa CNTT xác thực, không làm lộ dự án cá nhân khi hồ sơ ở chế độ Riêng tư.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="rounded-[20px] border-brand-navy/30">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-navy dark:text-brand-cyan" />
                  Thành tích &amp; Chứng nhận Được Xác thực
                </CardTitle>
                <VerifiedBadge label="Không thể chỉnh sửa thủ công" />
              </div>
              <CardDescription>
                Dữ liệu đối soát trực tiếp từ hệ thống E-Certificate, SV5T và Online Judge của Khoa CNTT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {verifiedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Chưa có chứng nhận hoặc thành tích công khai nào được ghim trên hồ sơ này.
                </div>
              ) : (
                verifiedItems.map((item, idx) => (
                  <div
                    key={item.id ?? item.code ?? idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="space-y-1">
                      {item.badge && (
                        <Badge variant="secondary" className="rounded-full text-[11px]">
                          {item.badge}
                        </Badge>
                      )}
                      <div className="font-medium text-foreground">
                        {item.title ?? item.eventTitle ?? "Chứng nhận xác thực"}
                      </div>
                    </div>
                    <span className="tabular-mono text-xs font-semibold text-primary">
                      {item.code ?? item.certificateCode ?? ""}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {viewMode === "PUBLIC" ? (
            <Card className="rounded-[20px]">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Dự án &amp; Thông tin Tự kê khai
                  </CardTitle>
                  <CardDescription>
                    BTV không tự ý sửa nội dung cá nhân; chỉ được Ẩn nội dung vi phạm chuẩn mực kèm lý do Audit Log.
                  </CardDescription>
                </div>
                {!projectHiddenByBtv && (verifyApi.skills || verifyApi.projects) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="shrink-0 rounded-full"
                    onClick={() => setHideDialogOpen(true)}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    BTV: Ẩn nội dung vi phạm
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {projectHiddenByBtv ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-status-warning/35 bg-status-warning/10 p-4 text-xs text-status-warning">
                    <EyeOff className="h-4 w-4 shrink-0" />
                    <span>
                      Mục dự án tự kê khai đã được Ban Thường vụ tạm ẩn do vi phạm chuẩn mực nội dung công khai (đã gửi thông báo cho sinh viên &amp; lưu Audit Log).
                    </span>
                  </div>
                ) : verifyApi.skills || verifyApi.projects ? (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {verifyApi.skills && (
                      <p>
                        <strong className="text-foreground">Kỹ năng:</strong> {verifyApi.skills}
                      </p>
                    )}
                    {verifyApi.projects && (
                      <p>
                        <strong className="text-foreground">Dự án tiêu biểu:</strong> {verifyApi.projects}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chủ sở hữu hồ sơ chưa công khai mục kỹ năng và dự án tự kê khai.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[20px]">
              <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
                <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span>
                  Mục dự án cá nhân và liên kết riêng tư đang được bảo vệ bởi chế độ <strong>Riêng tư</strong> của sinh viên.
                </span>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="liquid-glass-card flex flex-col items-center rounded-[20px] p-6 text-center">
            <div className="rounded-2xl bg-white p-4">
              <QRCodeSVG value={verifyUrl} size={156} level="M" />
            </div>
            <div className="mt-4 font-display text-base font-medium text-foreground">
              Mã QR Xác thực Độc lập
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Có giá trị kiểm chứng chứng nhận Đoàn - Hội ngay cả khi sinh viên đã tốt nghiệp hoặc bật chế độ riêng tư.
            </p>
          </div>
        </div>
      </div>

      <AuditActionDialog
        open={hideDialogOpen}
        onOpenChange={setHideDialogOpen}
        title="BTV: Ẩn Nội dung E-Portfolio Vi phạm Chuẩn mực"
        description="Hệ thống chỉ ẩn hiển thị công khai và gửi thông báo để sinh viên tự điều chỉnh, tuyệt đối không ghi đè nội dung cá nhân."
        targetSummary={`E-Portfolio /p/${username} — Mục Dự án & Thông tin tự kê khai`}
        actionCode="PORTFOLIO_HIDE_CONTENT"
        destructive
        onConfirm={() => setProjectHiddenByBtv(true)}
      />
    </div>
  );
}
