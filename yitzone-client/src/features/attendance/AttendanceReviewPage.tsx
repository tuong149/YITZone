import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock, MonitorPlay, QrCode, ShieldAlert, UserCheck } from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReviewQueueRow {
  id: string;
  studentCode: string;
  fullName: string;
  flags: string;
  riskWeight: 1 | 2;
  scannedAt: string;
}

const INITIAL_QUEUE: ReviewQueueRow[] = [
  {
    id: "rq-1",
    studentCode: "22110345",
    fullName: "Nguyễn Minh Khoa",
    flags: "GPS lệch nhẹ (+1đ)",
    riskWeight: 1,
    scannedAt: "08:12:04"
  },
  {
    id: "rq-2",
    studentCode: "22110489",
    fullName: "Trần Thảo Vy",
    flags: "Khóa thiết bị mới < 15p (+1đ)",
    riskWeight: 1,
    scannedAt: "08:14:31"
  },
  {
    id: "rq-3",
    studentCode: "23110219",
    fullName: "Lê Quốc Bảo",
    flags: "DEVICE_TOKEN_COLLISION (+2đ · Tín hiệu Mạnh)",
    riskWeight: 2,
    scannedAt: "08:18:10"
  },
  {
    id: "rq-4",
    studentCode: "24110077",
    fullName: "Phạm Gia Bảo (Vãng lai)",
    flags: "BARCODE_WALKIN_UNVERIFIED (+2đ · Tín hiệu Mạnh)",
    riskWeight: 2,
    scannedAt: "08:21:55"
  }
];

