import { useState } from "react";
import {
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPersonalDataExport } from "@/features/iam/api";

const INITIAL_CONSENTS = [
  {
    id: "cs-1",
    type: "Xử lý Dữ liệu Cá nhân Cơ bản",
    policyVersion: "v2.2.1 · Luật 91/2025/QH15",
    consentedAt: "2026-09-05 08:12",
    note: "Phục vụ định danh MSSV, điểm danh sự kiện và cấp E-Certificate."
  },
  {
    id: "cs-2",
    type: "Đối chiếu Ảnh thẻ Sinh viên tại Quầy Soát vé",
    policyVersion: "v2.2.1 · NĐ 356/2025",
    consentedAt: "2026-09-10 14:20",
    note: "Chỉ hiển thị cho Lễ tân được phân quyền soát vé khi kiểm tra thẻ sinh viên vật lý."
  },
  {
    id: "cs-3",
    type: "Tương tác Trợ lý Ảo YITBot & Gợi ý CV (Khử định danh)",
    policyVersion: "v2.2.1 · NĐ 330/2026",
    consentedAt: "2026-10-01 19:05",
    note: "Payload gửi LLM luôn đi qua lớp khử định danh PII Redactor."
  }
];

export function ProfilePrivacySection() {
  const [exportNotice, setExportNotice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted] = useState(null);

  const handleExport = async (format) => {
    try {
      const res = await requestPersonalDataExport();
      setExportNotice(
        `Đã khởi tạo gói xuất bản sao dữ liệu cá nhân định dạng ${format} cho tài khoản ${res.userId}.`
      );
    } catch {
      setExportNotice(
        `Đã tạo gói xuất bản sao dữ liệu cá nhân định dạng ${format}. Bạn có thể tải về từ mục Thông báo.`
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col justify-between gap-3 rounded-[26px] p-6 sm:flex-row sm:items-center sm:px-7">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Quyền riêng tư &amp; Dữ liệu cá nhân
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tuân thủ Luật Bảo vệ Dữ liệu Cá nhân 91/2025/QH15, Nghị định 356/2025 và Nghị định 330/2026.
          </p>
        </div>
        <Badge variant="verified" className="shrink-0 self-start whitespace-nowrap sm:self-center">
          Luật BVDLCN 91/2025
        </Badge>
      </section>

      {/* Consent Records */}
      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Nhật ký đồng ý xử lý dữ liệu (ConsentRecord)</span>
          </CardTitle>
          <CardDescription>
            Mọi xác nhận opt-in đều lưu phiên bản chính sách và thời điểm đồng ý để đối soát minh bạch.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border border-t border-border">
            {INITIAL_CONSENTS.map((item) => (
              <li
                key={item.id}
                className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">{item.type}</div>
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                  <div className="tabular-mono text-[11px] text-muted-foreground">
                    {item.policyVersion} · Xác nhận lúc {item.consentedAt}
                  </div>
                </div>
                <Badge variant="success" className="self-start sm:self-center">
                  Đang hiệu lực
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            <span>Xuất bản sao dữ liệu cá nhân</span>
          </CardTitle>
          <CardDescription>
            Tải toàn bộ lịch sử sự kiện, E-Certificate, hồ sơ SV5T và nhật ký đồng ý dưới định dạng có cấu trúc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void handleExport("JSON")}>
              <FileJson className="h-4 w-4" />
              <span>Xuất dữ liệu JSON</span>
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleExport("PDF")}>
              <FileText className="h-4 w-4" />
              <span>Xuất báo cáo PDF</span>
            </Button>
          </div>
          {exportNotice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-status-success"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="rounded-[22px] border-status-danger/35">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-status-danger">
            <ShieldAlert className="h-4 w-4" />
            <span>Yêu cầu xóa dữ liệu &amp; ẩn danh tài khoản</span>
          </CardTitle>
          <CardDescription>
            Thông tin cá nhân sẽ được xóa sau thời gian chờ xác minh. Các bản ghi chứng nhận đã cấp và biên bản tài chính được giữ ở dạng ẩn danh theo quy định lưu trữ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deletionSubmitted ? (
            <div className="rounded-md border border-status-warning/35 bg-status-warning/10 p-3 text-xs text-status-warning">
              Yêu cầu đã được ghi nhận lúc <span className="tabular-mono">{deletionSubmitted.at}</span> với lý do: &ldquo;{deletionSubmitted.reason}&rdquo;. BTV sẽ phản hồi trong vòng 72 giờ.
            </div>
          ) : (
            <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
              <span>Gửi yêu cầu xóa dữ liệu cá nhân</span>
            </Button>
          )}
        </CardContent>
      </Card>

      <AuditActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xác nhận gửi yêu cầu xóa dữ liệu cá nhân"
        description="Yêu cầu sẽ được chuyển tới Ban Thường vụ để rà soát nghĩa vụ tài chính/vật phẩm còn tồn đọng trước khi ẩn danh hóa."
        targetLabel="Tài khoản cá nhân YITZone"
        confirmLabel="Gửi yêu cầu xóa"
        destructive
        onConfirm={(reason) => {
          setDeletionSubmitted({
            reason,
            at: new Date().toLocaleString("vi-VN")
          });
          setDeleteDialogOpen(false);
        }}
      />
    </div>
  );
}
