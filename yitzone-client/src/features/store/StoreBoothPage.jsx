import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Barcode,
  CheckCircle2,
  PackageCheck,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fulfillStoreOrder,
  lookupStoreOrdersByBarcode,
  submitCodHandover
} from "@/features/store/api";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export function StoreBoothPage() {
  const fullName = useAuthStore((s) => s.fullName) ?? "Cán bộ trực Văn phòng";
  const userId = useAuthStore((s) => s.userId) ?? "—";

  const [orderQr, setOrderQr] = useState("");
  const [studentCard1D, setStudentCard1D] = useState("");
  const [collectCod, setCollectCod] = useState(false);
  const [codAmountInput, setCodAmountInput] = useState("");
  const [matchedOrders, setMatchedOrders] = useState([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [statusBanner, setStatusBanner] = useState(null);
  const [handoverSubmitted, setHandoverSubmitted] = useState(false);

  const totalCodCash = deliveries.reduce((sum, d) => sum + d.codAmount, 0);
  const codOrdersCount = deliveries.filter((d) => d.codAmount > 0).length;

  const handleLookupByBarcode = async () => {
    const cleanedMssv = studentCard1D.trim();
    if (!/^[0-9]{8}$/.test(cleanedMssv)) {
      setStatusBanner({
        tone: "ERROR",
        title: "Mã thẻ sinh viên không hợp lệ",
        detail: "Mã vạch 1D trên thẻ sinh viên phải gồm đúng 8 chữ số MSSV để tra cứu đơn hàng."
      });
      return;
    }
    setLookingUp(true);
    setStatusBanner(null);
    try {
      const orders = await lookupStoreOrdersByBarcode(cleanedMssv);
      const list = Array.isArray(orders) ? orders : [];
      setMatchedOrders(list);
      if (list.length === 0) {
        setStatusBanner({
          tone: "ERROR",
          title: "Không tìm thấy đơn hàng chờ nhận",
          detail: `Sinh viên ${cleanedMssv} hiện không có đơn hàng nào đang chờ bàn giao tại quầy.`
        });
      } else {
        const first = list[0];
        if (first?.orderCode) setOrderQr(first.orderCode);
        if (first?.paymentMethod === "COD") {
          setCollectCod(true);
          if (typeof first.totalAmount === "number") {
            setCodAmountInput(String(first.totalAmount));
          }
        }
      }
    } catch (err) {
      setMatchedOrders([]);
      setStatusBanner({
        tone: "ERROR",
        title: "Không thể tra cứu đơn hàng theo thẻ SV",
        detail: extractApiErrorMessage(
          err,
          "Chưa kết nối được máy chủ Cửa hàng để tra cứu đơn hàng theo mã vạch 1D."
        )
      });
    } finally {
      setLookingUp(false);
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const rawOrder = orderQr.trim().toUpperCase();
    const cleanedOrder = rawOrder.startsWith("YIT-PICKUP|")
      ? (rawOrder.split("|")[1] ?? rawOrder)
      : rawOrder;
    const cleanedMssv = studentCard1D.trim();
    if (!cleanedOrder) {
      setStatusBanner({
        tone: "ERROR",
        title: "Thiếu mã đơn hàng QR",
        detail: "Vui lòng quét mã QR đơn hàng từ điện thoại của sinh viên nhận vật phẩm."
      });
      return;
    }
    if (!/^[0-9]{8}$/.test(cleanedMssv)) {
      setStatusBanner({
        tone: "ERROR",
        title: "Mã thẻ sinh viên không hợp lệ",
        detail: "Mã vạch 1D trên thẻ sinh viên phải gồm đúng 8 chữ số MSSV."
      });
      return;
    }

    setSubmitting(true);
    setStatusBanner(null);
    try {
      const fulfilled = await fulfillStoreOrder(cleanedOrder);
      const serverCod =
        fulfilled?.paymentMethod === "COD" && typeof fulfilled?.totalAmount === "number"
          ? fulfilled.totalAmount
          : null;
      const codVal =
        serverCod !== null
          ? serverCod
          : collectCod
            ? Math.max(0, Number(codAmountInput) || 0)
            : 0;
      const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const finalCode = fulfilled?.orderCode ?? cleanedOrder;
      const record = {
        id: `dlv-${Date.now()}`,
        orderCode: finalCode,
        studentMssv: cleanedMssv,
        paymentType: codVal > 0 ? "COD" : "VIETQR",
        codAmount: codVal,
        deliveredAt: nowStr
      };

      setDeliveries((prev) => [record, ...prev]);
      setMatchedOrders((prev) => prev.filter((o) => o.orderCode !== finalCode));
      setStatusBanner({
        tone: "SUCCESS",
        title: `Hợp lệ — Đã bàn giao đơn ${finalCode}`,
        detail: `MSSV nhận hàng: ${cleanedMssv}${codVal > 0 ? ` · Thu COD ${codVal.toLocaleString("vi-VN")}đ` : " · Đã thanh toán VietQR"}`
      });
      setOrderQr("");
      setStudentCard1D("");
      setCodAmountInput("");
      setCollectCod(false);
    } catch (err) {
      setStatusBanner({
        tone: "ERROR",
        title: "Không thể xác nhận bàn giao đơn hàng",
        detail: extractApiErrorMessage(
          err,
          "Không thể đối chiếu đơn hàng với máy chủ Cửa hàng. Vui lòng kiểm tra mã đơn hoặc kết nối mạng."
        )
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitHandover = async () => {
    if (deliveries.length === 0 || submittingHandover) return;
    setSubmittingHandover(true);
    setStatusBanner(null);
    try {
      await submitCodHandover({
        ordersCount: codOrdersCount,
        cashCollected: totalCodCash,
        orderCodes: deliveries.map((d) => d.orderCode)
      });
      setHandoverSubmitted(true);
    } catch (err) {
      setStatusBanner({
        tone: "ERROR",
        title: "Không thể chốt Phiếu bàn giao COD",
        detail: extractApiErrorMessage(
          err,
          "Chưa kết nối được máy chủ để lưu Phiếu bàn giao COD cuối ca."
        )
      });
    } finally {
      setSubmittingHandover(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
            Bàn Phát Vật phẩm &amp; Thu hộ COD Ca trực
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quét mã QR đơn hàng kết hợp mã vạch 1D trên thẻ sinh viên của người đến nhận.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/office-duty">
            <ArrowLeft className="h-4 w-4" />
            <span>Về Ca trực Văn phòng</span>
          </Link>
        </Button>
      </div>

      {statusBanner && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 ${
            statusBanner.tone === "SUCCESS"
              ? "border-status-success/40 bg-status-success/10 text-status-success"
              : "border-status-danger/40 bg-status-danger/10 text-status-danger"
          }`}
        >
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">{statusBanner.title}</div>
            <div className="text-xs text-foreground">{statusBanner.detail}</div>
          </div>
          {statusBanner.tone === "SUCCESS" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageCheck className="h-5 w-5 text-primary" />
              <span>Quét Giao hàng Kép (QR Đơn + Thẻ SV 1D)</span>
            </CardTitle>
            <CardDescription>
              Hỗ trợ súng quét mã vạch USB/Bluetooth HID hoặc nhập trực tiếp mã đơn và 8 số MSSV.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="booth-order-qr" className="flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5 text-primary" />
                    <span>1. Mã QR Đơn hàng</span>
                  </Label>
                  <Input
                    id="booth-order-qr"
                    value={orderQr}
                    onChange={(e) => setOrderQr(e.target.value)}
                    placeholder="VD: YIT-STR-849514"
                    className="tabular-mono h-11 rounded-xl font-medium uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="booth-student-1d" className="flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5 text-primary" />
                    <span>2. Mã vạch 1D Thẻ SV nhận hàng</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="booth-student-1d"
                      value={studentCard1D}
                      onChange={(e) => setStudentCard1D(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Nhập hoặc quét 8 số MSSV"
                      className="tabular-mono h-11 rounded-xl font-medium"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={lookingUp || studentCard1D.length !== 8}
                      onClick={() => void handleLookupByBarcode()}
                      className="h-11 shrink-0 rounded-xl px-3"
                      title="Tra cứu đơn chờ nhận theo mã vạch thẻ SV"
                    >
                      <Search className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">{lookingUp ? "Đang tìm..." : "Tra cứu"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {matchedOrders.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
                  <div className="font-semibold text-foreground">
                    Đơn hàng chờ nhận của sinh viên ({matchedOrders.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedOrders.map((ord) => (
                      <button
                        key={ord.orderCode}
                        type="button"
                        onClick={() => {
                          setOrderQr(ord.orderCode);
                          setCollectCod(ord.paymentMethod === "COD");
                          setCodAmountInput(
                            ord.paymentMethod === "COD" && typeof ord.totalAmount === "number"
                              ? String(ord.totalAmount)
                              : ""
                          );
                        }}
                        className="tabular-mono rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground hover:border-primary"
                      >
                        {ord.orderCode} ({ord.paymentMethod})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-3.5">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={collectCod}
                    onChange={(e) => setCollectCod(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Đơn thanh toán tiền mặt tại bàn trực (Thu hộ COD)</span>
                </label>
                {collectCod && (
                  <div className="flex items-center gap-2 pt-1">
                    <Label htmlFor="booth-cod-amount" className="shrink-0 text-xs">
                      Số tiền mặt thu (VNĐ):
                    </Label>
                    <Input
                      id="booth-cod-amount"
                      value={codAmountInput}
                      onChange={(e) => setCodAmountInput(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="Nhập số tiền..."
                      className="tabular-mono h-9 max-w-[180px] rounded-xl"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-xl">
                <UserCheck className="h-4 w-4" />
                <span>{submitting ? "Đang xác nhận..." : "Xác nhận Giao Vật phẩm"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5 text-status-success" />
              <span>Phiếu Bàn giao COD Cuối ca</span>
            </CardTitle>
            <CardDescription>
              CTV trực: <strong>{fullName}</strong> ({userId}) · Hạn bàn giao Thủ quỹ 24 giờ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/35 p-3">
                <div className="text-xs text-muted-foreground">Đơn đã phát</div>
                <div className="mt-1 tabular-mono text-xl font-semibold text-foreground">
                  {deliveries.length} ({codOrdersCount} COD)
                </div>
              </div>
              <div className="rounded-xl border border-status-success/35 bg-status-success/10 p-3">
                <div className="text-xs text-status-success">Tiền mặt COD giữ</div>
                <div className="mt-1 tabular-mono text-xl font-semibold text-status-success">
                  {totalCodCash.toLocaleString("vi-VN")}đ
                </div>
              </div>
            </div>

            {handoverSubmitted ? (
              <div className="flex items-start gap-2 rounded-xl border border-status-success/35 bg-status-success/10 p-3 text-xs text-status-success">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Đã lập phiếu bàn giao <strong>{totalCodCash.toLocaleString("vi-VN")}đ</strong> lên Thủ quỹ Khoa.
                </span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={deliveries.length === 0 || submittingHandover}
                className="w-full rounded-xl"
                onClick={() => void handleSubmitHandover()}
              >
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>
                  {submittingHandover
                    ? "Đang gửi phiếu bàn giao..."
                    : `Chốt Phiếu Bàn giao COD (${totalCodCash.toLocaleString("vi-VN")}đ)`}
                </span>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nhật ký Phát vật phẩm trong Ca trực ({deliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 px-6 py-10 text-center">
              <PackageCheck className="mb-2.5 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Chưa có đơn hàng nào được bàn giao trong ca này</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Quét mã QR đơn hàng và mã vạch 1D trên thẻ sinh viên ở khung phía trên để bắt đầu phát vật phẩm.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-card p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular-mono text-sm font-semibold text-foreground">{d.orderCode}</span>
                      <Badge variant={d.codAmount > 0 ? "warning" : "success"}>
                        {d.codAmount > 0 ? `Thu COD ${d.codAmount.toLocaleString("vi-VN")}đ` : "Đã trả VietQR"}
                      </Badge>
                    </div>
                    <div className="tabular-mono text-xs text-muted-foreground">
                      Thẻ SV nhận: {d.studentMssv} · Lúc {d.deliveredAt}
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    Đã giao hàng
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
