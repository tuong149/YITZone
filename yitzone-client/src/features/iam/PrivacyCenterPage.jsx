import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadOnboardingState } from "@/features/iam/data/onboarding-storage";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { requestPersonalDataExport } from "./api";

const INITIAL_CONSENTS = [];

export function PrivacyCenterPage() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const userId = useAuthStore((s) => s.userId);

  const consents = useMemo(() => {
    if (!isAuthenticated || !userId) return INITIAL_CONSENTS;
    const saved = loadOnboardingState(userId);
    if (!saved?.consents) return INITIAL_CONSENTS;
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
        note: "Chỉ hiển thị cho Lễ tân được phân quyền soát vé khi kiểm tra thẻ sinh viên."
      });
    }
    if (saved.consents.yitbotDeidentified) {
      items.push({
        id: "cs-yitbot",
        type: "Tương tác Trợ lý Ảo YITBot & Gợi ý CV (Khử định danh)",
        policyVersion: "NĐ 330/2026",
        consentedAt: formattedAt,
        note: "Payload gửi LLM luôn qua lớp khử định danh PII Redactor."
      });
    }
    return items;
  }, [isAuthenticated, userId]);

  const [exportNotice, setExportNotice] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted] = useState(null);

  const handleExport = async (format) => {
    setExportNotice(null);
    setExportError(null);
    try {
      const res = await requestPersonalDataExport();
      setExportNotice(
        `Đã khởi tạo gói xuất bản sao dữ liệu cá nhân định dạng ${format} cho tài khoản ${res.userId ?? userId ?? ""}.`
      );
    } catch (err) {
      setExportError(
        extractApiErrorMessage(
          err,
          "Không thể khởi tạo yêu cầu xuất dữ liệu cá nhân từ máy chủ. Vui lòng thử lại sau."
        )
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
            {consents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                {isAuthenticated
                  ? "Chưa có bản ghi đồng ý xử lý dữ liệu nào được ghi nhận cho phiên hiện tại."
                  : "Đăng nhập để xem lịch sử đồng ý xử lý dữ liệu cá nhân của tài khoản bạn."}
              </div>
            ) : (
              consents.map((item) => (
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
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {!isAuthenticated ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LogIn className="h-5 w-5 text-primary" />
                  Quản lý dữ liệu cá nhân
                </CardTitle>
                <CardDescription>
                  Đăng nhập tài khoản YITZone để tải bản sao dữ liệu hoặc gửi yêu cầu xóa / ẩn danh hóa thông tin cá nhân.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full rounded-full">
                  <Link to="/login" state={{ from: location }}>
                    <LogIn className="h-4 w-4" />
                    <span>Đăng nhập để quản lý dữ liệu</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
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
                    <Button variant="outline" onClick={() => void handleExport("JSON")}>
                      <FileJson className="h-4 w-4" />
                      Xuất JSON
                    </Button>
                    <Button variant="outline" onClick={() => void handleExport("PDF")}>
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
                  {exportError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{exportError}</span>
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
                    Ban Thường vụ sẽ xử lý ẩn danh hóa thông tin cá nhân, nhưng hệ thống bắt buộc bảo lưu dữ liệu tài chính, khen thưởng chính thức và nhật ký kiểm toán theo quy chế.
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
            </>
          )}
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
