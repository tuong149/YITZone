import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  LogIn,
  MapPin,
  QrCode,
  Search,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CancelRegistrationDialog,
  EventRegistrationDialog
} from "@/features/events/EventRegistrationDialog";
import { canViewInternalCtvEvents } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";

export function EventsCatalogPage() {
  const storedEvents = useEventStore((s) => s.events);
  const registrations = useEventStore((s) => s.registrations);
  const registerForEvent = useEventStore((s) => s.registerForEvent);
  const cancelRegistration = useEventStore((s) => s.cancelRegistration);

  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const canSeeInternalCtv = canViewInternalCtvEvents(isAuthenticated, authorities, roleScopes);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const rawFilter = (searchParams.get("benefit") ?? "ALL");
  const filter = ["ALL", "DRL", "CTXH", "CDDN", "INTERNAL"].includes(rawFilter)
    ? rawFilter
    : "ALL";
  const activeFilter = !canSeeInternalCtv && filter === "INTERNAL" ? "ALL" : filter;

  const setQuery = (nextQ) => {
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

  const setFilter = (nextFilter) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextFilter === "ALL") next.delete("benefit");
        else next.set("benefit", nextFilter);
        return next;
      },
      { replace: true }
    );
  };

  const [formTarget, setFormTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const filterOptions = useMemo(() => {
    const base = [
      { id: "ALL", label: "Tất cả" },
      { id: "DRL", label: "Cộng ĐRL" },
      { id: "CTXH", label: "Cộng CTXH" },
      { id: "CDDN", label: "Cộng CĐDN" }
    ];
    if (canSeeInternalCtv) {
      base.push({ id: "INTERNAL", label: "Nội bộ CTV" });
    }
    return base;
  }, [canSeeInternalCtv]);

  const events = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return storedEvents.filter((ev) => {
      if (ev.status !== "PUBLISHED" && ev.status !== "ONGOING") return false;
      if (!canSeeInternalCtv && ev.visibility === "INTERNAL_CTV") return false;
      if (normalizedQuery) {
        const hay = `${ev.title} ${ev.subtitle} ${ev.location}`.toLowerCase();
        if (!hay.includes(normalizedQuery)) return false;
      }
      if (activeFilter === "ALL") return true;
      if (activeFilter === "INTERNAL") return ev.visibility === "INTERNAL_CTV";
      if (activeFilter === "DRL") return ev.benefits.some((b) => b.includes("ĐRL") || b === "DRL");
      if (activeFilter === "CTXH") return ev.benefits.some((b) => b.includes("CTXH") || b === "CTXH");
      if (activeFilter === "CDDN") return ev.benefits.some((b) => b.includes("CĐDN") || b === "CDDN");
      return true;
    });
  }, [storedEvents, activeFilter, canSeeInternalCtv, query]);

  return (
    <div className="space-y-6">
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Sự kiện &amp; Hoạt động Khoa CNTT
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Đăng ký tham gia hội thảo học thuật, cuộc thi công nghệ, ngày hội tình nguyện và nhận vé QR điểm danh tức thì.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to="/calendar"
              className="liquid-glass-pill inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
            >
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Xem Lịch hoạt động</span>
            </Link>
            <Link
              to="/scanner"
              className="liquid-glass-btn-cobalt inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
            >
              <QrCode className="h-4 w-4" />
              <span>Mở Vé QR</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Tìm kiếm sự kiện theo tên hoặc địa điểm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên sự kiện, địa điểm..."
            className="h-10 rounded-full bg-card/90 pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {filterOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={activeFilter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeFilter === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/85 text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Event Cards Grid */}
      {events.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-border bg-card/80 px-6 py-12 text-center">
          <p className="font-display text-lg font-medium text-foreground">
            Không tìm thấy sự kiện phù hợp
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Thử đổi từ khóa tìm kiếm hoặc chọn lại bộ lọc quyền lợi phía trên.
          </p>
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {events.map((ev) => {
            const isRegistered = Boolean(registrations[ev.id]);
            const hasCustomForm = ev.formMode === "CUSTOM_FORM" && ev.formFields.length > 0;
            const slotsLabel =
              ev.capacity === 0
                ? `${ev.registeredCount} đã ĐK`
                : `${ev.registeredCount} / ${ev.capacity}${ev.isTeamCompetition ? " đội" : ""}`;

            return (
              <article
                key={ev.id}
                className="flex flex-col justify-between rounded-[22px] border border-border bg-card/95 p-5 transition-all hover:border-primary/40"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="tabular-mono text-base font-semibold leading-none">{ev.day}</span>
                        <span className="mt-0.5 text-[10px] font-semibold tracking-wide">{ev.month}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ev.benefits.map((b) => (
                          <Badge key={b} variant="secondary">
                            {b}
                          </Badge>
                        ))}
                        {ev.visibility === "INTERNAL_CTV" && <Badge variant="calDept">Nội bộ Ban</Badge>}
                        {ev.isTeamCompetition && <Badge variant="calExam">Thi theo đội</Badge>}
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-mono">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {slotsLabel}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-xl font-medium leading-snug text-foreground">
                      <Link to={`/events/${ev.id}`} className="transition-colors hover:text-primary">
                        {ev.title}
                      </Link>
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {ev.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 tabular-mono">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {ev.timeShort}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {ev.location}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4">
                  {!isAuthenticated ? (
                    <Link
                      to="/login"
                      className="liquid-glass-btn-cobalt inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Đăng nhập để đăng ký</span>
                    </Link>
                  ) : ev.isTeamCompetition ? (
                    <Link
                      to={`/events/${ev.id}`}
                      className="liquid-glass-btn-cobalt inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Đăng ký theo đội</span>
                    </Link>
                  ) : isRegistered ? (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(ev)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-status-success/35 bg-status-success/10 px-4 text-xs font-semibold text-status-success transition-all hover:bg-status-success/15"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Đã giữ chỗ · Hủy ĐK</span>
                    </button>
                  ) : hasCustomForm ? (
                    <button
                      type="button"
                      onClick={() => setFormTarget(ev)}
                      className="liquid-glass-btn-cobalt inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all active:scale-[0.98]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Điền biểu mẫu</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => registerForEvent(ev.id)}
                      className="liquid-glass-btn-cobalt inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all active:scale-[0.98]"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Đăng ký 1 chạm</span>
                    </button>
                  )}

                  <Link
                    to={`/events/${ev.id}`}
                    className="inline-flex items-center gap-1 py-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {formTarget && (
        <EventRegistrationDialog
          event={formTarget}
          open={Boolean(formTarget)}
          onOpenChange={(open) => {
            if (!open) setFormTarget(null);
          }}
          onSubmitted={(answers) => {
            registerForEvent(formTarget.id, answers);
            setFormTarget(null);
          }}
        />
      )}

      {cancelTarget && (
        <CancelRegistrationDialog
          eventTitle={cancelTarget.title}
          lockNote={cancelTarget.lockNote}
          open={Boolean(cancelTarget)}
          onOpenChange={(open) => {
            if (!open) setCancelTarget(null);
          }}
          onConfirm={() => {
            cancelRegistration(cancelTarget.id);
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}
