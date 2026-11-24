import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Coffee,
  HeartHandshake,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Truck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRelatedStoreProducts,
  getStoreProductById
} from "@/features/store/products-data";
import { cn } from "@/lib/utils";
import { campaignBucketKey, formatVnd, useCartStore } from "@/stores/cart-store";
import { pushAppToast } from "@/stores/toast-store";

export function StoreProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const product = getStoreProductById(productId);
  const addItem = useCartStore((s) => s.addItem);
  const setSelectedBucket = useCartStore((s) => s.setSelectedBucket);
  const totalCartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0));

  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? "Free Size");
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? "Mặc định");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.sizes[0] ?? "Free Size");
    setSelectedColor(product.colors[0] ?? "Mặc định");
    setQty(1);
  }, [product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="rounded-[24px] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-medium text-foreground">
            Không tìm thấy sản phẩm
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mã sản phẩm <span className="tabular-mono font-semibold text-foreground">{productId}</span> không tồn tại hoặc đợt mở bán đã kết thúc.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild className="rounded-full px-5">
              <Link to="/store">
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại Cửa hàng</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const unitPrice = product.promoPrice ?? product.listPrice;
  const savings = product.promoPrice ? product.listPrice - product.promoPrice : 0;
  const isFundraising = product.productType === "FUNDRAISING_ITEM";
  const isOutOfStock = product.stock <= 0;
  const relatedProducts = getRelatedStoreProducts(product, 3);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, selectedSize, selectedColor, qty);
    pushAppToast({
      variant: "success",
      title: "Đã thêm vào giỏ hàng",
      description: `${qty}× ${product.name} (${selectedSize} · ${selectedColor}).`
    });
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, selectedSize, selectedColor, qty);
    setSelectedBucket(campaignBucketKey(product.campaignId));
    void navigate("/store/checkout");
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb + Quick Cart Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Đường dẫn sản phẩm" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/store" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cửa hàng</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <Link
            to={isFundraising ? "/store?section=XTN_2027" : "/store?section=MERCH"}
            className="transition-colors hover:text-foreground"
          >
            {isFundraising ? "Gây quỹ XTN 2027" : "Vật phẩm Khoa"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="max-w-[240px] truncate font-semibold text-foreground sm:max-w-md">
            {product.name}
          </span>
        </nav>

        <Button asChild variant="outline" size="sm" className="h-9 rounded-full">
          <Link to="/store/cart">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span>
              Giỏ hàng (<span className="tabular-mono">{totalCartCount}</span>)
            </span>
          </Link>
        </Button>
      </div>

      {/* Main 2-Column Product Showcase & Purchase Panel */}
      <section className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Visual Column */}
        <div className="space-y-4 lg:col-span-6">
          <div className="liquid-glass-card relative aspect-[4/3] w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-primary/10 via-brand-cyan/8 to-card">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="liquid-glass-pill flex h-20 w-20 items-center justify-center rounded-full">
                  {isFundraising ? (
                    <Coffee className="h-9 w-9 text-primary" />
                  ) : product.categoryCode === "UNIFORM_APPAREL" ? (
                    <Shirt className="h-9 w-9 text-primary" />
                  ) : (
                    <Package className="h-9 w-9 text-primary" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{product.categoryLabel}</p>
                  <p className="text-xs text-muted-foreground">{product.campaignLabel}</p>
                </div>
              </div>
            )}

            <span className="liquid-glass-pill absolute left-4 top-4 rounded-full px-3.5 py-1 text-xs font-semibold text-foreground">
              {product.promotionalBadge ?? product.categoryLabel}
            </span>
          </div>

          {/* Trust & Fulfillment Strip */}
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-card/85 p-3.5 text-xs">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="font-semibold text-foreground">Nhận tại VP (0đ)</div>
                <div className="mt-0.5 text-muted-foreground">CS1 &amp; CS2 giờ trực OFIT</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-card/85 p-3.5 text-xs">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="font-semibold text-foreground">Giao phòng học</div>
                <div className="mt-0.5 text-muted-foreground">5.000đ · Đơn ≤ 5kg</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-card/85 p-3.5 text-xs">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
              <div>
                <div className="font-semibold text-foreground">Chính hãng FIT</div>
                <div className="mt-0.5 text-muted-foreground">VietQR &amp; COD an toàn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Purchase Controls Column */}
        <div className="liquid-glass-card space-y-5 rounded-[24px] p-5 sm:p-7 lg:sticky lg:top-20 lg:col-span-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isFundraising ? "calDeadline" : "secondary"}>
                {isFundraising && <HeartHandshake className="h-3 w-3" />}
                <span>{product.campaignLabel}</span>
              </Badge>
              {product.isPreorder && <Badge variant="info">Nhận đặt trước (Pre-order)</Badge>}
            </div>

            <h1 className="font-display text-2xl font-medium leading-tight tracking-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.shortSummary}</p>
          </div>

          {/* Price Block */}
          <div className="flex flex-wrap items-baseline gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3.5">
            <span className="tabular-mono text-3xl font-semibold text-primary">
              {formatVnd(unitPrice)}
            </span>
            {product.promoPrice && (
              <>
                <span className="tabular-mono text-sm text-muted-foreground line-through">
                  {formatVnd(product.listPrice)}
                </span>
                <Badge variant="success" className="tabular-mono">
                  Tiết kiệm {formatVnd(savings)}
                </Badge>
              </>
            )}
          </div>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary" />
              Tình trạng:{" "}
              <strong className={isOutOfStock ? "text-status-danger" : "text-status-success"}>
                {isOutOfStock ? "Hết hàng" : `Còn ${product.stock} sản phẩm`}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-mono">
              <Scale className="h-3.5 w-3.5 text-primary" />
              Khối lượng: {product.weightKg} kg
            </span>
          </div>

          {/* Size / Variant Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {product.categoryCode === "UNIFORM_APPAREL" ? "Chọn kích cỡ (Size)" : "Tùy chọn / Phân loại"}
              </span>
              <span className="tabular-mono text-muted-foreground">Đang chọn: {selectedSize}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={cn(
                    "min-h-[38px] rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                    selectedSize === sz
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/45"
                  )}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color / Packaging Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Màu sắc / Quy cách</span>
              <span className="text-muted-foreground">{selectedColor}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "min-h-[38px] rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                    selectedColor === color
                      ? "border-primary bg-primary/12 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/45 hover:text-foreground"
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">Số lượng</span>
              <p className="tabular-mono text-xs text-muted-foreground">
                Tạm tính: <strong className="text-foreground">{formatVnd(unitPrice * qty)}</strong>
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
              <button
                type="button"
                aria-label="Giảm số lượng"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="tabular-mono min-w-[2.5rem] text-center text-sm font-semibold text-foreground">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={qty >= product.stock}
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="h-12 rounded-full border-primary/35 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Thêm vào giỏ hàng</span>
            </Button>
            <Button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="liquid-glass-btn-cobalt h-12 rounded-full text-sm font-semibold"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Mua ngay</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Detailed Info & Size Guide */}
      <section className="grid gap-5 lg:grid-cols-12">
        <Card className="rounded-[22px] lg:col-span-7">
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium">
              Mô tả chi tiết &amp; Điểm nổi bật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p className="text-foreground/90">{product.description}</p>
            <ul className="space-y-2">
              {product.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 border-t border-border/70 pt-4 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <div className="font-semibold text-foreground">Chất liệu / Thành phần</div>
                <p className="mt-1 text-muted-foreground">{product.materialOrIngredients}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  <span>Chính sách đổi trả</span>
                </div>
                <p className="mt-1 text-muted-foreground">{product.exchangePolicy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] lg:col-span-5">
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium">
              {product.sizeGuide ? "Bảng gợi ý chọn Size" : "Thông tin Giao nhận & Gây quỹ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.sizeGuide ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Size</th>
                      <th className="px-3 py-2 font-semibold">Chiều cao</th>
                      <th className="px-3 py-2 font-semibold">Cân nặng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {product.sizeGuide.map((row) => (
                      <tr
                        key={row.size}
                        className={selectedSize === row.size ? "bg-primary/8 font-semibold text-foreground" : ""}
                      >
                        <td className="tabular-mono px-3 py-2">{row.size}</td>
                        <td className="tabular-mono px-3 py-2">{row.height}</td>
                        <td className="tabular-mono px-3 py-2">{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs leading-relaxed text-muted-foreground">
              <div className="font-semibold text-foreground">Hướng dẫn nhận hàng</div>
              <p className="mt-1">{product.pickupNote}</p>
            </div>

            {isFundraising && (
              <div className="flex items-start gap-2.5 rounded-xl border border-cal-deadline/30 bg-cal-deadline/10 p-3.5 text-xs leading-relaxed text-foreground">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-cal-deadline" />
                <span>
                  Sản phẩm thuộc đợt <strong>{product.campaignLabel}</strong>. Toàn bộ lợi nhuận sau trừ giá vốn được công khai minh bạch và đóng góp trực tiếp vào quỹ chiến dịch.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-medium text-foreground sm:text-2xl">
              Sản phẩm cùng đợt khác
            </h2>
            <Link to="/store" className="text-xs font-semibold text-primary hover:underline">
              Xem tất cả cửa hàng
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                to={`/store/products/${rel.id}`}
                className="liquid-glass-card group flex flex-col justify-between rounded-[20px] p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{rel.categoryLabel}</span>
                    <span className="tabular-mono">Còn {rel.stock}</span>
                  </div>
                  <h3 className="font-display line-clamp-2 text-base font-medium text-foreground transition-colors group-hover:text-primary">
                    {rel.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-2">
                  <span className="tabular-mono text-lg font-semibold text-primary">
                    {formatVnd(rel.promoPrice ?? rel.listPrice)}
                  </span>
                  <span className="text-xs font-semibold text-primary">Xem chi tiết →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
