import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Scale,
  ShoppingCart,
  Tag,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { campaignBucketKey, formatVnd, useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

export function StoreCartPage(){
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const selectedBucket = useCartStore((s) => s.selectedBucket);
  const appliedVoucher = useCartStore((s) => s.appliedVoucher);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const setSelectedBucket = useCartStore((s) => s.setSelectedBucket);
  const setAppliedVoucher = useCartStore((s) => s.setAppliedVoucher);

  const [voucherCode, setVoucherCode] = useState(appliedVoucher?.code ?? "");
  const [voucherError, setVoucherError] = useState(null);

  // Group items by campaign bucket (FACULTY_MERCH vs XTN-2027, etc.)
  const buckets = useMemo(() => {
    const map = new Map;
    for (const item of items) {
      const b = campaignBucketKey(item.campaignId);
      const existing = map.get(b);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(b, { bucket: b, label: item.campaignLabel, items: [item] });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const activeBucket =
    buckets.find((b) => b.bucket === selectedBucket)?.bucket ?? buckets[0]?.bucket ?? "FACULTY_MERCH";
  const activeItems = useMemo(() => items.filter((i) => campaignBucketKey(i.campaignId) === activeBucket),
    [items, activeBucket]
  );

  const subtotal = useMemo(() => activeItems.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
    [activeItems]
  );
  const totalWeightKg = useMemo(() => Number(activeItems.reduce((sum, i) => sum + i.weightKg * i.qty, 0).toFixed(2)),
    [activeItems]
  );
  const discountGoods = appliedVoucher?.discountGoods ?? 0;
  const estimatedTotal = Math.max(0, subtotal - discountGoods);

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    setVoucherError(null);
    if (!code) return;
    if (code === "YIT20K") {
      if (subtotal < 200_000) {
        setVoucherError("Mã YIT20K yêu cầu đơn hàng tối thiểu 200.000đ.");
        return;
      }
      setAppliedVoucher({ code: "YIT20K", discountGoods: 20_000, freeShip: false });
    } else if (code === "FREESHIP") {
      setAppliedVoucher({ code: "FREESHIP", discountGoods: 0, freeShip: true });
    } else {
      setVoucherError("Mã Voucher không hợp lệ hoặc đã hết lượt sử dụng toàn Khoa.");
    }
  };

  const handleProceedCheckout = () => {
    setSelectedBucket(activeBucket);
    void navigate("/store/checkout");
  };

  return (
    <div className="space-y-6">
      {/* Header & Stepper */}
      <section className="liquid-glass-card space-y-4 rounded-[22px] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Giỏ hàng Cửa hàng YITZone
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bước 2/3 · Kiểm tra số lượng, khối lượng đơn hàng, áp mã Voucher và chọn đợt thanh toán.
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="rounded-full self-start sm:self-auto">
            <Link to="/store">
              <ArrowLeft className="h-4 w-4" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </Button>
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
          <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">2. Giỏ hàng</span>
          <span className="text-muted-foreground">→</span>
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
            3. Thanh toán
          </span>
        </div>
      </section>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/60" />
            <h2 className="mt-3 font-display text-lg font-medium text-foreground">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Hãy quay lại Cửa hàng để chọn Vật phẩm Khoa hoặc đồ ăn vặt ủng hộ Đợt Gây quỹ Xuân Tình Nguyện 2027.
            </p>
            <Button asChild className="mt-5">
              <Link to="/store">Mở Cửa hàng ngay</Link>
            </Button>
          </CardContent>
        </Card>
      ): (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Grouped Cart Items */}
          <div className="space-y-4 lg:col-span-8">
            {buckets.length > 1 && (
              <div className="flex items-start gap-2.5 rounded-lg border border-status-warning/35 bg-status-warning/10 p-3.5 text-xs text-status-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Giỏ hàng đang có sản phẩm thuộc <strong>{buckets.length} đợt bán khác nhau</strong>. Vì mỗi đợt
                  hạch toán và dùng tài khoản thụ hưởng VietQR riêng, hãy chọn <strong>1 đợt</strong> bên dưới để
                  thanh toán trước (các món đợt còn lại vẫn được giữ nguyên trong giỏ).
                </span>
              </div>
            )}

            {buckets.map((group) => {
              const isSelected = group.bucket === activeBucket;
              const groupWeight = Number(
                group.items.reduce((s, i) => s + i.weightKg * i.qty, 0).toFixed(2)
              );
              return (
                <Card
                  key={group.bucket}
                  className={cn(
                    "transition-colors",
                    isSelected ? "border-primary/50": "opacity-80"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="radio"
                          name="checkout-bucket"
                          checked={isSelected}
                          onChange={() => setSelectedBucket(group.bucket)}
                          className="h-4 w-4 accent-primary"
                        />
                        <CardTitle className="text-base">{group.label}</CardTitle>
                      </label>
                      <div className="flex items-center gap-2">
                        <Badge variant={groupWeight > 5 ? "warning": "secondary"}>
                          <Scale className="h-3 w-3" />
                          <span className="tabular-mono">{groupWeight} kg</span>
                        </Badge>
                        {isSelected && <Badge variant="default">Đang chọn thanh toán</Badge>}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="divide-y divide-border p-0">
                    {group.items.map((item) => (
                      <div
                        key={item.key}
                        className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="tabular-mono text-xs text-muted-foreground">
                            Phân loại: {item.size} · {formatVnd(item.unitPrice)} / sp · {item.weightKg} kg
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQty(item.key, -1)}
                              aria-label="Giảm số lượng"
                            >
                              -
                            </Button>
                            <span className="tabular-mono w-7 text-center text-sm font-semibold">
                              {item.qty}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQty(item.key, 1)}
                              aria-label="Tăng số lượng"
                            >
                              +
                            </Button>
                          </div>

                          <div className="tabular-mono w-24 text-right text-sm font-semibold text-foreground">
                            {formatVnd(item.unitPrice * item.qty)}
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-status-danger"
                            onClick={() => removeItem(item.key)}
                            aria-label="Xóa sản phẩm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Right: Voucher & Order Summary */}
          <Card className="h-fit lg:col-span-4 lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <CardTitle>Tóm tắt Đợt đang chọn</CardTitle>
              <CardDescription>
                {buckets.find((b) => b.bucket === activeBucket)?.label}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cart-voucher">Mã giảm giá (Thử: YIT20K hoặc FREESHIP)</Label>
                <div className="flex gap-2">
                  <Input
                    id="cart-voucher"
                    placeholder="Nhập mã Voucher..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    error={voucherError ?? undefined}
                  />
                  <Button type="button" variant="outline" onClick={handleApplyVoucher} className="shrink-0">
                    <Tag className="h-4 w-4" />
                    <span>Áp mã</span>
                  </Button>
                </div>
                {appliedVoucher && (
                  <div className="flex items-center justify-between text-xs font-medium text-status-success">
                    <span>Đã áp dụng mã {appliedVoucher.code}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedVoucher(null);
                        setVoucherCode("");
                      }}
                      className="underline underline-offset-2"
                    >
                      Gỡ mã
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-muted/35 p-3.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tổng khối lượng</span>
                  <span className="tabular-mono">{totalWeightKg} kg</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính ({activeItems.reduce((s, i) => s + i.qty, 0)} món)</span>
                  <span className="tabular-mono">{formatVnd(subtotal)}</span>
                </div>
                {discountGoods > 0 && (
                  <div className="flex justify-between text-status-success">
                    <span>Giảm giá Voucher</span>
                    <span className="tabular-mono">-{formatVnd(discountGoods)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                  <span>Tạm cộng</span>
                  <span className="tabular-mono text-primary">{formatVnd(estimatedTotal)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Phí giao phòng học (0đ–5.000đ, chỉ áp dụng đơn ≤ 5kg) sẽ được chọn ở bước Thanh toán.
                </p>
              </div>

              <Button className="w-full" disabled={activeItems.length === 0} onClick={handleProceedCheckout}>
                <span>Tiếp tục Thanh toán</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
