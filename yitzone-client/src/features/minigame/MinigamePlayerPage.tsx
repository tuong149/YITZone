import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flame,
  Gamepad2,
  Globe,
  KeyRound,
  MonitorPlay,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
  WifiOff,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn, maskStudentCode } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type QuestionKind = "SINGLE" | "MULTI" | "TRUE_FALSE";
type RoomStatus = "OPEN" | "UPCOMING";

interface MinigameRoom {
  id: string;
  title: string;
  eventLabel: string;
  description: string;
  pin: string;
  requireAttendance: boolean;
  userCheckedIn: boolean;
  accessRuleNote: string;
  status: RoomStatus;
  timeWindow: string;
  questionCount: number;
  playerCount: number;
}

interface GameQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  timeLimitSec: number;
  baseScore: number;
  options: { key: string; text: string }[];
  correctKeys: string[];
}

const MINIGAME_ROOMS: MinigameRoom[] = [
  {
    id: "room-fit-arena",
    title: "Đấu trường Công nghệ FIT 2026",
    eventLabel: "Hội thảo Cloud Native & DevOps 2026",
    description:
      "Tranh tài kiến thức Đoàn – Hội & Công nghệ trực tiếp cùng màn hình LED hội trường, tính điểm tốc độ và chuỗi thắng Streak.",
    pin: "739 204",
    requireAttendance: true,
    userCheckedIn: true,
    accessRuleNote: "Yêu cầu đã điểm danh sự kiện · Tài khoản của bạn đã điểm danh",
    status: "OPEN",
    timeWindow: "Đang mở phòng · Chờ nhịp MC",
    questionCount: 10,
    playerCount: 194
  },
  {
    id: "room-freshman-quiz",
    title: "Đố vui Nhanh: Hành trang Tân Sinh viên IT",
    eventLabel: "Chuỗi hoạt động Chào đón Tân Sinh viên",
    description:
      "Chơi trực tuyến ngay tại nhà để tìm hiểu về Khoa CNTT, điểm rèn luyện, phong trào SV5T và nhận quà lưu niệm.",
    pin: "518 092",
    requireAttendance: false,
    userCheckedIn: false,
    accessRuleNote: "Không cần điểm danh sự kiện · Mở tự do cho sinh viên tham gia",
    status: "OPEN",
    timeWindow: "Đang mở · Đến 22:00 hôm nay",
    questionCount: 8,
    playerCount: 86
  },
  {
    id: "room-sec-bell",
    title: "Rung chuông vàng Tuần lễ An toàn Thông tin",
    eventLabel: "FIT Security Week 2026",
    description:
      "Thử thách phản xạ nhanh về bảo mật ứng dụng web, mật mã và an toàn mạng tại hội trường.",
    pin: "904 115",
    requireAttendance: true,
    userCheckedIn: false,
    accessRuleNote: "Cần quét QR điểm danh tại Hội trường A5 để mở khóa phòng chơi",
    status: "OPEN",
    timeWindow: "Đang mở phòng · Hội trường A5",
    questionCount: 15,
    playerCount: 72
  }
];

