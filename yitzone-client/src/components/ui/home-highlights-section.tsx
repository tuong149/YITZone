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
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  DEFAULT_HOME_HIGHLIGHTS,
  useCmsStore,
  type HomeHighlightItem,
  type HomeHighlightSourceType
} from "@/stores/cms-store";

interface HighlightCandidate {
  sourceType: HomeHighlightSourceType;
  sourceId: string;
  category: string;
  title: string;
  meta: string;
  image: string;
  to: string;
  badges?: string[];
  verified?: boolean;
}

const STATIC_EVENT_CANDIDATES: HighlightCandidate[] = [
  {
    sourceType: "EVENT",
    sourceId: "EVT-2026-HACK",
    category: "Hackathon",
    title: "UTE Hackathon 2026: Smart Campus",
    meta: "Thứ 7, 12/12 · 08:00 · Sảnh A HCM-UTE",
    image: "/images/card-hackathon.jpg",
    badges: ["Cộng ĐRL", "Cộng CĐDN"],
    to: "/events/EVT-2026-HACK"
  },
  {
    sourceType: "EVENT",
    sourceId: "EVT-2026-CLOUD",
    category: "Hội thảo",
    title: "Hội thảo Cloud Native & DevOps 2026",
    meta: "Thứ 7, 28/11 · 08:00 · Hội trường Lớn HCM-UTE",
    image: "/images/hero-campus.jpg",
    badges: ["Cộng ĐRL", "Cộng CĐDN"],
    to: "/events/EVT-2026-CLOUD"
  },
  {
    sourceType: "EVENT",
    sourceId: "EVT-2026-DIST",
    category: "Tech Talk",
    title: "FIT Tech Talk: Kiến trúc Hệ thống Phân tán & Kafka",
    meta: "Thứ 5, 03/12 · 18:00 · Phòng A5-302",
    image: "/images/card-hackathon.jpg",
    badges: ["Cộng ĐRL", "Cộng CĐDN"],
    to: "/events/EVT-2026-DIST"
  },
  {
    sourceType: "EVENT",
    sourceId: "EVT-2026-VOL",
    category: "Tình nguyện",
    title: "Ngày hội Hiến máu Nhân đạo & Tiếp sức Mùa thi",
    meta: "Chủ Nhật, 06/12 · 07:30 · Sảnh Khu E HCM-UTE",
    image: "/images/hero-campus.jpg",
    badges: ["Cộng CTXH", "Cộng ĐRL"],
    to: "/events/EVT-2026-VOL"
  }
];

const PRODUCT_CANDIDATES: HighlightCandidate[] = [
  {
    sourceType: "PRODUCT",
    sourceId: "prd-hoodie",
    category: "Cửa hàng",
    title: "Áo khoác Hoodie FIT HCM-UTE 2026",
    meta: "320.000đ · Vật phẩm Khoa thường trực · Pre-order Đợt 2",
    image: "/images/card-hoodie.jpg",
    to: "/store"
  },
  {
    sourceType: "PRODUCT",
    sourceId: "prd-polo",
    category: "Cửa hàng",
    title: "Áo Polo Khoa CNTT (Tech Knit)",
    meta: "185.000đ · Ưu đãi Tân SV · Nhận tại Văn phòng",
    image: "/images/card-hoodie.jpg",
    to: "/store"
  },
  {
    sourceType: "PRODUCT",
    sourceId: "prd-combo-xtn",
    category: "Xuân Tình Nguyện",
    title: "Combo Tiếp sức Ôn thi (Bánh tráng + Trà tắc + Khô gà)",
    meta: "109.000đ · Tiết kiệm 16k · Gây quỹ XTN 2027",
    image: "/images/hero-campus.jpg",
    to: "/store"
  }
];

