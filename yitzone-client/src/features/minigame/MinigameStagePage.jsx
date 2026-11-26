import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Flame, Shield, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMinigameRooms } from "./api";

const STAGE_PLAYERS = [];
const STAGE_QUESTION = null;

export function MinigameStagePage() {
  const [searchParams] = useSearchParams();
  const { data: rooms = [] } = useMinigameRooms();
  const requestedPin = (searchParams.get("pin") ?? "").replace(/\D/g, "");
  const activeRoom =
    rooms.find((r) => (r.pin ?? "").replace(/\D/g, "") === requestedPin) ?? rooms[0] ?? null;

  const [mode, setMode] = useState("lobby");
  const [guestEnabled, setGuestEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(STAGE_QUESTION?.timeLimit ?? 20);

  useEffect(() => {
    if (mode !== "question" || !STAGE_QUESTION) return;
    if (timeLeft <= 0) {
      setMode("reveal");
      return;
    }
    const id = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, timeLeft]);

  const totalAnswers = STAGE_QUESTION
    ? STAGE_QUESTION.options.reduce((acc, o) => acc + o.count, 0)
    : 0;
  const rawPin = (activeRoom?.pin ?? requestedPin).replace(/\D/g, "");
  const formattedPin =
    rawPin.length === 6 ? `${rawPin.slice(0, 3)} ${rawPin.slice(3)}` : "--- ---";
  const onlineCount = activeRoom?.playerCount ?? STAGE_PLAYERS.length;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://yitzone.fit.hcmute.edu.vn";

  return (
    <div className="space-y-6">
      {/* MC Stage Mode Switcher */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {[
          { id: "lobby", label: "Phòng chờ PIN" },
          { id: "question", label: "Chiếu câu hỏi" },
          { id: "reveal", label: "Chốt đáp án" },
          { id: "podium", label: "Top Vinh danh" }
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (m.id === "question" && STAGE_QUESTION) {
                setTimeLeft(STAGE_QUESTION.timeLimit);
              }
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
                  <span>Khách mời (Lọc từ nhạy cảm): {guestEnabled ? "BẬT" : "TẮT"}</span>
                </button>
              </div>

              <h1 className="font-display text-3xl font-medium text-white sm:text-5xl">
                {activeRoom?.title ?? "Chờ Ban Tổ chức mở phòng Minigame"}
              </h1>
              <p className="text-base text-slate-300">
                Quét mã QR hoặc nhập PIN trên điện thoại để vào sảnh chờ. Danh sách người chơi che 5 số đầu MSSV tự động.
              </p>

              {STAGE_PLAYERS.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
                  Sảnh chờ đang mở — danh sách người chơi tham gia trực tiếp sẽ xuất hiện tại đây.
                </div>
              ) : (
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
              )}
            </div>
          )}

          {(mode === "question" || mode === "reveal") && (
            <div className="space-y-6">
              {!STAGE_QUESTION ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center">
                  <div className="font-display text-2xl font-medium text-white">
                    Đang chờ MC phát câu hỏi tiếp theo từ máy chủ
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    Nội dung câu hỏi và đồng hồ đếm ngược sẽ đồng bộ tức thì lên màn hình LED khi bắt đầu lượt mới.
                  </p>
                </div>
              ) : (
                <>
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
                      {mode === "reveal" ? "HẾT GIỜ" : `${timeLeft}s`}
                    </span>
                  </div>

                  <h2 className="font-display text-3xl font-medium leading-snug text-white sm:text-4xl">
                    {STAGE_QUESTION.prompt}
                  </h2>

                  <div className="grid gap-4 pt-2 sm:grid-cols-2">
                    {STAGE_QUESTION.options.map((opt) => {
                      const pct =
                        totalAnswers > 0 ? Math.round((opt.count / totalAnswers) * 100) : 0;
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
                </>
              )}
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

              {STAGE_PLAYERS.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
                  Chưa có dữ liệu xếp hạng chung cuộc cho phiên Minigame này.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {STAGE_PLAYERS.slice(0, 5).map((player, idx) => {
                    const topScore = Math.max(1, STAGE_PLAYERS[0]?.score ?? 1);
                    const barPct = Math.round((player.score / topScore) * 100);
                    return (
                      <div key={player.name} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="tabular-mono text-lg font-semibold text-sky-300">
                              #{idx + 1}
                            </span>
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
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-300" />
              <strong className="tabular-mono text-white">{onlineCount}</strong> người chơi đang trực tuyến
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
              value={rawPin ? `${origin}/minigame?pin=${rawPin}` : `${origin}/minigame`}
              size={184}
              level="M"
            />
          </div>
          <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-300">
            Quét QR hoặc nhập Mã PIN
          </div>
          <div className="mt-1.5 tabular-mono text-4xl font-semibold tracking-[0.18em] text-white sm:text-5xl">
            {formattedPin}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Rớt mạng giữa chừng? Mở lại trình duyệt để khôi phục nguyên điểm &amp; chuỗi thắng
          </p>
        </div>
      </div>
    </div>
  );
}
