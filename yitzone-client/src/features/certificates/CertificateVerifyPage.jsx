import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldX } from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCertificateVerify } from "./api";

export function CertificateVerifyPage(){
  const { certCode = "YIT-2026-CLD-0184" } = useParams();
  const [demoState, setDemoState] = useState("VALID");
  const { data: verifyApiData } = useCertificateVerify(certCode);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VerifiedBadge label="Cổng Xác thực Công khai · Không cần Đăng nhập" />
        {import.meta.env.DEV && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Trạng thái kiểm thử (Dev):</span>
            {(["VALID", "SUPERSEDED", "REVOKED"]).map((st) => (
              <Button
                key={st}
                size="sm"
                variant={demoState === st ? "default" : "outline"}
                className="h-7 rounded-full px-2.5 text-[11px]"
                onClick={() => setDemoState(st)}
              >
                {st === "VALID" ? "Hợp lệ" : st === "SUPERSEDED" ? "Đã thay thế" : "Đã thu hồi"}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Card className="overflow-hidden rounded-[22px]">
        {/* Official Institutional FIT Navy Header */}
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
              Mã: <strong>{certCode}</strong>
              {verifyApiData && (
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                  {verifyApiData.valid ? "Đã đối chiếu sổ cái" : "Chưa xác thực"}
                </span>
              )}
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {/* Status Banner */}
          {demoState === "VALID" && (
            <div className="flex items-center gap-3 rounded-xl border border-status-success/35 bg-status-success/10 p-4 text-status-success">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div>
                <div className="font-semibold">CHỨNG NHẬN HỢP LỆ (Phiên bản v1)</div>
                <p className="text-xs opacity-90">
                  Thông tin trùng khớp hoàn toàn với sổ cái xác thực của Đoàn – Hội Khoa CNTT HCM-UTE.
                </p>
              </div>
            </div>
          )}

          {demoState === "SUPERSEDED" && (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-status-warning/35 bg-status-warning/10 p-4 text-status-warning sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-semibold">ĐÃ THAY THẾ BỞI PHIÊN BẢN MỚI (v2)</div>
                  <p className="text-xs opacity-90">
                    Bản này đã được cấp lại sau khi cập nhật tư cách BTC / đặc cách chuyển ngành CĐDN.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
                <Link to={`/verify/${certCode}-V2`} onClick={() => setDemoState("VALID")}>
                  Xem bản mới nhất (v2)
                </Link>
              </Button>
            </div>
          )}

          {demoState === "REVOKED" && (
            <div className="flex items-start gap-3 rounded-xl border border-status-danger/35 bg-status-danger/10 p-4 text-status-danger">
              <ShieldX className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <div className="font-semibold">CHỨNG NHẬN ĐÃ BỊ THU HỒI (Ngày 30/11/2026)</div>
                <p className="text-xs opacity-90">
                  Lý do: Phát hiện gian lận điểm danh hậu kiểm (DEVICE_TOKEN_COLLISION) theo biên bản xác minh BTV.
                </p>
              </div>
            </div>
          )}

          {/* Certificate Fields */}
          <div className="grid gap-6 sm:grid-cols-12">
            <div className="space-y-3 text-sm sm:col-span-8">
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-muted-foreground">Họ và tên</span>
                <span className="col-span-2 font-semibold text-foreground">Nguyễn Minh Khoa</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-muted-foreground">MSSV · Ngành</span>
                <span className="col-span-2 tabular-mono text-foreground">22110345 · Công nghệ Thông tin (110)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-muted-foreground">Sự kiện</span>
                <span className="col-span-2 font-medium text-foreground">Hội thảo Cloud Native &amp; DevOps 2026</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-muted-foreground">Tư cách</span>
                <span className="col-span-2 text-foreground">Tham dự viên (Hoàn thành 2/2 buổi)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Quyền lợi</span>
                <div className="col-span-2 flex flex-wrap gap-1.5">
                  <Badge variant="default">Cộng ĐRL</Badge>
                  <Badge variant="success">Cộng CĐDN</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-4 text-center sm:col-span-4">
              <QRCodeSVG value={`https://yitzone.fit.hcmute.edu.vn/verify/${certCode}`} size={136} />
              <span className="mt-2 tabular-mono text-[11px] text-slate-600">{certCode}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span>Trang xác thực này hoạt động độc lập với trạng thái email trường của Cựu sinh viên.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
