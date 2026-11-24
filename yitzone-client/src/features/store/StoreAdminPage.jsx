import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  PackageCheck,
  QrCode,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  XCircle
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useOrderStore } from "@/stores/order-store";
import { pushAppToast } from "@/stores/toast-store";
import { StoreCatalogCrudTab } from "./StoreCatalogCrudTab";

const INITIAL_ADMIN_ORDERS = [
  {
    id: "adm-ord-1",
    code: "YIT-STR-849514",
    student: "22110345 · Nguyễn Minh Khoa",
    itemsSummary: "1× Áo Polo Khoa CNTT (Size M) + 1× Dây đeo thẻ FIT",
    deliveryLabel: "Giao phòng A3-302 (Khu A, CS1) · Ca 2",
    campaign: "FACULTY_MERCH",
    paymentMethod: "COD",
    total: 235_000,
    status: "PENDING_COD",
    createdAt: "24/11/2026 08:40"
  },
  {
    id: "adm-ord-2",
    code: "YIT-STR-849201",
    student: "23110218 · Nguyễn Hoàng Nam",
    itemsSummary: "1× Áo khoác Hoodie FIT 2026 (Size L, Xanh Navy)",
    deliveryLabel: "Nhận tại Văn phòng Đoàn – Hội (CS1)",
    campaign: "FACULTY_MERCH",
    paymentMethod: "VIETQR",
    total: 320_000,
    status: "PAID",
    createdAt: "23/11/2026 15:12"
  },
  {
    id: "adm-ord-3",
    code: "YIT-STR-849108",
    student: "23110440 · Lê Thảo Nhi",
    itemsSummary: "2× Combo Tiếp sức Ôn thi XTN 2027",
    deliveryLabel: "Giao phòng E2-104 (Khu E, CS1) · Ca 3",
    campaign: "XTN-2027",
    paymentMethod: "VIETQR",
    total: 223_000,
    status: "DELIVERED",
    createdAt: "23/11/2026 10:05"
  },
  {
    id: "adm-ord-4",
    code: "YIT-STR-848112",
    student: "24110095 · Phạm Thảo Vy",
    itemsSummary: "1× Túi Tote Canvas Node-Grid",
    deliveryLabel: "Nhận tại Văn phòng Đoàn – Hội (CS1)",
    campaign: "XTN-2027",
    paymentMethod: "VIETQR",
    total: 80_000,
    status: "PAID_OUT_OF_STOCK",
    createdAt: "22/11/2026 19:22"
  }
];

