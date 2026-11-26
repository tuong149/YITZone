import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Coffee,
  HeartHandshake,
  Package,
  Plus,
  Receipt,
  Scale,
  Search,
  Shirt,
  ShoppingCart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FACULTY_MERCH_PRODUCTS,
  FUNDRAISING_XTN_PRODUCTS
} from "@/features/store/products-data";
import { formatVnd, useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

export function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSection = (searchParams.get("section") ?? "ALL");
  const activeSection = ["ALL", "MERCH", "XTN_2027"].includes(rawSection)
    ? rawSection
    : "ALL";
  const searchQuery = searchParams.get("q") ?? "";

  const setActiveSection = (nextSection) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextSection === "ALL") next.delete("section");
        else next.set("section", nextSection);
        return next;
      },
      { replace: true }
    );
  };

  const setSearchQuery = (nextQ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextQ.trim()) next.set("q", nextQ);
        else next.delete("q");
        return next;
      },
      { replace: true }
    );
  };
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedToast, setAddedToast] = useState(null);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasAnyCatalogProducts =
    FACULTY_MERCH_PRODUCTS.length > 0 || FUNDRAISING_XTN_PRODUCTS.length > 0;

  const filteredMerch = useMemo(
    () =>
      FACULTY_MERCH_PRODUCTS.filter(
        (p) =>
          !normalizedQuery ||
          p.name.toLowerCase().includes(normalizedQuery) ||
          p.categoryLabel.toLowerCase().includes(normalizedQuery)
      ),
    [normalizedQuery]
  );

  const filteredFundraising = useMemo(
    () =>
      FUNDRAISING_XTN_PRODUCTS.filter(
        (p) =>
          !normalizedQuery ||
          p.name.toLowerCase().includes(normalizedQuery) ||
          p.categoryLabel.toLowerCase().includes(normalizedQuery)
      ),
    [normalizedQuery]
  );

  const handleAdd = (p) => {
    const sizes = p.sizes ?? [];
    const size = selectedSizes[p.id] ?? sizes[0] ?? "Free Size";
    addItem(p, size);
    setAddedToast(`Đã thêm "${p.name}" (${size}) vào Giỏ hàng.`);
  };

  // Unified Liquid Glass Product Card matching EventsPage.tsx (rounded-[22px] + concentric pills)
  const renderProductCard = (p) => {
    const sizes = p.sizes ?? [];
    const colors = p.colors ?? [];
    const activeSize = selectedSizes[p.id] ?? sizes[0] ?? "Free Size";
    const isMultiSize = sizes.length > 1;
    const isFundraising = p.productType === "FUNDRAISING_ITEM";

    return (
      <article
        key={p.id}
        className="liquid-glass-card group flex flex-col overflow-hidden rounded-[22px] transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
      >
        {/* Media Frame */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/60">
          {p.image ? (
            <img
              src={p.image}
              alt={p.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ): (
            <div className="yit-node-grid flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/8 via-card/60 to-brand-cyan/10 px-4 text-center">
              <div className="liquid-glass-pill flex h-12 w-12 items-center justify-center rounded-full">
                {isFundraising ? (
                  <Coffee className="h-5 w-5 text-primary" />
                ): p.categoryCode === "UNIFORM_APPAREL" ? (
                  <Shirt className="h-5 w-5 text-primary" />
                ): (
                  <Package className="h-5 w-5 text-primary" />
                )}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Ảnh minh họa sản phẩm
              </span>
            </div>
          )}

          {/* Single clean Liquid Glass pill matching EventsPage */}
          <span className="liquid-glass-pill absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
            {p.promotionalBadge ?? p.categoryLabel}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{p.categoryLabel}</span>
                <span className="tabular-mono inline-flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {p.weightKg}kg · Còn {p.stock}
                </span>
              </div>
              <h3 className="font-display min-h-[2.75rem] line-clamp-2 text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                <Link to={`/store/products/${p.id}`} className="hover:underline underline-offset-4">
                  {p.name}
                </Link>
              </h3>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="tabular-mono text-xl font-semibold text-primary">
                {formatVnd(p.promoPrice ?? p.listPrice)}
              </span>
              {p.promoPrice && (
                <span className="tabular-mono text-xs text-muted-foreground line-through">
                  {formatVnd(p.listPrice)}
                </span>
              )}
            </div>

            {/* Concentric pill size selector */}
            <div className="min-h-[34px]">
              {isMultiSize ? (
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSizes((prev) => ({...prev, [p.id]: sz }))}
                      className={cn(
                        "min-h-[32px] rounded-full border px-3 py-1 text-xs font-semibold transition-colors sm:min-h-0 sm:px-2.5 sm:py-0.5",
                        activeSize === sz
                          ? "border-primary bg-primary/12 text-primary"
: "border-border bg-card/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              ): (
                <span className="inline-flex rounded-full border border-border bg-card/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {activeSize}{colors[0] ? ` · ${colors[0]}` : ""}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-10 flex-1 rounded-full border-primary/30 bg-card/80 text-primary hover:bg-primary hover:text-primary-foreground sm:h-9"
              onClick={() => handleAdd(p)}
            >
              <Plus className="h-4 w-4" />
              <span>{isMultiSize ? `Thêm (${activeSize})` : "Thêm vào giỏ"}</span>
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-10 rounded-full px-3.5 text-xs font-semibold sm:h-9">
              <Link to={`/store/products/${p.id}`}>Chi tiết</Link>
            </Button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-7">
      {/* Unified Liquid Glass Page Header */}
      <section className="liquid-glass rounded-[26px] p-5 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Cửa hàng Vật phẩm Khoa &amp; Các Đợt Gây quỹ
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn sản phẩm theo từng đợt bán, kiểm tra tại Giỏ hàng và thanh toán qua VietQR hoặc COD.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="h-10 rounded-full sm:h-9">
              <Link to="/store/orders">
                <Receipt className="h-4 w-4" />
                <span>Đơn hàng của tôi</span>
              </Link>
            </Button>

            <Link
              to="/store/cart"
              className="liquid-glass-btn-cobalt inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-transform active:scale-[0.98] sm:h-9"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>
                Giỏ hàng (<span className="tabular-mono">{totalCount}</span>)
                {totalCount > 0 ? ` · ${formatVnd(totalAmount)}` : ""}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Dedicated Filter & Search Bar */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-full flex-wrap items-center gap-3">
          <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v)} className="max-w-full">
            <TabsList>
              <TabsTrigger value="ALL">Tất cả các đợt</TabsTrigger>
              <TabsTrigger value="MERCH">Vật phẩm Khoa</TabsTrigger>
              <TabsTrigger value="XTN_2027">Gây quỹ XTN 2027</TabsTrigger>
            </TabsList>
          </Tabs>

          <span className="hidden text-xs text-muted-foreground xl:inline">
            Nhận tại Văn phòng (0đ) · Giao phòng học cùng cơ sở (≤ 5kg)
          </span>
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm áo khoa, phụ kiện, đồ gây quỹ..."
            className="h-11 rounded-full bg-card/90 pl-9 text-base sm:h-10 sm:text-sm"
          />
        </div>
      </section>

      {addedToast && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {addedToast}
          </span>
          <div className="flex items-center gap-3">
            <Link to="/store/cart" className="text-xs font-semibold underline underline-offset-2">
              Mở Giỏ hàng ({totalCount})
            </Link>
            <button
              type="button"
              onClick={() => setAddedToast(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: Vật phẩm & Phụ kiện Khoa thường trực (FACULTY_MERCH) */}
      {(activeSection === "ALL" || activeSection === "MERCH") && filteredMerch.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-medium text-foreground">
                Vật phẩm &amp; Phụ kiện Khoa CNTT
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Đồng phục, áo khoác, dây đeo thẻ và quà lưu niệm thường trực · Không thuộc chiến dịch gây quỹ.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Vật phẩm thường trực
            </Badge>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMerch.map(renderProductCard)}
          </div>
        </section>
      )}

      {/* SECTION 2: Đợt Gây quỹ Xuân Tình Nguyện 2027 (FUNDRAISING_ITEM) */}
      {(activeSection === "ALL" || activeSection === "XTN_2027") && filteredFundraising.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <HeartHandshake className="mt-1 h-5 w-5 shrink-0 text-cal-deadline" />
              <div>
                <h2 className="font-display text-2xl font-medium text-foreground">
                  Đợt Gây quỹ Chiến dịch Xuân Tình Nguyện 2027
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Đồ ăn vặt &amp; thức uống gây quỹ · Toàn bộ lợi nhuận sau trừ giá vốn đóng góp trực tiếp vào quỹ XTN.
                </p>
              </div>
            </div>
            <Badge variant="calDeadline" className="rounded-full px-3 py-1">
              Chiến dịch gây quỹ
            </Badge>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFundraising.map(renderProductCard)}
          </div>
        </section>
      )}

      {((activeSection === "ALL" && filteredMerch.length === 0 && filteredFundraising.length === 0) ||
        (activeSection === "MERCH" && filteredMerch.length === 0) ||
        (activeSection === "XTN_2027" && filteredFundraising.length === 0)) && (
        <div className="rounded-[22px] border border-dashed border-border bg-card/80 px-6 py-12 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/70" />
          <p className="font-display text-lg font-medium text-foreground">
            {!hasAnyCatalogProducts && !normalizedQuery
              ? "Chưa có vật phẩm nào đang mở bán"
              : "Không tìm thấy sản phẩm phù hợp"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {!hasAnyCatalogProducts && !normalizedQuery
              ? "Các đợt mở bán vật phẩm Khoa và chiến dịch gây quỹ sẽ được cập nhật tại đây khi mở cổng."
              : "Thử đổi từ khóa tìm kiếm hoặc chọn sang nhóm sản phẩm khác."}
          </p>
        </div>
      )}

      {/* Floating Mobile Quick-Checkout Cart Bar above PWA Bottom Nav */}
      {totalCount > 0 && (
        <div className="fixed bottom-[5.5rem] left-3 right-3 z-20 md:hidden">
          <Link
            to="/store/cart"
            className="liquid-glass-btn-cobalt flex h-12 w-full items-center justify-between rounded-full px-5 text-sm font-semibold shadow-modal transition-transform active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Xem Giỏ hàng ({totalCount})</span>
            </span>
            <span className="tabular-mono">{formatVnd(totalAmount)} →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
