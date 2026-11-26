import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Receipt,
  Scale,
  Truck
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createIdempotencyKey, createStoreOrder } from "@/features/store/api";
import { extractApiErrorMessage } from "@/lib/api-client";
import { campaignBucketKey, formatVnd, useCartStore } from "@/stores/cart-store";
import { pushLiveNotification } from "@/stores/notification-store";
import { useOrderStore } from "@/stores/order-store";
import { cn } from "@/lib/utils";

export function StoreCheckoutPage() {
  const items = useCartStore((s) => s.items);
  const selectedBucket = useCartStore((s) => s.selectedBucket);
  const appliedVoucher = useCartStore((s) => s.appliedVoucher);
  const clearBucket = useCartStore((s) => s.clearBucket);
  const orders = useOrderStore((s) => s.orders);
  const addOrder = useOrderStore((s) => s.addOrder);

  const [deliveryMethod, setDeliveryMethod] = useState("OFFICE");
  const [campus, setCampus] = useState("CS1");
  const [building, setBuilding] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [classShift, setClassShift] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("VIETQR");
  const existingPendingCodCount = useMemo(
    () => orders.filter((o) => o.status === "PENDING_COD").length,
    [orders]
  );

  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [vietQrSecondsLeft, setVietQrSecondsLeft] = useState(15 * 60);
  const idempotencyKeyRef = useRef(createIdempotencyKey());

  const [createdOrder, setCreatedOrder] = useState(null);

  const activeItems = useMemo(() => {
    const filtered = items.filter((i) => campaignBucketKey(i.campaignId) === selectedBucket);
    if (filtered.length > 0) return filtered;
    const first = items[0];
    if (!first) return [];
    const fallbackBucket = campaignBucketKey(first.campaignId);
    return items.filter((i) => campaignBucketKey(i.campaignId) === fallbackBucket);
  }, [items, selectedBucket]);

  const activeBucketKey = activeItems[0] ? campaignBucketKey(activeItems[0].campaignId) : selectedBucket;
  const campaignLabel = activeItems[0]?.campaignLabel ?? "Vật phẩm Khoa (Thường trực)";

  useEffect(() => {
    // Rotate intent-scoped Idempotency-Key only when the checkout bucket changes
    idempotencyKeyRef.current = createIdempotencyKey();
  }, [activeBucketKey]);

  const subtotal = useMemo(() => activeItems.reduce((s, i) => s + i.unitPrice * i.qty, 0), [activeItems]);
  const totalWeightKg = useMemo(
    () => Number(activeItems.reduce((s, i) => s + i.weightKg * i.qty, 0).toFixed(2)),
    [activeItems]
  );

  const overweightForClassroom = deliveryMethod === "CLASSROOM" && totalWeightKg > 5;
  const rawShipFee = deliveryMethod === "CLASSROOM" ? 5_000 : 0;
  const shipFee = appliedVoucher?.freeShip ? 0 : rawShipFee;
  const discountGoods = appliedVoucher?.discountGoods ?? 0;
  const grandTotal = Math.max(0, subtotal - discountGoods) + shipFee;

  useEffect(() => {
    if (!createdOrder || createdOrder.method !== "VIETQR") return;
    setVietQrSecondsLeft(15 * 60);
    const deadline = Date.now() + 15 * 60 * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setVietQrSecondsLeft(remaining);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [createdOrder]);

  const vietQrMins = String(Math.floor(vietQrSecondsLeft / 60)).padStart(2, "0");
  const vietQrSecs = String(vietQrSecondsLeft % 60).padStart(2, "0");

  const handlePlaceOrder = async () => {
    if (submitting || activeItems.length === 0 || overweightForClassroom) return;
    if (deliveryMethod === "CLASSROOM") {
      if (!building.trim() || !roomCode.trim() || !classShift.trim()) {
        setOrderError("Vui lòng chọn Tòa nhà/Khu, nhập mã Phòng học và chọn Ca học để giao hàng.");
        return;
      }
    }
    if (paymentMethod === "COD" && existingPendingCodCount >= 2) {
      setOrderError("Bạn đã đạt giới hạn tối đa 2 đơn COD đang chờ xử lý.");
      return;
    }

    setOrderError(null);
    setSubmitting(true);
    try {
      const order = await createStoreOrder(
        {
          items: activeItems.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            qty: item.qty
          })),
          deliveryMethod,
          paymentMethod,
          voucherCode: appliedVoucher?.code,
          campus,
          building: deliveryMethod === "CLASSROOM" ? building : undefined,
          roomCode: deliveryMethod === "CLASSROOM" ? roomCode.trim() : undefined,
          classShift: deliveryMethod === "CLASSROOM" ? classShift : undefined
        },
        idempotencyKeyRef.current
      );

      const deliveryLabel =
        deliveryMethod === "OFFICE"
          ? `Nhận tại Văn phòng Đoàn – Hội (${campus === "CS1" ? "Cơ sở 1" : "Cơ sở 2"})`
          : `Giao phòng ${roomCode.trim()} (${building}, ${campus === "CS1" ? "CS1" : "CS2"}) · ${classShift}`;

      const finalTotal = typeof order.totalAmount === "number" ? order.totalAmount : grandTotal;
      const itemsSummary = activeItems
        .map((item) => {
          const variant = [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(", ");
          return `${item.qty}× ${item.name}${variant ? ` (${variant})` : ""}`;
        })
        .join(" + ");

      addOrder({
        id: `ord-${Date.now()}`,
        code: order.orderCode,
        itemsSummary,
        deliveryLabel,
        total: finalTotal,
        paymentMethod,
        status: paymentMethod === "COD" ? "PENDING_COD" : "PAID",
        createdAt: new Date().toLocaleString("vi-VN"),
        deadlineNote:
          paymentMethod === "COD"
            ? "Vui lòng nhận hàng & thanh toán trong vòng 03 ngày làm việc."
            : undefined
      });

      pushLiveNotification({
        category: "STORE",
        title: `Đã tạo đơn hàng #${order.orderCode}`,
        body: `${itemsSummary} · ${formatVnd(finalTotal)}. Mở mục Đơn hàng để lấy mã QR nhận vật phẩm.`,
        channels: ["In-App", "Web Push"],
        link: "/store/orders"
      });

      setCreatedOrder({
        orderCode: order.orderCode,
        method: paymentMethod,
        total: finalTotal,
        campaignLabel,
        deliveryLabel,
        qrPayload: order.qrPayload,
        bankName: order.bankName,
        accountNo: order.accountNo,
        accountName: order.accountName
      });
      clearBucket(activeBucketKey);
      idempotencyKeyRef.current = createIdempotencyKey();
    } catch (err) {
      setOrderError(
        extractApiErrorMessage(
          err,
          "Không thể tạo đơn hàng lúc này. Giỏ hàng của bạn vẫn được giữ nguyên — vui lòng thử lại."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass-card space-y-4 rounded-[22px] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Thanh toán &amp; Chọn Hình thức Nhận hàng
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bước 3/3 · Chọn nhận tại Văn phòng hoặc Giao phòng học cùng cơ sở, khởi tạo VietQR hoặc COD.
            </p>
          </div>

          {!createdOrder && (
            <Button asChild variant="outline" size="sm" className="rounded-full self-start sm:self-auto">
              <Link to="/store/cart">
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại Giỏ hàng</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Stepper Bar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-4 text-xs font-semibold">
          <Link
            to="/store"
            className="rounded-full border border-border bg-card/80 px-3 py-1 text-muted-foreground hover:text-foreground"
          >
            1. Mua hàng
          </Link>
          <span className="text-muted-foreground">→</span>
          <Link
            to="/store/cart"
            className="rounded-full border border-border bg-card/80 px-3 py-1 text-muted-foreground hover:text-foreground"
          >
            2. Giỏ hàng
          </Link>
          <span className="text-muted-foreground">→</span>
          <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">3. Thanh toán</span>
        </div>
      </section>

      {createdOrder ? (
        /* Order Confirmation & Payment Screen (VietQR / COD) */
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>
                {createdOrder.method === "VIETQR"
                  ? "Quét mã VietQR để hoàn tất thanh toán"
                  : "Đặt đơn thanh toán khi nhận hàng (COD) thành công"}
              </CardTitle>
              <Badge variant={createdOrder.method === "VIETQR" ? "info": "warning"}>
                <span className="tabular-mono">{createdOrder.orderCode}</span>
              </Badge>
            </div>
            <CardDescription>
              {createdOrder.campaignLabel} · {createdOrder.deliveryLabel}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {createdOrder.method === "VIETQR" ? (
              <div className="flex flex-col items-center space-y-4">
                <VerifiedBadge label="TK Tổ chức đã được BTV phê duyệt" />
                {/* Strict 16px white quiet zone around QR per DESIGN.md */}
                <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                  <QRCodeSVG
                    value={createdOrder.qrPayload || `VIETQR|${createdOrder.orderCode}|${createdOrder.total}`}
                    size={212}
                    level="M"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-full border border-status-warning/35 bg-status-warning/10 px-3.5 py-1 text-xs font-semibold text-status-warning">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="tabular-mono">
                    {vietQrSecondsLeft > 0
                      ? `Thời gian giữ đơn & thanh toán còn lại: ${vietQrMins}:${vietQrSecs}`
                      : "Đã hết thời gian giữ đơn VietQR — vui lòng kiểm tra trạng thái đơn hàng."}
                  </span>
                </div>
                <div className="w-full space-y-1.5 rounded-lg border border-border bg-muted/35 p-4 text-xs">
                  {createdOrder.bankName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngân hàng thụ hưởng</span>
                      <span className="font-semibold text-foreground">
                        {createdOrder.bankName}
                        {createdOrder.accountName ? ` · ${createdOrder.accountName}` : ""}
                      </span>
                    </div>
                  )}
                  {createdOrder.accountNo && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số tài khoản</span>
                      <span className="tabular-mono font-semibold text-foreground">{createdOrder.accountNo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền chính xác</span>
                    <span className="tabular-mono font-semibold text-primary">
                      {formatVnd(createdOrder.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nội dung chuyển khoản</span>
                    <span className="tabular-mono font-semibold text-primary">{createdOrder.orderCode}</span>
                  </div>
                </div>
              </div>
            ): (
              <div className="space-y-3">
                <div className="rounded-lg border border-status-warning/35 bg-status-warning/10 p-4 text-center text-sm font-semibold text-status-warning">
                  CHỜ THU TIỀN KHI GIAO —{" "}
                  <span className="tabular-mono">{formatVnd(createdOrder.total)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Đơn hàng đang ở trạng thái <span className="font-semibold text-foreground">Chờ thu tiền khi giao</span> với hạn
                  nhận hàng <strong>03 ngày làm việc</strong>. Quá hạn, hệ thống sẽ tự động hủy đơn và hoàn tồn
                  kho + Voucher.
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2.5 pt-2">
              <Button asChild variant="outline">
                <Link to="/store">Quay về Cửa hàng</Link>
              </Button>
              <Button asChild>
                <Link to="/store/orders">
                  <Receipt className="h-4 w-4" />
                  <span>Mở Đơn hàng &amp; QR nhận hàng</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ): activeItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Chưa có sản phẩm nào được chọn để thanh toán.
            </p>
            <Button asChild>
              <Link to="/store">Quay lại Cửa hàng</Link>
            </Button>
          </CardContent>
        </Card>
      ): (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Delivery & Payment Configuration */}
          <div className="space-y-5 lg:col-span-7">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>1. Hình thức Nhận hàng (Theo Cơ sở)</CardTitle>
                  <Badge variant={overweightForClassroom ? "danger": "secondary"}>
                    <Scale className="h-3 w-3" />
                    <span className="tabular-mono">{totalWeightKg} kg</span>
                  </Badge>
                </div>
                <CardDescription>
                  Chọn nhận trực tiếp tại Văn phòng (0đ) hoặc Giao đến phòng học cùng cơ sở (5.000đ, đơn ≤ 5kg).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("OFFICE")}
                    className={cn(
                      "flex flex-col items-start rounded-lg border p-3.5 text-left transition-colors",
                      deliveryMethod === "OFFICE"
                        ? "border-primary bg-primary/10"
: "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="mt-1.5 text-sm font-semibold text-foreground">
                      Nhận tại Văn phòng Đoàn – Hội
                    </span>
                    <span className="tabular-mono text-xs text-status-success">Miễn phí (0đ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("CLASSROOM")}
                    className={cn(
                      "flex flex-col items-start rounded-lg border p-3.5 text-left transition-colors",
                      deliveryMethod === "CLASSROOM"
                        ? "border-primary bg-primary/10"
: "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="mt-1.5 text-sm font-semibold text-foreground">
                      Giao đến Phòng học cùng Cơ sở
                    </span>
                    <span className="tabular-mono text-xs text-muted-foreground">5.000đ (Giới hạn ≤ 5kg)</span>
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Cơ sở học tập</Label>
                    <Select value={campus} onValueChange={setCampus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CS1">Cơ sở 1 (Số 1 Võ Văn Ngân)</SelectItem>
                        <SelectItem value="CS2">Cơ sở 2 (484 Lê Văn Việt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {deliveryMethod === "CLASSROOM" && (
                    <div className="space-y-1.5">
                      <Label>Tòa nhà / Khu <span className="text-status-danger">*</span></Label>
                      <Select value={building} onValueChange={setBuilding}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tòa nhà / khu..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Khu A">Tòa nhà Trung tâm (Khu A)</SelectItem>
                          <SelectItem value="Khu B">Khu B (Giảng đường)</SelectItem>
                          <SelectItem value="Khu E">Khu E (Thực hành CNTT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {deliveryMethod === "CLASSROOM" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-room">Phòng học <span className="text-status-danger">*</span></Label>
                      <Input
                        id="checkout-room"
                        required
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="VD: A3-302"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ca học giao (Giờ giải lao) <span className="text-status-danger">*</span></Label>
                      <Select value={classShift} onValueChange={setClassShift}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn ca học..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ca 1 (07:30–09:30)">Ca 1 (07:30–09:30)</SelectItem>
                          <SelectItem value="Ca 2 (09:30–11:30)">Ca 2 (09:30–11:30)</SelectItem>
                          <SelectItem value="Ca 3 (12:30–14:30)">Ca 3 (12:30–14:30)</SelectItem>
                          <SelectItem value="Ca 4 (14:30–16:30)">Ca 4 (14:30–16:30)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {overweightForClassroom && (
                  <div className="flex items-start gap-2 rounded-lg border border-status-danger/35 bg-status-danger/10 p-3 text-xs text-status-danger">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Đơn hàng nặng <strong className="tabular-mono">{totalWeightKg} kg</strong> (&gt; 5kg). Vui
                      lòng chuyển sang <strong>Nhận tại Văn phòng</strong> hoặc quay lại Giỏ hàng tách thành nhiều
                      đơn ≤ 5kg.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>2. Phương thức Thanh toán</CardTitle>
                <CardDescription>
                  Tài khoản ngân hàng nhận VietQR đứng tên tổ chức và đã qua BTV phê duyệt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIETQR">
                      Chuyển khoản VietQR (Đối soát tự động · Giữ kho 15 phút)
                    </SelectItem>
                    <SelectItem value="COD">
                      Thanh toán tiền mặt khi nhận (COD · Đang chờ {existingPendingCodCount}/2 đơn)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Breakdown & Place Order */}
          <Card className="h-fit lg:col-span-5 lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <CardTitle>Chi tiết Thanh toán</CardTitle>
              <CardDescription>{campaignLabel}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="divide-y divide-border rounded-lg border border-border">
                {activeItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{item.name}</div>
                      <div className="text-muted-foreground">
                        {item.size} × <span className="tabular-mono">{item.qty}</span>
                      </div>
                    </div>
                    <span className="tabular-mono shrink-0 font-semibold text-foreground">
                      {formatVnd(item.unitPrice * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 rounded-lg border border-border bg-muted/35 p-3.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span className="tabular-mono">{formatVnd(subtotal)}</span>
                </div>
                {appliedVoucher && discountGoods > 0 && (
                  <div className="flex justify-between text-status-success">
                    <span>Voucher ({appliedVoucher.code})</span>
                    <span className="tabular-mono">-{formatVnd(discountGoods)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Phí giao phòng học</span>
                  <span className="tabular-mono">{formatVnd(shipFee)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                  <span>Tổng thanh toán</span>
                  <span className="tabular-mono text-primary">{formatVnd(grandTotal)}</span>
                </div>
              </div>

              {orderError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-status-danger/35 bg-status-danger/10 p-3 text-xs text-status-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <Button
                type="button"
                className="w-full"
                disabled={submitting || overweightForClassroom}
                onClick={() => void handlePlaceOrder()}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {submitting
                    ? "Đang khởi tạo đơn hàng..."
                    : paymentMethod === "VIETQR"
                      ? "Xác nhận & Tạo mã VietQR"
                      : "Xác nhận đặt đơn COD (Hạn 3 ngày)"}
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