const INITIAL_RECON = [
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

const INITIAL_SUPPORTS = [
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

const INITIAL_COD = [
  {
    id: "cod-1",
    ctvName: "Lê Quốc Bảo",
    mssv: "22110389",
    ordersCount: 6,
    cashCollected: 1_420_000,
    hoursElapsed: 27,
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

const PRODUCT_FINANCE_ROWS = [
  {
    id: "pf-1",
    name: "Combo Tiếp sức Ôn thi XTN 2027",
    campaign: "XTN-2027",
    soldQty: 92,
    revenue: 10_028_000,
    cost: 4_968_000,
    refund: 0
  },
  {
    id: "pf-2",
    name: "Bánh tráng trộn & Khô gà gây quỹ",
    campaign: "XTN-2027",
    soldQty: 148,
    revenue: 6_212_000,
    cost: 1_972_000,
    refund: 80_000
  },
  {
    id: "pf-3",
    name: "Trà tắc mật ong xí muội (500ml)",
    campaign: "XTN-2027",
    soldQty: 120,
    revenue: 2_400_000,
    cost: 800_000,
    refund: 0
  },
  {
    id: "pf-4",
    name: "Áo khoác Hoodie FIT HCM-UTE 2026",
    campaign: "FACULTY_MERCH",
    soldQty: 34,
    revenue: 10_880_000,
    cost: 6_630_000,
    refund: 0
  },
  {
    id: "pf-5",
    name: "Áo Polo Khoa CNTT & Dây đeo thẻ",
    campaign: "FACULTY_MERCH",
    soldQty: 103,
    revenue: 10_375_000,
    cost: 5_626_000,
    refund: 0
  }
];

function formatVnd(amount) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function orderStatusBadge(status) {
  switch (status) {
    case "PAID":
      return <Badge variant="info">Đã thanh toán · Chờ giao</Badge>;
    case "PENDING_COD":
      return <Badge variant="warning">Chờ thu COD</Badge>;
    case "DELIVERED":
      return <Badge variant="success">Đã giao hàng</Badge>;
    case "PAID_OUT_OF_STOCK":
      return <Badge variant="danger">Hết tồn · Chờ hoàn tiền</Badge>;
  }
}

export function StoreAdminPage() {
  const authorities = useAuthStore((s) => s.authorities);
  const currentUserName = useAuthStore((s) => s.fullName) ?? "Cán bộ trực";
  const currentUserId = useAuthStore((s) => s.userId) ?? "22110456";
  const studentOrders = useOrderStore((s) => s.orders);

  const canManageStoreFinance = hasAnyPermission(authorities, [
    "ROLE_STANDING_COMMITTEE",
    "MOD_STORE_MANAGER",
    "store:manage"
  ]);

  const [adminOrders, setAdminOrders] = useState(INITIAL_ADMIN_ORDERS);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [reconRows, setReconRows] = useState(INITIAL_RECON);
  const [supportRows, setSupportRows] = useState(INITIAL_SUPPORTS);
  const [codRows, setCodRows] = useState(INITIAL_COD);

  const [handoverScan, setHandoverScan] = useState("");
  const [studentCard1D, setStudentCard1D] = useState("");
  const [handoverError, setHandoverError] = useState(null);
  const [shiftLogs, setShiftLogs] = useState([]);

  const [financeScope, setFinanceScope] = useState("XTN-2027");
  const [notice, setNotice] = useState(null);

  const [auditTarget, setAuditTarget] = useState(null);

  // Merge newly placed student orders from order-store with admin order list
  const allOrders = useMemo(() => {
    const existingCodes = new Set(adminOrders.map((o) => o.code));
    const fromStudentStore = studentOrders
      .filter((o) => !existingCodes.has(o.code))
      .map((o) => ({
        id: o.id,
        code: o.code,
        student: `${currentUserId} · ${currentUserName}`,
        itemsSummary: o.itemsSummary,
        deliveryLabel: o.deliveryLabel,
        campaign: o.itemsSummary.toLowerCase().includes("xtn") ? "XTN-2027" : "FACULTY_MERCH",
        paymentMethod: o.paymentMethod,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt
      }));
    return [...fromStudentStore, ...adminOrders];
  }, [adminOrders, studentOrders, currentUserId, currentUserName]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return allOrders.filter((ord) => {
      if (orderStatusFilter !== "ALL" && ord.status !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        ord.code.toLowerCase().includes(q) ||
        ord.student.toLowerCase().includes(q) ||
        ord.itemsSummary.toLowerCase().includes(q)
      );
    });
  }, [allOrders, orderSearch, orderStatusFilter]);

  const pendingPickupOrders = useMemo(
    () => allOrders.filter((o) => o.status === "PAID" || o.status === "PENDING_COD"),
    [allOrders]
  );

  const markOrderStatus = (code, nextStatus) => {
    setAdminOrders((prev) => {
      const exists = prev.some((o) => o.code === code);
      if (exists) {
        return prev.map((o) => (o.code === code ? { ...o, status: nextStatus } : o));
      }
      const matched = allOrders.find((o) => o.code === code);
      return matched ? [{ ...matched, status: nextStatus }, ...prev] : prev;
    });
  };

  const handleConfirmHandover = (e) => {
    e.preventDefault();
    setHandoverError(null);
    const code = handoverScan.trim().toUpperCase();
    const mssv = studentCard1D.trim();
    if (!code) {
      setHandoverError("Vui lòng nhập hoặc chọn mã QR đơn hàng cần phát.");
      return;
    }
    if (!/^\d{6,10}$/.test(mssv)) {
      setHandoverError("Vui lòng nhập MSSV đối chiếu hợp lệ (6–10 chữ số trên thẻ sinh viên).");
      return;
    }

    const matchedOrder = allOrders.find((o) => o.code.toUpperCase() === code);
    const cashAmount = matchedOrder?.paymentMethod === "COD" ? matchedOrder.total : 0;

    if (matchedOrder) {
      markOrderStatus(matchedOrder.code, "DELIVERED");
    }

    if (cashAmount > 0) {
      setCodRows((prev) => {
        const idx = prev.findIndex((r) => r.mssv === currentUserId && !r.signedByTreasurer);
        if (idx >= 0) {
          return prev.map((r, i) =>
            i === idx
              ? { ...r, ordersCount: r.ordersCount + 1, cashCollected: r.cashCollected + cashAmount }
              : r
          );
        }
        return [
          {
            id: `cod-${Date.now()}`,
            ctvName: currentUserName,
            mssv: currentUserId,
            ordersCount: 1,
            cashCollected: cashAmount,
            hoursElapsed: 0,
            signedByTreasurer: false
          },
          ...prev
        ];
      });
    }

    setShiftLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        orderCode: code,
        studentMssv: mssv,
        collectedCash: cashAmount,
        at: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      },
      ...prev
    ]);

    const msg =
      cashAmount > 0
        ? `Đã giao đơn ${code} (MSSV ${mssv}) và cộng ${formatVnd(cashAmount)} vào Phiếu bàn giao COD cuối ca.`
        : `Đã xác nhận giao đơn ${code} (MSSV ${mssv}) thành công.`;
    setNotice(msg);
    pushAppToast({ variant: "success", title: "Xác nhận giao hàng thành công", description: msg });
    setHandoverScan("");
    setStudentCard1D("");
  };

  const handleExportCsvReport = () => {
    const header = ["Mã đơn", "Sinh viên", "Sản phẩm", "Hình thức nhận", "Thanh toán", "Tổng tiền (VNĐ)", "Trạng thái", "Thời gian"];
    const rows = allOrders.map((o) => [
      o.code,
      o.student,
      o.itemsSummary,
      o.deliveryLabel,
      o.paymentMethod,
      String(o.total),
      o.status,
      o.createdAt
    ]);
    const csvContent =
      "\uFEFF" +
      [header, ...rows]
        .map((cols) => cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yitzone-store-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushAppToast({
      variant: "success",
      title: "Đã tải xuống báo cáo Cửa hàng",
      description: `Xuất ${allOrders.length} đơn hàng định dạng CSV tương thích Excel (UTF-8).`
    });
  };

  const financeRows = useMemo(
    () =>
      financeScope === "ALL"
        ? PRODUCT_FINANCE_ROWS
        : PRODUCT_FINANCE_ROWS.filter((r) => r.campaign === financeScope),
    [financeScope]
  );

  const financeTotals = useMemo(() => {
    const revenue = financeRows.reduce((s, r) => s + r.revenue, 0);
    const cost = financeRows.reduce((s, r) => s + r.cost, 0);
    const refund = financeRows.reduce((s, r) => s + r.refund, 0);
    return { revenue, cost, refund, net: revenue - cost - refund };
  }, [financeRows]);

  const overdueCodCount = codRows.filter((r) => r.hoursElapsed > 24 && !r.signedByTreasurer).length;
  const unsignedCodTotal = codRows
    .filter((r) => !r.signedByTreasurer)
    .reduce((sum, r) => sum + r.cashCollected, 0);
  const pendingActionCount =
    reconRows.filter((r) => r.status === "PENDING_MANUAL").length +
    supportRows.filter((r) => r.status === "OPEN").length;
  const totalOrderRevenue = allOrders
    .filter((o) => o.status !== "PAID_OUT_OF_STOCK")
    .reduce((sum, o) => sum + o.total, 0);

  const orderCols = [
    {
      key: "code",
      header: "Mã đơn",
      render: (r) => (
        <div>
          <div className="tabular-mono font-semibold text-foreground">{r.code}</div>
          <div className="tabular-mono text-xs text-muted-foreground">{r.createdAt}</div>
        </div>
      )
    },
    {
      key: "student",
      header: "Sinh viên & Vật phẩm",
      render: (r) => (
        <div className="max-w-xs space-y-0.5">
          <div className="text-xs font-medium text-foreground">{r.student}</div>
          <div className="truncate text-xs text-muted-foreground">{r.itemsSummary}</div>
        </div>
      )
    },
    {
      key: "method",
      header: "Thanh toán",
      render: (r) => <Badge variant="outline">{r.paymentMethod}</Badge>
    },
    {
      key: "total",
      header: "Tổng tiền",
      align: "right",
      render: (r) => <span className="tabular-mono font-semibold">{formatVnd(r.total)}</span>
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => orderStatusBadge(r.status)
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => setSelectedOrder(r)}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Chi tiết</span>
          </Button>
          {(r.status === "PAID" || r.status === "PENDING_COD") && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                markOrderStatus(r.code, "DELIVERED");
                setNotice(`Đã chuyển đơn ${r.code} sang trạng thái Đã giao hàng.`);
              }}
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Đã giao</span>
            </Button>
          )}
        </div>
      )
    }
  ];

  const reconCols = [
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
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              className="rounded-full"
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
                      prev.map((x) => (x.id === r.id ? { ...x, status: "APPROVED" } : x))
                    );
                    setNotice(`Đã gạch nợ đơn ${r.orderCode}, cấp QR nhận hàng và lưu Audit Log.`);
                  }
                })
              }
            >
              Duyệt sao kê
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-status-danger"
              onClick={() =>
                setAuditTarget({
                  title: "Từ chối Đối soát Thủ công",
                  description: "Ghi rõ lý do không khớp sao kê để thông báo lại cho sinh viên.",
                  summary: `${r.orderCode} · ${formatVnd(r.amount)}`,
                  code: "STORE_MANUAL_RECONCILE_REJECT",
                  destructive: true,
                  onDone: () => {
                    setReconRows((prev) =>
                      prev.map((x) => (x.id === r.id ? { ...x, status: "REJECTED" } : x))
                    );
                    setNotice(`Đã từ chối đối soát đơn ${r.orderCode} và lưu Audit Log.`);
                  }
                })
              }
            >
              Từ chối
            </Button>
          </div>
        ) : r.status === "WEBHOOK_REJECTED_401" ? (
          <Badge variant="danger">
            <ShieldAlert className="h-3 w-3" />
            <span>401 Chặn chữ ký sai</span>
          </Badge>
        ) : r.status === "REJECTED" ? (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3" />
            <span>Đã từ chối</span>
          </Badge>
        ) : (
          <Badge variant="success">Đã gạch nợ</Badge>
        )
    }
  ];

  const supportCols = [
    { key: "code", header: "Mã đơn", render: (r) => <span className="tabular-mono font-medium">{r.orderCode}</span> },
    { key: "student", header: "Sinh viên", render: (r) => <span className="text-xs">{r.student}</span> },
    {
      key: "type",
      header: "Yêu cầu",
      render: (r) => (
        <Badge variant={r.requestType === "Hoàn tiền" ? "warning" : "info"}>{r.requestType}</Badge>
      )
    },
    { key: "reason", header: "Chi tiết", render: (r) => <span className="text-xs">{r.reason}</span> },
    {
      key: "action",
      header: "Xử lý",
      align: "right",
      render: (r) =>
        r.status === "OPEN" ? (
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() =>
                setAuditTarget({
                  title: `Chấp nhận ${r.requestType} — ${r.orderCode}`,
                  description:
                    r.requestType === "Hoàn tiền"
                      ? "Đính kèm mã giao dịch hoàn tiền trong lý do; hệ thống tự động hoàn nhập kho và trừ lợi nhuận quỹ."
                      : "Hệ thống tự động cân bằng tồn kho giữa 2 size cho đơn chưa giao.",
                  summary: `${r.orderCode} · ${r.student}`,
                  code: r.requestType === "Hoàn tiền" ? "STORE_REFUND_APPROVE" : "STORE_CHANGE_SIZE_APPROVE",
                  destructive: r.requestType === "Hoàn tiền",
                  onDone: () => {
                    setSupportRows((prev) =>
                      prev.map((x) => (x.id === r.id ? { ...x, status: "RESOLVED" } : x))
                    );
                    setNotice(`Đã xử lý yêu cầu ${r.requestType} cho đơn ${r.orderCode} và ghi Audit Log.`);
                  }
                })
              }
            >
              Phê duyệt
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-status-danger hover:bg-status-danger/10"
              onClick={() =>
                setAuditTarget({
                  title: `Từ chối yêu cầu ${r.requestType} — ${r.orderCode}`,
                  description: "Ghi rõ lý do từ chối để phản hồi minh bạch cho sinh viên.",
                  summary: `${r.orderCode} · ${r.student}`,
                  code: "STORE_SUPPORT_REJECT",
                  destructive: true,
                  onDone: () => {
                    setSupportRows((prev) =>
                      prev.map((x) => (x.id === r.id ? { ...x, status: "REJECTED" } : x))
                    );
                    setNotice(`Đã từ chối yêu cầu hỗ trợ đơn ${r.orderCode}.`);
                  }
                })
              }
            >
              Từ chối
            </Button>
          </div>
        ) : r.status === "REJECTED" ? (
          <Badge variant="secondary">Đã từ chối</Badge>
        ) : (
          <Badge variant="success">Đã hoàn tất</Badge>
        )
    }
  ];

  const codCols = [
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
        ) : (
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
        ) : (
          <Button
            size="sm"
            className="rounded-full"
            onClick={() =>
              setAuditTarget({
                title: "Ký nhận Phiếu Bàn giao Tiền mặt COD",
                description: "Xác nhận đã kiểm đếm đủ tiền mặt thực tế từ CTV cuối ca trực.",
                summary: `${r.ctvName} (${r.mssv}) · ${formatVnd(r.cashCollected)}`,
                code: "STORE_COD_HANDOVER_SIGN",
                destructive: false,
                onDone: () => {
                  setCodRows((prev) =>
                    prev.map((x) => (x.id === r.id ? { ...x, signedByTreasurer: true } : x))
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

  const financeCols = [
    { key: "name", header: "Sản phẩm", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    {
      key: "campaign",
      header: "Đợt bán",
      render: (r) => (
        <Badge variant={r.campaign === "XTN-2027" ? "calDeadline" : "secondary"}>
          {r.campaign === "XTN-2027" ? "Gây quỹ XTN 2027" : "Vật phẩm Khoa"}
        </Badge>
      )
    },
    { key: "sold", header: "SL bán", align: "right", render: (r) => <span className="tabular-mono">{r.soldQty}</span> },
    { key: "rev", header: "Doanh thu", align: "right", render: (r) => <span className="tabular-mono">{formatVnd(r.revenue)}</span> },
    { key: "cost", header: "Giá vốn + Hoàn", align: "right", render: (r) => <span className="tabular-mono text-muted-foreground">{formatVnd(r.cost + r.refund)}</span> },
    {
      key: "net",
      header: "Thực thu (Lãi)",
      align: "right",
      render: (r) => (
        <span className="tabular-mono font-semibold text-primary">
          {formatVnd(r.revenue - r.cost - r.refund)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Quản trị Cửa hàng, VietQR &amp; Bàn giao COD
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý đơn hàng sinh viên, đối soát sao kê VietQR, phát vật phẩm tại bàn trực, ký nhận tiền mặt COD và danh mục sản phẩm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/staff/store-booth">
              <ScanLine className="h-4 w-4 text-primary" />
              <span>Quầy phát hàng Di động</span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/store">
              <ExternalLink className="h-4 w-4" />
              <span>Xem Cửa hàng</span>
            </Link>
          </Button>
          <Button size="sm" className="rounded-full" onClick={handleExportCsvReport}>
            <Download className="h-4 w-4" />
            <span>Xuất báo cáo CSV</span>
          </Button>
        </div>
      </div>

      {/* Live Operational KPI Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng đơn hàng đang theo dõi</CardDescription>
            <CardTitle className="tabular-mono text-2xl text-foreground">
              {allOrders.length} đơn
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {pendingPickupOrders.length} đơn đang chờ phát vật phẩm
          </CardContent>
        </Card>

        <Card className={pendingActionCount > 0 ? "border-status-warning/35" : undefined}>
          <CardHeader className="pb-2">
            <CardDescription>Cần Thủ quỹ xử lý</CardDescription>
            <CardTitle className="tabular-mono text-2xl text-status-warning">
              {pendingActionCount} mục
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Đối soát VietQR thủ công &amp; yêu cầu đổi size/hoàn tiền
          </CardContent>
        </Card>

        <Card className={overdueCodCount > 0 ? "border-status-danger/35" : undefined}>
          <CardHeader className="pb-2">
            <CardDescription>Tiền COD chờ bàn giao</CardDescription>
            <CardTitle className="tabular-mono text-2xl text-foreground">
              {formatVnd(unsignedCodTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {overdueCodCount > 0 ? (
              <span className="font-semibold text-status-danger">{overdueCodCount} phiếu quá hạn &gt; 24h</span>
            ) : (
              "Tất cả phiếu COD trong hạn 24h"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Giá trị đơn hợp lệ</CardDescription>
            <CardTitle className="tabular-mono text-2xl text-primary">
              {formatVnd(totalOrderRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Đồng bộ cả đơn mới sinh viên vừa đặt
          </CardContent>
        </Card>
      </div>

      {overdueCodCount > 0 && (
        <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-status-danger/35 bg-status-danger/10 px-4 py-3 text-xs font-semibold text-status-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            CẢNH BÁO: Có {overdueCodCount} phiếu thu tiền mặt COD quá 24 giờ chưa bàn giao cho Thủ quỹ.
          </span>
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
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

      <Tabs defaultValue="orders" className="space-y-5">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders">
            Đơn hàng ({allOrders.length})
          </TabsTrigger>
          {canManageStoreFinance && (
            <TabsTrigger value="reconcile">
              Đối soát &amp; Hỗ trợ {pendingActionCount > 0 ? `(${pendingActionCount})` : ""}
            </TabsTrigger>
          )}
          <TabsTrigger value="cod">Bàn Phát hàng &amp; COD</TabsTrigger>
          {canManageStoreFinance && (
            <TabsTrigger value="finance">Lợi nhuận Quỹ &amp; Giá vốn</TabsTrigger>
          )}
          {canManageStoreFinance && (
            <TabsTrigger value="catalog">Danh mục, Sản phẩm &amp; Voucher</TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: ORDERS MANAGEMENT */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Tìm mã đơn, MSSV, tên sản phẩm..."
                className="h-10 rounded-full pl-9 text-sm"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={orderStatusFilter}
                onValueChange={(v) => setOrderStatusFilter(v)}
              >
                <SelectTrigger className="h-10 rounded-full px-4">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="PAID">Đã thanh toán · Chờ giao</SelectItem>
                  <SelectItem value="PENDING_COD">Chờ thu COD</SelectItem>
                  <SelectItem value="DELIVERED">Đã giao hàng</SelectItem>
                  <SelectItem value="PAID_OUT_OF_STOCK">Hết tồn · Chờ hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable columns={orderCols} data={filteredOrders} />
        </TabsContent>

        {/* TAB 2: VIETQR RECONCILIATION & SUPPORT */}
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

        {/* TAB 3: PICKUP HANDOVER & COD */}
        <TabsContent value="cod" className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-brand-cyan" />
                <span>Bàn Phát vật phẩm (Quét QR Đơn hàng / Mã vạch Thẻ SV)</span>
              </CardTitle>
              <CardDescription>
                Xác nhận giao hàng, chuyển trạng thái đơn sang Đã giao và tự động cộng tiền mặt COD vào Phiếu bàn giao cuối ca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingPickupOrders.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-muted-foreground">Chọn nhanh đơn chờ phát:</span>
                  {pendingPickupOrders.slice(0, 4).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => {
                        setHandoverScan(ord.code);
                        const mssvMatch = ord.student.match(/\d{6,10}/);
                        if (mssvMatch?.[0]) setStudentCard1D(mssvMatch[0]);
                        setHandoverError(null);
                      }}
                      className="tabular-mono rounded-full border border-border bg-muted/40 px-3 py-1 font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {ord.code} ({ord.paymentMethod})
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleConfirmHandover} className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="order-qr">Mã QR Đơn hàng</Label>
                  <Input
                    id="order-qr"
                    value={handoverScan}
                    onChange={(e) => {
                      setHandoverScan(e.target.value);
                      if (handoverError) setHandoverError(null);
                    }}
                    placeholder="VD: YIT-STR-849514"
                    className="tabular-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sv-card-1d">MSSV trên Thẻ SV đối chiếu</Label>
                  <Input
                    id="sv-card-1d"
                    value={studentCard1D}
                    onChange={(e) => {
                      setStudentCard1D(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (handoverError) setHandoverError(null);
                    }}
                    inputMode="numeric"
                    placeholder="VD: 22110345"
                    className="tabular-mono"
                  />
                </div>
                <Button type="submit" className="rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác nhận Đã giao &amp; Thu COD</span>
                </Button>
              </form>

              {handoverError && (
                <p role="alert" className="text-xs font-medium text-status-danger">
                  {handoverError}
                </p>
              )}

              {shiftLogs.length > 0 && (
                <div className="space-y-2 border-t border-border/70 pt-3">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Nhật ký phát hàng trong ca này ({shiftLogs.length})
                  </div>
                  <div className="space-y-1.5">
                    {shiftLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/25 px-3 py-2 text-xs"
                      >
                        <span className="tabular-mono font-semibold text-foreground">
                          {log.orderCode} · MSSV {log.studentMssv}
                        </span>
                        <span className="tabular-mono text-muted-foreground">
                          {log.collectedCash > 0 ? `Thu COD ${formatVnd(log.collectedCash)}` : "Đã thanh toán VietQR"} · {log.at}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

        {/* TAB 4: FINANCE & PROFIT BREAKDOWN */}
        <TabsContent value="finance" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs">
            <span className="font-medium text-foreground">
              Phạm vi hạch toán: tách biệt doanh thu <strong>Đợt Gây quỹ</strong> và <strong>Vật phẩm thường trực Khoa</strong>.
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={financeScope}
                onValueChange={(v) => setFinanceScope(v)}
              >
                <SelectTrigger className="h-8 w-52 rounded-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XTN-2027">Đợt Gây quỹ XTN 2027</SelectItem>
                  <SelectItem value="FACULTY_MERCH">Vật phẩm Khoa Thường trực</SelectItem>
                  <SelectItem value="ALL">Tổng hợp toàn Cửa hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tổng doanh thu thực thu</CardDescription>
                <CardTitle className="tabular-mono text-2xl">{formatVnd(financeTotals.revenue)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Không cộng phí giao phòng học (hạch toán riêng cho đội giao nhận).
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tổng Giá vốn &amp; Hoàn tiền</CardDescription>
                <CardTitle className="tabular-mono text-2xl">
                  {formatVnd(financeTotals.cost + financeTotals.refund)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Giá vốn: {formatVnd(financeTotals.cost)} · Hoàn tiền: {formatVnd(financeTotals.refund)}.
              </CardContent>
            </Card>
            <Card className="border-primary/35 bg-primary/5">
              <CardHeader className="pb-2">
                <CardDescription className="text-primary font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    {financeScope === "XTN-2027" ? "Số tiền thực góp vào quỹ XTN" : "Lợi nhuận ròng"}
                  </span>
                </CardDescription>
                <CardTitle className="tabular-mono text-2xl text-primary">
                  {formatVnd(financeTotals.net)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Hạch toán minh bạch sau trừ giá vốn &amp; hoàn tiền.
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-lg font-medium text-foreground">
              Chi tiết Hạch toán theo Sản phẩm
            </h2>
            <DataTable columns={financeCols} data={financeRows} />
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-brand-navy dark:text-brand-cyan" />
                  <span>Tài khoản Ngân hàng Tổ chức đang gắn VietQR</span>
                </CardTitle>
                <VerifiedBadge label="Đã được BTV phê duyệt" />
              </div>
              <CardDescription>
                Mọi chiến dịch gây quỹ bắt buộc gắn tài khoản đứng tên tổ chức Đoàn – Hội Khoa CNTT đã qua BTV duyệt.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Ngân hàng thụ hưởng</div>
                <div className="tabular-mono font-semibold text-foreground">
                  Vietcombank · 1029 8844 2026
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Chủ tài khoản</div>
                <div className="font-semibold text-foreground">
                  DOAN KHOA CONG NGHE THONG TIN HCMUTE
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: CATALOG, PRODUCTS & VOUCHERS */}
        <TabsContent value="catalog">
          <StoreCatalogCrudTab onNotify={setNotice} />
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span className="tabular-mono">{selectedOrder.code}</span>
                </DialogTitle>
                <DialogDescription>{selectedOrder.student}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trạng thái</span>
                  {orderStatusBadge(selectedOrder.status)}
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5">
                  <div>
                    <span className="font-semibold text-foreground">Sản phẩm: </span>
                    <span className="text-muted-foreground">{selectedOrder.itemsSummary}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Giao nhận: </span>
                    <span className="text-muted-foreground">{selectedOrder.deliveryLabel}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Thanh toán: </span>
                    <span className="tabular-mono text-muted-foreground">
                      {selectedOrder.paymentMethod} · {formatVnd(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setSelectedOrder(null)}>
                  Đóng
                </Button>
                {(selectedOrder.status === "PAID" || selectedOrder.status === "PENDING_COD") && (
                  <Button
                    type="button"
                    className="rounded-full"
                    onClick={() => {
                      markOrderStatus(selectedOrder.code, "DELIVERED");
                      setNotice(`Đã chuyển đơn ${selectedOrder.code} sang Đã giao hàng.`);
                      setSelectedOrder(null);
                    }}
                  >
                    <PackageCheck className="h-4 w-4" />
                    <span>Đánh dấu Đã giao</span>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
