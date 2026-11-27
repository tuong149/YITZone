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
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/verify">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Tra cứu mã khác</span>
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden rounded-panel">
        <div className="relative overflow-hidden bg-brand-navy px-6 py-6 text-white sm:px-8 sm:py-7">
          <div className="yit-node-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight sm:text-3xl">
                Chứng nhận Điện tử (E-Certificate)
              </h1>
              <p className="text-xs leading-relaxed text-white/80 sm:text-sm">
                Đoàn TN – Hội SV Khoa Công Nghệ Thông Tin · ĐH Công nghệ Kỹ thuật TP.HCM
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 tabular-mono text-xs text-white/90">
              <span>
                Mã: <strong className="font-semibold text-white">{certCode || "—"}</strong>
              </span>
              {!isLoading && verifyApiData && (
                <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  {verifyApiData.valid ? "Đã đối chiếu sổ cái" : "Chưa xác thực"}
                </span>
              )}
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/40 p-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Đang đối chiếu mã chứng nhận <span className="tabular-mono">{certCode}</span> với sổ cái xác thực...
              </p>
            </div>
          ) : isUnverified ? (
            <div
              role="alert"
              className="space-y-4 rounded-lg border border-status-danger/35 bg-status-danger/10 p-5"
            >
              <div className="flex items-start gap-3">
                <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-status-danger" aria-hidden="true" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-status-danger">
                    Không tìm thấy hoặc chưa thể xác thực mã chứng nhận{" "}
                    <span className="tabular-mono">{certCode || "(trống)"}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/85">
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
                <div className="flex items-start gap-3 rounded-lg border border-status-success/35 bg-status-success/10 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" aria-hidden="true" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-status-success">
                      Chứng nhận hợp lệ · Phiên bản v{version}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/85">
                      Thông tin trùng khớp hoàn toàn với sổ cái xác thực của Đoàn – Hội Khoa CNTT HCM-UTE.
                    </p>
                  </div>
                </div>
              )}

              {resolvedStatus === "SUPERSEDED" && (
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-status-warning/35 bg-status-warning/10 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" aria-hidden="true" />
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-status-warning">
                        Đã thay thế bởi phiên bản mới
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/85">
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
                <div className="flex items-start gap-3 rounded-lg border border-status-danger/35 bg-status-danger/10 p-4">
                  <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-status-danger" aria-hidden="true" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-status-danger">
                      Chứng nhận đã bị thu hồi
                      {verifyApiData?.revokedAt ? ` (${verifyApiData.revokedAt})` : ""}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/85">
                      {verifyApiData?.revokeReason ||
                        "Chứng nhận này đã bị thu hồi theo quyết định hậu kiểm của Ban Thường vụ."}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-12">
                <dl className="divide-y divide-border text-sm sm:col-span-8">
                  <div className="grid grid-cols-3 gap-2 py-3 first:pt-0">
                    <dt className="text-muted-foreground">Họ và tên</dt>
                    <dd className="col-span-2 font-semibold text-foreground">{holderName}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-3">
                    <dt className="text-muted-foreground">MSSV · Ngành</dt>
                    <dd className="col-span-2 tabular-mono text-foreground">{mssvMajorLabel}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-3">
                    <dt className="text-muted-foreground">Sự kiện</dt>
                    <dd className="col-span-2 font-medium text-foreground">{eventTitle}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-3">
                    <dt className="text-muted-foreground">Tư cách</dt>
                    <dd className="col-span-2 text-foreground">{roleLabel}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-3 last:pb-0">
                    <dt className="text-muted-foreground">Quyền lợi</dt>
                    <dd className="col-span-2 flex flex-wrap gap-1.5">
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
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-white p-4 text-center sm:col-span-4">
                  <QRCodeSVG
                    value={`${typeof window !== "undefined" ? window.location.origin : "https://yitzone.fit.hcmute.edu.vn"}/verify/${encodeURIComponent(certCode)}`}
                    size={136}
                  />
                  <span className="mt-2.5 tabular-mono text-[11px] font-medium text-[#475569]">
                    {certCode}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>Trang xác thực này hoạt động độc lập với trạng thái email trường của Cựu sinh viên.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
