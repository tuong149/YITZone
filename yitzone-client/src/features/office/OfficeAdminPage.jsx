import { useState } from "react";
import {
  AlertTriangle,
  Archive,
  CalendarOff,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Package,
  QrCode,
  ShieldAlert
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfficeChecklistAssetsCrudTab } from "./OfficeChecklistAssetsCrudTab";

const INITIAL_EXCEPTIONS = [
  {
    id: "ex-1",
    ctvName: "Trần Thị Minh Anh",
    mssv: "23110142",
    shift: "Thứ 6 · Ca 5 (14:30–16:30)",
    minutesBefore: 45,
    reason: "Xe hư trên đường đến trường, có ảnh gửi trưởng ca",
    status: "PENDING"
  }
];

const ATTENDANCE_STATS = [
  {
    id: "st-1",
    ctvName: "Nguyễn Hoàng Nam",
    mssv: "23110218",
    unit: "Ban OFIT",
    shiftsRatio: "8 / 8",
    totalHours: 16,
    onTime: 7,
    late: 1,
    excused: 0,
    unexcused: 0,
    missingCheckout: 0
  },
  {
    id: "st-2",
    ctvName: "Lê Quốc Bảo",
    mssv: "22110389",
    unit: "Ban EMFIT",
    shiftsRatio: "6 / 8",
    totalHours: 12,
    onTime: 5,
    late: 1,
    excused: 1,
    unexcused: 2,
    missingCheckout: 1
  },
  {
    id: "st-3",
    ctvName: "Phạm Thảo Vy",
    mssv: "24110095",
    unit: "Ban ARTIT",
    shiftsRatio: "8 / 8",
    totalHours: 16,
    onTime: 8,
    late: 0,
    excused: 0,
    unexcused: 0,
    missingCheckout: 0
  }
];

const INITIAL_ASSETS = [
  {
    id: "as-1",
    code: "OFIT-MIC-01",
    name: "Bộ Micro không dây Shure (2 tay mic)",
    type: "REUSABLE",
    goodQty: 3,
    damagedQty: 1,
    borrower: "23110218 · UTE Hackathon (Chưa trả)"
  },
  {
    id: "as-2",
    code: "OFIT-LOA-02",
    name: "Loa kéo sự kiện Sony 120W",
    type: "REUSABLE",
    goodQty: 2,
    damagedQty: 0
  },
  {
    id: "as-3",
    code: "OFIT-PIN-AA",
    name: "Pin AA Alkaline (Hộp 24 viên)",
    type: "CONSUMABLE",
    goodQty: 1,
    damagedQty: 0,
    minThreshold: 3
  }
];

const INITIAL_INVENTORY = [
  { id: "inv-1", code: "OFIT-MIC-01", name: "Bộ Micro không dây Shure", bookQty: 4, actualQty: 4 },
  { id: "inv-2", code: "OFIT-HDMI-10M", name: "Cáp HDMI 10m bọc lưới", bookQty: 3, actualQty: 5 },
  { id: "inv-3", code: "OFIT-STANDEE", name: "Khung Standee chữ X 60x160", bookQty: 6, actualQty: 5 }
];

