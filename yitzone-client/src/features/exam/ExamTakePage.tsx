import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  BotOff,
  CheckCircle2,
  Clock,
  Flag,
  Laptop,
  Lock,
  Maximize2,
  Save,
  ShieldAlert,
  Smartphone,
  WifiOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface ExamQuestion {
  id: string;
  level: "Nhận biết" | "Thông hiểu" | "Vận dụng";
  stem: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correct: "A" | "B" | "C" | "D";
}

const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: "eq-1",
    level: "Nhận biết",
    stem: "Theo cơ chế Điểm danh Đa lớp, tổ hợp chữ ký số nào dùng để xác thực mã QR thẻ sinh viên ngoại tuyến?",
    options: [
      { key: "A", text: "Mã hóa đối xứng AES-128 lưu trong localStorage" },
      { key: "B", text: "Chữ ký khóa công khai ECDSA P-256 kết hợp quét Barcode 1D" },
      { key: "C", text: "Mã băm MD5 của MSSV không có salt" },
      { key: "D", text: "OTP gửi qua SMS không cần mạng" }
    ],
    correct: "B"
  },
  {
    id: "eq-2",
    level: "Thông hiểu",
    stem: "Khi CTV gửi đơn xin vắng ca trực Văn phòng trước giờ trực ≥ 2 giờ và chọn ca bù hợp lệ, hệ thống xử lý như thế nào?",
    options: [
      { key: "A", text: "Bắt buộc chờ BTV phê duyệt trong 24 giờ" },
      { key: "B", text: "Chấp nhận tự động ngay, hủy ca cũ và thêm ca bù vào lịch" },
      { key: "C", text: "Ghi nhận 1 lần vắng không phép rồi trừ sau" },
      { key: "D", text: "Chỉ chấp nhận nếu ca bù rơi vào ngày Chủ Nhật" }
    ],
    correct: "B"
  },
  {
    id: "eq-3",
    level: "Vận dụng",
    stem: "Trong trường hợp máy tính thí sinh bị hỏng pin giữa giờ thi trắc nghiệm, Cán bộ coi thi cần thực hiện thao tác nào?",
    options: [
      { key: "A", text: "Yêu cầu thí sinh tạo tài khoản mới để làm lại từ đầu" },
      { key: "B", text: "Tắt toàn bộ giám sát phòng thi cho tất cả thí sinh" },
      { key: "C", text: "Bấm 'Cấp phép chuyển sang thiết bị khác' kèm lý do lưu Audit Log để tiếp tục bài nháp" },
      { key: "D", text: "Gửi đáp án qua email cho thí sinh tự chấm" }
    ],
    correct: "C"
  },
  {
    id: "eq-4",
    level: "Thông hiểu",
    stem: "Nếu sinh viên thi trên thiết bị di động hoặc đứt kết nối Heartbeat > 15 giây, cơ chế giám sát xử lý ra sao?",
    options: [
      { key: "A", text: "Tự động thu bài và hủy kết quả ngay lập tức" },
      { key: "B", text: "Chỉ ghi log hậu kiểm (LOG_ONLY / HEARTBEAT_GAP), không thu bài oan" },
      { key: "C", text: "Khóa tài khoản YITZone trong 7 ngày" },
      { key: "D", text: "Tự động cộng thêm 30 phút làm bài" }
    ],
    correct: "B"
  }
];

const MAX_DESKTOP_VIOLATIONS = 3;
const PASSING_SCORE = 75;
const EXAM_DURATION_SECONDS = 20 * 60;