const DEMO_QUESTIONS: GameQuestion[] = [
  {
    id: "q1",
    kind: "SINGLE",
    prompt: "Khoa Công nghệ Thông tin HCM-UTE vận hành bao nhiêu Ban chuyên môn trực thuộc Đoàn - Hội?",
    timeLimitSec: 20,
    baseScore: 1000,
    options: [
      { key: "A", text: "3 Ban (Văn phòng, Truyền thông, Học thuật)" },
      { key: "B", text: "4 Ban (OFIT, EMFIT, ARTIT, SV5T)" },
      { key: "C", text: "5 Ban chuyên môn và 6 Tổ" },
      { key: "D", text: "2 Ban điều phối chung" }
    ],
    correctKeys: ["B"]
  },
  {
    id: "q2",
    kind: "MULTI",
    prompt: "Chọn ĐỦ các tiêu chí xét danh hiệu Sinh viên 5 tốt (chấm đúng khi chọn đủ toàn bộ):",
    timeLimitSec: 30,
    baseScore: 2000,
    options: [
      { key: "A", text: "Đạo đức tốt & Học tập tốt" },
      { key: "B", text: "Thể lực tốt & Tình nguyện tốt" },
      { key: "C", text: "Hội nhập tốt" },
      { key: "D", text: "Bắt buộc có giải thưởng quốc tế" }
    ],
    correctKeys: ["A", "B", "C"]
  },
  {
    id: "q3",
    kind: "TRUE_FALSE",
    prompt: "Khi thí sinh đang làm bài Thi Trắc nghiệm trên YITZone, trợ lý YITBot AI sẽ tự động tạm khóa riêng cho tài khoản đó.",
    timeLimitSec: 10,
    baseScore: 1000,
    options: [
      { key: "T", text: "Đúng — Khóa tự động đến khi nộp bài" },
      { key: "F", text: "Sai — Vẫn mở tra cứu tự do" }
    ],
    correctKeys: ["T"]
  }
];

const PROFANITY_BLOCKLIST = ["spam", "hack", "cheat", "badword"];

const TOP_LEADERBOARD = [
  { rank: 1, maskedName: "Nguyễn Minh Khôi ·...345", score: 4280, streak: 3 },
  { rank: 2, maskedName: "Trần Thảo Vy ·...812", score: 3940, streak: 3 },
  { rank: 3, maskedName: "Lê Quốc Bảo ·...109", score: 3610, streak: 2 },
  { rank: 4, maskedName: "Phạm Gia Huy ·...554", score: 3120, streak: 1 },
  { rank: 5, maskedName: "Võ Ngọc Anh ·...901", score: 2890, streak: 2 }
];

function computeServerBoundedScore(
  baseScore: number,
  elapsedSec: number,
  timeLimitSec: number,
  nextStreak: number
) {
  const clamped = Math.max(0, Math.min(elapsedSec, timeLimitSec));
  const speedPart = Math.floor(baseScore * (1 - 0.5 * (clamped / timeLimitSec)));
  const streakBonus = nextStreak >= 2 ? 100 * Math.min(nextStreak - 1, 5) : 0;
  return { speedPart, streakBonus, total: speedPart + streakBonus };
}

