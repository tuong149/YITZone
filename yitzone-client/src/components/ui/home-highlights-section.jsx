import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Newspaper,
  Pin,
  RotateCcw,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEvents } from "@/features/events/api";
import { ALL_STORE_PRODUCTS } from "@/features/store/products-data";
import { formatVnd } from "@/stores/cart-store";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { DEFAULT_HOME_HIGHLIGHTS, useCmsStore } from "@/stores/cms-store";
import { useEventStore } from "@/stores/event-store";

function createEmptyHighlightSlots(existing) {
  return [0, 1, 2].map((idx) => {
    const found = existing[idx];
    if (found) return { ...found, id: `slot-${idx + 1}` };
    return {
      id: `slot-${idx + 1}`,
      sourceType: "EVENT",
      sourceId: "",
      category: "Nổi bật",
      title: "",
      meta: "",
      image: "/images/hero-campus.jpg",
      to: "/events"
    };
  });
}

export function HomeHighlightsSection() {
  const { data: apiEvents = [] } = useEvents();
  const storedEvents = useEventStore((s) => s.events);
  const articles = useCmsStore((s) => s.articles);
  const categories = useCmsStore((s) => s.categories);
  const homeHighlights = useCmsStore((s) => s.homeHighlights);
  const updateHomeHighlights = useCmsStore((s) => s.updateHomeHighlights);
  const resetHomeHighlights = useCmsStore((s) => s.resetHomeHighlights);

  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const canPinHighlights = isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.ADMIN_CMS);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => createEmptyHighlightSlots(homeHighlights));
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  const [sourceTab, setSourceTab] = useState("EVENT");

  const eventCandidates = useMemo(() => {
    const dynamicFromApi = apiEvents.map((ev) => {
      const dt = ev.startTime ? new Date(ev.startTime) : null;
      const dateStr = dt
        ? `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")} · ${dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
        : "Sắp diễn ra";
      return {
        sourceType: "EVENT",
        sourceId: ev.id,
        category: "Sự kiện",
        title: ev.title,
        meta: `${dateStr} · Khoa CNTT HCM-UTE`,
        image: "/images/card-hackathon.jpg",
        badges: ev.benefitTypes?.length ? ev.benefitTypes : undefined,
        to: `/events/${ev.id}`
      };
    });

    const seen = new Set(dynamicFromApi.map((e) => e.sourceId));
    const fromStore = storedEvents
      .filter((ev) => ev.status === "PUBLISHED" && !seen.has(ev.id))
      .map((ev) => ({
        sourceType: "EVENT",
        sourceId: ev.id,
        category: "Sự kiện",
        title: ev.title,
        meta: `${ev.dateSummary} · ${ev.location}`,
        image: ev.coverImage || "/images/hero-campus.jpg",
        badges: ev.benefits?.length ? ev.benefits : undefined,
        to: `/events/${ev.id}`
      }));

    return [...dynamicFromApi, ...fromStore];
  }, [apiEvents, storedEvents]);

  const articleCandidates = useMemo(
    () =>
      articles
        .filter((a) => a.status === "PUBLISHED")
        .map((a) => {
          const catName = categories.find((c) => c.id === a.categoryId)?.name ?? "Bản tin FIT";
          return {
            sourceType: "ARTICLE",
            sourceId: a.id,
            category: catName,
            title: a.title,
            meta: `${a.authorName} · ${a.readingMinutes} phút đọc`,
            image: a.coverImage,
            to: `/news/${a.slug}`
          };
        }),
    [articles, categories]
  );

  const productCandidates = useMemo(
    () =>
      ALL_STORE_PRODUCTS.map((p) => ({
        sourceType: "PRODUCT",
        sourceId: p.id,
        category: p.categoryLabel || "Cửa hàng",
        title: p.name,
        meta: `${formatVnd(p.promoPrice ?? p.listPrice)} · ${p.campaignLabel}`,
        image: p.image || "/images/card-hoodie.jpg",
        to: `/store/products/${p.id}`
      })),
    []
  );

  const campaignCandidates = useMemo(() => [], []);

  const currentCandidates = useMemo(() => {
    if (sourceTab === "EVENT") return eventCandidates;
    if (sourceTab === "ARTICLE") return articleCandidates;
    if (sourceTab === "PRODUCT") return productCandidates;
    return campaignCandidates;
  }, [sourceTab, eventCandidates, articleCandidates, productCandidates, campaignCandidates]);

  const activeSlot = draft[activeSlotIdx] ?? draft[0];

  const openEditor = () => {
    const nextDraft = createEmptyHighlightSlots(homeHighlights);
    setDraft(nextDraft);
    setActiveSlotIdx(0);
    setSourceTab(nextDraft[0]?.sourceType ?? "EVENT");
    setOpen(true);
  };

  const handleSelectSlot = (idx) => {
    setActiveSlotIdx(idx);
    setSourceTab(draft[idx]?.sourceType ?? "EVENT");
  };

  const handlePinCandidate = (candidate) => {
    setDraft((prev) =>
      prev.map((item, idx) =>
        idx === activeSlotIdx
          ? {
              ...candidate,
              id: item.id
            }
          : item
      )
    );
  };

  const handleSwapSlot = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      const temp = next[fromIdx];
      next[fromIdx] = next[toIdx];
      next[toIdx] = temp;
      return next;
    });
    setActiveSlotIdx(toIdx);
  };

  const handleCategoryLabelChange = (value) => {
    setDraft((prev) =>
      prev.map((item, idx) => (idx === activeSlotIdx ? { ...item, category: value } : item))
    );
  };

  const handleSave = () => {
    updateHomeHighlights(draft);
    setOpen(false);
  };

  const handleReset = () => {
    resetHomeHighlights();
    const cleared = createEmptyHighlightSlots(DEFAULT_HOME_HIGHLIGHTS);
    setDraft(cleared);
    setActiveSlotIdx(0);
    setSourceTab("EVENT");
  };

  if (homeHighlights.length === 0 && !canPinHighlights) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-medium text-foreground">
          Nổi bật tại Khoa CNTT
        </h2>

        {canPinHighlights && (
          <button
            type="button"
            onClick={openEditor}
            className="liquid-glass-pill yit-pressable inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-foreground hover:border-primary/45"
          >
            <Pin className="h-3.5 w-3.5 text-primary" />
            <span>Ghim mục nổi bật</span>
          </button>
        )}
      </div>

      {homeHighlights.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-border bg-card/60 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">Chưa có mục nổi bật nào được ghim</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sau khi xuất bản sự kiện, bài viết hoặc vật phẩm từ máy chủ, bấm &ldquo;Ghim mục nổi bật&rdquo; để đưa lên Trang chủ.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {homeHighlights.map((card) => (
            <Link
              key={card.id}
              to={card.to}
              className="yit-hover-hit group block rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="liquid-glass-card yit-hover-surface flex h-full flex-col overflow-hidden rounded-[22px] group-hover:border-primary/40">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                  <span className="liquid-glass-pill absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
                    {card.category}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 p-5">
                  <h3 className="font-display text-lg font-medium leading-snug text-foreground transition-colors duration-150 group-hover:text-primary">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{card.meta}</p>

                  {card.badges && card.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {card.badges.map((b) => (
                        <Badge key={b} variant="default">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {card.verified && (
                    <div className="pt-1">
                      <VerifiedBadge label="Xác thực Đoàn - Hội FIT" />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pinning Dialog (Permission-gated to ADMIN_CMS) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium">
              Chọn &amp; Ghim 3 Mục Nổi bật Trang chủ
            </DialogTitle>
            <DialogDescription>
              Chọn từng vị trí bên dưới rồi gắn bài viết, sự kiện, sản phẩm hoặc hoạt động phong trào có sẵn để hiển thị trên trang chủ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* 3 Slots Selector Strip */}
            <div className="grid gap-2.5 sm:grid-cols-3">
              {draft.map((slot, idx) => {
                const isSelected = idx === activeSlotIdx;
                return (
                  <div
                    key={slot.id}
                    onClick={() => handleSelectSlot(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectSlot(idx);
                      }
                    }}
                    className={cn(
                      "cursor-pointer overflow-hidden rounded-2xl border p-2.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/8 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-1">
                      <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px]">
                        Vị trí {idx + 1}
                      </Badge>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          aria-label={`Đẩy vị trí ${idx + 1} sang trái`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwapSlot(idx, idx - 1);
                          }}
                          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === draft.length - 1}
                          aria-label={`Đẩy vị trí ${idx + 1} sang phải`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwapSlot(idx, idx + 1);
                          }}
                          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <img
                        src={slot.image}
                        alt={slot.title || `Vị trí ${idx + 1}`}
                        className="h-11 w-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-primary">{slot.category}</p>
                        <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                          {slot.title || "Chưa chọn nội dung"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Slot Pill Label + Source Picker */}
            <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/25 p-3.5 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Tabs
                  value={sourceTab}
                  onValueChange={(v) => setSourceTab(v)}
                  className="max-w-full"
                >
                  <TabsList>
                    <TabsTrigger value="EVENT" className="gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Sự kiện</span>
                    </TabsTrigger>
                    <TabsTrigger value="ARTICLE" className="gap-1.5">
                      <Newspaper className="h-3.5 w-3.5" />
                      <span>Bài viết</span>
                    </TabsTrigger>
                    <TabsTrigger value="PRODUCT" className="gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Sản phẩm</span>
                    </TabsTrigger>
                    <TabsTrigger value="CAMPAIGN" className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Phong trào</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="w-full space-y-1 sm:w-44">
                  <Label htmlFor="highlight-pill-label" className="text-[11px] text-muted-foreground">
                    Nhãn góc ảnh (Vị trí {activeSlotIdx + 1})
                  </Label>
                  <Input
                    id="highlight-pill-label"
                    value={activeSlot.category}
                    onChange={(e) => handleCategoryLabelChange(e.target.value)}
                    placeholder="VD: Hackathon, Nổi bật"
                    className="h-9 rounded-xl bg-card text-sm"
                  />
                </div>
              </div>

              {currentCandidates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/70 px-4 py-8 text-center text-xs text-muted-foreground">
                  Chưa có mục xuất bản nào trong nhóm này từ hệ thống.
                </div>
              ) : (
                <div className="grid max-h-[240px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {currentCandidates.map((cand) => {
                    const isPinnedHere =
                      activeSlot.sourceType === cand.sourceType &&
                      activeSlot.sourceId === cand.sourceId;
                    return (
                      <button
                        key={`${cand.sourceType}-${cand.sourceId}`}
                        type="button"
                        onClick={() => handlePinCandidate(cand)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                          isPinnedHere
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <img
                          src={cand.image}
                          alt={cand.title}
                          className="h-12 w-16 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-semibold text-foreground">
                            {cand.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                            {cand.meta}
                          </p>
                        </div>
                        {isPinnedHere && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="rounded-full">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Bỏ ghim toàn bộ</span>
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-full">
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="liquid-glass-btn-cobalt rounded-full px-5"
              >
                <Check className="h-4 w-4" />
                <span>Lưu mục nổi bật</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
