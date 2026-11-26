import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Newspaper,
  Pin,
  Plus,
  QrCode,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { HomeHeroBanner } from "@/components/ui/home-hero-banner";
import { HomeHighlightsSection } from "@/components/ui/home-highlights-section";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { mergeStoredAndApiEvents, useEvents } from "@/features/events/api";
import {
  CancelRegistrationDialog,
  EventRegistrationDialog
} from "@/features/events/EventRegistrationDialog";
import { canViewInternalCtvEvents, hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { useEventStore } from "@/stores/event-store";

export function EventsPage() {
  const storedEvents = useEventStore((s) => s.events);
  const { data: apiEventsData } = useEvents();
  const registrations = useEventStore((s) => s.registrations);
  const registerForEvent = useEventStore((s) => s.registerForEvent);
  const cancelRegistration = useEventStore((s) => s.cancelRegistration);
  const homeSpotlight = useEventStore((s) => s.homeSpotlight);
  const updateHomeSpotlight = useEventStore((s) => s.updateHomeSpotlight);
  const articles = useCmsStore((s) => s.articles);
  const categories = useCmsStore((s) => s.categories);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const canSeeInternalCtv = canViewInternalCtvEvents(isAuthenticated, authorities, roleScopes);
  const canCustomizeSpotlight = isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.ADMIN_EVENTS);

  const allEvents = useMemo(
    () => mergeStoredAndApiEvents(storedEvents, apiEventsData),
    [storedEvents, apiEventsData]
  );

  const publishedPublicEvents = useMemo(
    () => allEvents.filter((e) => e.status === "PUBLISHED" && e.visibility !== "INTERNAL_CTV"),
    [allEvents]
  );

  const spotlightEvent = useMemo(() => {
    if (homeSpotlight.eventId) {
      const pinned = allEvents.find(
        (e) => e.id === homeSpotlight.eventId && e.status === "PUBLISHED"
      );
      if (pinned) return pinned;
    }
    return publishedPublicEvents[0] ?? null;
  }, [allEvents, publishedPublicEvents, homeSpotlight.eventId]);

  const registered = Boolean(spotlightEvent && registrations[spotlightEvent.id]);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [spotlightDialogOpen, setSpotlightDialogOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const activeFilter = !canSeeInternalCtv && filter === "INTERNAL" ? "ALL" : filter;

  const spotlightFillPercent = useMemo(() => {
    if (!spotlightEvent || !spotlightEvent.capacity || spotlightEvent.capacity <= 0) return 0;
    return Math.min(100, Math.round((spotlightEvent.registeredCount / spotlightEvent.capacity) * 100));
  }, [spotlightEvent]);
  const remainingSlots =
    spotlightEvent && spotlightEvent.capacity > 0
      ? Math.max(0, spotlightEvent.capacity - spotlightEvent.registeredCount)
      : null;
  const isAlmostFull = remainingSlots !== null && remainingSlots > 0 && spotlightFillPercent >= 85;
  const isSoldOut = remainingSlots === 0 && (spotlightEvent?.capacity ?? 0) > 0;
  const showSpotlightCover = Boolean(homeSpotlight.showCoverImage && spotlightEvent?.coverImage);

  const filterOptions = useMemo(() => {
    const base = [
      { id: "ALL", label: "Tất cả" },
      { id: "DRL", label: "Cộng ĐRL" },
      { id: "CDDN", label: "Cộng CĐDN" }
    ];
    if (canSeeInternalCtv) {
      base.push({ id: "INTERNAL", label: "Nội bộ CTV" });
    }
    return base;
  }, [canSeeInternalCtv]);

  const publishedNews = useMemo(
    () => articles.filter((a) => a.status === "PUBLISHED").slice(0, 3),
    [articles]
  );

  const weeklyScheduleItems = useMemo(() => {
    return allEvents
      .filter(
        (e) =>
          (e.status === "PUBLISHED" || e.status === "ONGOING") &&
          (canSeeInternalCtv || e.visibility !== "INTERNAL_CTV")
      )
      .slice(0, 4)
      .map((e) => {
        const isInternal = e.visibility === "INTERNAL_CTV";
        const isTeam = Boolean(e.isTeamCompetition);
        return {
          id: e.id,
          title: e.title,
          time: e.timeShort || `${e.day}/${e.month}`,
          dotClass: isInternal
            ? "bg-cal-dept"
            : isTeam
              ? "bg-cal-exam"
              : "bg-cal-faculty",
          rowClass: isInternal
            ? "bg-cal-dept/12 text-foreground"
            : isTeam
              ? "bg-cal-exam/12 text-foreground"
              : "bg-cal-faculty/12 text-foreground"
        };
      });
  }, [allEvents, canSeeInternalCtv]);

  const upcomingEvents = useMemo(() => {
    const base = allEvents
      .filter((e) => e.status === "PUBLISHED" && e.id !== spotlightEvent?.id)
      .map((e) => ({
        id: e.id,
        day: e.day,
        month: e.month,
        title: e.title,
        time: e.timeShort,
        location: e.location,
        visibility: e.visibility,
        benefits: e.benefits ?? [],
        slots:
          e.capacity === 0
            ? `${e.registeredCount} đã ĐK`
            : `${e.registeredCount} / ${e.capacity}${e.isTeamCompetition ? " đội" : ""}`
      }));

    return base.filter((ev) => {
      if (!canSeeInternalCtv && ev.visibility === "INTERNAL_CTV") return false;
      if (activeFilter === "ALL") return true;
      if (activeFilter === "INTERNAL") return ev.visibility === "INTERNAL_CTV";
      if (activeFilter === "DRL") return ev.benefits.some((b) => b.includes("ĐRL") || b === "DRL");
      if (activeFilter === "CDDN") return ev.benefits.some((b) => b.includes("CĐDN") || b === "CDDN");
      return true;
    });
  }, [allEvents, spotlightEvent?.id, activeFilter, canSeeInternalCtv]);

  const ticketQuickLink = spotlightEvent
    ? `/scanner?tab=ticket&eventId=${encodeURIComponent(spotlightEvent.id)}`
    : "/scanner?tab=ticket";

  return (
    <div className="space-y-10">
      {/* Shared Unified Full-Bleed Hero Banner across all roles */}
      <HomeHeroBanner />

      {/* Actionable Personal Strip for Authenticated Students (A6) */}
      {isAuthenticated && (
        <section aria-label="Việc của tôi hôm nay" className="grid gap-3.5 sm:grid-cols-3">
          <Link
            to={ticketQuickLink}
            className="yit-hover-hit group block rounded-[20px]"
          >
            <div className="liquid-glass-card yit-hover-surface flex h-full items-center justify-between gap-3 rounded-[20px] p-4 group-hover:border-primary/45">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-primary">1. Vé sự kiện sắp tới</div>
                <div className="line-clamp-1 text-sm font-medium text-foreground">
                  {spotlightEvent ? spotlightEvent.title : "Xem vé sự kiện đã đăng ký"}
                </div>
                <div className="text-xs text-muted-foreground">Mở Vé QR cá nhân 15 giây</div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary transition-transform duration-150 group-hover:scale-105">
                <QrCode className="h-5 w-5" />
              </span>
            </div>
          </Link>

          <Link
            to="/surveys"
            className="yit-hover-hit group block rounded-[20px]"
          >
            <div className="liquid-glass-card yit-hover-surface flex h-full items-center justify-between gap-3 rounded-[20px] p-4 group-hover:border-primary/45">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-status-warning">2. Khảo sát mở khóa E-Cert</div>
                <div className="text-sm font-medium text-foreground">
                  Kiểm tra phiếu khảo sát sau sự kiện
                </div>
                <div className="text-xs text-muted-foreground">Hoàn tất trong 24h sau sự kiện</div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-warning/15 text-status-warning transition-transform duration-150 group-hover:scale-105">
                <ClipboardList className="h-5 w-5" />
              </span>
            </div>
          </Link>

          <Link
            to="/me/certificates"
            className="yit-hover-hit group block rounded-[20px]"
          >
            <div className="liquid-glass-card yit-hover-surface flex h-full items-center justify-between gap-3 rounded-[20px] p-4 group-hover:border-primary/45">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-status-success">3. Ví Chứng nhận E-Certificate</div>
                <div className="text-sm font-medium text-foreground">
                  Tra cứu chứng nhận &amp; quyền lợi đã cấp
                </div>
                <div className="text-xs text-muted-foreground">Tra cứu nhãn Cộng ĐRL / CTXH / CĐDN</div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success/15 text-status-success transition-transform duration-150 group-hover:scale-105">
                <Award className="h-5 w-5" />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Tier 1: Asymmetric 65 / 35 Flagship Event Registration + Weekly 6-Color Schedule */}
      <section id="events-spotlight" className="grid gap-5 lg:grid-cols-12">
        <div className="liquid-glass-card relative flex flex-col overflow-hidden rounded-[22px] lg:col-span-8">
          {!spotlightEvent ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h2 className="font-display text-2xl font-medium text-foreground">
                  Chưa có sự kiện tiêu điểm đang mở đăng ký
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Các hội thảo, cuộc thi học thuật và hoạt động phong trào của Khoa CNTT sẽ được ghim tại đây ngay khi mở cổng đăng ký.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <Button asChild className="liquid-glass-btn-cobalt rounded-full px-5">
                  <Link to="/events">
                    <span>Xem Cổng Sự kiện</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                {canCustomizeSpotlight && (
                  <>
                    <Button asChild variant="outline" className="rounded-full px-4">
                      <Link to="/admin/events/new">
                        <Plus className="h-4 w-4" />
                        <span>Tạo sự kiện mới</span>
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full px-4"
                      onClick={() => setSpotlightDialogOpen(true)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Tùy chỉnh Spotlight</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Optional Event Cover Image Header */}
              {showSpotlightCover && (
                <div className="relative h-44 w-full shrink-0 overflow-hidden bg-muted sm:h-52">
                  <img
                    src={spotlightEvent.coverImage}
                    alt={spotlightEvent.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090d16]/75 via-[#090d16]/20 to-transparent" />
                  <div className="absolute inset-x-4 top-3.5 flex items-center justify-between gap-2 sm:inset-x-6">
                    <span className="liquid-glass-on-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isSoldOut
                        ? "Đã hết chỗ · Mở Waitlist"
                        : isAlmostFull
                          ? `Sắp hết chỗ · Còn ${remainingSlots} suất`
                          : "Đang mở đăng ký"}
                    </span>
                    {canCustomizeSpotlight && (
                      <button
                        type="button"
                        onClick={() => setSpotlightDialogOpen(true)}
                        className="liquid-glass-on-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/25"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Tùy chỉnh</span>
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-3.5 left-4 right-4 flex flex-wrap items-center gap-1.5 sm:left-6 sm:right-6">
                    {(spotlightEvent.benefits ?? []).map((b) => (
                      <span
                        key={b}
                        className="liquid-glass-on-dark rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-7">
                <div className="space-y-3">
                  {!showSpotlightCover && (
                    <div className="flex flex-wrap items-center gap-2">
                      {(spotlightEvent.benefits ?? []).map((b) => (
                        <Badge key={b} variant="default" className="rounded-full">
                          {b}
                        </Badge>
                      ))}
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-status-info/30 bg-status-info/10 px-3 py-1 text-xs font-medium text-status-info">
                          <Sparkles className="h-3.5 w-3.5" />
                          {isSoldOut
                            ? "Đã hết chỗ · Mở Waitlist"
                            : isAlmostFull
                              ? `Sắp hết chỗ · Còn ${remainingSlots} suất`
                              : "Đang mở đăng ký"}
                        </span>
                        {canCustomizeSpotlight && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-full px-2.5 text-xs"
                            onClick={() => setSpotlightDialogOpen(true)}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span>Tùy chỉnh</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <h2 className="max-w-2xl font-display text-2xl font-medium leading-[1.2] tracking-tight text-foreground sm:text-3xl">
                    <Link
                      to={`/events/${spotlightEvent.id}`}
                      className="transition-colors hover:text-primary"
                    >
                      {spotlightEvent.title}
                    </Link>
                  </h2>

                  <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {spotlightEvent.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                      <span className="tabular-mono">{spotlightEvent.dateSummary}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span>{spotlightEvent.location}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/60 pt-4">
                  {homeSpotlight.showCapacityBar && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      {spotlightEvent.capacity > 0 ? (
                        <>
                          <div className="h-2 min-w-[160px] max-w-xs flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full w-full origin-left rounded-full transition-[transform,background-color] duration-500 ease-out",
                                isSoldOut
                                  ? "bg-status-danger"
                                  : isAlmostFull
                                    ? "bg-status-warning"
                                    : "bg-primary"
                              )}
                              style={{ transform: `scaleX(${spotlightFillPercent / 100})` }}
                            />
                          </div>
                          <span className="tabular-mono shrink-0 text-xs font-semibold text-foreground sm:text-sm">
                            {spotlightEvent.registeredCount} / {spotlightEvent.capacity}{" "}
                            {spotlightEvent.isTeamCompetition ? "đội" : "chỗ"}
                          </span>
                          <span className="tabular-mono text-xs text-muted-foreground">
                            ({spotlightFillPercent}%)
                          </span>
                        </>
                      ) : (
                        <span className="tabular-mono text-xs font-medium text-muted-foreground">
                          {spotlightEvent.registeredCount} người đã đăng ký · Không giới hạn chỗ
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    {!isAuthenticated ? (
                      <>
                        <Link
                          to="/login"
                          className="liquid-glass-btn-cobalt inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all active:scale-[0.98] sm:w-auto"
                        >
                          <span>Đăng nhập để đăng ký</span>
                        </Link>
                        <Link
                          to={`/events/${spotlightEvent.id}`}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto"
                        >
                          <span>Xem chi tiết</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </>
                    ) : registered ? (
                      <>
                        <Link
                          to={`/scanner?tab=ticket&eventId=${encodeURIComponent(spotlightEvent.id)}`}
                          className="liquid-glass-btn-cobalt inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all active:scale-[0.98] sm:w-auto"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>Mở Vé QR</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCancelDialogOpen(true)}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-status-success/35 bg-status-success/10 px-5 text-sm font-medium text-status-success transition-colors hover:bg-status-success/15 sm:w-auto"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Đã giữ chỗ · Hủy ĐK</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              spotlightEvent.formMode === "CUSTOM_FORM" &&
                              (spotlightEvent.formFields ?? []).length > 0
                            ) {
                              setFormDialogOpen(true);
                            } else {
                              registerForEvent(spotlightEvent.id);
                            }
                          }}
                          className="liquid-glass-btn-cobalt inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all active:scale-[0.98] sm:w-auto"
                        >
                          <span>
                            {spotlightEvent.formMode === "CUSTOM_FORM" &&
                            (spotlightEvent.formFields ?? []).length > 0
                              ? "Điền biểu mẫu đăng ký"
                              : "Đăng ký 1 chạm"}
                          </span>
                        </button>
                        <Link
                          to={`/events/${spotlightEvent.id}`}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto"
                        >
                          <span>Xem chi tiết</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="liquid-glass-card flex flex-col justify-between rounded-[22px] p-5 lg:col-span-4">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-foreground">Lịch tuần này</h2>
              <span className="tabular-mono text-xs text-muted-foreground">6 màu</span>
            </div>

            {weeklyScheduleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
                <CalendarDays className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Chưa có lịch hoạt động trong tuần này
                </p>
                <p className="text-xs text-muted-foreground">
                  Mở Lịch hoạt động để tra cứu toàn bộ sự kiện, lịch ca trực và hạn chót phong trào.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {weeklyScheduleItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/events/${item.id}`}
                    className={`flex items-center justify-between gap-2 rounded-xl border border-white/50 px-3.5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 dark:border-white/10 ${item.rowClass}`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClass}`} />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="shrink-0 tabular-mono text-xs text-muted-foreground">
                      {item.time}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/calendar"
            className="liquid-glass-pill yit-pressable group mt-4 flex h-11 items-center justify-between rounded-full px-4 text-sm font-semibold text-foreground hover:border-primary/45"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Mở Lịch hoạt động đầy đủ</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </div>
      </section>

      {/* Tier 2: Pin-curated 3 Editorial Highlights (Events, News, Store, Campaigns) */}
      <HomeHighlightsSection />

      {/* Tier 3: Editorial 7 / 5 Split — Upcoming Events + Published CMS News (UC-CMS-02) */}
      <section className="grid gap-8 lg:grid-cols-12">
        {/* Left 7 Cols: Open-canvas Event Stream */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl font-medium text-foreground">
              Sự kiện đang mở đăng ký
            </h2>
            <div className="scroll-x-pills flex max-w-full items-center gap-1.5 pb-1 sm:flex-wrap sm:pb-0">
              {filterOptions.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "yit-pressable shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-1",
                    activeFilter === f.id
                      ? "bg-primary text-primary-foreground shadow-floating"
                      : "bg-card/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-border bg-card/80 px-6 py-10 text-center">
              <CalendarDays className="h-6 w-6 text-primary/80" />
              <p className="font-display text-base font-medium text-foreground">
                Chưa có sự kiện nào đang mở đăng ký trong danh sách này
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Kiểm tra lại bộ lọc quyền lợi hoặc mở Cổng Sự kiện để xem toàn bộ hoạt động của Khoa CNTT.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/80 rounded-[22px] border border-border bg-card/90">
              {upcomingEvents.map((ev, index) => (
                <Link
                  key={`${activeFilter}-${ev.id}`}
                  to={`/events/${ev.id}`}
                  style={{ "--stagger-index": Math.min(index, 5) }}
                  className="yit-list-item-motion group flex items-start gap-3.5 px-4 py-4 transition-colors duration-150 first:rounded-t-[22px] last:rounded-b-[22px] hover:bg-muted/45 sm:items-center sm:gap-4 sm:px-5"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="tabular-mono text-base font-semibold leading-none">{ev.day}</span>
                    <span className="mt-0.5 text-[10px] font-semibold tracking-wide">{ev.month}</span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-2 font-display text-base font-medium leading-snug text-foreground transition-colors group-hover:text-primary sm:truncate">
                        {ev.title}
                      </span>
                      {ev.visibility === "INTERNAL_CTV" && <Badge variant="calDept">Nội bộ Ban</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="tabular-mono">{ev.time}</span>
                      <span>·</span>
                      <span>{ev.location}</span>
                      {ev.benefits.map((b) => (
                        <Badge key={b} variant="secondary" className="py-0 text-[10px]">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <span className="tabular-mono text-xs font-medium text-muted-foreground">{ev.slots}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Published CMS News Stream */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-medium text-foreground">Bản tin mới</h2>
            <Link to="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <span>Tất cả bài viết</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {publishedNews.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-border bg-card/80 px-6 py-10 text-center">
              <Newspaper className="h-6 w-6 text-primary/80" />
              <p className="font-display text-base font-medium text-foreground">
                Chưa có bản tin mới được xuất bản
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Các thông báo học thuật, tổng kết sự kiện và tin tức phong trào sẽ được cập nhật tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {publishedNews.map((article) => {
                const catName =
                  categories.find((c) => c.id === article.categoryId)?.name ?? "Bản tin FIT";
                return (
                  <Link
                    key={article.id}
                    to={`/news/${article.slug}`}
                    className="yit-pressable group flex items-center gap-3.5 rounded-[18px] border border-border bg-card/90 p-3 hover:border-primary/40 hover:shadow-floating"
                  >
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-primary">
                        <span className="truncate">{catName}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1 font-normal text-muted-foreground tabular-mono">
                          <Clock className="h-3 w-3" />
                          {article.readingMinutes}p
                        </span>
                      </div>
                      <h3 className="line-clamp-2 font-display text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {spotlightEvent && (
        <>
          <EventRegistrationDialog
            event={spotlightEvent}
            open={formDialogOpen}
            onOpenChange={setFormDialogOpen}
            onSubmitted={(answers) => registerForEvent(spotlightEvent.id, answers)}
          />
          <CancelRegistrationDialog
            eventTitle={spotlightEvent.title}
            lockNote={spotlightEvent.lockNote}
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onConfirm={() => cancelRegistration(spotlightEvent.id)}
          />
        </>
      )}

      {canCustomizeSpotlight && (
        <Dialog open={spotlightDialogOpen} onOpenChange={setSpotlightDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
                <Pin className="h-4 w-4 text-primary" />
                <span>Tùy chỉnh Sự kiện nổi bật Trang chủ</span>
              </DialogTitle>
              <DialogDescription>
                Chọn sự kiện công khai muốn ghim lên vị trí Spotlight và tùy chỉnh cách hiển thị trên Trang chủ.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="home-spotlight-select">Sự kiện đang ghim</Label>
                <Select
                  value={homeSpotlight.eventId ?? "__AUTO__"}
                  onValueChange={(value) =>
                    updateHomeSpotlight({ eventId: value === "__AUTO__" ? null : value })
                  }
                >
                  <SelectTrigger id="home-spotlight-select" className="h-10 rounded-xl">
                    <SelectValue placeholder="Chọn sự kiện nổi bật" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__AUTO__">
                      Tự động chọn sự kiện sắp diễn ra gần nhất
                    </SelectItem>
                    {publishedPublicEvents.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.title} ({ev.day}/{ev.month})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                <div className="flex items-center justify-between gap-4 p-3.5">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">Hiển thị ảnh bìa sự kiện</div>
                    <p className="text-xs text-muted-foreground">
                      Hiển thị ảnh cover phía trên thẻ Spotlight để tăng điểm nhấn thị giác.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(homeSpotlight.showCoverImage)}
                    onCheckedChange={(checked) => updateHomeSpotlight({ showCoverImage: checked })}
                    aria-label="Hiển thị ảnh bìa sự kiện nổi bật"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 p-3.5">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">Hiển thị thanh tiến độ chỗ ngồi</div>
                    <p className="text-xs text-muted-foreground">
                      Hiển thị tỷ lệ đã đăng ký và số suất còn lại trực tiếp trên thẻ.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(homeSpotlight.showCapacityBar)}
                    onCheckedChange={(checked) => updateHomeSpotlight({ showCapacityBar: checked })}
                    aria-label="Hiển thị thanh tiến độ chỗ ngồi"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild type="button" variant="outline" size="sm" className="rounded-full">
                <Link to="/admin/events" onClick={() => setSpotlightDialogOpen(false)}>
                  Quản lý toàn bộ sự kiện
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => setSpotlightDialogOpen(false)}
              >
                Xong
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
