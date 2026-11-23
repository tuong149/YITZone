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
import { requestPersonalDataExport } from "./api";

interface ConsentItem {
  id: string;
  type: string;
  policyVersion: string;
  consentedAt: string;
  status: "ACTIVE" | "REVOKED";
  note: string;
}

const INITIAL_CONSENTS: ConsentItem[] = [
  {
    id: "cs-1",
    type: "Xử lý Dữ liệu Cá nhân Cơ bản",
    policyVersion: "v2.2.1 · Luật 91/2025/QH15",
    consentedAt: "2026-09-05 08:12",
    status: "ACTIVE",
    note: "Phục vụ định danh MSSV, điểm danh sự kiện và cấp E-Certificate."
  },
  {
    id: "cs-2",
    type: "Đối chiếu Ảnh thẻ Sinh viên tại Quầy Soát vé",
    policyVersion: "v2.2.1 · NĐ 356/2025",
    consentedAt: "2026-09-10 14:20",
    status: "ACTIVE",
    note: "Chỉ hiển thị cho Lễ tân được phân quyền soát vé khi kiểm tra thẻ sinh viên."
  },
  {
    id: "cs-3",
    type: "Tương tác Trợ lý Ảo YITBot & Gợi ý CV (Khử định danh)",
    policyVersion: "v2.2.1 · NĐ 330/2026",
    consentedAt: "2026-10-01 19:05",
    status: "ACTIVE",
    note: "Payload gửi LLM luôn qua lớp khử định danh PII Redactor."
  }
];

export function PrivacyCenterPage(){
  const [consents] = useState<ConsentItem[]>(INITIAL_CONSENTS);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted] = useState<string | null>(null);

  const handleExport = async (format: "JSON" | "PDF") => {
    try {
      const res = await requestPersonalDataExport();
      setExportNotice(
        `API /privacy/my-data-exports (${res.status}): đã khởi tạo gói xuất bản sao dữ liệu cá nhân ${format} cho ${res.userId}.`
      );
    } catch {
      setExportNotice(
        `Đã tạo gói xuất bản sao dữ liệu cá nhân định dạng ${format} (chế độ mô phỏng cục bộ khi chưa kết nối server).`
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[26px] p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Trung tâm Quyền riêng tư &amp; Dữ liệu Cá nhân
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tuân thủ Luật Bảo vệ Dữ liệu Cá nhân 91/2025/QH15, Nghị định 356/2025 và Nghị định 330/2026.
            </p>
          </div>
          <Badge variant="verified">Luật BVDLCN 91/2025</Badge>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Nhật ký Đồng ý Xử lý Dữ liệu (ConsentRecord)
            </CardTitle>
            <CardDescription>
              Mọi xác nhận opt-in đều lưu phiên bản chính sách và thời điểm đồng ý để đối soát minh bạch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {consents.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="font-medium text-foreground">{item.type}</div>
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                  <div className="tabular-mono text-[11px] text-muted-foreground">
                    {item.policyVersion} · Xác nhận lúc {item.consentedAt}
                  </div>
                </div>
                <Badge variant="success">Đang hiệu lực</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Tải Bản sao Dữ liệu
              </CardTitle>
              <CardDescription>
                Xuất toàn bộ dữ liệu cá nhân đang lưu trên YITZone theo quyền chủ thể dữ liệu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleExport("JSON")}>
                  <FileJson className="h-4 w-4" />
                  Xuất JSON
                </Button>
                <Button variant="outline" onClick={() => handleExport("PDF")}>
                  <FileText className="h-4 w-4" />
                  Xuất PDF
                </Button>
              </div>
              {exportNotice && (
                <div className="flex items-start gap-2 rounded-lg border border-status-success/30 bg-status-success/10 p-3 text-xs text-status-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{exportNotice}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-status-danger/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-crimson">
                <ShieldAlert className="h-5 w-5" />
                Yêu cầu Xóa / Ẩn danh hóa
              </CardTitle>
              <CardDescription>
                BTV sẽ xử lý ẩn danh hóa PII, nhưng hệ thống bắt buộc bảo lưu dữ liệu tài chính, khen thưởng chính thức và Audit Log theo quy chế.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Gửi yêu cầu Ẩn danh hóa Tài khoản
              </Button>
              {deletionSubmitted && (
                <div className="rounded-lg border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-status-warning">
                  Đã tiếp nhận yêu cầu (chờ BTV xử lý): {deletionSubmitted}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AuditActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Gửi yêu cầu Xóa / Ẩn danh hóa Dữ liệu"
        description="Hệ thống sẽ chuyển yêu cầu tới Ban Thường vụ để ẩn danh hóa thông tin cá nhân, đồng thời giữ nguyên Audit Log và chứng nhận khen thưởng chính thức."
        targetSummary="Yêu cầu DataPrivacyRequest · Tài khoản hiện tại"
        actionCode="PRIVACY_DELETION_REQUEST"
        confirmLabel="Xác nhận gửi yêu cầu"
        onConfirm={(reason) => setDeletionSubmitted(reason)}
      />
    </div>
  );
}
