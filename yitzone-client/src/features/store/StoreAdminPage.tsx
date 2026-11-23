import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Download,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { StoreCatalogCrudTab } from "./StoreCatalogCrudTab";

interface ReconciliationRow {
  id: string;
  orderCode: string;
  student: string;
  amount: number;
  channel: string;
  issue: string;
  status: "PENDING_MANUAL" | "WEBHOOK_REJECTED_401" | "APPROVED";
}

interface SupportTicketRow {
  id: string;
  orderCode: string;
  student: string;
  requestType: "Đổi size (L → XL)" | "Hoàn tiền";
  reason: string;
  status: "OPEN" | "RESOLVED";
}

interface CodHandoverRow {
  id: string;
  ctvName: string;
  mssv: string;
  ordersCount: number;
  cashCollected: number;
  hoursElapsed: number;
  signedByTreasurer: boolean;
}

const INITIAL_RECON: ReconciliationRow[] = [
  {
    id: "rc-1",
    orderCode: "YIT-STR-849300",
    student: "22110412 · Võ Gia Huy",
    amount: 320_000,
    channel: "Chuyển khoản sai nội dung",
    issue: "Có ảnh biên lai tham chiếu · Chờ Thủ quỹ đối chiếu sao kê thực tế",
    status: "PENDING_MANUAL"
  },
  {
    id: "rc-2",
    orderCode: "YIT-STR-849199",
    student: "Webhook SePay",
    amount: 185_000,
    channel: "Webhook HMAC-SHA256",
    issue: "Từ chối 401 — Chữ ký số không khớp (Đã ghi Audit Log)",
    status: "WEBHOOK_REJECTED_401"
  }
];

const INITIAL_SUPPORTS: SupportTicketRow[] = [
  {
    id: "sp-1",
    orderCode: "YIT-STR-849201",
    student: "23110218 · Nguyễn Hoàng Nam",
    requestType: "Đổi size (L → XL)",
    reason: "Đơn chưa giao, xin đổi sang XL (Tự động cân bằng tồn 2 size)",
    status: "OPEN"
  },
  {
    id: "sp-2",
    orderCode: "YIT-STR-848112",
    student: "24110095 · Phạm Thảo Vy",
    requestType: "Hoàn tiền",
    reason: "Tiền về sau 15 phút khi hết tồn kho Túi Tote · Hoàn 80.000đ",
    status: "OPEN"
  }
];

