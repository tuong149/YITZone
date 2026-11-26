import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  KeyRound,
  Lock,
  MessageSquareMore,
  MonitorPlay,
  QrCode,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";
import { useSurveyStore } from "@/stores/survey-store";

/**
 * 1. /surveys — Student Survey Entry Hub (fixes A2 & S2)
 */
export function SurveyListPage() {
  const surveys = useSurveyStore((s) => s.surveys);
  const events = useEventStore((s) => s.events);
  const registrations = useEventStore((s) => s.registrations);

  const surveyItems = useMemo(() => {
    const items = surveys
      .filter((sv) => sv.status !== "DRAFT")
      .map((sv) => ({
        id: sv.id,
        title: sv.title,
        eventTitle: sv.description || sv.scope,
        deadline: "Trong vòng 24 giờ sau khi kết thúc sự kiện",
        status: sv.status,
        unlocksEcert: sv.scope === "Sau sự kiện",
        anonymous: sv.mode === "ANONYMOUS"
      }));

    for (const [evId, reg] of Object.entries(registrations)) {
      if (!reg) continue;
      const ev = events.find((e) => e.id === evId);
      if (!ev) continue;
      const alreadyListed = items.some(
        (it) => it.id === ev.id || it.title.includes(ev.title)
      );
      if (!alreadyListed) {
        items.unshift({
          id: ev.id,
          title: `Khảo sát chất lượng sau sự kiện — ${ev.title}`,
          eventTitle: ev.title,
          deadline: "Trong vòng 24 giờ sau khi kết thúc sự kiện",
          status: "OPEN",
          unlocksEcert: true,
          anonymous: false
        });
      }
    }

    return items;
  }, [surveys, events, registrations]);

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col justify-between gap-4 rounded-[26px] p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Khảo sát Sự kiện &amp; Mở khóa E-Certificate</Badge>
            <Badge variant="outline">Hỗ trợ lưu nháp ngoại tuyến 24h</Badge>
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-4xl">
            Khảo sát Sau Sự kiện của Tôi
          </h1>
          <p className="text-sm text-muted-foreground">
            Hoàn thành phiếu khảo sát chất lượng sau khi điểm danh sự kiện để hệ thống tự động mở khóa Chứng nhận điện tử (E-Certificate).
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/me/certificates">
            <Award className="h-4 w-4 text-primary" />
            <span>Xem Ví E-Certificate</span>
          </Link>
        </Button>
      </section>

      {surveyItems.length === 0 ? (
        <Card className="rounded-[22px] border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h2 className="font-display text-lg font-medium text-foreground">
                Chưa có khảo sát nào đang mở
              </h2>
              <p className="text-sm text-muted-foreground">
                Phiếu khảo sát chất lượng sẽ tự động xuất hiện tại đây sau khi bạn đăng ký và tham dự sự kiện.
              </p>
            </div>
            <Button asChild className="liquid-glass-btn-cobalt mt-1 rounded-full px-5">
              <Link to="/events">
                <span>Khám phá Sự kiện</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {surveyItems.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between rounded-[22px]">
              <CardHeader className="space-y-2.5 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.unlocksEcert && (
                      <Badge variant="success" className="gap-1">
                        <Award className="h-3 w-3" />
                        <span>Mở khóa E-Cert</span>
                      </Badge>
                    )}
                    {item.anonymous && <Badge variant="secondary">Khảo sát Ẩn danh</Badge>}
                  </div>
                  <Badge variant={item.status === "OPEN" ? "info" : "secondary"}>
                    {item.status === "OPEN" ? "Đang mở" : "Đã đóng"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-primary">{item.eventTitle}</p>
                  <CardTitle className="mt-1 font-display text-lg font-medium leading-snug">
                    {item.title}
                  </CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>Hạn gửi phiếu: {item.deadline}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  asChild
                  className="liquid-glass-btn-cobalt h-11 w-full rounded-full"
                  disabled={item.status !== "OPEN"}
                >
                  <Link to={`/surveys/${item.id}`}>
                    <ClipboardList className="h-4 w-4" />
                    <span>{item.status === "OPEN" ? "Làm khảo sát ngay" : "Xem phiếu khảo sát"}</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 2. /live-qa — Student Live Q&A Entry Hub (fixes A2 & S3)
 */
export function LiveQaJoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authorities = useAuthStore((s) => s.authorities);
  const canModerate = hasAnyPermission(authorities, PERMISSIONS.ADMIN_LIVEQA);

  const events = useEventStore((s) => s.events);

  const [pinInput, setPinInput] = useState(searchParams.get("pin") ?? "");
  const [pinError, setPinError] = useState(null);

  const activeQaSessions = useMemo(() => {
    const list = [];

    for (const ev of events) {
      const hasQa = (ev.sessions ?? []).some((s) => s.activities?.liveQa);
      if (!hasQa) continue;
      const derivedPin = ((ev.id.replace(/\D/g, "") || "482") + "910").slice(0, 6);
      if (!list.some((x) => x.pin === derivedPin || x.eventId === ev.id)) {
        list.push({
          pin: derivedPin,
          eventId: ev.id,
          title: ev.title,
          room: ev.location,
          speaker: ev.scope === "DEPT_INTERNAL" ? "Nội bộ Ban" : "Đoàn – Hội Khoa CNTT"
        });
      }
    }
    return list;
  }, [events]);

  const handleJoinPin = (e) => {
    e.preventDefault();
    const digits = pinInput.replace(/\D/g, "");
    if (digits.length !== 6) {
      setPinError("Mã PIN phiên hỏi đáp phải gồm đúng 6 chữ số hiển thị trên màn hình LED.");
      return;
    }
    setPinError(null);
    void navigate(`/live-qa/${digits}`);
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col justify-between gap-4 rounded-[26px] p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Hỏi đáp Trực tiếp Hội trường</Badge>
            <Badge variant="outline">Bình chọn câu hỏi hay · Đặt câu hỏi ẩn danh</Badge>
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-4xl">
            Tham gia Phiên Hỏi đáp Live Q&amp;A
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhập mã PIN 6 chữ số hiển thị trên màn chiếu LED sân khấu hoặc chọn trực tiếp phiên hội thảo đang mở bên dưới.
          </p>
        </div>

        {canModerate && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/admin/live-qa">
                <ShieldCheck className="h-4 w-4" />
                <span>Bàn Kiểm duyệt</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/stage/live-qa">
                <MonitorPlay className="h-4 w-4" />
                <span>Màn chiếu LED</span>
              </Link>
            </Button>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="rounded-[22px] lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>Nhập Mã PIN 6 số trên LED</span>
            </CardTitle>
            <CardDescription>
              Mã PIN gồm 6 chữ số nằm ở góc phải màn chiếu LED hội trường hoặc bên dưới mã QR sự kiện.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleJoinPin} className="space-y-3">
              <Input
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (pinError) setPinError(null);
                }}
                inputMode="numeric"
                maxLength={6}
                placeholder="Nhập 6 chữ số PIN"
                className="tabular-mono h-12 rounded-xl text-center text-lg font-semibold tracking-[0.25em]"
              />
              {pinError && (
                <div className="flex items-start gap-2 rounded-xl border border-status-danger/35 bg-status-danger/10 p-3 text-xs font-medium text-status-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
              <Button type="submit" className="liquid-glass-btn-cobalt h-11 w-full rounded-full">
                <MessageSquareMore className="h-4 w-4" />
                <span>Vào Tường Hỏi đáp</span>
              </Button>
            </form>

            <div className="pt-2 text-center">
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link to="/scanner?tab=scan">
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  <span>Hoặc quét mã QR trên màn hình LED</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-7">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Phiên Hỏi đáp Đang mở ({activeQaSessions.length})
          </h2>
          {activeQaSessions.length === 0 ? (
            <Card className="rounded-[20px] border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2.5 px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageSquareMore className="h-5 w-5" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="font-display text-base font-medium text-foreground">
                    Chưa có phiên Live Q&amp;A nào đang mở
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Nếu hội trường đang chiếu mã PIN 6 chữ số trên màn hình LED, bạn có thể nhập trực tiếp ở khung bên trái để tham gia.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            activeQaSessions.map((ses) => (
              <Card key={ses.pin} className="rounded-[20px]">
                <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">Đang mở nhận câu hỏi</Badge>
                      <Badge variant="outline" className="tabular-mono">
                        PIN: {ses.pin.slice(0, 3)} {ses.pin.slice(3)}
                      </Badge>
                    </div>
                    <div className="font-display text-lg font-medium text-foreground">{ses.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ses.room} · {ses.speaker}
                    </div>
                  </div>
                  <Button asChild className="rounded-full">
                    <Link to={`/live-qa/${ses.pin}`}>
                      <MessageSquareMore className="h-4 w-4" />
                      <span>Đặt câu hỏi ngay</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. /exams — Student Exam List Hub (fixes A2 & S5)
 */
export function ExamListPage() {
  const events = useEventStore((s) => s.events);
  const authorities = useAuthStore((s) => s.authorities);
  const canManageExams = hasAnyPermission(authorities, PERMISSIONS.ADMIN_EXAMS_MINIGAME);

  const examSessions = useMemo(() => {
    return events
      .filter((ev) => ev.hasExam || (ev.sessions ?? []).some((s) => s.activities?.quizExam))
      .map((ev) => {
        const examCode = ev.examPath?.replace("/exam/", "") ?? `exam-${ev.id.toLowerCase()}`;
        return {
          code: examCode,
          eventId: ev.id,
          title: `Bài thi Trắc nghiệm: ${ev.title}`,
          eventTitle: ev.title,
          location: ev.location,
          durationMinutes: ev.examMinutes ?? 20,
          passingScore: ev.examPassRate ?? 75,
          status: ev.status === "PUBLISHED" ? "OPEN" : "UPCOMING"
        };
      });
  }, [events]);

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col justify-between gap-4 rounded-[26px] p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="calExam">Phòng Thi Trắc nghiệm Học thuật</Badge>
            <Badge variant="outline">Tự động lưu nháp · Tạm khóa YITBot khi đang thi</Badge>
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-4xl">
            Danh sách Kỳ thi Trắc nghiệm
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn kỳ thi gắn với sự kiện hoặc đợt tập huấn bạn đã điểm danh để làm bài và xét cấp chứng nhận E-Certificate.
          </p>
        </div>

        {canManageExams && (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/admin/exams">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Quản trị Ngân hàng Đề &amp; Coi thi</span>
            </Link>
          </Button>
        )}
      </section>

      {examSessions.length === 0 ? (
        <Card className="rounded-[22px] border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h2 className="font-display text-lg font-medium text-foreground">
                Chưa có kỳ thi trắc nghiệm nào đang mở
              </h2>
              <p className="text-sm text-muted-foreground">
                Các bài kiểm tra gắn với sự kiện học thuật hoặc đợt tập huấn sẽ hiển thị tại đây khi đến giờ mở phòng thi.
              </p>
            </div>
            <Button asChild variant="outline" className="mt-1 rounded-full px-5">
              <Link to="/events">
                <span>Xem Danh sách Sự kiện</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {examSessions.map((ex) => (
            <Card key={ex.code} className="flex flex-col justify-between rounded-[22px]">
              <CardHeader className="space-y-2.5 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={ex.status === "OPEN" ? "success" : "secondary"}>
                    {ex.status === "OPEN" ? "Đang mở phòng thi" : "Sắp mở"}
                  </Badge>
                  <span className="tabular-mono text-xs text-muted-foreground">Mã đề: {ex.code}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-primary">{ex.eventTitle}</p>
                  <CardTitle className="mt-1 font-display text-lg font-medium leading-snug">
                    {ex.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Thời lượng: <strong>{ex.durationMinutes} phút</strong> · Điểm đạt tối thiểu:{" "}
                  <strong>≥ {ex.passingScore}/100</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/35 px-3.5 py-2.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    {ex.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-status-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đủ điều kiện dự thi
                  </span>
                </div>

                <Button
                  asChild
                  className="liquid-glass-btn-cobalt h-11 w-full rounded-full"
                  disabled={ex.status !== "OPEN"}
                >
                  <Link to={`/exam/${ex.code}`}>
                    {ex.status === "OPEN" ? (
                      <>
                        <FileCheck2 className="h-4 w-4" />
                        <span>Vào Phòng thi ngay</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Chưa đến giờ mở đề</span>
                      </>
                    )}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
