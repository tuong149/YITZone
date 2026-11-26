import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldX
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCertificateVerify } from "./api";

export function CertificateVerifyPage() {
  const { certCode = "" } = useParams();
  const { data: verifyApiData, isLoading, isError } = useCertificateVerify(certCode);

  const rawStatus = verifyApiData?.status;
  const resolvedStatus =
    rawStatus === "REVOKED" || rawStatus === "SUPERSEDED"
      ? rawStatus
      : verifyApiData?.valid
        ? rawStatus === "VALID"
          ? "VALID"
          : "VALID"
        : null;

  const isUnverified =
    !certCode ||
    isError ||
    !verifyApiData ||
    (verifyApiData.valid === false && resolvedStatus !== "REVOKED" && resolvedStatus !== "SUPERSEDED");

  const holderName = verifyApiData?.holderName || verifyApiData?.fullName || "—";
  const studentCode = verifyApiData?.studentCode || verifyApiData?.mssv || "";
  const majorName = verifyApiData?.majorName || "";
  const mssvMajorLabel = [studentCode, majorName].filter(Boolean).join(" · ") || "—";
  const eventTitle = verifyApiData?.eventTitle || "—";
  const roleLabel = verifyApiData?.roleLabel || "—";
  const benefitTypes = verifyApiData?.benefitTypes || verifyApiData?.benefits || [];
  const version = verifyApiData?.version ?? 1;
  const replacementCode = verifyApiData?.supersededByCode || verifyApiData?.latestCode;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VerifiedBadge label="Cổng Xác thực Công khai · Không cần Đăng nhập" />
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/verify">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Tra cứu mã khác</span>
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden rounded-[22px]">
        <div className="bg-brand-navy px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-blue-200">
                Đoàn TN – Hội SV Khoa Công Nghệ Thông Tin · ĐH Công nghệ Kỹ thuật TP.HCM
              </div>
              <h1 className="mt-1 font-display text-2xl font-medium sm:text-3xl">
                Chứng nhận Điện tử (E-Certificate)
              </h1>
            </div>
            <div className="tabular-mono text-xs text-blue-100">
              Mã: <strong>{certCode || "—"}</strong>
              {!isLoading && verifyApiData && (
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                  {verifyApiData.valid ? "Đã đối chiếu sổ cái" : "Chưa xác thực"}
                </span>
              )}
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 p-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Đang đối chiếu mã chứng nhận <span className="tabular-mono">{certCode}</span> với sổ cái xác thực...
              </p>
            </div>
          ) : isUnverified ? (
            <div
              role="alert"
              className="space-y-4 rounded-xl border border-status-danger/35 bg-status-danger/10 p-5 text-status-danger"
            >
              <div className="flex items-start gap-3">
                <ShieldX className="mt-0.5 h-6 w-6 shrink-0" />
                <div className="space-y-1">
                  <div className="font-semibold">
                    Không tìm thấy hoặc chưa thể xác thực mã chứng nhận {certCode || "(trống)"}
                  </div>
                  <p className="text-xs opacity-90">
                    Mã chứng nhận không tồn tại trên sổ cái Đoàn – Hội Khoa CNTT hoặc dịch vụ đối soát hiện chưa phản hồi. Vui lòng kiểm tra lại ký tự in dưới mã QR trên tệp PDF.
                  </p>
                </div>
              </div>
              <div>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/verify">Quay lại trang Tra cứu &amp; Xác thực</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {resolvedStatus === "VALID" && (
                <div className="flex items-center gap-3 rounded-xl border border-status-success/35 bg-status-success/10 p-4 text-status-success">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      CHỨNG NHẬN HỢP LỆ (Phiên bản v{version})
                    </div>
                    <p className="text-xs opacity-90">
                      Thông tin trùng khớp hoàn toàn với sổ cái xác thực của Đoàn – Hội Khoa CNTT HCM-UTE.
                    </p>
                  </div>
                </div>
              )}

              {resolvedStatus === "SUPERSEDED" && (
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-status-warning/35 bg-status-warning/10 p-4 text-status-warning sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <div className="font-semibold">ĐÃ THAY THẾ BỞI PHIÊN BẢN MỚI</div>
                      <p className="text-xs opacity-90">
                        Bản chứng nhận này đã được cập nhật và cấp lại phiên bản mới trên sổ cái chính thức.
                      </p>
                    </div>
                  </div>
                  {replacementCode && (
                    <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
                      <Link to={`/verify/${encodeURIComponent(replacementCode)}`}>
                        Xem bản mới nhất
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {resolvedStatus === "REVOKED" && (
                <div className="flex items-start gap-3 rounded-xl border border-status-danger/35 bg-status-danger/10 p-4 text-status-danger">
                  <ShieldX className="mt-0.5 h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      CHỨNG NHẬN ĐÃ BỊ THU HỒI
                      {verifyApiData?.revokedAt ? ` (${verifyApiData.revokedAt})` : ""}
                    </div>
                    <p className="text-xs opacity-90">
                      {verifyApiData?.revokeReason ||
                        "Chứng nhận này đã bị thu hồi theo quyết định hậu kiểm của Ban Thường vụ."}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-12">
                <div className="space-y-3 text-sm sm:col-span-8">
                  <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                    <span className="text-muted-foreground">Họ và tên</span>
                    <span className="col-span-2 font-semibold text-foreground">{holderName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                    <span className="text-muted-foreground">MSSV · Ngành</span>
                    <span className="col-span-2 tabular-mono text-foreground">{mssvMajorLabel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                    <span className="text-muted-foreground">Sự kiện</span>
                    <span className="col-span-2 font-medium text-foreground">{eventTitle}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                    <span className="text-muted-foreground">Tư cách</span>
                    <span className="col-span-2 text-foreground">{roleLabel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Quyền lợi</span>
                    <div className="col-span-2 flex flex-wrap gap-1.5">
                      {benefitTypes.length > 0 ? (
                        benefitTypes.map((benefit) => (
                          <Badge
                            key={benefit}
                            variant={benefit.includes("CĐDN") ? "success" : "default"}
                          >
                            {benefit}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-4 text-center sm:col-span-4">
                  <QRCodeSVG
                    value={`${typeof window !== "undefined" ? window.location.origin : "https://yitzone.fit.hcmute.edu.vn"}/verify/${encodeURIComponent(certCode)}`}
                    size={136}
                  />
                  <span className="mt-2 tabular-mono text-[11px] text-slate-600">{certCode}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Trang xác thực này hoạt động độc lập với trạng thái email trường của Cựu sinh viên.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