const INITIAL_COD: CodHandoverRow[] = [
  {
    id: "cod-1",
    ctvName: "Lê Quốc Bảo",
    mssv: "22110389",
    ordersCount: 6,
    cashCollected: 1_420_000,
    hoursElapsed: 27, // > 24h red alert!
    signedByTreasurer: false
  },
  {
    id: "cod-2",
    ctvName: "Trần Thị Minh Anh",
    mssv: "23110142",
    ordersCount: 4,
    cashCollected: 860_000,
    hoursElapsed: 5,
    signedByTreasurer: false
  }
];

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function StoreAdminPage(){
  const authorities = useAuthStore((s) => s.authorities);
  const canManageStoreFinance = hasAnyPermission(authorities, [
    "ROLE_STANDING_COMMITTEE",
    "MOD_STORE_MANAGER",
    "store:manage"
  ]);
  const [reconRows, setReconRows] = useState<ReconciliationRow[]>(INITIAL_RECON);
  const [supportRows, setSupportRows] = useState<SupportTicketRow[]>(INITIAL_SUPPORTS);
  const [codRows, setCodRows] = useState<CodHandoverRow[]>(INITIAL_COD);
  const [handoverScan, setHandoverScan] = useState("YIT-STR-849514");
  const [studentCard1D, setStudentCard1D] = useState("22110345");
  const [notice, setNotice] = useState<string | null>(null);

  const [auditTarget, setAuditTarget] = useState<{
    title: string;
    description: string;
    summary: string;
    code: string;
    destructive?: boolean;
    onDone: () => void;
  } | null>(null);

  const reconCols: DataTableColumn<ReconciliationRow>[] = [
    { key: "code", header: "Mã đơn", render: (r) => <span className="tabular-mono font-medium">{r.orderCode}</span> },
    { key: "student", header: "Nguồn / Sinh viên", render: (r) => <span className="text-xs">{r.student}</span> },
    { key: "amount", header: "Số tiền", align: "right", render: (r) => <span className="tabular-mono font-semibold">{formatVnd(r.amount)}</span> },
    { key: "issue", header: "Trạng thái Đối soát", render: (r) => <span className="text-xs">{r.issue}</span> },
    {
      key: "action",
      header: "Thao tác Thủ quỹ",
      align: "right",
      render: (r) =>
        r.status === "PENDING_MANUAL" ? (
          <Button
            size="sm"
            onClick={() =>
              setAuditTarget({
                title: "Duyệt Sao kê Ngân hàng Thủ công",
                description:
                  "Xác nhận đã đối chiếu sao kê tài khoản ngân hàng tổ chức thực tế (không chỉ dựa vào ảnh biên lai).",
                summary: `${r.orderCode} · ${formatVnd(r.amount)}`,
                code: "STORE_MANUAL_RECONCILE_APPROVE",
                destructive: false,
                onDone: () => {
                  setReconRows((prev) =>
                    prev.map((x) => (x.id === r.id ? {...x, status: "APPROVED" }: x))
                  );
                  setNotice(`Đã gạch nợ đơn ${r.orderCode}, cấp QR nhận hàng và lưu Audit Log.`);
                }
              })
            }
          >
            Duyệt theo sao kê
          </Button>
        ): r.status === "WEBHOOK_REJECTED_401" ? (
          <Badge variant="danger">
            <ShieldAlert className="h-3 w-3" />
            <span>401 Chặn chữ ký sai</span>
          </Badge>
        ): (
          <Badge variant="success">Đã gạch nợ</Badge>
        )
    }
  ];

  const supportCols: DataTableColumn<SupportTicketRow>[] = [
    { key: "code", header: "Mã đơn", render: (r) => <span className="tabular-mono font-medium">{r.orderCode}</span> },
    { key: "student", header: "Sinh viên", render: (r) => <span className="text-xs">{r.student}</span> },
    {
      key: "type",
      header: "Yêu cầu",
      render: (r) => (
        <Badge variant={r.requestType === "Hoàn tiền" ? "warning": "info"}>{r.requestType}</Badge>
      )
    },
    { key: "reason", header: "Chi tiết", render: (r) => <span className="text-xs">{r.reason}</span> },
    {
      key: "action",
      header: "Xử lý",
      align: "right",
      render: (r) =>
        r.status === "OPEN" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setAuditTarget({
                title: `Chấp nhận ${r.requestType} — ${r.orderCode}`,
                description:
                  r.requestType === "Hoàn tiền"
                    ? "Đính kèm mã giao dịch hoàn tiền trong lý do; hệ thống tự động hoàn nhập kho và trừ lợi nhuận quỹ."
: "Hệ thống tự động cân bằng tồn kho giữa 2 size cho đơn chưa giao.",
                summary: `${r.orderCode} · ${r.student}`,
                code: r.requestType === "Hoàn tiền" ? "STORE_REFUND_APPROVE": "STORE_CHANGE_SIZE_APPROVE",
                destructive: r.requestType === "Hoàn tiền",
                onDone: () => {
                  setSupportRows((prev) =>
                    prev.map((x) => (x.id === r.id ? {...x, status: "RESOLVED" }: x))
                  );
                  setNotice(`Đã xử lý yêu cầu ${r.requestType} cho đơn ${r.orderCode} và ghi Audit Log.`);
                }
              })
            }
          >
            Phê duyệt
          </Button>
        ): (
          <Badge variant="success">Đã hoàn tất</Badge>
        )
    }
  ];

  const codCols: DataTableColumn<CodHandoverRow>[] = [
    {
      key: "ctv",
      header: "CTV Thu COD",
      render: (r) => (
        <div>
          <div className="font-medium">{r.ctvName}</div>
          <div className="tabular-mono text-xs text-muted-foreground">{r.mssv}</div>
        </div>
      )
    },
    { key: "orders", header: "Số đơn COD", render: (r) => <span className="tabular-mono">{r.ordersCount} đơn</span> },
    {
      key: "cash",
      header: "Tiền mặt cần bàn giao",
      align: "right",
      render: (r) => <span className="tabular-mono font-semibold text-foreground">{formatVnd(r.cashCollected)}</span>
    },
    {
      key: "sla",
      header: "Thời gian giữ tiền",
      render: (r) =>
        r.hoursElapsed > 24 && !r.signedByTreasurer ? (
          <Badge variant="danger">
            <AlertTriangle className="h-3 w-3" />
            <span className="tabular-mono">Quá hạn {r.hoursElapsed}h (&gt; 24h)</span>
          </Badge>
        ): (
          <span className="tabular-mono text-xs text-muted-foreground">{r.hoursElapsed} giờ</span>
        )
    },
    {
      key: "action",
      header: "Thủ quỹ Ký nhận",
      align: "right",
      render: (r) =>
        r.signedByTreasurer ? (
          <Badge variant="success">Đã ký nhận tiền mặt</Badge>
        ): (
          <Button
            size="sm"
            onClick={() =>
              setAuditTarget({
                title: "Ký nhận Phiếu Bàn giao Tiền mặt COD",
                description: "Xác nhận đã kiểm đếm đủ tiền mặt thực tế từ CTV cuối ca trực.",
                summary: `${r.ctvName} (${r.mssv}) · ${formatVnd(r.cashCollected)}`,
                code: "STORE_COD_HANDOVER_SIGN",
                destructive: false,
                onDone: () => {
                  setCodRows((prev) =>
                    prev.map((x) => (x.id === r.id ? {...x, signedByTreasurer: true }: x))
                  );
                  setNotice(`Thủ quỹ đã ký nhận ${formatVnd(r.cashCollected)} từ ${r.ctvName} (Audit Log).`);
                }
              })
            }
          >
            Ký nhận COD
          </Button>
        )
    }
  ];

  const overdueCodCount = codRows.filter((r) => r.hoursElapsed > 24 && !r.signedByTreasurer).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground">
            Quản trị Cửa hàng, VietQR &amp; Bàn giao COD
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đối soát thanh toán VietQR tự động, quét giao hàng tại bàn trực, ký nhận phiếu tiền mặt COD và xuất báo
            cáo 3 sheet.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setNotice(
              "Đã xuất Báo cáo Excel 3 Sheet: (1) Tổng hợp đặt may theo Size, (2) Danh sách giao nhận theo Cơ sở/Tòa nhà/Ca học, (3) Sao kê tài chính."
            )
          }
        >
          <Download className="h-4 w-4" />
          <span>Xuất Excel 3 Sheet</span>
        </Button>
      </div>

      {overdueCodCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-status-danger/35 bg-status-danger/10 px-4 py-3 text-xs font-semibold text-status-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            CẢNH BÁO ĐỎ: Có {overdueCodCount} phiếu thu tiền mặt COD quá 24 giờ chưa bàn giao cho Thủ quỹ (Đã gửi
            cảnh báo tới Thủ quỹ, Trưởng Ban OFIT và BTV).
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

      <Tabs defaultValue={canManageStoreFinance ? "reconcile" : "cod"} className="space-y-5">
        <TabsList>
          {canManageStoreFinance && (
            <TabsTrigger value="reconcile">Đối soát VietQR &amp; Hỗ trợ Đơn</TabsTrigger>
          )}
          <TabsTrigger value="cod">Bàn Phát hàng &amp; Phiếu COD</TabsTrigger>
          {canManageStoreFinance && (
            <TabsTrigger value="finance">Lợi nhuận Quỹ &amp; Giá vốn</TabsTrigger>
          )}
          {canManageStoreFinance && (
            <TabsTrigger value="catalog">Danh mục, Sản phẩm &amp; Voucher</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="reconcile" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-medium text-foreground">
              Hàng chờ Đối soát VietQR &amp; Nhật ký Thanh toán Tự động
            </h2>
            <DataTable columns={reconCols} data={reconRows} />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-lg font-medium text-foreground">
              Yêu cầu Hỗ trợ Đơn hàng (Đổi Size / Hoàn tiền)
            </h2>
            <DataTable columns={supportCols} data={supportRows} />
          </div>
        </TabsContent>

        <TabsContent value="cod" className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-brand-cyan" />
                <span>Bàn Phát vật phẩm (Quét QR Đơn hàng / Mã vạch 1D Thẻ SV)</span>
              </CardTitle>
              <CardDescription>
                Xác nhận giao hàng và chuyển đơn sang trạng thái Đã giao &amp; Đã thu tiền mặt (tự cộng vào Phiếu bàn giao cuối ca).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="order-qr">Mã QR Đơn hàng</Label>
                <Input
                  id="order-qr"
                  value={handoverScan}
                  onChange={(e) => setHandoverScan(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sv-card-1d">Mã vạch 1D Thẻ SV đối chiếu</Label>
                <Input
                  id="sv-card-1d"
                  value={studentCard1D}
                  onChange={(e) => setStudentCard1D(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <Button
                onClick={() =>
                  setNotice(
                    `Đã giao đơn ${handoverScan} (đối chiếu MSSV ${studentCard1D}) và ghi nhận vào Phiếu bàn giao COD cuối ca.`
                  )
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Xác nhận Đã giao &amp; Thu COD</span>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h2 className="font-display text-lg font-medium text-foreground flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              <span>Phiếu Bàn giao Tiền mặt Cuối ca</span>
            </h2>
            <DataTable columns={codCols} data={codRows} />
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-xs">
            <span className="font-medium text-foreground">
              Phạm vi hạch toán: <strong>Đợt Gây quỹ Xuân Tình Nguyện 2027 (XTN-2027)</strong> · Tách biệt với
              doanh thu Vật phẩm thường trực của Khoa.
            </span>
            <Badge variant="calDeadline">Hạn chót: 25/11/2026</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tổng doanh thu thực thu (Đợt XTN)</CardDescription>
                <CardTitle className="tabular-mono text-2xl">18.640.000đ</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Không cộng phí giao phòng học (phí ship hạch toán riêng: 310.000đ).
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tổng Giá vốn sản xuất &amp; Hoàn tiền</CardDescription>
                <CardTitle className="tabular-mono text-2xl">7.820.000đ</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Giá vốn hàng đã giao/chốt xuất: 7.740.000đ · Hoàn tiền thực tế: 80.000đ.
              </CardContent>
            </Card>
            <Card className="border-primary/35 bg-primary/5">
              <CardHeader className="pb-2">
                <CardDescription className="text-primary font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span>Số tiền thực góp vào quỹ XTN</span>
                </CardDescription>
                <CardTitle className="tabular-mono text-2xl text-primary">10.820.000đ</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Hạch toán minh bạch sau trừ giá vốn &amp; hoàn tiền cho chiến dịch Xuân Tình Nguyện 2027.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-navy" />
                  <span>Tài khoản Ngân hàng Tổ chức &amp; Cấu hình Voucher</span>
                </CardTitle>
                <VerifiedBadge label="Đã được BTV phê duyệt" />
              </div>
              <CardDescription>
                Mọi chiến dịch gây quỹ bắt buộc gắn tài khoản đứng tên tổ chức Đoàn – Hội Khoa CNTT đã qua BTV duyệt.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Voucher đang mở</div>
                <div className="tabular-mono font-semibold text-foreground">
                  YIT20K · Giảm 20.000đ (Đơn ≥ 200k · Còn 48/100 lượt · 1 lượt/SV)
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Voucher phí giao phòng</div>
                <div className="tabular-mono font-semibold text-foreground">
                  FREESHIP · Miễn phí giao phòng 5.000đ (Còn 112/200 lượt)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <StoreCatalogCrudTab onNotify={setNotice} />
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
