import { useState } from "react";
import { Award, CheckCircle2, FileSpreadsheet, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertTemplatesTab } from "./CertTemplatesTab";
import { reissueCertificate, revokeCertificate } from "./api";

const MAJOR_OPTIONS = [
  { code: "110", name: "Công nghệ Thông tin (FIT)" },
  { code: "133", name: "Kỹ thuật Dữ liệu (FIT)" },
  { code: "162", name: "An toàn Thông tin (FIT)" },
  { code: "146", name: "Cơ điện tử (Khoa Cơ khí)" }
];

export function CertificateAdminPage(){
  const [cddnMajors, setCddnMajors] = useState<string[]>(["110", "133", "162"]);
  const [transferMssv, setTransferMssv] = useState("22146091");
  const [transferDate, setTransferDate] = useState("2026-09-01");
  const [revokeCode, setRevokeCode] = useState("YIT-2026-CLD-0184");
  const [auditModal, setAuditModal] = useState<{
    title: string;
    summary: string;
    code: string;
    destructive?: boolean;
    onDone: (reason: string) => void | Promise<void>;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleMajor = (code: string) => {
    setCddnMajors((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code): [...prev, code]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Chốt Kết quả, Cấp / Thu hồi E-Certificate &amp; Đặc cách CĐDN
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn danh sách ngành cộng CĐDN linh hoạt theo sự kiện, xuất Excel đối soát CTSV, xử lý đặc cách chuyển ngành và thu hồi phiên bản.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setNotice("Đã xuất tệp Excel đối soát mẫu Phòng CTSV / Đào tạo (gồm chi tiết hoạt động & cột tổng hợp theo loại quyền lợi, không liệt kê số điểm).")
          }
        >
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel Đối soát CTSV
        </Button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <Tabs defaultValue="finalize" className="w-full">
        <TabsList>
          <TabsTrigger value="finalize">Chốt Kết quả &amp; Ngành CĐDN</TabsTrigger>
          <TabsTrigger value="transfer">Đặc cách Chuyển ngành (BTV)</TabsTrigger>
          <TabsTrigger value="revoke">Thu hồi &amp; Cấp lại v2 (BTV)</TabsTrigger>
          <TabsTrigger value="templates">Kho Mẫu Phôi E-Cert</TabsTrigger>
        </TabsList>

        <TabsContent value="finalize">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Chốt Sự kiện: Hội thảo Cloud Native &amp; DevOps 2026
              </CardTitle>
              <CardDescription>
                Mặc định chọn sẵn 3 ngành Khoa CNTT (`110, 133, 162`). Sinh viên ngành ngoài danh sách sẽ được ghi chú không tích lũy chuẩn CĐDN.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Chọn các ngành được ghi nhận quyền lợi CĐDN cho sự kiện này</Label>
                <div className="flex flex-wrap gap-2">
                  {MAJOR_OPTIONS.map((m) => {
                    const active = cddnMajors.includes(m.code);
                    return (
                      <Button
                        key={m.code}
                        type="button"
                        size="sm"
                        variant={active ? "default": "outline"}
                        onClick={() => toggleMajor(m.code)}
                      >
                        <span className="tabular-mono">{m.code}</span>{m.name} {active ? "✓": ""}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="text-muted-foreground">Tham dự viên đủ K/N buổi + Khảo sát</div>
                  <div className="mt-1 tabular-mono text-lg font-semibold text-foreground">176 SV</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="text-muted-foreground">Thành viên BTC đủ điểm danh (Miễn bài thu hoạch)</div>
                  <div className="mt-1 tabular-mono text-lg font-semibold text-foreground">18 BTC</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="text-muted-foreground">Hàng chờ hậu kiểm 48h còn tồn</div>
                  <div className="mt-1 tabular-mono text-lg font-semibold text-status-success">0 ca</div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() =>
                  setNotice(
                    `Đã chốt kết quả, ghi nhận quyền lợi (CĐDN cho mã ngành ${cddnMajors.join(", ")}) và phát hành 194 E-Certificate kèm mã QR xác thực.`
                  )
                }
              >
                <ShieldCheck className="h-4 w-4" />
                Chốt Kết quả &amp; Phát hành 194 E-Certificate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle>Xác nhận Sinh viên Chuyển ngành / Đặc cách CĐDN (Duy nhất BTV)</CardTitle>
              <CardDescription>
                Dành cho sinh viên chuyển vào Khoa CNTT nhưng giữ MSSV mã ngành cũ. Hệ thống tự động rà soát hội thảo CĐDN từ ngày hiệu lực và phát hành bản E-Cert v2.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tr-mssv">MSSV sinh viên chuyển ngành</Label>
                <Input
                  id="tr-mssv"
                  value={transferMssv}
                  onChange={(e) => setTransferMssv(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tr-date">Ngày hiệu lực quyết định chuyển ngành</Label>
                <Input
                  id="tr-date"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setAuditModal({
                      title: "Cấp Đặc cách Sinh viên Chuyển ngành CĐDN (BTV)",
                      summary: `MSSV ${transferMssv} · Hiệu lực từ ${transferDate}`,
                      code: "CERT_TRANSFER_MAJOR_OVERRIDE",
                      destructive: false,
                      onDone: () =>
                        setNotice(
                          `Đã bật xác nhận "Sinh viên thuộc Khoa CNTT" cho ${transferMssv}, cộng bù CĐDN từ ${transferDate} và phát hành E-Cert phiên bản mới.`
                        )
                    })
                  }
                >
                  Bật đặc cách &amp; Cộng bù CĐDN
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revoke">
          <Card>
            <CardHeader>
              <CardTitle>Thu hồi hoặc Cấp lại Phiên bản E-Certificate Mới</CardTitle>
              <CardDescription>
                Trang QR công khai lập tức chuyển sang &ldquo;Đã thu hồi&rdquo; hoặc &ldquo;Đã thay thế bởi bản mới&rdquo; và ghi đầy đủ vào Audit Log.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm space-y-1.5">
                <Label htmlFor="rev-code">Mã E-Certificate</Label>
                <Input
                  id="rev-code"
                  value={revokeCode}
                  onChange={(e) => setRevokeCode(e.target.value)}
                  className="tabular-mono"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  onClick={() =>
                    setAuditModal({
                      title: "Thu hồi E-Certificate Vĩnh viễn",
                      summary: `Mã chứng nhận: ${revokeCode}`,
                      code: "CERT_REVOKE",
                      destructive: true,
                      onDone: async (reason) => {
                        try {
                          const res = await revokeCertificate(revokeCode, reason);
                          setNotice(`API /certificates/${res.certificateId}/revoke → ${res.certStatus} (Idempotency-Key: ${res.idempotencyKey.slice(0, 8)}…).`);
                        } catch {
                          setNotice(`Đã thu hồi chứng nhận ${revokeCode} (chế độ mô phỏng cục bộ).`);
                        }
                      }
                    })
                  }
                >
                  <ShieldX className="h-4 w-4" />
                  Thu hồi Chứng nhận
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    setAuditModal({
                      title: "Cấp lại Phiên bản E-Certificate Mới (Tăng v2)",
                      summary: `Mã chứng nhận: ${revokeCode}`,
                      code: "CERT_REISSUE_NEW_VERSION",
                      destructive: false,
                      onDone: async (reason) => {
                        try {
                          const res = await reissueCertificate(revokeCode, reason);
                          setNotice(`API /certificates/${res.previousCertificateId}/reissue → v${res.newCertVersion} (${res.previousStatus}).`);
                        } catch {
                          setNotice(`Đã phát hành phiên bản mới (${revokeCode}-V2) (chế độ mô phỏng cục bộ).`);
                        }
                      }
                    })
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                  Cấp lại Phiên bản Mới (v2)
                </Button>
              </div>

              <Badge variant="secondary">Mọi thao tác thu hồi / cấp lại chỉ dành cho Ban Thường vụ (BTV)</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <CertTemplatesTab onNotify={setNotice} />
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(auditModal)}
        onOpenChange={(open) => {
          if (!open) setAuditModal(null);
        }}
        title={auditModal?.title ?? ""}
        description="Quyết định liên quan đến quyền lợi CĐDN và hiệu lực E-Certificate được lưu bất biến vào Audit Log."
        targetSummary={auditModal?.summary ?? ""}
        actionCode={auditModal?.code ?? "CERT_AUDIT"}
        destructive={auditModal?.destructive ?? false}
        onConfirm={(reason) => auditModal?.onDone(reason)}
      />
    </div>
  );
}
