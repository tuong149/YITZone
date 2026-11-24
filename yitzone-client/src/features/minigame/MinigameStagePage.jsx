import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Flame, Shield, Trophy, Users } from "lucide-react";
import { cn, maskStudentCode } from "@/lib/utils";

const STAGE_PLAYERS = [
  { name: maskStudentCode("22110345", "Nguyễn Minh Khôi"), score: 4280, streak: 3 },
  { name: maskStudentCode("23110812", "Trần Thảo Vy"), score: 3940, streak: 3 },
  { name: maskStudentCode("24162109", "Lê Quốc Bảo"), score: 3610, streak: 2 },
  { name: maskStudentCode("22110554", "Phạm Gia Huy"), score: 3120, streak: 1 },
  { name: maskStudentCode("23133901", "Võ Ngọc Anh"), score: 2890, streak: 2 },
  { name: maskStudentCode("22110276", "Đặng Hoàng Phúc"), score: 2640, streak: 1 }
];

const STAGE_QUESTION = {
  index: 2,
  total: 10,
  prompt: "Trong quy chế Đoàn - Hội Khoa CNTT, thời hạn hậu kiểm điểm danh sự kiện tối đa là bao nhiêu giờ?",
  timeLimit: 20,
  options: [
    { key: "A", label: "12 giờ sau khi đóng sự kiện", count: 14, correct: false },
    { key: "B", label: "24 giờ làm việc", count: 29, correct: false },
    { key: "C", label: "48 giờ kèm chấm điểm rủi ro trọng số", count: 142, correct: true },
    { key: "D", label: "7 ngày kể từ ngày tổ chức", count: 9, correct: false }
  ]
};

export function MinigameStagePage(){
  const [mode, setMode] = useState("lobby");
  const [guestEnabled, setGuestEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(STAGE_QUESTION.timeLimit);

  useEffect(() => {
    if (mode !== "question") return;
    if (timeLeft <= 0) {
      setMode("reveal");
      return;
    }
    const id = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, timeLeft]);

  const totalAnswers = STAGE_QUESTION.options.reduce((acc, o) => acc + o.count, 0);

  return (
    <div className="space-y-6">
      {/* MC Stage Mode Switcher — exact parity with VotingStagePage */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(
          [
            { id: "lobby", label: "Phòng chờ PIN" },
            { id: "question", label: "Chiếu câu hỏi" },
            { id: "reveal", label: "Chốt đáp án" },
            { id: "podium", label: "Top Vinh danh" }
          ]
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (m.id === "question") setTimeLeft(STAGE_QUESTION.timeLimit);
              setMode(m.id);
            }}
            className={cn(
              "rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
              mode === m.id
                ? "bg-white text-[#050814]"
: "border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* 70% Main LED Display */}
        <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-8 lg:p-10">
          {mode === "lobby" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
                  MINIGAME HỘI TRƯỜNG · ZSET LIVE
                </span>
                <button
                  type="button"
                  onClick={() => setGuestEnabled((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Khách mời (Lọc từ nhạy cảm): {guestEnabled ? "BẬT": "TẮT"}</span>
                </button>
              </div>

              <h1 className="font-display text-3xl font-medium text-white sm:text-5xl">
                Đấu trường Công nghệ FIT 2026
              </h1>
              <p className="text-base text-slate-300">
                Quét mã QR hoặc nhập PIN trên điện thoại để vào sảnh chờ. Danh sách người chơi che 5 số đầu MSSV tự động.
              </p>

              <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                {STAGE_PLAYERS.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 tabular-mono text-sm font-medium text-white"
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(mode === "question" || mode === "reveal") && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 tabular-mono text-xs font-semibold tracking-wider text-sky-200">
                  CÂU {STAGE_QUESTION.index} / {STAGE_QUESTION.total} · 1 ĐÁP ÁN ĐÚNG
                </span>
                <span
                  className={cn(
                    "rounded-full border px-4 py-1 tabular-mono text-2xl font-semibold",
                    timeLeft <= 5 && mode === "question"
                      ? "border-rose-400/50 bg-rose-500/20 text-rose-200"
: "border-sky-400/40 bg-sky-500/15 text-white"
                  )}
                >
                  {mode === "reveal" ? "HẾT GIỜ": `${timeLeft}s`}
                </span>
              </div>

              <h2 className="font-display text-3xl font-medium leading-snug text-white sm:text-4xl">
                {STAGE_QUESTION.prompt}
              </h2>

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                {STAGE_QUESTION.options.map((opt) => {
                  const pct = Math.round((opt.count / totalAnswers) * 100);
                  return (
                    <div
                      key={opt.key}
                      className={cn(
                        "rounded-2xl border p-5 transition-all",
                        mode === "reveal" && opt.correct
                          ? "border-emerald-400 bg-emerald-500/20"
: mode === "reveal"
                            ? "border-white/10 bg-white/5 opacity-60"
: "border-white/15 bg-white/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 tabular-mono text-sm font-semibold text-white">
                            {opt.key}
                          </span>
                          <span className="text-lg font-medium text-white">{opt.label}</span>
                        </div>
                        {mode === "reveal" && opt.correct && (
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-300" />
                        )}
                      </div>
                      {mode === "reveal" && (
                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between tabular-mono text-xs text-slate-300">
                            <span>{opt.count} lượt chọn</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                opt.correct
                                  ? "bg-emerald-400"
: "bg-gradient-to-r from-[#3B5BFF] to-[#38BDF8]"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mode === "podium" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-300" />
                <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
                  Bảng Vàng Top Chung cuộc
                </h2>
              </div>

              <div className="space-y-4 pt-2">
                {STAGE_PLAYERS.slice(0, 5).map((player, idx) => {
                  const barPct = Math.round((player.score / STAGE_PLAYERS[0].score) * 100);
                  return (
                    <div key={player.name} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="tabular-mono text-lg font-semibold text-sky-300">#{idx + 1}</span>
                          <span className="font-display text-xl font-medium text-white tabular-mono">
                            {player.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 tabular-mono">
                          <span className="inline-flex items-center gap-1 text-sm text-amber-300">
                            <Flame className="h-4 w-4" />×{player.streak}
                          </span>
                          <span className="text-xl font-semibold text-white">
                            {player.score.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>
                      <div className="h-3.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#38BDF8] transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-300" />
              <strong className="tabular-mono text-white">194</strong> người chơi đang trực tuyến
            </span>
            <span className="tabular-mono text-xs text-slate-400">
              Server-Bounded Scoring · Auto Reconnect
            </span>
          </div>
        </div>

        {/* 30% Real QR + PIN Column */}
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-[#0E1529] p-8 text-center lg:col-span-4">
          <div className="rounded-2xl bg-white p-5">
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin: "https://yitzone.fit.hcmute.edu.vn"}/minigame?pin=739204`}
              size={184}
              level="M"
            />
          </div>
          <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-300">
            Quét QR hoặc nhập Mã PIN
          </div>
          <div className="mt-1.5 tabular-mono text-4xl font-semibold tracking-[0.18em] text-white sm:text-5xl">
            739 204
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Rớt mạng giữa chừng? Mở lại trình duyệt để khôi phục nguyên điểm &amp; chuỗi thắng
          </p>
        </div>
      </div>
    </div>
  );
}