export function MinigamePlayerPage() {
  const [searchParams] = useSearchParams();
  const authorities = useAuthStore((s) => s.authorities);
  const authFullName = useAuthStore((s) => s.fullName);
  const authUserId = useAuthStore((s) => s.userId);
  const canControlStage = hasAnyPermission(authorities, PERMISSIONS.STAGE_CONTROL);

  const qrPinRaw = searchParams.get("pin")?.replace(/\D/g, "").slice(0, 6) ?? "";
  const formattedQrPin =
    qrPinRaw.length === 6 ? `${qrPinRaw.slice(0, 3)} ${qrPinRaw.slice(3)}` : null;
  const initialMatchedRoom = formattedQrPin
    ? MINIGAME_ROOMS.find((r) => r.pin.replace(/\s+/g, "") === qrPinRaw) ?? null
    : null;

  const [accessFilter, setAccessFilter] = useState<"ALL" | "REQUIRE_ATTENDANCE" | "NO_ATTENDANCE">("ALL");
  const [quickPin, setQuickPin] = useState(qrPinRaw);
  const [selectedRoom, setSelectedRoom] = useState<MinigameRoom | null>(initialMatchedRoom);

  const [phase, setPhase] = useState<"catalog" | "join" | "playing" | "result">(
    initialMatchedRoom ? "join" : "catalog"
  );
  const [pin, setPin] = useState(formattedQrPin ?? "739 204");
  const [isGuest, setIsGuest] = useState(false);
  const [displayName, setDisplayName] = useState(authFullName ?? "Trần Đức Thịnh");
  const [mssv, setMssv] = useState(authUserId ?? "22110418");
  const [joinError, setJoinError] = useState<string | null>(
    formattedQrPin && !initialMatchedRoom
      ? "Không tìm thấy phòng, kiểm tra lại PIN trên màn hình LED."
      : null
  );

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(DEMO_QUESTIONS[0]!.timeLimitSec);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastGain, setLastGain] = useState<{
    correct: boolean;
    speedPart: number;
    streakBonus: number;
    total: number;
  } | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  const filteredRooms = useMemo(
    () =>
      MINIGAME_ROOMS.filter((r) => {
        if (accessFilter === "REQUIRE_ATTENDANCE") return r.requireAttendance;
        if (accessFilter === "NO_ATTENDANCE") return !r.requireAttendance;
        return true;
      }),
    [accessFilter]
  );

  const currentQuestion = DEMO_QUESTIONS[qIndex] ?? DEMO_QUESTIONS[0]!;
  const maskedPlayerLabel = useMemo(() => {
    if (isGuest) return `${displayName.trim() || "Khách mời"} · Khách`;
    return maskStudentCode(mssv, displayName.trim() || "Sinh viên FIT");
  }, [displayName, isGuest, mssv]);

  useEffect(() => {
    if (phase !== "playing" || submitted || reconnecting) return;
    if (timeLeft <= 0) {
      setSubmitted(true);
      setStreak(0);
      setLastGain({ correct: false, speedPart: 0, streakBonus: 0, total: 0 });
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, submitted, timeLeft, reconnecting]);

  const openRoomJoin = (room: MinigameRoom) => {
    setSelectedRoom(room);
    setPin(room.pin);
    setJoinError(null);
    setPhase("join");
  };

  const handleQuickPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = quickPin.replace(/\D/g, "");
    if (digits.length !== 6) {
      setJoinError("Mã PIN phòng chơi phải gồm đúng 6 chữ số.");
      return;
    }
    const formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    const matched = MINIGAME_ROOMS.find((r) => r.pin.replace(/\s+/g, "") === digits);
    if (!matched) {
      setJoinError("Không tìm thấy phòng, kiểm tra lại PIN trên màn hình LED.");
      return;
    }
    if (matched.requireAttendance && !matched.userCheckedIn) {
      setJoinError("Phòng này yêu cầu bạn quét QR điểm danh sự kiện trước khi tham gia.");
      return;
    }
    setSelectedRoom(matched);
    setPin(formatted);
    setJoinError(null);
    setPhase("join");
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = pin.replace(/\s+/g, "");
    if (digits.length !== 6) {
      setJoinError("Mã PIN phòng chơi phải gồm đúng 6 chữ số.");
      return;
    }
    const matched = MINIGAME_ROOMS.find((r) => r.pin.replace(/\s+/g, "") === digits);
    if (!matched) {
      setJoinError("Không tìm thấy phòng, kiểm tra lại PIN trên màn hình LED.");
      return;
    }
    if (matched.requireAttendance && !matched.userCheckedIn) {
      setJoinError("Phòng này yêu cầu bạn quét QR điểm danh sự kiện trước khi tham gia.");
      return;
    }
    const lowered = displayName.toLowerCase();
    if (isGuest && PROFANITY_BLOCKLIST.some((w) => lowered.includes(w))) {
      setJoinError("Tên hiển thị chứa từ ngữ bị chặn bởi bộ lọc Khách mời.");
      return;
    }
    setSelectedRoom(matched);
    setJoinError(null);
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setSelected([]);
    setSubmitted(false);
    setLastGain(null);
    setTimeLeft(DEMO_QUESTIONS[0]!.timeLimitSec);
    setPhase("playing");
  };

  const toggleOption = (key: string) => {
    if (submitted || reconnecting) return;
    if (currentQuestion.kind === "MULTI") {
      setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    } else {
      setSelected([key]);
    }
  };

  const handleSubmitAnswer = () => {
    if (submitted || selected.length === 0) return;
    const expected = [...currentQuestion.correctKeys].sort().join(",");
    const actual = [...selected].sort().join(",");
    const isCorrect = expected === actual;
    const elapsed = currentQuestion.timeLimitSec - timeLeft;

    if (isCorrect) {
      const nextStreak = streak + 1;
      const calc = computeServerBoundedScore(
        currentQuestion.baseScore,
        elapsed,
        currentQuestion.timeLimitSec,
        nextStreak
      );
      setStreak(nextStreak);
      setScore((prev) => prev + calc.total);
      setLastGain({ correct: true, ...calc });
    } else {
      setStreak(0);
      setLastGain({ correct: false, speedPart: 0, streakBonus: 0, total: 0 });
    }
    setSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (qIndex + 1 >= DEMO_QUESTIONS.length) {
      setPhase("result");
      return;
    }
    const nextIdx = qIndex + 1;
    setQIndex(nextIdx);
    setSelected([]);
    setSubmitted(false);
    setLastGain(null);
    setTimeLeft(DEMO_QUESTIONS[nextIdx]!.timeLimitSec);
  };

  const handleSimulateDisconnect = () => {
    setReconnecting(true);
    setRecoveryNotice(null);
    window.setTimeout(() => {
      setReconnecting(false);
      setRecoveryNotice(
        `Đã khôi phục phiên phòng ${pin}: bảo toàn ${score.toLocaleString("vi-VN")} điểm, chuỗi thắng ×${streak} và đồng bộ câu ${qIndex + 1}/${DEMO_QUESTIONS.length}.`
      );
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Minigame &amp; Đấu trường FIT
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Chọn chương trình đang mở theo quy định cần điểm danh hoặc không cần điểm danh, hoặc nhập nhanh mã PIN 6 số trên màn hình LED để vào phòng chơi.
            </p>
          </div>

          {canControlStage && (
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Button asChild variant="outline" size="sm" className="h-10 rounded-full sm:h-9">
                <Link to="/stage/minigame">
                  <MonitorPlay className="h-4 w-4" />
                  <span>LED Sân khấu</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* PHASE 0: ROOM CATALOG + QUICK PIN ENTRY */}
      {phase === "catalog" && (
        <div className="space-y-5">
          {/* Quick PIN Join Strip */}
          <Card className="rounded-[22px]">
            <CardContent className="p-4 sm:p-5">
              <form
                onSubmit={handleQuickPinSubmit}
                className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground sm:shrink-0">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>Có sẵn mã PIN trên LED?</span>
                </div>
                <Input
                  value={quickPin}
                  onChange={(e) => {
                    setQuickPin(e.target.value);
                    if (joinError) setJoinError(null);
                  }}
                  inputMode="numeric"
                  placeholder="Nhập mã PIN 6 số (VD: 739 204)"
                  className="tabular-mono h-11 flex-1 rounded-full text-base tracking-wider sm:h-10 sm:text-sm"
                  aria-label="Nhập nhanh mã PIN phòng minigame"
                />
                <Button
                  type="submit"
                  className="liquid-glass-btn-cobalt h-11 w-full rounded-full px-6 sm:h-10 sm:w-auto"
                >
                  Vào bằng PIN
                </Button>
              </form>
              {joinError && (
                <p className="mt-2.5 text-xs font-medium text-status-danger">{joinError}</p>
              )}
            </CardContent>
          </Card>

          {/* Access Filter */}
          <Tabs
            value={accessFilter}
            onValueChange={(v) => setAccessFilter(v as "ALL" | "REQUIRE_ATTENDANCE" | "NO_ATTENDANCE")}
          >
            <TabsList>
              <TabsTrigger value="ALL">Tất cả ({MINIGAME_ROOMS.length})</TabsTrigger>
              <TabsTrigger value="REQUIRE_ATTENDANCE">
                Cần điểm danh ({MINIGAME_ROOMS.filter((r) => r.requireAttendance).length})
              </TabsTrigger>
              <TabsTrigger value="NO_ATTENDANCE">
                Không cần điểm danh ({MINIGAME_ROOMS.filter((r) => !r.requireAttendance).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Program Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const isOpen = room.status === "OPEN";
              const needsCheckin = isOpen && room.requireAttendance && !room.userCheckedIn;
              const canEnter = isOpen && (!room.requireAttendance || room.userCheckedIn);

              return (
                <Card
                  key={room.id}
                  className="liquid-glass-card flex flex-col justify-between rounded-[22px] border border-border/80"
                >
                  <CardHeader className="space-y-2.5 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge
                        variant={room.requireAttendance ? "warning" : "info"}
                        className="gap-1"
                      >
                        {room.requireAttendance ? (
                          <QrCode className="h-3 w-3" />
                        ) : (
                          <Globe className="h-3 w-3" />
                        )}
                        <span>{room.requireAttendance ? "Cần điểm danh" : "Không cần điểm danh"}</span>
                      </Badge>
                      <Badge variant={needsCheckin ? "secondary" : isOpen ? "success" : "secondary"}>
                        {needsCheckin ? "Chưa điểm danh" : isOpen ? "Đang mở" : "Sắp diễn ra"}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-primary">{room.eventLabel}</p>
                      <CardTitle className="mt-1 font-display text-lg font-medium leading-snug">
                        {room.title}
                      </CardTitle>
                    </div>

                    <CardDescription className="text-xs leading-relaxed">
                      {room.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/35 p-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 text-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{room.accessRuleNote}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {room.timeWindow}
                        </span>
                        <span className="tabular-mono inline-flex items-center gap-1 font-medium text-foreground">
                          <Users className="h-3 w-3 text-primary" />
                          {isOpen ? `${room.playerCount} người chơi` : `${room.questionCount} câu hỏi`}
                        </span>
                      </div>
                    </div>

                    {needsCheckin ? (
                      <Button asChild variant="outline" className="h-11 w-full rounded-full">
                        <Link to="/scanner">
                          <QrCode className="h-4 w-4 text-primary" />
                          <span>Quét QR điểm danh để mở khóa</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={!canEnter}
                        onClick={() => openRoomJoin(room)}
                        className={cn("h-11 w-full rounded-full", canEnter && "liquid-glass-btn-cobalt")}
                        variant={canEnter ? "default" : "outline"}
                      >
                        <Gamepad2 className="h-4 w-4" />
                        <span>{canEnter ? `Tham gia phòng (PIN ${room.pin})` : "Chưa mở phòng"}</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* PHASE 1: JOIN ROOM */}
      {phase === "join" && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-full sm:h-9"
            onClick={() => setPhase("catalog")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Danh sách chương trình Minigame</span>
          </Button>

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="flex flex-col justify-between rounded-[20px] lg:col-span-7">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <span>{selectedRoom?.title ?? "Tham gia Phòng chơi Trực tiếp"}</span>
                </CardTitle>
                <CardDescription>
                  Màn hình LED luôn che 5 số đầu MSSV (<span className="tabular-mono">Họ tên ·...3 số cuối</span>) để bảo vệ thông tin cá nhân.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="mg-pin">Mã PIN 6 số</Label>
                      <Input
                        id="mg-pin"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="tabular-mono h-11 rounded-xl text-base font-semibold tracking-widest sm:h-10"
                        placeholder="739 204"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mg-name">Họ tên hiển thị</Label>
                      <Input
                        id="mg-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                      />
                    </div>
                  </div>

                  {!isGuest && (
                    <div className="space-y-1.5">
                      <Label htmlFor="mg-mssv">Mã số sinh viên (tự động che 5 số đầu trên LED)</Label>
                      <Input
                        id="mg-mssv"
                        inputMode="numeric"
                        value={mssv}
                        onChange={(e) => setMssv(e.target.value)}
                        className="tabular-mono h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                      />
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={isGuest}
                      onChange={(e) => setIsGuest(e.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                    />
                    <span>Tham gia chế độ Khách mời (bật bộ lọc từ ngữ nhạy cảm)</span>
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                    <span>Tên hiển thị trên màn hình LED</span>
                    <span className="tabular-mono font-semibold text-foreground">{maskedPlayerLabel}</span>
                  </div>

                  {joinError && (
                    <p className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2 text-xs font-medium text-status-danger">
                      {joinError}
                    </p>
                  )}

                  <div className="pt-1">
                    <Button type="submit" className="liquid-glass-btn-cobalt h-12 w-full rounded-full sm:h-11 sm:w-auto sm:px-7">
                      Vào phòng chơi ngay
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="liquid-glass-card flex flex-col justify-between gap-4 rounded-[20px] p-5 sm:p-6 lg:col-span-5">
              <div className="space-y-3.5">
                <div>
                  <h2 className="font-display text-lg font-medium text-foreground">
                    Thể lệ Tính điểm &amp; Bảo toàn Phiên
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Công bằng theo đồng hồ máy chủ · Tự đồng bộ khi mất mạng
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-xl border border-border/70 bg-card/85 p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>Tốc độ trả lời</span>
                      <span className="tabular-mono text-primary">1.000 – 2.000đ</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Trả lời đúng càng sớm điểm càng cao; thời gian được đối chiếu trực tiếp trên máy chủ để đảm bảo công bằng.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card/85 p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>Thưởng chuỗi thắng (Streak)</span>
                      <span className="tabular-mono text-status-warning">Tối đa +500đ</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Đúng liên tiếp từ câu thứ 2 trở đi được cộng thêm +100đ mỗi câu nối tiếp.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card/85 p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>Khôi phục khi rớt mạng</span>
                      <span className="text-status-success">Tự động</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Lỡ tải lại trang hoặc chuyển 4G/Wi-Fi? Nhập lại mã PIN để giữ nguyên điểm số, chuỗi thắng và câu hiện tại.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: PLAYING */}
      {phase === "playing" && (
        <div className="space-y-4">
          <div className="liquid-glass flex flex-wrap items-center justify-between gap-2.5 rounded-2xl px-4 py-2.5 sm:rounded-full sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" className="rounded-full">
                <Users className="h-3.5 w-3.5" />
                PIN {pin}
              </Badge>
              <span className="tabular-mono text-xs font-semibold text-foreground sm:text-sm">
                {maskedPlayerLabel}
              </span>
              <Badge variant="secondary" className="rounded-full tabular-mono">
                Câu {qIndex + 1}/{DEMO_QUESTIONS.length}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-status-warning/30 bg-status-warning/10 px-3 py-1 tabular-mono text-xs font-semibold text-status-warning">
                <Flame className="h-3.5 w-3.5" />
                Streak ×{streak}
              </div>
              <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 tabular-mono text-xs font-semibold text-primary">
                {score.toLocaleString("vi-VN")} điểm
              </div>
              {import.meta.env.DEV && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleSimulateDisconnect}
                  disabled={reconnecting}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", reconnecting && "animate-spin")} />
                  <span className="hidden sm:inline">Mô phỏng rớt mạng</span>
                </Button>
              )}
            </div>
          </div>

          {reconnecting && (
            <div className="flex items-center gap-2 rounded-xl border border-status-warning/35 bg-status-warning/10 px-4 py-2.5 text-sm font-medium text-status-warning">
              <WifiOff className="h-4 w-4 shrink-0" />
              Đang kết nối lại máy chủ phòng chơi và khôi phục trạng thái phiên...
            </div>
          )}

          {recoveryNotice && (
            <div className="flex items-center gap-2 rounded-xl border border-status-success/35 bg-status-success/10 px-4 py-2.5 text-sm font-medium text-status-success">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {recoveryNotice}
            </div>
          )}

          <Card className="rounded-[20px]">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={currentQuestion.kind === "MULTI" ? "warning" : "default"}>
                  {currentQuestion.kind === "SINGLE"
                    ? "1 đáp án đúng"
                    : currentQuestion.kind === "MULTI"
                      ? "Nhiều đáp án đúng (chọn đủ toàn bộ)"
                      : "Đúng / Sai"}
                </Badge>
                <div className="flex items-center gap-3">
                  <span className="tabular-mono text-xs text-muted-foreground">
                    Điểm cơ bản: {currentQuestion.baseScore}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 tabular-mono text-sm font-semibold",
                      timeLeft <= 5
                        ? "bg-status-danger/15 text-status-danger"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {timeLeft}s / {currentQuestion.timeLimitSec}s
                  </span>
                </div>
              </div>
              <CardTitle className="text-lg leading-snug sm:text-xl">{currentQuestion.prompt}</CardTitle>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    timeLeft <= 5 ? "bg-status-danger" : "bg-primary"
                  )}
                  style={{ width: `${(timeLeft / currentQuestion.timeLimitSec) * 100}%` }}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((opt) => {
                  const isPicked = selected.includes(opt.key);
                  const isCorrect = currentQuestion.correctKeys.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={submitted || reconnecting}
                      onClick={() => toggleOption(opt.key)}
                      className={cn(
                        "flex min-h-[56px] items-start gap-3 rounded-xl border p-4 text-left text-sm transition-colors",
                        !submitted && isPicked && "border-primary bg-primary/8",
                        !submitted && !isPicked && "border-border bg-card hover:border-primary/40",
                        submitted && isCorrect && "border-status-success bg-status-success/10",
                        submitted && isPicked && !isCorrect && "border-status-danger bg-status-danger/10"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg tabular-mono text-xs font-semibold",
                          isPicked ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        )}
                      >
                        {opt.key}
                      </span>
                      <span className="pt-0.5 font-medium leading-relaxed text-foreground">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {lastGain && (
                <div
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
                    lastGain.correct
                      ? "border-status-success/35 bg-status-success/10 text-status-success"
                      : "border-status-danger/35 bg-status-danger/10 text-status-danger"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {lastGain.correct ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>
                      {lastGain.correct
                        ? `Chính xác! +${lastGain.total.toLocaleString("vi-VN")} điểm`
                        : "Chưa chính xác — Chuỗi thắng đặt lại về 0"}
                    </span>
                  </div>
                  {lastGain.correct && (
                    <span className="tabular-mono text-xs">
                      Tốc độ: +{lastGain.speedPart} · Streak: +{lastGain.streakBonus}
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {!submitted ? (
                  <Button
                    type="button"
                    className="liquid-glass-btn-cobalt h-11 w-full rounded-full sm:w-auto sm:px-6"
                    onClick={handleSubmitAnswer}
                    disabled={selected.length === 0}
                  >
                    Chốt đáp án
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="liquid-glass-btn-cobalt h-11 w-full rounded-full sm:w-auto sm:px-6"
                    onClick={handleNextQuestion}
                  >
                    {qIndex + 1 >= DEMO_QUESTIONS.length ? "Xem Bảng Vinh danh" : "Sang câu tiếp theo"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PHASE 3: RESULT */}
      {phase === "result" && (
        <Card className="rounded-[20px]">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-5 w-5 text-status-warning" />
                Vinh danh Chung cuộc · Phòng {pin}
              </CardTitle>
              <CardDescription>
                Điểm của bạn ({maskedPlayerLabel}):{" "}
                <strong className="tabular-mono text-foreground">{score.toLocaleString("vi-VN")} điểm</strong>
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-full sm:w-auto"
              onClick={() => setPhase("catalog")}
            >
              Về danh sách Minigame
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              ...TOP_LEADERBOARD,
              { rank: 6, maskedName: `${maskedPlayerLabel} (Bạn)`, score, streak }
            ]
              .sort((a, b) => b.score - a.score)
              .map((row, idx) => (
                <div
                  key={`${row.maskedName}-${idx}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm sm:px-4",
                    row.maskedName.includes("(Bạn)")
                      ? "border-primary/40 bg-primary/8"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted tabular-mono text-xs font-semibold">
                      #{idx + 1}
                    </span>
                    <span className="truncate font-medium text-foreground">{row.maskedName}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5 tabular-mono sm:gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:inline">Streak ×{row.streak}</span>
                    <span className="font-semibold text-foreground">{row.score.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
