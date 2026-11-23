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
  QrCode,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HomeHeroBanner } from "@/components/ui/home-hero-banner";
import { HomeHighlightsSection } from "@/components/ui/home-highlights-section";
import {
  CancelRegistrationDialog,
  EventRegistrationDialog
} from "@/features/events/EventRegistrationDialog";
import { canViewInternalCtvEvents } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { useEventStore } from "@/stores/event-store";
import { cn } from "@/lib/utils";

const WEEKLY_SCHEDULE = [
  {
    id: "cal-1",
    title: "Sự kiện Khoa · Cloud Native",
    time: "T7 · 08:00",
    dotClass: "bg-cal-faculty",
    rowClass: "bg-cal-faculty/12 text-foreground"
  },
  {
    id: "cal-2",
    title: "Trực Văn phòng Ca 3 (OFIT)",
    time: "T4 · 13:30",
    dotClass: "bg-cal-office",
    rowClass: "bg-cal-office/12 text-foreground"
  },
  {
    id: "cal-3",
    title: "Tổng duyệt Văn nghệ (ARTIT)",
    time: "T5 · 18:00",
    dotClass: "bg-cal-arts",
    rowClass: "bg-cal-arts/12 text-foreground"
  },
  {
    id: "cal-4",
    title: "Thi lập trình Online Judge",
    time: "CN · 09:00",
    dotClass: "bg-cal-exam",
    rowClass: "bg-cal-exam/12 text-foreground"
  }
];

interface UpcomingEventCard {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
  location: string;
  visibility: "PUBLIC_FACULTY" | "INTERNAL_CTV";
  benefits: string[];
  slots: string;
}

const FALLBACK_UPCOMING: UpcomingEventCard[] = [
  {
    id: "EVT-2026-DIST",
    day: "03",
    month: "TH12",
    title: "FIT Tech Talk: Kiến trúc Hệ thống Phân tán & Kafka",
    time: "Thứ 5 · 18:00",
    location: "Phòng A5-302",
    visibility: "PUBLIC_FACULTY",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    slots: "112 / 150"
  },
  {
    id: "EVT-2026-VOL",
    day: "06",
    month: "TH12",
    title: "Ngày hội Hiến máu Nhân đạo & Tiếp sức Mùa thi",
    time: "Chủ Nhật · 07:30",
    location: "Sảnh Khu E HCM-UTE",
    visibility: "PUBLIC_FACULTY",
    benefits: ["Cộng CTXH", "Cộng ĐRL"],
    slots: "240 / 300"
  },
  {
    id: "EVT-2026-OFIT",
    day: "09",
    month: "TH12",
    title: "Tập huấn Quét mã vạch & Kiểm kê Tài sản Văn phòng",
    time: "Thứ 4 · 17:30",
    location: "Văn phòng Đoàn - Hội FIT",
    visibility: "INTERNAL_CTV",
    benefits: [],
    slots: "28 / 40"
  }
];