export function AttendanceReviewPage(){
  const [queue, setQueue] = useState<ReviewQueueRow[]>(INITIAL_QUEUE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualMssv, setManualMssv] = useState("");
  const [qrCountdown, setQrCountdown] = useState(10);
  const [qrNonce, setQrNonce] = useState(1001);
  const [auditModal, setAuditModal] = useState<{
    title: string;
    summary: string;
    code: string;
    destructive?: boolean;
    onDone: () => void;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          setQrNonce((n) => n + 1);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const columns: DataTableColumn<ReviewQueueRow>[] = [
    { key: "code", header: "MSSV", render: (r) => <span className="tabular-mono font-semibold">{r.studentCode}</span> },
    { key: "name", header: "Họ và tên", render: (r) => <span className="font-medium">{r.fullName}</span> },
    {
      key: "flags",
      header: "Cờ Rủi ro Trọng số",
      render: (r) => (
        <Badge variant={r.riskWeight === 2 ? "danger": "warning"}>{r.flags}</Badge>
      )
    },
    { key: "time", header: "Giờ quét", render: (r) => <span className="tabular-mono text-xs text-muted-foreground">{r.scannedAt}</span> },
    {
      key: "actions",
      header: "Quyết định (Hạn 48h)",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setAuditModal({
                title: "Chấp nhận Lượt Điểm danh Hậu kiểm",
                summary: `${r.fullName} (${r.studentCode}) · ${r.flags}`,
                code: "ATTENDANCE_REVIEW_APPROVE",
                destructive: false,
                onDone: () => {
                  setQueue((prev) => prev.filter((x) => x.id !== r.id));
                  setNotice(`Đã chấp nhận lượt điểm danh của ${r.fullName} và ghi Audit Log.`);
                }
              })
            }
          >
            Chấp nhận
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              setAuditModal({
                title: "Từ chối Lượt Điểm danh Vi phạm",
                summary: `${r.fullName} (${r.studentCode}) · ${r.flags}`,
                code: "ATTENDANCE_REVIEW_REJECT",
                destructive: true,
                onDone: () => {
                  setQueue((prev) => prev.filter((x) => x.id !== r.id));
                  setNotice(`Đã từ chối lượt điểm danh của ${r.fullName} (không cấp E-Cert).`);
                }
              })
            }
          >
            Từ chối
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Điểm danh Đa lớp, QR Động 10s &amp; Hậu kiểm 48h
          </h1>
          <p className="text-sm text-muted-foreground">
            Chấm điểm rủi ro trọng số, cấm duyệt hàng loạt nhóm Tín hiệu Mạnh (+2đ), điểm danh bù có Audit Log.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">
            <Clock className="h-3.5 w-3.5" />
            Hạn hậu kiểm còn: 41h 20p
          </Badge>
          <Button asChild size="sm" variant="outline">
            <Link to="/scanner">
              <QrCode className="h-4 w-4" />
              Mở Máy Soát vé 1D
            </Link>
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <Tabs defaultValue="review" className="w-full">
        <TabsList>
          <TabsTrigger value="review">Hàng chờ Hậu kiểm 48h</TabsTrigger>
          <TabsTrigger value="manual">Điểm danh Sớm BTC &amp; Bù tay</TabsTrigger>
          <TabsTrigger value="dynamic-qr">Chiếu QR Động 10s</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-status-danger/25 bg-status-danger/5 px-4 py-2.5 text-xs text-status-danger">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Quy tắc duyệt: Chỉ cho phép &ldquo;Xác nhận hàng loạt&rdquo; với cảnh báo nhẹ (+1đ). Các ca Tín hiệu Mạnh (+2đ) bị khóa checkbox hàng loạt và bắt buộc xét duyệt thủ công từng trường hợp.
            </span>
          </div>

          <DataTable
            columns={columns}
            data={queue}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            isRowBulkDisabled={(row) => row.riskWeight === 2}
            bulkDisabledReason="Cấm duyệt hàng loạt với cờ Tín hiệu Mạnh (+2đ)"
            bulkActions={
              <Button
                size="sm"
                onClick={() =>
                  setAuditModal({
                    title: "Xác nhận hàng loạt nhóm Cảnh báo Nhẹ (+1đ)",
                    summary: `${selectedIds.length} lượt điểm danh cùng ngữ cảnh`,
                    code: "ATTENDANCE_BULK_APPROVE_WEAK",
                    destructive: false,
                    onDone: () => {
                      setQueue((prev) => prev.filter((x) => !selectedIds.includes(x.id)));
                      setSelectedIds([]);
                      setNotice(`Đã duyệt hàng loạt ${selectedIds.length} lượt cảnh báo nhẹ (+1đ).`);
                    }
                  })
                }
              >
                Chấp nhận {selectedIds.length} lượt nhẹ
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="manual" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Điểm danh Bù Bằng tay Có Kiểm toán
              </CardTitle>
              <CardDescription>
                Dành cho sinh viên hết pin, lỗi thiết bị hoặc quên thẻ SV. Mọi thao tác bắt buộc nhập lý do và ghi Audit Log.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="manual-mssv">MSSV 8 chữ số</Label>
                <Input
                  id="manual-mssv"
                  maxLength={8}
                  placeholder="22110345"
                  value={manualMssv}
                  onChange={(e) => setManualMssv(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <Button
                type="button"
                disabled={!/^[0-9]{8}$/.test(manualMssv.trim())}
                onClick={() =>
                  setAuditModal({
                    title: "Xác nhận Điểm danh Bù Bằng tay",
                    summary: `MSSV ${manualMssv} · Hội thảo Cloud Native & DevOps 2026`,
                    code: "ATTENDANCE_MANUAL_OVERRIDE",
                    destructive: false,
                    onDone: () => {
                      setNotice(`Đã ghi nhận điểm danh bù cho MSSV ${manualMssv} và lưu Audit Log.`);
                      setManualMssv("");
                    }
                  })
                }
              >
                Ghi nhận Điểm danh Bù (Yêu cầu lý do Audit)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Điểm danh Sớm Thành viên BTC (Trước 1–2 giờ)</CardTitle>
              <CardDescription>
                Ghi nhận thành viên BTC đã duyệt đến làm nhiệm vụ sớm — là điều kiện miễn bài thu hoạch khi chốt E-Cert.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                <div>
                  <div className="font-medium text-foreground">Trần Thảo Vy (Lễ tân)</div>
                  <div className="tabular-mono text-xs text-muted-foreground">22110412 · Đã duyệt BTC</div>
                </div>
                <Badge variant="success">Đã điểm danh sớm</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                <div>
                  <div className="font-medium text-foreground">Lê Hoàng Nam (Kỹ thuật LED)</div>
                  <div className="tabular-mono text-xs text-muted-foreground">23110188 · Đã duyệt BTC</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNotice("Đã điểm danh sớm BTC cho Lê Hoàng Nam (23110188).")}
                >
                  Xác nhận có mặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dynamic-qr">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Mã QR Động Ký số (Tự đổi mỗi 10 giây · Ân hạn truyền N=8s)</CardTitle>
                <CardDescription>
                  Vùng quiet zone trắng tối thiểu 16px đảm bảo camera hội trường bắt mã dưới 0.3s.
                </CardDescription>
              </div>
              <Button asChild>
                <Link to="/stage">
                  <MonitorPlay className="h-4 w-4" />
                  Phóng toàn màn hình LED 16:9
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-floating">
                <QRCodeSVG
                  value={`YITZONE:EVT-CLOUD-2026:NONCE-${qrNonce}:SIG-ECDSA-P256`}
                  size={220}
                />
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="info" className="tabular-mono">
                  Đổi mã sau: {qrCountdown}s
                </Badge>
                <span className="tabular-mono text-xs text-muted-foreground">
                  Nonce #{qrNonce}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(auditModal)}
        onOpenChange={(open) => {
          if (!open) setAuditModal(null);
        }}
        title={auditModal?.title ?? ""}
        description="Quyết định hậu kiểm và điểm danh bù được lưu bất biến vào Audit Log."
        targetSummary={auditModal?.summary ?? ""}
        actionCode={auditModal?.code ?? "ATTENDANCE_AUDIT"}
        destructive={auditModal?.destructive ?? false}
        onConfirm={() => {
          auditModal?.onDone();
        }}
      />
    </div>
  );
}
