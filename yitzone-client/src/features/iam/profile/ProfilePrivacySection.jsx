import { useMemo, useState } from "react";
import {
  AlertCircle,
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
import {
  createPrivacyRequest,
  downloadPersonalDataExport,
  useMyConsents
} from "@/features/iam/api";
import { loadOnboardingState } from "@/features/iam/data/onboarding-storage";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export function ProfilePrivacySection({ userId: propUserId }) {
  const storeUserId = useAuthStore((s) => s.userId);
  const effectiveUserId = propUserId || storeUserId || "";

  const { data: apiConsents } = useMyConsents(Boolean(effectiveUserId));

  const consents = useMemo(() => {
    if (Array.isArray(apiConsents) && apiConsents.length > 0) {
      return apiConsents.map((c) => ({
        id: c.id ?? `${c.consentType}-${c.policyVersion}`,
        type:
          c.consentType === "INITIAL_PRIVACY"
            ? "Xử lý Dữ liệu Cá nhân Cơ bản"
            : c.consentType === "PORTRAIT_TICKET"
              ? "Đối chiếu Ảnh thẻ Sinh viên tại Quầy Soát vé"
              : c.consentType === "AI_USAGE"
                ? "Tương tác Trợ lý Ảo YITBot (Khử định danh)"
                : c.consentType,
        policyVersion: c.policyVersion || "v2026.1",
        consentedAt: c.grantedAt ? new Date(c.grantedAt).toLocaleString("vi-VN") : "Đã xác nhận",
        note: c.granted ? "Đang hiệu lực theo Luật BVDLCN 91/2025/QH15." : "Đã rút lại đồng ý."
      }));
    }
    const saved = loadOnboardingState(effectiveUserId);
    if (!saved?.consents) return [];
    const at = saved.completedAt || saved.updatedAt;
    const formattedAt = at ? new Date(at).toLocaleString("vi-VN") : "Đã xác nhận";
    const items = [];
    if (saved.consents.pdplBasic) {
      items.push({
        id: "cs-pdpl",
        type: "Xử lý Dữ liệu Cá nhân Cơ bản",
        policyVersion: "Luật 91/2025/QH15",
        consentedAt: formattedAt,
        note: "Phục vụ định danh MSSV, điểm danh sự kiện và cấp E-Certificate."
      });
    }
    if (saved.consents.photoCheckin) {
      items.push({
        id: "cs-photo",
        type: "Đối chiếu Ảnh thẻ Sinh viên tại Quầy Soát vé",
        policyVersion: "NĐ 356/2025",
        consentedAt: formattedAt,
        note: "Chỉ hiển thị cho Lễ tân được phân quyền soát vé khi kiểm tra thẻ sinh viên vật lý."
      });
    }
    if (saved.consents.yitbotDeidentified) {
      items.push({
        id: "cs-yitbot",
        type: "Tương tác Trợ lý Ảo YITBot & Gợi ý CV (Khử định danh)",
        policyVersion: "NĐ 330/2026",
        consentedAt: formattedAt,
        note: "Payload gửi LLM luôn đi qua lớp khử định danh PII Redactor."
      });
    }
    return items;
  }, [effectiveUserId, apiConsents]);

  const [exportNotice, setExportNotice] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted] = useState(null);

  const handleExport = async (format) => {
    setExportNotice(null);
    setExportError(null);
    try {
      const blob = await downloadPersonalDataExport(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yitzone-personal-data-${effectiveUserId || "me"}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportNotice(
        `Đã tải xuống bản sao dữ liệu cá nhân định dạng ${format} cho tài khoản ${effectiveUserId}.`
      );
    } catch (err) {
      setExportError(
        extractApiErrorMessage(
          err,
          "Không thể khởi tạo yêu cầu xuất bản sao dữ liệu cá nhân. Vui lòng thử lại sau."
        )
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
          {consents.length === 0 ? (
            <div className="border-t border-border p-6 text-center text-xs text-muted-foreground">
              Chưa có bản ghi đồng ý xử lý dữ liệu nào được lưu trong phiên hiện tại.
            </div>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {consents.map((item) => (
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
          )}
        </CardContent>
      </Card>

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
          {exportError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
        </CardContent>
      </Card>

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
        onConfirm={async (reason) => {
          try {
            await createPrivacyRequest({
              requestType: "ERASURE_ANONYMIZE",
              reason
            });
            setDeletionSubmitted({
              reason,
              at: new Date().toLocaleString("vi-VN")
            });
            setDeleteDialogOpen(false);
          } catch (err) {
            setExportError(extractApiErrorMessage(err, "Không thể gửi yêu cầu ẩn danh hóa tài khoản."));
          }
        }}
      />
    </div>
  );
}
