import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Gamepad2,
  LogIn,
  MapPin,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Vote
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CancelRegistrationDialog,
  EventRegistrationDialog
} from "@/features/events/EventRegistrationDialog";
import { EventTeamCompetitionTab } from "@/features/events/EventTeamCompetitionTab";
import { canViewInternalCtvEvents } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";
import { pushLiveNotification } from "@/stores/notification-store";
import { pushAppToast } from "@/stores/toast-store";

const FALLBACK_BTC_ROLES = [
  "Lễ tân / Soát vé QR & Thẻ SV",
  "Kỹ thuật Âm thanh – Ánh sáng – LED",
  "Truyền thông / Nhiếp ảnh",
  "Hậu cần / Điều phối hội trường",
  "MC Dẫn chương trình"
];

export function EventDetailPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const canApplyBtc = canViewInternalCtvEvents(isAuthenticated, authorities, roleScopes);

  const events = useEventStore((s) => s.events);
  const registrations = useEventStore((s) => s.registrations);
  const registerForEvent = useEventStore((s) => s.registerForEvent);
  const cancelRegistration = useEventStore((s) => s.cancelRegistration);

  const event = useMemo(
    () => (eventId ? events.find((e) => e.id === eventId) : events[0]),
    [eventId, events]
  );

  const openBtcRoles = useMemo(
    () => (event && event.btcRoles.length > 0 ? event.btcRoles : FALLBACK_BTC_ROLES),
    [event]
  );

  const [activeTab, setActiveTab] = useState(
    event?.isTeamCompetition ? "team-rounds" : "sessions"
  );
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [primaryRole, setPrimaryRole] = useState(openBtcRoles[0] ?? "");
  const [backupRole, setBackupRole] = useState(openBtcRoles[1] ?? openBtcRoles[0] ?? "");
  const [btcError, setBtcError] = useState(null);
  const [btcApplied, setBtcApplied] = useState(null);

  const tabsSectionRef = useRef(null);

  useEffect(() => {
    setActiveTab(event?.isTeamCompetition ? "team-rounds" : "sessions");
    setPrimaryRole(openBtcRoles[0] ?? "");
    setBackupRole(openBtcRoles[1] ?? openBtcRoles[0] ?? "");
    setBtcApplied(null);
    setBtcError(null);
  }, [event?.id, event?.isTeamCompetition, openBtcRoles]);

  if (!event) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="rounded-[24px] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-medium text-foreground">
            Không tìm thấy sự kiện
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mã sự kiện <span className="tabular-mono font-semibold text-foreground">{eventId}</span> không tồn tại hoặc đã bị gỡ khỏi cổng công khai.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild className="rounded-full px-5">
              <Link to="/events">
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại Danh sách Sự kiện</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const registeredRecord = registrations[event.id];
  const registered = Boolean(registeredRecord);
  const hasCustomForm = event.formMode === "CUSTOM_FORM" && event.formFields.length > 0;
  const isUnlimited = event.capacity === 0;
  const remainingSlots = isUnlimited ? null : Math.max(0, event.capacity - event.registeredCount);
  const isSoldOut = remainingSlots !== null && remainingSlots <= 0;
  const fillPercent = isUnlimited
    ? 100
    : Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  const handleJumpToTeamTab = () => {
    setActiveTab("team-rounds");
    tabsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleApplyBtc = () => {
    setBtcError(null);
    if (openBtcRoles.length > 1 && primaryRole === backupRole) {
      setBtcError("Nguyện vọng 1 và Nguyện vọng 2 cần chọn hai vị trí khác nhau.");
      return;
    }
    setBtcApplied({ nv1: primaryRole, nv2: backupRole });
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Danh sách Sự kiện</span>
        </Link>
        <span className="tabular-mono rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs text-muted-foreground">
          {event.id}
        </span>
      </div>

      {/* Editorial Photographic Hero Banner */}
      <section className="relative overflow-hidden rounded-[26px] border border-border/60 bg-[#0b1636] shadow-popover">
        <div className="relative min-h-[280px] w-full sm:min-h-[340px]">
          <img
            src={event.coverImage}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#060b19] via-[#0b1636]/75 to-[#0b1636]/30"
          />

          <div className="relative z-10 flex min-h-[280px] flex-col justify-end gap-4 p-5 text-white sm:min-h-[340px] sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              {event.benefits.map((b) => (
                <span
                  key={b}
                  className="liquid-glass-on-dark rounded-full px-3 py-1 text-xs font-semibold text-white"
                >
                  {b}
                </span>
              ))}
              {event.sv5tTag && (
                <span className="liquid-glass-on-dark rounded-full px-3 py-1 text-xs font-medium text-sky-200">
                  {event.sv5tTag}
                </span>
              )}
            </div>

            <div className="max-w-3xl space-y-2.5">
              <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.65rem]">
                {event.title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                {event.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-slate-200 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-sky-300" />
                <span className="tabular-mono">{event.dateSummary}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-sky-300" />
                <span>{event.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sky-300" />
                <span>{event.lockNote}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content (8 cols) + Sticky Registration Sidebar (4 cols) */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Key Takeaways Strip */}
          <Card className="rounded-[22px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Điểm nổi bật của chương trình</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {event.highlights.map((text, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tabs: Team Competition (if enabled) / Schedule / Exam / BTC Recruiting (CTV+ only) */}
          <div ref={tabsSectionRef}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                {event.isTeamCompetition && (
                  <TabsTrigger value="team-rounds">Đội thi &amp; Vòng đấu</TabsTrigger>
                )}
                <TabsTrigger value="sessions">Lịch trình ({event.sessions.length} buổi)</TabsTrigger>
                {event.hasExam && <TabsTrigger value="exam">Bài thi Trắc nghiệm</TabsTrigger>}
                <TabsTrigger value="survey">Khảo sát &amp; E-Cert</TabsTrigger>
                {canApplyBtc && <TabsTrigger value="btc">Ứng tuyển Ban Tổ chức</TabsTrigger>}
              </TabsList>

              {event.isTeamCompetition && (
                <TabsContent value="team-rounds" className="mt-4">
                  <EventTeamCompetitionTab />
                </TabsContent>
              )}

              {/* Timeline Schedule */}
              <TabsContent value="sessions" className="mt-4 space-y-4">
                {event.sessions.map((s) => (
                  <Card key={s.id} className="overflow-hidden rounded-[20px]">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 tabular-mono text-sm font-semibold text-primary">
                          {s.step}
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <div className="tabular-mono text-xs font-semibold text-primary">
                              {s.timeRange} · {s.date}
                            </div>
                            <h3 className="mt-0.5 font-display text-base font-medium text-foreground sm:text-lg">
                              {s.name}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.topic}</p>
                          </div>

                          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <div className="rounded-xl border border-border/80 bg-muted/35 px-3.5 py-2.5">
                              <span className="block font-semibold text-foreground">Điểm Check-in</span>
                              <span className="mt-0.5 block">{s.checkIn}</span>
                            </div>
                            <div className="rounded-xl border border-border/80 bg-muted/35 px-3.5 py-2.5">
                              <span className="block font-semibold text-foreground">Điểm Check-out</span>
                              <span className="mt-0.5 block">{s.checkOut}</span>
                            </div>
                          </div>

                          {(s.activities.liveQa ||
                            s.activities.liveVoting ||
                            s.activities.quizExam ||
                            s.activities.minigame) && (
                            <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                Hoạt động buổi này:
                              </span>
                              {s.activities.liveQa && (
                                <Link
                                  to={`/live-qa/${((event.id.replace(/\D/g, "") || "482") + "910").slice(0, 6)}`}
                                  className="inline-flex items-center gap-1 rounded-full border border-status-info/35 bg-status-info/10 px-2.5 py-1 text-xs font-semibold text-status-info transition-colors hover:bg-status-info/20"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  <span>Live Q&amp;A</span>
                                </Link>
                              )}
                              {s.activities.liveVoting && (
                                <Link
                                  to="/voting"
                                  className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                                >
                                  <Vote className="h-3 w-3" />
                                  <span>
                                    Live Voting{s.activities.liveVotingSecret ? " (Phiếu kín)" : ""}
                                  </span>
                                </Link>
                              )}
                              {s.activities.quizExam && (
                                <Link
                                  to={event.examPath ?? `/exam/exam-${event.id.toLowerCase()}`}
                                  className="inline-flex items-center gap-1 rounded-full border border-cal-exam/35 bg-cal-exam/10 px-2.5 py-1 text-xs font-semibold text-cal-exam transition-colors hover:bg-cal-exam/20"
                                >
                                  <ClipboardList className="h-3 w-3" />
                                  <span>
                                    Thi trắc nghiệm ({s.activities.quizMinutes ?? 20}p)
                                  </span>
                                </Link>
                              )}
                              {s.activities.minigame && (
                                <Link
                                  to="/minigame"
                                  className="inline-flex items-center gap-1 rounded-full border border-cal-arts/35 bg-cal-arts/10 px-2.5 py-1 text-xs font-semibold text-cal-arts transition-colors hover:bg-cal-arts/20"
                                >
                                  <Gamepad2 className="h-3 w-3" />
                                  <span>Minigame</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Attached Quiz Exam */}
              {event.hasExam && (
                <TabsContent value="exam" className="mt-4">
                  <Card className="rounded-[20px]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-display text-xl font-medium">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Phòng Thi Trắc nghiệm Đính kèm Sự kiện
                      </CardTitle>
                      <CardDescription>
                        Bài kiểm tra kiến thức đi kèm sự kiện để hoàn tất điều kiện cấp E-Certificate hoặc xét điểm Vòng loại.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 text-xs sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                          <span className="block text-muted-foreground">Thời lượng</span>
                          <span className="tabular-mono mt-0.5 block text-sm font-semibold text-foreground">
                            {event.examMinutes ?? 20} phút
                          </span>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                          <span className="block text-muted-foreground">Hình thức</span>
                          <span className="mt-0.5 block text-sm font-semibold text-foreground">
                            Trắc nghiệm trực tuyến
                          </span>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                          <span className="block text-muted-foreground">Mức đạt</span>
                          <span className="tabular-mono mt-0.5 block text-sm font-semibold text-foreground">
                            ≥ {event.examPassRate ?? 70}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 rounded-xl border border-status-info/30 bg-status-info/10 px-3.5 py-3 text-xs leading-relaxed text-status-info">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          Trong lúc làm bài, hệ thống tự động giám sát chuyển tab và tạm khóa trợ lý YITBot cho riêng tài khoản của bạn.
                        </span>
                      </div>

                      <Button asChild className="liquid-glass-btn-cobalt h-11 w-full rounded-full px-6 sm:w-auto">
                        <Link to={event.examPath ?? `/exam/exam-${event.id.toLowerCase()}`}>
                          <span>Vào phòng thi trắc nghiệm</span>
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Post-Event Survey & E-Certificate Unlock Tab (S2) */}
              <TabsContent value="survey" className="mt-4">
                <Card className="rounded-[20px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-xl font-medium">
                      <FileText className="h-5 w-5 text-primary" />
                      Khảo sát Sau Sự kiện &amp; Mở khóa E-Certificate
                    </CardTitle>
                    <CardDescription>
                      Sau khi quét QR điểm danh tại hội trường, bạn cần hoàn thành phiếu khảo sát chất lượng trong vòng 24 giờ để mở khóa Chứng nhận điện tử (E-Certificate).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild className="liquid-glass-btn-cobalt h-11 rounded-full px-6">
                        <Link to={`/surveys/${event.id === "EVT-2026-CLOUD" ? "evt-cloud-2026" : event.id}`}>
                          <span>Làm khảo sát sự kiện này</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-11 rounded-full px-5">
                        <Link to="/me/certificates">
                          <span>Kiểm tra Ví E-Certificate</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BTC Recruiting (CTV+ Only) */}
              {canApplyBtc && (
                <TabsContent value="btc" className="mt-4">
                  <Card className="rounded-[20px]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-display text-xl font-medium">
                        <Users className="h-5 w-5 text-primary" />
                        Đăng ký Thành viên Ban Tổ chức
                      </CardTitle>
                      <CardDescription>
                        Chọn Nguyện vọng 1 (chính thức) và Nguyện vọng 2 (dự phòng). Nếu đồng thời tham gia tiết mục Văn nghệ, hệ thống giữ 01 vị trí BTC chính thức để in E-Cert.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="btc-nv1">Nguyện vọng 1 (Chính thức)</Label>
                          <Select
                            value={primaryRole}
                            onValueChange={(val) => {
                              setPrimaryRole(val);
                              setBtcError(null);
                            }}
                          >
                            <SelectTrigger id="btc-nv1" className="h-11 rounded-xl sm:h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {openBtcRoles.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="btc-nv2">Nguyện vọng 2 (Dự phòng)</Label>
                          <Select
                            value={backupRole}
                            onValueChange={(val) => {
                              setBackupRole(val);
                              setBtcError(null);
                            }}
                          >
                            <SelectTrigger id="btc-nv2" className="h-11 rounded-xl sm:h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {openBtcRoles.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {btcError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-xs font-medium text-status-danger"
                        >
                          {btcError}
                        </div>
                      )}

                      {btcApplied && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 p-3 text-xs text-status-success"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>
                            Đã gửi hồ sơ ứng tuyển BTC (NV1: {btcApplied.nv1} · NV2: {btcApplied.nv2}). Chờ Trưởng BTC phê duyệt.
                          </span>
                        </div>
                      )}

                      <Button
                        type="button"
                        className="liquid-glass-btn-cobalt h-11 w-full rounded-full sm:w-auto sm:px-6"
                        onClick={handleApplyBtc}
                      >
                        {btcApplied ? "Cập nhật nguyện vọng BTC" : "Gửi đăng ký Ứng tuyển BTC"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        {/* Right Sticky Registration Panel */}
        <aside className="lg:sticky lg:top-20 lg:col-span-4">
          <div className="liquid-glass-card space-y-5 rounded-[24px] p-5 sm:p-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="info" className="rounded-full">
                  Đang mở đăng ký
                </Badge>
                <span className="tabular-mono text-xs font-semibold text-foreground">
                  {remainingSlots === null
                    ? "Không giới hạn"
                    : `Còn ${remainingSlots} ${event.isTeamCompetition ? "suất đội" : "chỗ"}`}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {event.isTeamCompetition ? "Số đội đã duyệt" : "Số lượng đã đăng ký"}
                </span>
                <span className="tabular-mono text-base font-semibold text-foreground">
                  {event.registeredCount} / {isUnlimited ? "∞" : event.capacity}{" "}
                  {event.isTeamCompetition ? "đội" : ""}
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={fillPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tỷ lệ lấp đầy sự kiện"
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${fillPercent}%`,
                    background: "linear-gradient(90deg, #3b5bff 0%, #38bdf8 100%)"
                  }}
                />
              </div>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card/75 p-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Thời gian</div>
                  <div className="tabular-mono mt-0.5 text-muted-foreground">{event.dateSummary}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Địa điểm</div>
                  <div className="mt-0.5 text-muted-foreground">{event.location}</div>
                </div>
              </div>
            </div>

            {/* Registration CTA differentiated by auth, capacity, team mode, and custom form */}
            {!isAuthenticated ? (
              <Button asChild className="liquid-glass-btn-cobalt h-12 w-full rounded-full text-sm font-semibold">
                <Link to="/login" state={{ from: location }}>
                  <LogIn className="h-4 w-4" />
                  <span>Đăng nhập để đăng ký</span>
                </Link>
              </Button>
            ) : event.isTeamCompetition ? (
              <div className="space-y-2.5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Sự kiện này áp dụng hình thức <strong className="text-foreground">đăng ký theo Đội</strong> (
                  {event.minTeamSize === event.maxTeamSize
                    ? `${event.minTeamSize} SV/đội`
                    : `${event.minTeamSize ?? 3}–${event.maxTeamSize ?? 5} SV/đội`}
                  ). Hãy tạo đội mới hoặc nhập mã mời từ Đội trưởng.
                </p>
                <Button
                  type="button"
                  className="liquid-glass-btn-cobalt h-12 w-full rounded-full text-sm font-semibold"
                  onClick={handleJumpToTeamTab}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Tạo / Tham gia Đội thi</span>
                </Button>
              </div>
            ) : registered ? (
              <div className="space-y-2.5">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 p-3 text-xs font-medium text-status-success"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Đã ghi nhận đăng ký tham dự. Mở Vé QR để xuất trình tại bàn lễ tân.</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="liquid-glass-btn-cobalt h-11 flex-1 rounded-full">
                    <Link to={`/scanner?tab=ticket&eventId=${event.id}`}>
                      <QrCode className="h-4 w-4" />
                      <span>Mở Vé QR</span>
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full px-4"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Hủy ĐK
                  </Button>
                </div>
              </div>
            ) : isSoldOut ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  disabled
                  className="h-12 w-full rounded-full text-sm font-semibold"
                >
                  Đã đủ chỗ ({event.capacity}/{event.capacity})
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Sự kiện hiện đã hết suất tham dự. Vui lòng quay lại sau nếu có sinh viên hủy đăng ký.
                </p>
              </div>
            ) : hasCustomForm ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  className="liquid-glass-btn-cobalt h-12 w-full rounded-full text-sm font-semibold"
                  onClick={() => setFormDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  <span>Điền biểu mẫu đăng ký ({event.formFields.length} câu)</span>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Họ tên, MSSV &amp; Email được tự động điền từ tài khoản YITZone.
                </p>
              </div>
            ) : (
              <Button
                type="button"
                className="liquid-glass-btn-cobalt h-12 w-full rounded-full text-sm font-semibold"
                onClick={() => {
                  registerForEvent(event.id);
                  pushLiveNotification({
                    category: "EVENT",
                    title: `Đăng ký thành công: ${event.title}`,
                    body: `Vé QR cá nhân đã sẵn sàng. Xuất trình tại ${event.location} khi tham dự.`,
                    channels: ["In-App", "Web Push"],
                    link: `/scanner?tab=ticket&eventId=${event.id}`
                  });
                }}
              >
                Đăng ký Tham dự 1 chạm
              </Button>
            )}
          </div>
        </aside>
      </div>

      {/* Dynamic Registration Form Dialog */}
      {hasCustomForm && (
        <EventRegistrationDialog
          event={event}
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          onSubmitted={(answers) => {
            registerForEvent(event.id, answers);
            pushAppToast({
              variant: "success",
              title: "Đã gửi biểu mẫu đăng ký",
              description: `Vé QR cho "${event.title}" đã sẵn sàng trong mục Quét QR.`
            });
          }}
        />
      )}

      {/* Safe Cancel Confirmation Dialog */}
      <CancelRegistrationDialog
        eventTitle={event.title}
        lockNote={event.lockNote}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={() => {
          cancelRegistration(event.id);
          pushAppToast({
            variant: "info",
            title: "Đã hủy đăng ký sự kiện",
            description: "Suất trống đã được mở lại cho sinh viên khác."
          });
        }}
      />
    </div>
  );
}