const CAMPAIGN_CANDIDATES: HighlightCandidate[] = [
  {
    sourceType: "CAMPAIGN",
    sourceId: "camp-sv5t",
    category: "SV5T",
    title: "Lễ Tuyên dương Sinh viên 5 tốt",
    meta: "Cấp Liên chi hội Khoa & Trường · Đợt xét 2026",
    image: "/images/card-sv5t.jpg",
    verified: true,
    to: "/public/honor-roll"
  },
  {
    sourceType: "CAMPAIGN",
    sourceId: "camp-voting",
    category: "Bình chọn",
    title: "Bình chọn Mẫu Áo Khoa CNTT & Đêm Gala FIT 2026",
    meta: "Cổng bình chọn trực tuyến & tại hội trường đang mở",
    image: "/images/card-sv5t.jpg",
    to: "/voting"
  },
  {
    sourceType: "CAMPAIGN",
    sourceId: "camp-minigame",
    category: "Minigame",
    title: "Đấu trường Công nghệ FIT 2026",
    meta: "Tham gia trả lời nhanh, tích lũy Streak & vinh danh Top",
    image: "/images/card-hackathon.jpg",
    to: "/minigame"
  },
  {
    sourceType: "CAMPAIGN",
    sourceId: "camp-oj",
    category: "Học thuật",
    title: "Hệ thống Luyện tập Lập trình FIT Online Judge",
    meta: "Luyện tập thuật toán, chấm bài tự động chuẩn ICPC",
    image: "/images/card-hackathon.jpg",
    to: "/oj"
  }
];

export function HomeHighlightsSection() {
  const { data: apiEvents = [] } = useEvents();
  const articles = useCmsStore((s) => s.articles);
  const categories = useCmsStore((s) => s.categories);
  const homeHighlights = useCmsStore((s) => s.homeHighlights);
  const updateHomeHighlights = useCmsStore((s) => s.updateHomeHighlights);
  const resetHomeHighlights = useCmsStore((s) => s.resetHomeHighlights);

  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const canPinHighlights = isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.ADMIN_CMS);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<HomeHighlightItem[]>(homeHighlights);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [sourceTab, setSourceTab] = useState<HomeHighlightSourceType>("EVENT");

  const eventCandidates = useMemo<HighlightCandidate[]>(() => {
    const dynamicFromApi: HighlightCandidate[] = apiEvents.map((ev) => {
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
    return [...dynamicFromApi, ...STATIC_EVENT_CANDIDATES.filter((e) => !seen.has(e.sourceId))];
  }, [apiEvents]);

  const articleCandidates = useMemo<HighlightCandidate[]>(
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

  const currentCandidates = useMemo(() => {
    if (sourceTab === "EVENT") return eventCandidates;
    if (sourceTab === "ARTICLE") return articleCandidates;
    if (sourceTab === "PRODUCT") return PRODUCT_CANDIDATES;
    return CAMPAIGN_CANDIDATES;
  }, [sourceTab, eventCandidates, articleCandidates]);

  const activeSlot = draft[activeSlotIdx] ?? draft[0]!;

  const openEditor = () => {
    setDraft(homeHighlights);
    setActiveSlotIdx(0);
    setSourceTab(homeHighlights[0]?.sourceType ?? "EVENT");
    setOpen(true);
  };

  const handleSelectSlot = (idx: number) => {
    setActiveSlotIdx(idx);
    setSourceTab(draft[idx]?.sourceType ?? "EVENT");
  };

  const handlePinCandidate = (candidate: HighlightCandidate) => {
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

  const handleSwapSlot = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      const temp = next[fromIdx]!;
      next[fromIdx] = next[toIdx]!;
      next[toIdx] = temp;
      return next;
    });
    setActiveSlotIdx(toIdx);
  };

  const handleCategoryLabelChange = (value: string) => {
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
    setDraft(DEFAULT_HOME_HIGHLIGHTS);
    setActiveSlotIdx(0);
    setSourceTab(DEFAULT_HOME_HIGHLIGHTS[0]!.sourceType);
  };

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
            className="liquid-glass-pill inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            <Pin className="h-3.5 w-3.5 text-primary" />
            <span>Ghim mục nổi bật</span>
          </button>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {homeHighlights.map((card) => (
          <Link
            key={card.id}
            to={card.to}
            className="liquid-glass-card group overflow-hidden rounded-[22px] transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="liquid-glass-pill absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
                {card.category}
              </span>
            </div>

            <div className="space-y-2.5 p-5">
              <h3 className="font-display text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
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
          </Link>
        ))}
      </div>

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
                        alt={slot.title}
                        className="h-11 w-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-primary">{slot.category}</p>
                        <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                          {slot.title}
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
                  onValueChange={(v) => setSourceTab(v as HomeHighlightSourceType)}
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
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="rounded-full">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Khôi phục mặc định</span>
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
                <span>Lưu 3 mục nổi bật</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