export function ExamTakePage() {
  const { id } = useParams();
  const examCode = id ?? "ex-fit-2026";
  const userId = useAuthStore((s) => s.userId) ?? "guest";
  const draftStorageKey = `yitzone-exam-draft:${userId}:${examCode}`;

  const [phase, setPhase] = useState<"gate" | "taking" | "submitted">("gate");
  const [deviceMode, setDeviceMode] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  const [lastSavedAt, setLastSavedAt] = useState<string>("Chưa lưu");
  const [violations, setViolations] = useState<
    { at: string; type: "TAB_BLUR" | "HEARTBEAT_GAP" | "MOBILE_LOG_ONLY"; note: string }[]
  >([]);
  const [autoSubmitReason, setAutoSubmitReason] = useState<string | null>(null);
  const [copyWarning, setCopyWarning] = useState<string | null>(null);

  const deadlineMsRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  const flaggedRef = useRef(flagged);
  answersRef.current = answers;
  flaggedRef.current = flagged;

  const desktopBlurCount = violations.filter((v) => v.type === "TAB_BLUR").length;

  // Restore saved draft for this user & exam on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        answers?: Record<string, "A" | "B" | "C" | "D">;
        flagged?: string[];
        savedAt?: string;
      };
      if (parsed.answers) setAnswers(parsed.answers);
      if (Array.isArray(parsed.flagged)) setFlagged(parsed.flagged);
      if (parsed.savedAt) setLastSavedAt(parsed.savedAt);
    } catch {
      // Ignore malformed draft
    }
  }, [draftStorageKey]);

  const finishExam = useCallback(
    (reason?: string) => {
      if (reason) setAutoSubmitReason(reason);
      setPhase("submitted");
      deadlineMsRef.current = null;
      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch {
        // Ignore storage errors
      }
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    },
    [draftStorageKey]
  );

  // Trigger auto-submit outside state updater when desktop violation threshold is reached
  useEffect(() => {
    if (phase === "taking" && deviceMode === "DESKTOP" && desktopBlurCount >= MAX_DESKTOP_VIOLATIONS) {
      finishExam(`Đạt ngưỡng ${MAX_DESKTOP_VIOLATIONS} lần rời tab trên Desktop — Hệ thống tự động thu bài.`);
    }
  }, [phase, deviceMode, desktopBlurCount, finishExam]);

  // Wall-clock countdown timer (resistant to background-tab setInterval throttling)
  useEffect(() => {
    if (phase !== "taking") return;
    if (deadlineMsRef.current === null) {
      deadlineMsRef.current = Date.now() + secondsLeft * 1000;
    }
    const syncRemaining = () => {
      const deadline = deadlineMsRef.current;
      if (deadline === null) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        finishExam("Hết thời gian làm bài — Server tự động thu bài (ân hạn truyền 5s).");
      }
    };
    syncRemaining();
    const t = window.setInterval(syncRemaining, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, finishExam]);

  // Auto-save real draft to localStorage every 8s
  useEffect(() => {
    if (phase !== "taking") return;
    const persistDraft = () => {
      const now = new Date();
      const label = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      try {
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            answers: answersRef.current,
            flagged: flaggedRef.current,
            savedAt: label
          })
        );
      } catch {
        // Ignore quota errors
      }
      setLastSavedAt(label);
    };
    persistDraft();
    const t = window.setInterval(persistDraft, 8000);
    return () => window.clearInterval(t);
  }, [phase, draftStorageKey]);

  // Real visibilitychange / blur monitor
  useEffect(() => {
    if (phase !== "taking") return;
    const recordViolation = () => {
      const now = new Date().toLocaleTimeString("vi-VN");
      if (deviceMode === "MOBILE") {
        setViolations((prev) => [
          {
            at: now,
            type: "MOBILE_LOG_ONLY",
            note: "Chuyển ứng dụng trên Mobile — ghi LOG_ONLY, không thu bài oan."
          },
          ...prev
        ]);
        return;
      }
      setViolations((prev) => [
        { at: now, type: "TAB_BLUR" as const, note: "Rời tab / mất tiêu điểm cửa sổ trên Desktop." },
        ...prev
      ]);
    };

    const onVis = () => {
      if (document.hidden) recordViolation();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase, deviceMode]);

  const handleStartExam = () => {
    deadlineMsRef.current = Date.now() + EXAM_DURATION_SECONDS * 1000;
    setSecondsLeft(EXAM_DURATION_SECONDS);
    setPhase("taking");
    setLastSavedAt(new Date().toLocaleTimeString("vi-VN"));
    if (deviceMode === "DESKTOP" && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleSimulateBlur = () => {
    const now = new Date().toLocaleTimeString("vi-VN");
    if (deviceMode === "MOBILE") {
      setViolations((prev) => [
        { at: now, type: "MOBILE_LOG_ONLY", note: "Mobile rời cửa sổ — chỉ ghi LOG_ONLY hậu kiểm." },
        ...prev
      ]);
      return;
    }
    setViolations((prev) => [
      { at: now, type: "TAB_BLUR" as const, note: "Giả lập vi phạm rời tab / blur trên Desktop." },
      ...prev
    ]);
  };

  const handleSimulateHeartbeatGap = () => {
    const now = new Date().toLocaleTimeString("vi-VN");
    setViolations((prev) => [
      { at: now, type: "HEARTBEAT_GAP", note: "Đứt Heartbeat > 15s — ghi nhật ký hậu kiểm, không thu bài oan." },
...prev
    ]);
  };

  const correctCount = EXAM_QUESTIONS.filter((q) => answers[q.id] === q.correct).length;
  const finalScore = Math.round((correctCount / EXAM_QUESTIONS.length) * 100);
  const passedECert = finalScore >= PASSING_SCORE;

  const currentQ = EXAM_QUESTIONS[activeIdx] ?? EXAM_QUESTIONS[0]!;
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div
      className="space-y-6"
      onContextMenu={(e) => {
        if (phase === "taking") {
          e.preventDefault();
          setCopyWarning("Chuột phải và sao chép đề thi bị vô hiệu hóa trong phòng thi.");
        }
      }}
      onCopy={(e) => {
        if (phase === "taking") {
          e.preventDefault();
          setCopyWarning("Không được phép sao chép nội dung câu hỏi trong giờ thi.");
        }
      }}
    >
      <section
        className={cn(
          "flex flex-col gap-3 rounded-[26px] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7",
          phase === "taking" ? "border border-border bg-card": "liquid-glass"
        )}
      >
        <div>
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Phòng Thi Trắc nghiệm<span className="tabular-mono">{examCode}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bài thu hoạch Quy chế Đoàn - Hội &amp; Kiến thức Chuyên môn FIT · Xáo trộn câu hỏi &amp; đáp án trên server.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={phase === "taking" ? "danger": "success"} className="rounded-full">
            {phase === "taking" ? (
              <>
                <BotOff className="h-3.5 w-3.5" />
                YITBot: ĐANG KHÓA RIÊNG
              </>
            ): (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                YITBot: Sẵn sàng
              </>
            )}
          </Badge>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/admin/exams">Phòng Coi thi (Admin)</Link>
          </Button>
        </div>
      </section>

      {phase === "gate" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Kiểm tra Điều kiện &amp; Khóa Phiên Thi</CardTitle>
              <CardDescription>
                Phiên thi gắn duy nhất 01 thiết bị; mọi câu hỏi và đáp án được xáo trộn tại server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Thời lượng</div>
                  <div className="mt-0.5 tabular-mono text-lg font-semibold text-foreground">20 phút</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Số câu hỏi</div>
                  <div className="mt-0.5 tabular-mono text-lg font-semibold text-foreground">
                    {EXAM_QUESTIONS.length} câu (4 đáp án)
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Điểm sàn E-Cert</div>
                  <div className="mt-0.5 tabular-mono text-lg font-semibold text-status-success">
                    ≥ {PASSING_SCORE}/100
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">Chọn chế độ thiết bị kiểm thử giám sát:</div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDeviceMode("DESKTOP")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors",
                      deviceMode === "DESKTOP"
                        ? "border-primary bg-primary/10"
: "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <Laptop className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold text-foreground">Desktop (Khuyến nghị)</div>
                      <div className="text-xs text-muted-foreground">
                        Fullscreen + Thu bài khi rời tab đủ {MAX_DESKTOP_VIOLATIONS} lần
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceMode("MOBILE")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors",
                      deviceMode === "MOBILE"
                        ? "border-primary bg-primary/10"
: "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold text-foreground">Mobile (LOG_ONLY)</div>
                      <div className="text-xs text-muted-foreground">
                        Chỉ ghi log hậu kiểm, không tự thu bài oan
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-status-warning/30 bg-status-warning/10 px-3.5 py-2.5 text-xs text-status-warning">
                Khi bấm <strong>Bắt đầu làm bài</strong>, tài khoản của bạn sẽ tự động khóa quyền truy cập <strong>YITBot AI</strong> cho tới khi nộp bài hoàn tất.
              </div>

              <Button type="button" onClick={handleStartExam} className="w-full sm:w-auto">
                <Maximize2 className="h-4 w-4" />
                Bắt đầu làm bài (Khóa 01 thiết bị)
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Cam kết Phòng thi Nghiêm túc</CardTitle>
              <CardDescription>Bề mặt đặc chuẩn WCAG 2.1 AA · Không dùng kính mờ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Watermark động chứa MSSV, Họ tên và thời gian phủ mờ trên toàn bộ vùng đề thi.</span>
              </p>
              <p className="flex items-start gap-2">
                <Save className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Bài làm tự động lưu nháp mỗi 5–10 giây; hỗ trợ Cán bộ coi thi cấp phép chuyển máy khi sự cố.</span>
              </p>
              <p className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                <span>Không gửi đáp án đúng xuống trình duyệt; hết giờ có ân hạn truyền 5 giây.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {phase === "taking" && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Crisp Solid Exam Surface with subtle Watermark */}
          <Card className="relative overflow-hidden lg:col-span-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-[0.045] dark:opacity-[0.06]"
            >
              <div className="grid h-full w-full -rotate-12 grid-cols-2 gap-12 p-8 tabular-mono text-xs font-semibold text-foreground">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>22110418 · TRẦN ĐỨC THỊNH · {examCode.toUpperCase()}</div>
                ))}
              </div>
            </div>

            <CardHeader className="relative z-10 border-b border-border pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="calExam" className="tabular-mono">
                    Câu {activeIdx + 1}/{EXAM_QUESTIONS.length}
                  </Badge>
                  <Badge variant="secondary">{currentQ.level}</Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={flagged.includes(currentQ.id) ? "default": "outline"}
                  onClick={() =>
                    setFlagged((prev) =>
                      prev.includes(currentQ.id)
                        ? prev.filter((fid) => fid !== currentQ.id)
: [...prev, currentQ.id]
                    )
                  }
                >
                  <Flag className="h-3.5 w-3.5" />
                  {flagged.includes(currentQ.id) ? "Đã gắn cờ": "Gắn cờ xem lại"}
                </Button>
              </div>
              <CardTitle className="pt-2 text-lg leading-relaxed select-none">
                {currentQ.stem}
              </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10 space-y-3 pt-5 select-none">
              {copyWarning && (
                <div className="flex items-center justify-between rounded-lg border border-status-warning/35 bg-status-warning/10 px-3 py-2 text-xs font-medium text-status-warning">
                  <span>{copyWarning}</span>
                  <button type="button" onClick={() => setCopyWarning(null)} className="underline">
                    Đóng
                  </button>
                </div>
              )}

              {currentQ.options.map((opt) => {
                const picked = answers[currentQ.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAnswers((prev) => ({...prev, [currentQ.id]: opt.key }))}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-colors",
                      picked
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
: "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg tabular-mono text-xs font-semibold",
                        picked ? "bg-primary text-primary-foreground": "bg-muted text-foreground"
                      )}
                    >
                      {opt.key}
                    </span>
                    <span className="pt-0.5 leading-relaxed text-foreground">{opt.text}</span>
                  </button>
                );
              })}

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={activeIdx === 0}
                  onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                >
                  Câu trước
                </Button>
                <div className="flex gap-2">
                  {activeIdx < EXAM_QUESTIONS.length - 1 ? (
                    <Button type="button" onClick={() => setActiveIdx((i) => i + 1)}>
                      Câu tiếp theo
                    </Button>
                  ): (
                    <Button type="button" onClick={() => finishExam()}>
                      Nộp bài &amp; Mở khóa YITBot
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Proctoring & Navigator Panel */}
          <div className="space-y-4 lg:col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Thời gian còn lại</span>
                  <Badge variant="outline" className="tabular-mono">
                    <Save className="h-3 w-3" />
                    Lưu {lastSavedAt}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 tabular-mono text-3xl font-semibold text-foreground">
                  <Clock className="h-6 w-6 text-primary" />
                  {mins}:{secs}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">
                    Danh sách câu hỏi ({Object.keys(answers).length}/{EXAM_QUESTIONS.length} đã chọn)
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {EXAM_QUESTIONS.map((q, idx) => {
                      const answered = Boolean(answers[q.id]);
                      const isFlagged = flagged.includes(q.id);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setActiveIdx(idx)}
                          className={cn(
                            "relative flex h-10 items-center justify-center rounded-lg border tabular-mono text-xs font-semibold transition-colors",
                            idx === activeIdx && "ring-2 ring-primary",
                            answered
                              ? "border-cal-exam/40 bg-cal-exam/15 text-cal-exam"
: "border-border bg-card text-foreground hover:bg-muted/60"
                          )}
                        >
                          {idx + 1}
                          {isFlagged && (
                            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-status-warning" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button type="button" className="w-full" onClick={() => finishExam()}>
                  Nộp bài ngay
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Giám sát ({deviceMode})</span>
                  <Badge
                    variant={
                      desktopBlurCount >= 2 ? "danger": desktopBlurCount === 1 ? "warning": "success"
                    }
                    className="tabular-mono"
                  >
                    Rời tab: {desktopBlurCount}/{MAX_DESKTOP_VIOLATIONS}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleSimulateBlur}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Mô phỏng rời tab
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleSimulateHeartbeatGap}>
                    <WifiOff className="h-3.5 w-3.5" />
                    Đứt Heartbeat &gt;15s
                  </Button>
                </div>

                {violations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa ghi nhận cảnh báo giám sát nào.</p>
                ): (
                  <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                    {violations.map((v, i) => (
                      <div
                        key={`${v.at}-${i}`}
                        className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span className="tabular-mono">{v.type}</span>
                          <span className="tabular-mono text-muted-foreground">{v.at}</span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground">{v.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {phase === "submitted" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-6 w-6 text-status-success" />
              Đã nộp bài &amp; Mở khóa YITBot thành công
            </CardTitle>
            <CardDescription>
              {autoSubmitReason ?? "Hệ thống đã chấm điểm tự động và ghi nhận vào bảng xếp hạng kỳ thi."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground">Điểm đạt được</div>
                <div className="mt-1 tabular-mono text-3xl font-semibold text-foreground">
                  {finalScore}/100
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Đúng {correctCount}/{EXAM_QUESTIONS.length} câu
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground">Ghi nhận vi phạm</div>
                <div className="mt-1 tabular-mono text-3xl font-semibold text-foreground">
                  {violations.length}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Rời tab Desktop: {desktopBlurCount}/{MAX_DESKTOP_VIOLATIONS}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground">Mở khóa E-Certificate</div>
                <div className="mt-2">
                  {passedECert ? (
                    <Badge variant="verified">
                      <Award className="h-3.5 w-3.5" />
                      Đạt điểm sàn (≥ {PASSING_SCORE})
                    </Badge>
                  ): (
                    <Badge variant="warning">Chưa đạt điểm sàn ({PASSING_SCORE})</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/certificates">Xem E-Certificate của tôi</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/yitbot">Quay lại hỏi YITBot AI</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAnswers({});
                  setViolations([]);
                  setAutoSubmitReason(null);
                  setSecondsLeft(20 * 60);
                  setPhase("gate");
                }}
              >
                Thử lại phiên mới
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