export function OfficeAdminPage(){
  const [published, setPublished] = useState(true);
  const [suspendedRange, setSuspendedRange] = useState(null);
  const [exceptions, setExceptions] = useState(INITIAL_EXCEPTIONS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [scanQrInput, setScanQrInput] = useState("OFIT-LOA-02");
  const [scanBarcodeInput, setScanBarcodeInput] = useState("22110345");
  const [notice, setNotice] = useState(null);

  const [auditTarget, setAuditTarget] = useState(null);

  const exceptionCols = [
    {
      key: "ctv",
      header: "Cộng tác viên",
      render: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.ctvName}</div>
          <div className="tabular-mono text-xs text-muted-foreground">{r.mssv}</div>
        </div>
      )
    },
    { key: "shift", header: "Ca trực xin vắng", render: (r) => <span className="text-xs">{r.shift}</span> },
    {
      key: "before",
      header: "Cận giờ",
      render: (r) => <Badge variant="warning">Trước {r.minutesBefore} phút</Badge>
    },
    { key: "reason", header: "Lý do ngoại lệ", render: (r) => <span className="text-xs">{r.reason}</span> },
    {
      key: "action",
      header: "Quyết định (OFIT Lead)",
      align: "right",
      render: (r) =>
        r.status === "PENDING" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAuditTarget({
                  title: "Duyệt ngoại lệ vắng cận giờ (< 2h)",
                  description: "Chuyển ca trực sang Vắng có phép (không tính vi phạm).",
                  summary: `${r.ctvName} (${r.mssv}) · ${r.shift}`,
                  code: "DUTY_EXCEPTION_APPROVE",
                  destructive: false,
                  onDone: () => {
                    setExceptions((prev) =>
                      prev.map((x) => (x.id === r.id ? {...x, status: "APPROVED" }: x))
                    );
                    setNotice(`Đã duyệt ngoại lệ cận giờ cho ${r.ctvName} và ghi Audit Log.`);
                  }
                })
              }
            >
              Duyệt
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                setAuditTarget({
                  title: "Từ chối đơn ngoại lệ cận giờ",
                  description: "Ghi nhận Vắng không phép và cập nhật cảnh báo chuyên cần.",
                  summary: `${r.ctvName} (${r.mssv}) · ${r.shift}`,
                  code: "DUTY_EXCEPTION_REJECT",
                  destructive: true,
                  onDone: () => {
                    setExceptions((prev) =>
                      prev.map((x) => (x.id === r.id ? {...x, status: "REJECTED" }: x))
                    );
                    setNotice(`Đã từ chối đơn ngoại lệ của ${r.ctvName} và ghi Audit Log.`);
                  }
                })
              }
            >
              Từ chối
            </Button>
          </div>
        ): (
          <Badge variant={r.status === "APPROVED" ? "success": "danger"}>
            {r.status === "APPROVED" ? "Đã duyệt": "Đã từ chối"}
          </Badge>
        )
    }
  ];

  const statCols = [
    {
      key: "ctv",
      header: "CTV",
      render: (r) => (
        <div>
          <div className="font-medium">{r.ctvName}</div>
          <div className="tabular-mono text-xs text-muted-foreground">
            {r.mssv} · {r.unit}
          </div>
        </div>
      )
    },
    { key: "ratio", header: "Số ca / Định mức", render: (r) => <span className="tabular-mono">{r.shiftsRatio}</span> },
    { key: "hours", header: "Tổng giờ", render: (r) => <span className="tabular-mono">{r.totalHours}h</span> },
    { key: "onTime", header: "Đúng giờ", render: (r) => <span className="tabular-mono text-status-success">{r.onTime}</span> },
    { key: "late", header: "Đi trễ", render: (r) => <span className="tabular-mono text-status-warning">{r.late}</span> },
    { key: "excused", header: "Vắng CP", render: (r) => <span className="tabular-mono">{r.excused}</span> },
    {
      key: "unexcused",
      header: "Vắng KP",
      render: (r) =>
        r.unexcused >= 2 ? (
          <Badge variant="danger">
            <span className="tabular-mono">{r.unexcused} lần (Cảnh báo BTV)</span>
          </Badge>
        ): (
          <span className="tabular-mono">{r.unexcused}</span>
        )
    },
    {
      key: "miss",
      header: "Thiếu Check-out",
      render: (r) => <span className="tabular-mono">{r.missingCheckout}</span>
    }
  ];

  const assetCols = [
    {
      key: "code",
      header: "Mã QR / Tài sản",
      render: (a) => (
        <div>
          <div className="font-medium">{a.name}</div>
          <div className="tabular-mono text-xs text-muted-foreground">{a.code}</div>
        </div>
      )
    },
    {
      key: "type",
      header: "Phân loại",
      render: (a) => (
        <Badge variant={a.type === "REUSABLE" ? "info": "secondary"}>
          {a.type === "REUSABLE" ? "Dùng nhiều lần (QR)": "Vật tư tiêu hao"}
        </Badge>
      )
    },
    {
      key: "stock",
      header: "Tồn Tốt / Hỏng",
      render: (a) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="tabular-mono text-xs font-semibold text-status-success">Tốt: {a.goodQty}</span>
          {a.damagedQty > 0 && (
            <Badge variant="danger">
              <span className="tabular-mono">Hỏng: {a.damagedQty}</span>
            </Badge>
          )}
          {a.minThreshold !== undefined && a.goodQty < a.minThreshold && (
            <Badge variant="warning">Dưới ngưỡng ({a.minThreshold})</Badge>
          )}
        </div>
      )
    },
    {
      key: "borrower",
      header: "Trạng thái Mượn – Trả",
      render: (a) =>
        a.borrower ? (
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-status-warning">{a.borrower}</div>
            <div className="text-[11px] text-muted-foreground">Liên kết chặn nghỉ CTV</div>
          </div>
        ): (
          <span className="text-xs text-muted-foreground">Sẵn sàng tại VP</span>
        )
    },
    {
      key: "action",
      header: "Thao tác",
      align: "right",
      render: (a) =>
        a.borrower ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAssets((prev) =>
                prev.map((x) =>
                  x.id === a.id
                    ? {...x, goodQty: Math.max(0, x.goodQty - 1), damagedQty: x.damagedQty + 1, borrower: undefined }
: x
                )
              );
              setNotice(
                `Đã nhận trả ${a.code} (ghi nhận 1 thiết bị Hỏng): tự động trừ tồn Tốt, cộng mục Hỏng/Sửa chữa.`
              );
            }}
          >
            Nhận trả (Báo Hỏng 1)
          </Button>
        ): (
          <span className="text-xs text-muted-foreground">—</span>
        )
    }
  ];

  const handleQuickLoan = () => {
    if (!scanQrInput.trim() || !scanBarcodeInput.trim()) return;
    setAssets((prev) =>
      prev.map((a) =>
        a.code === scanQrInput.trim()
          ? {...a, borrower: `${scanBarcodeInput.trim()} · Mượn sự kiện (Vừa quét)` }
: a
      )
    );
    setNotice(`Đã lập phiếu mượn thiết bị ${scanQrInput} cho MSSV ${scanBarcodeInput} (≤ 0.3s).`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground">
            Quản trị Trực Văn phòng &amp; Kiểm kê Tài sản (OFIT)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Điều phối chu kỳ trực 6 ca + Ca Vệ sinh T6, duyệt ngoại lệ cận giờ, quản lý mượn-trả QR/1D và kiểm
            kê định kỳ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={published ? "outline": "default"}
            onClick={() => {
              setPublished(true);
              setNotice("Đã công bố lịch trực chính thức và đồng bộ màu Cam vào Lịch của toàn thể CTV.");
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{published ? "Lịch trực đã công bố": "Công bố lịch trực"}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setSuspendedRange((prev) => (prev ? null: "01/01/2027 – 04/01/2027 (Nghỉ Tết Dương lịch)"))
            }
          >
            <CalendarOff className="h-4 w-4" />
            <span>{suspendedRange ? "Hủy tạm ngưng": "Tạm ngưng (Nghỉ lễ/Thi)"}</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              setAuditTarget({
                title: "Kết thúc Chu kỳ Trực Văn phòng Học kỳ 1",
                description: "Thao tác chốt số liệu chuyên cần toàn Khoa và mở chu kỳ trực mới.",
                summary: "Chu kỳ HK1 2026–2027 · 4 Ban – 9 Tổ",
                code: "DUTY_CYCLE_CLOSE",
                destructive: true,
                onDone: () => setNotice("Đã chốt chu kỳ trực hiện tại và ghi Audit Log.")
              })
            }
          >
            Kết thúc chu kỳ trực
          </Button>
        </div>
      </div>

      {suspendedRange && (
        <div className="flex items-center gap-2 rounded-lg border border-status-warning/35 bg-status-warning/10 px-4 py-2.5 text-xs font-medium text-status-warning">
          <CalendarOff className="h-4 w-4 shrink-0" />
          <span>
            Đang áp dụng Tạm ngưng trực: <strong>{suspendedRange}</strong> — các ca trong khoảng này không tính
            vắng, chu kỳ tiếp tục sau kỳ nghỉ.
          </span>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
          <span className="font-medium">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Đóng
          </button>
        </div>
      )}

      <Tabs defaultValue="exceptions" className="space-y-5">
        <TabsList>
          <TabsTrigger value="exceptions">Ngoại lệ Cận giờ &lt; 2h</TabsTrigger>
          <TabsTrigger value="attendance">Thống kê Chuyên cần</TabsTrigger>
          <TabsTrigger value="assets">Tài sản &amp; Mượn – Trả QR/1D</TabsTrigger>
          <TabsTrigger value="inventory">Kiểm kê &amp; Tài sản dư</TabsTrigger>
          <TabsTrigger value="crud">Hạng mục Vệ sinh T6 &amp; Thanh lý</TabsTrigger>
        </TabsList>

        <TabsContent value="exceptions" className="space-y-4">
          <DataTable columns={exceptionCols} data={exceptions} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Tách bạch chỉ số theo phạm vi đơn vị Tổ/Ban · Cảnh báo tự động khi Vắng không phép ≥ 2 lần/tháng.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNotice("Đã xuất file Excel thống kê chuyên cần toàn Khoa (HK1-2026.xlsx).")}
            >
              <Download className="h-4 w-4" />
              <span>Xuất Excel Chuyên cần</span>
            </Button>
          </div>
          <DataTable columns={statCols} data={ATTENDANCE_STATS} />
        </TabsContent>

        <TabsContent value="assets" className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-brand-cyan" />
                <span>Lập phiếu Mượn nhanh (QR Thiết bị + Mã vạch 1D Thẻ SV)</span>
              </CardTitle>
              <CardDescription>
                Hỗ trợ súng quét HID hoặc nhập nhanh mã QR dán trên thiết bị và mã vạch 1D trên thẻ sinh viên.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="asset-qr">Mã QR Thiết bị</Label>
                <Input
                  id="asset-qr"
                  value={scanQrInput}
                  onChange={(e) => setScanQrInput(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="borrower-1d">Mã vạch 1D Thẻ SV (MSSV)</Label>
                <Input
                  id="borrower-1d"
                  value={scanBarcodeInput}
                  onChange={(e) => setScanBarcodeInput(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <Button onClick={handleQuickLoan}>
                <Package className="h-4 w-4" />
                <span>Xác nhận Giao mượn</span>
              </Button>
            </CardContent>
          </Card>

          <DataTable columns={assetCols} data={assets} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-primary" />
                    <span>Kiểm kê Định kỳ &amp; Xử lý Tài sản Dư</span>
                  </CardTitle>
                  <CardDescription>
                    Thực tế nhiều hơn sổ sách sẽ tự động tách sang mục &ldquo;Tài sản dư chờ xác minh nguồn
                    gốc&rdquo; — không tự cộng vào tồn kho chính thức.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    setAuditTarget({
                      title: "Chốt Biên bản Kiểm kê & Trình BTV",
                      description:
                        "Ghi nhận chênh lệch thiếu/hỏng và danh mục Tài sản dư chờ xác minh nguồn gốc.",
                      summary: "Biên bản kiểm kê Tháng 11/2026 · Ban OFIT",
                      code: "OFFICE_INVENTORY_FINALIZE",
                      destructive: false,
                      onDone: () => setNotice("Đã chốt biên bản kiểm kê, xuất báo cáo trình BTV và lưu Audit Log.")
                    })
                  }
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Chốt biên bản trình BTV</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventory.map((row) => {
                const diff = row.actualQty - row.bookQty;
                return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-foreground">{row.name}</div>
                      <div className="tabular-mono text-xs text-muted-foreground">{row.code}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="tabular-mono text-xs text-muted-foreground">
                        Sổ sách: <strong className="text-foreground">{row.bookQty}</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Thực tế:</span>
                        <Input
                          type="number"
                          min={0}
                          value={row.actualQty}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setInventory((prev) =>
                              prev.map((x) => (x.id === row.id ? {...x, actualQty: val }: x))
                            );
                          }}
                          className="h-8 w-20 tabular-mono"
                        />
                      </div>
                      {diff === 0 ? (
                        <Badge variant="success">Khớp sổ sách</Badge>
                      ): diff > 0 ? (
                        <Badge variant="warning">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Tài sản dư chờ xác minh (+{diff})</span>
                        </Badge>
                      ): (
                        <Badge variant="danger">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Thiếu hụt ({diff})</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crud">
          <OfficeChecklistAssetsCrudTab onNotify={setNotice} />
        </TabsContent>
      </Tabs>

      {auditTarget && (
        <AuditActionDialog
          open={Boolean(auditTarget)}
          onOpenChange={(open) => !open && setAuditTarget(null)}
          title={auditTarget.title}
          description={auditTarget.description}
          targetSummary={auditTarget.summary}
          actionCode={auditTarget.code}
          destructive={auditTarget.destructive}
          onConfirm={() => {
            auditTarget.onDone();
            setAuditTarget(null);
          }}
        />
      )}
    </div>
  );
}