export function EventsPage(){
  const storedEvents = useEventStore((s) => s.events);
  const registrations = useEventStore((s) => s.registrations);
  const registerForEvent = useEventStore((s) => s.registerForEvent);
  const cancelRegistration = useEventStore((s) => s.cancelRegistration);
  const articles = useCmsStore((s) => s.articles);
  const categories = useCmsStore((s) => s.categories);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const canSeeInternalCtv = canViewInternalCtvEvents(isAuthenticated, authorities, roleScopes);

  const spotlightEvent = useMemo(
    () => storedEvents.find((e) => e.id === "EVT-2026-CLOUD") ?? storedEvents[0],
    [storedEvents]
  );
  const registered = Boolean(spotlightEvent && registrations[spotlightEvent.id]);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "DRL" | "CDDN" | "INTERNAL">("ALL");
  const activeFilter = !canSeeInternalCtv && filter === "INTERNAL" ? "ALL" : filter;

  const filterOptions = useMemo(() => {
    const base: Array<{ id: "ALL" | "DRL" | "CDDN" | "INTERNAL"; label: string }> = [
      { id: "ALL", label: "Tất cả" },
      { id: "DRL", label: "Cộng ĐRL" },
      { id: "CDDN", label: "Cộng CĐDN" }
    ];
    if (canSeeInternalCtv) {
      base.push({ id: "INTERNAL", label: "Nội bộ CTV" });
    }
    return base;
  }, [canSeeInternalCtv]);

  const publishedNews = useMemo(() => articles.filter((a) => a.status === "PUBLISHED").slice(0, 3),
    [articles]
  );

  const upcomingEvents = useMemo<UpcomingEventCard[]>(() => {
    const base: UpcomingEventCard[] =
      storedEvents.length > 0
        ? storedEvents
            .filter((e) => e.status === "PUBLISHED" && e.id !== spotlightEvent?.id)
            .map((e) => ({
              id: e.id,
              day: e.day,
              month: e.month,
              title: e.title,
              time: e.timeShort,
              location: e.location,
              visibility: e.visibility,
              benefits: e.benefits,
              slots:
                e.capacity === 0
                  ? `${e.registeredCount} đã ĐK`
                  : `${e.registeredCount} / ${e.capacity}${e.isTeamCompetition ? " đội" : ""}`
            }))
        : FALLBACK_UPCOMING;

    return base.filter((ev) => {
      if (!canSeeInternalCtv && ev.visibility === "INTERNAL_CTV") return false;
      if (activeFilter === "ALL") return true;
      if (activeFilter === "INTERNAL") return ev.visibility === "INTERNAL_CTV";
      if (activeFilter === "DRL") return ev.benefits.some((b) => b.includes("ĐRL") || b === "DRL");
      if (activeFilter === "CDDN") return ev.benefits.some((b) => b.includes("CĐDN") || b === "CDDN");
      return true;
    });
  }, [storedEvents, spotlightEvent?.id, activeFilter, canSeeInternalCtv]);

  return (
    <div className="space-y-10">
      {/* Shared Unified Full-Bleed Hero Banner across all roles */}
      <HomeHeroBanner />

      {/* Actionable Personal Strip for Authenticated Students (A6) */}
      {isAuthenticated && (
        <section aria-label="Việc của tôi hôm nay" className="grid gap-3.5 sm:grid-cols-3">
          <Link
            to={`/scanner?tab=ticket&eventId=${spotlightEvent?.id ?? "EVT-2026-CLOUD"}`}
            className="liquid-glass-card flex items-center justify-between gap-3 rounded-[20px] p-4 transition-colors hover:border-primary/45"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-primary">1. Vé sự kiện sắp tới</div>
              <div className="text-sm font-medium text-foreground">
                {spotlightEvent?.title ?? "Hội thảo Cloud Native & DevOps 2026"}
              </div>
              <div className="text-xs text-muted-foreground">Mở Vé QR cá nhân 15 giây</div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <QrCode className="h-5 w-5" />
            </span>
          </Link>

          <Link
            to="/surveys"
            className="liquid-glass-card flex items-center justify-between gap-3 rounded-[20px] p-4 transition-colors hover:border-primary/45"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-status-warning">2. Khảo sát mở khóa E-Cert</div>
              <div className="text-sm font-medium text-foreground">1 khảo sát đang chờ hoàn thành</div>
              <div className="text-xs text-muted-foreground">Hoàn tất trong 24h sau sự kiện</div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
              <ClipboardList className="h-5 w-5" />
            </span>
          </Link>

          <Link
            to="/me/certificates"
            className="liquid-glass-card flex items-center justify-between gap-3 rounded-[20px] p-4 transition-colors hover:border-primary/45"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-status-success">3. Ví Chứng nhận E-Certificate</div>
              <div className="text-sm font-medium text-foreground">3 chứng nhận đã cấp chính thức</div>
              <div className="text-xs text-muted-foreground">Tra cứu nhãn Cộng ĐRL / CTXH / CĐDN</div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success/15 text-status-success">
              <Award className="h-5 w-5" />
            </span>
          </Link>
        </section>
      )}

      {/* Tier 1: Asymmetric 65 / 35 Flagship Event Registration + Weekly 6-Color Schedule */}
      <section id="events-spotlight" className="grid gap-5 lg:grid-cols-12">
        <div className="liquid-glass-card relative overflow-hidden rounded-[22px] p-5 sm:p-8 lg:col-span-8">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                {(spotlightEvent?.benefits ?? ["Cộng ĐRL", "Cộng CĐDN"]).map((b) => (
                  <Badge key={b} variant="default" className="rounded-full">
                    {b}
                  </Badge>
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-status-info/30 bg-status-info/10 px-3 py-1 text-xs font-medium text-status-info sm:ml-auto">
                  <Sparkles className="h-3.5 w-3.5" />
                  Đang mở đăng ký
                </span>
              </div>

              <h2 className="max-w-xl font-display text-2xl font-medium leading-[1.2] tracking-tight text-foreground sm:text-3xl">
                <Link
                  to={`/events/${spotlightEvent?.id ?? "EVT-2026-CLOUD"}`}
                  className="transition-colors hover:text-primary"
                >
                  {spotlightEvent?.title ?? "Hội thảo Cloud Native & DevOps 2026"}
                </Link>
              </h2>

              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {spotlightEvent?.subtitle ??
                  "Chuyên đề kiến trúc Kubernetes, CI/CD thực chiến và giao lưu định hướng nghề nghiệp cùng kỹ sư doanh nghiệp đối tác Khoa CNTT."}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="tabular-mono">
                    {spotlightEvent?.dateSummary ?? "Thứ 7, 28/11 · 08:00"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{spotlightEvent?.location ?? "Hội trường Lớn HCM-UTE"}</span>
                </span>
              </div>
            </div>

            <div className="space-y-4 border-t border-border/60 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-2.5 flex-1 max-w-xs overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: registered ? "92.5%" : "92%"
                    }}
                  />
                </div>
                <span className="tabular-mono shrink-0 text-sm font-medium text-foreground">
                  {spotlightEvent ? `${spotlightEvent.registeredCount} / ${spotlightEvent.capacity} chỗ` : "184 / 200 chỗ"}
                </span>
              </div>

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
                      to={`/events/${spotlightEvent?.id ?? "EVT-2026-CLOUD"}`}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : registered ? (
                  <>
                    <Link
                      to={`/scanner?tab=ticket&eventId=${spotlightEvent?.id ?? "EVT-2026-CLOUD"}`}
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
                        if (!spotlightEvent) return;
                        if (
                          spotlightEvent.formMode === "CUSTOM_FORM" &&
                          spotlightEvent.formFields.length > 0
                        ) {
                          setFormDialogOpen(true);
                        } else {
                          registerForEvent(spotlightEvent.id);
                        }
                      }}
                      className="liquid-glass-btn-cobalt inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all active:scale-[0.98] sm:w-auto"
                    >
                      <span>
                        {spotlightEvent &&
                        spotlightEvent.formMode === "CUSTOM_FORM" &&
                        spotlightEvent.formFields.length > 0
                          ? "Điền biểu mẫu đăng ký"
                          : "Đăng ký 1 chạm"}
                      </span>
                    </button>
                    <Link
                      to={`/events/${spotlightEvent?.id ?? "EVT-2026-CLOUD"}`}
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
        </div>

        <div className="liquid-glass-card flex flex-col justify-between rounded-[22px] p-5 lg:col-span-4">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-foreground">Lịch tuần này</h2>
              <span className="tabular-mono text-xs text-muted-foreground">Tuần 47</span>
            </div>

            <div className="space-y-2.5">
              {WEEKLY_SCHEDULE.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border border-white/50 px-3.5 py-2.5 text-sm font-medium dark:border-white/10 ${item.rowClass}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClass}`} />
                    <span className="truncate">{item.title}</span>
                  </span>
                  <span className="shrink-0 tabular-mono text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/calendar"
            className="liquid-glass-pill mt-4 flex h-11 items-center justify-between rounded-full px-4 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Mở Lịch hoạt động đầy đủ</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:py-1",
                    activeFilter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border/80 rounded-[22px] border border-border bg-card/90">
            {upcomingEvents.map((ev) => (
              <Link
                key={ev.id}
                to={`/events/${ev.id}`}
                className="group flex items-start gap-3.5 px-4 py-4 transition-colors first:rounded-t-[22px] last:rounded-b-[22px] hover:bg-muted/45 sm:items-center sm:gap-4 sm:px-5"
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

          <div className="space-y-3">
            {publishedNews.map((article) => {
              const catName =
                categories.find((c) => c.id === article.categoryId)?.name ?? "Bản tin FIT";
              return (
                <Link
                  key={article.id}
                  to={`/news/${article.slug}`}
                  className="group flex items-center gap-3.5 rounded-[18px] border border-border bg-card/90 p-3 transition-colors hover:border-primary/40"
                >
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="h-16 w-20 shrink-0 rounded-xl object-cover"
                  />
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
    </div>
  );
}
