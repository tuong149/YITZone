import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  Barcode,
  CheckCircle2,
  PackageCheck,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

export function StoreBoothPage() {
  const fullName = useAuthStore((s) => s.fullName) ?? "Cán bộ trực Văn phòng";
  const userId = useAuthStore((s) => s.userId) ?? "—";

  const [orderQr, setOrderQr] = useState("");
  const [studentCard1D, setStudentCard1D] = useState("");
  const [collectCod, setCollectCod] = useState(false);
  const [codAmountInput, setCodAmountInput] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  const [statusBanner, setStatusBanner] = useState(null);
  const [handoverSubmitted, setHandoverSubmitted] = useState(false);

  const totalCodCash = deliveries.reduce((sum, d) => sum + d.codAmount, 0);
  const codOrdersCount = deliveries.filter((d) => d.codAmount > 0).length;

  const handleConfirmDelivery = (e) => {
    e.preventDefault();
    const cleanedOrder = orderQr.trim().toUpperCase();
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

    const codVal = collectCod ? Math.max(0, Number(codAmountInput) || 0) : 0;
    const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const record = {
      id: `dlv-${Date.now()}`,
      orderCode: cleanedOrder,
      studentMssv: cleanedMssv,
      paymentType: codVal > 0 ? "COD" : "VIETQR",
      codAmount: codVal,
      deliveredAt: nowStr
    };

    setDeliveries((prev) => [record, ...prev]);
    setStatusBanner({
      tone: "SUCCESS",
      title: `Hợp lệ — Đã bàn giao đơn ${cleanedOrder}`,
      detail: `MSSV nhận hàng: ${cleanedMssv}${codVal > 0 ? ` · Thu COD ${codVal.toLocaleString("vi-VN")}đ` : " · Đã thanh toán VietQR"}`
    });
    setOrderQr("");
    setStudentCard1D("");
    setCodAmountInput("");
    setCollectCod(false);
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
          <CheckCircle2 className="h-5 w-5 shrink-0" />
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
                  <Input
                    id="booth-student-1d"
                    value={studentCard1D}
                    onChange={(e) => setStudentCard1D(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Nhập hoặc quét 8 số MSSV"
                    className="tabular-mono h-11 rounded-xl font-medium"
                  />
                </div>
              </div>

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
                      placeholder="185000"
                      className="tabular-mono h-9 max-w-[180px] rounded-xl"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full rounded-xl">
                <UserCheck className="h-4 w-4" />
                <span>Xác nhận Giao Vật phẩm</span>
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
                disabled={deliveries.length === 0}
                className="w-full rounded-xl"
                onClick={() => setHandoverSubmitted(true)}
              >
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>Chốt Phiếu Bàn giao COD ({totalCodCash.toLocaleString("vi-VN")}đ)</span>
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
