import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  ArrowLeft,
  HelpCircle,
  Lock,
  QrCode,
  Upload
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type OrderStatus = "PAID" | "PENDING_COD" | "DELIVERED" | "PAID_OUT_OF_STOCK";

interface StudentOrder {
  id: string;
  code: string;
  itemsSummary: string;
  deliveryLabel: string;
  total: number;
  paymentMethod: "VIETQR" | "COD";
  status: OrderStatus;
  deadlineNote?: string;
  supportSubmitted?: string;
}

const INITIAL_ORDERS: StudentOrder[] = [
  {
    id: "ord-1",
    code: "YIT-STR-849201",
    itemsSummary: "1× Áo Hoodie FIT 2026 (Size L, Xanh Navy)",
    deliveryLabel: "Nhận tại Văn phòng CS1 (A1-204)",
    total: 300_000,
    paymentMethod: "VIETQR",
    status: "PAID"
  },
  {
    id: "ord-2",
    code: "YIT-STR-849514",
    itemsSummary: "1× Áo Polo YITZone (Size M) + 1× Dây đeo thẻ FIT",
    deliveryLabel: "Giao phòng học A3-302 (CS1)",
    total: 235_000,
    paymentMethod: "COD",
    status: "PENDING_COD",
    deadlineNote: "Hạn nhận hàng: 24/11/2026 (03 ngày làm việc)"
  },
  {
    id: "ord-3",
    code: "YIT-STR-848112",
    itemsSummary: "1× Túi Tote Canvas Node-Grid",
    deliveryLabel: "Nhận tại Văn phòng CS1",
    total: 80_000,
    paymentMethod: "VIETQR",
    status: "PAID_OUT_OF_STOCK"
  }
];

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function StoreOrdersPage() {
  const [orders, setOrders] = useState<StudentOrder[]>(INITIAL_ORDERS);
  const [qrOrder, setQrOrder] = useState<StudentOrder | null>(null);
  const [supportOrder, setSupportOrder] = useState<StudentOrder | null>(null);
  const [supportType, setSupportType] = useState("CHANGE_SIZE");
  const [supportReason, setSupportReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmitSupport = () => {
    if (!supportOrder || supportReason.trim().length < 8) return;
    const typeLabel =
      supportType === "CHANGE_SIZE"
        ? "Đổi size"
        : supportType === "CHANGE_MODEL"
          ? "Đổi mẫu"
          : "Trả hàng & Hoàn tiền";
    setOrders((prev) =>
      prev.map((o) => (o.id === supportOrder.id ? { ...o, supportSubmitted: typeLabel } : o))
    );
    setNotice(
      `Đã gửi Yêu cầu Hỗ trợ (${typeLabel}) cho đơn ${supportOrder.code} tới Thủ quỹ / BTV.`
    );
    setSupportOrder(null);
    setSupportReason("");
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass-card flex flex-col gap-3 rounded-[22px] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Đơn hàng Cửa hàng &amp; QR Nhận vật phẩm
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xuất trình mã QR đơn hàng hoặc Thẻ Sinh viên vật lý tại bàn trực OFIT để nhận hàng nhanh.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full self-start sm:self-auto">
          <Link to="/store">
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Cửa hàng</span>
          </Link>
        </Button>
      </section>

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

      <div className="grid gap-4">
        {orders.map((ord) => (
          <Card key={ord.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="tabular-mono text-base">{ord.code}</CardTitle>
                  <Badge
                    variant={
                      ord.status === "PAID" || ord.status === "DELIVERED"
                        ? "success"
                        : ord.status === "PENDING_COD"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {ord.status === "PAID"
                      ? "Đã thanh toán (VietQR)"
                      : ord.status === "PENDING_COD"
                        ? "PENDING_COD"
                        : ord.status === "DELIVERED"
                          ? "Đã giao"
                          : "Đã nhận tiền — Chờ Thủ quỹ hoàn tiền/đổi mẫu"}
                  </Badge>
                </div>
                <div className="tabular-mono text-base font-semibold text-primary">
                  {formatVnd(ord.total)}
                </div>
              </div>
              <CardDescription>{ord.deliveryLabel}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-foreground">{ord.itemsSummary}</p>

              {ord.status === "PENDING_COD" && (
                <div className="flex items-center gap-2 rounded-lg border border-status-warning/35 bg-status-warning/10 px-3.5 py-2 text-xs font-semibold text-status-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    CHỜ THU TIỀN KHI GIAO —{" "}
                    <span className="tabular-mono">{formatVnd(ord.total)}</span>{ord.deadlineNote}
                  </span>
                </div>
              )}

              {ord.supportSubmitted && (
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                  Đang xử lý yêu cầu hỗ trợ: {ord.supportSubmitted} (Chờ Thủ quỹ / BTV duyệt).
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" onClick={() => setQrOrder(ord)}>
                  <QrCode className="h-4 w-4" />
                  <span>Mở QR Nhận hàng</span>
                </Button>

                {ord.status === "PAID" && (
                  <>
                    <Button size="sm" variant="outline" disabled title="Đơn đã thanh toán không thể tự hủy">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Tự hủy (Đã khóa)</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSupportOrder(ord)}>
                      <HelpCircle className="h-4 w-4" />
                      <span>Yêu cầu Hỗ trợ (Đổi size / Hoàn tiền)</span>
                    </Button>
                  </>
                )}

                {ord.status === "PENDING_COD" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNotice(`Đã tải ảnh biên lai tham chiếu cho đơn ${ord.code} (Thủ quỹ đối chiếu sao kê).`)
                    }
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Tải ảnh biên lai (Tham chiếu)</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pickup QR Dialog (UC-STR-04) */}
      <Dialog open={Boolean(qrOrder)} onOpenChange={(o) => !o && setQrOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Nhận hàng — {qrOrder?.code}</DialogTitle>
            <DialogDescription>
              Đưa mã này cho CTV trực bàn OFIT quét (hoặc xuất trình Thẻ Sinh viên nhựa vật lý).
            </DialogDescription>
          </DialogHeader>

          {qrOrder && (
            <div className="flex flex-col items-center space-y-4 py-2">
              {qrOrder.paymentMethod === "COD" && (
                <div className="w-full rounded-lg border border-status-warning/40 bg-status-warning/12 px-4 py-2.5 text-center text-sm font-semibold text-status-warning">
                  CHỜ THU TIỀN KHI GIAO —{" "}
                  <span className="tabular-mono">{formatVnd(qrOrder.total)}</span>
                </div>
              )}
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <QRCodeSVG value={`YIT-PICKUP|${qrOrder.code}|${qrOrder.status}`} size={200} level="M" />
              </div>
              <div className="text-center text-xs text-muted-foreground">{qrOrder.itemsSummary}</div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setQrOrder(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Request Dialog (UC-STR-05) */}
      <Dialog open={Boolean(supportOrder)} onOpenChange={(o) => !o && setSupportOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yêu cầu Hỗ trợ Đơn hàng {supportOrder?.code}</DialogTitle>
            <DialogDescription>
              Đơn đã thanh toán được khóa tự hủy; Thủ quỹ hoặc BTV sẽ xem xét đổi size, đổi mẫu hoặc hoàn tiền.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Loại yêu cầu</Label>
              <Select value={supportType} onValueChange={setSupportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHANGE_SIZE">Đổi Size (Tự điều chỉnh tồn kho 2 size nếu chưa giao)</SelectItem>
                  <SelectItem value="CHANGE_MODEL">Đổi Mẫu vật phẩm khác</SelectItem>
                  <SelectItem value="REFUND">Trả hàng &amp; Hoàn tiền về tài khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="support-reason">Lý do &amp; thông tin size/tài khoản nhận hoàn (bắt buộc)</Label>
              <Textarea
                id="support-reason"
                placeholder="VD: Xin đổi từ Size L sang Size XL do mặc hơi chật..."
                value={supportReason}
                onChange={(e) => setSupportReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportOrder(null)}>
              Hủy
            </Button>
            <Button disabled={supportReason.trim().length < 8} onClick={handleSubmitSupport}>
              Gửi yêu cầu tới Thủ quỹ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
