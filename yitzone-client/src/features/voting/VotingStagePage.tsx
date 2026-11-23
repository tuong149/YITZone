import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Lock, Snowflake, Users } from "lucide-react";

const LED_ACTS = [
  { code: "02", name: "Nhảy Hiện đại Cyber Pulse", votes: 162, pct: 38 },
  { code: "01", name: "Mashup Tuổi trẻ FIT", votes: 148, pct: 34 },
  { code: "03", name: "Hòa tấu Guitar & Cajon", votes: 119, pct: 28 }
];

export function VotingStagePage(){
  const [mode, setMode] = useState<"IDENTIFIED" | "FROZEN" | "SECRET_BALLOT">("IDENTIFIED");

  return (
    <div className="space-y-6">
      {/* Quick stage demo mode switcher for MC */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(
          [
            { id: "IDENTIFIED", label: "Đua Top Trực tiếp" },
            { id: "FROZEN", label: "Freeze Mode (Đóng băng)" },
            { id: "SECRET_BALLOT", label: "Bỏ phiếu Kín (Ẩn kiểm phiếu)" }
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              mode === m.id
                ? "bg-white text-[#050814]"
: "border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* 70% Main LED Display */}
        <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-8 lg:p-10">
          {mode === "SECRET_BALLOT" ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-10 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
                <Lock className="h-4 w-4" />
                <span>CHẾ ĐỘ BỎ PHIẾU KÍN · KHÔNG HIỂN THỊ KIỂM PHIẾU THỜI GIAN THỰC</span>
              </span>
              <h1 className="font-display text-3xl font-medium text-white sm:text-5xl">
                Biểu quyết Nghị quyết Đại hội Đoàn Khoa CNTT 2026
              </h1>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-8 py-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                  Tổng số đại biểu đã bỏ phiếu
                </div>
                <div className="mt-2 tabular-mono text-5xl font-semibold text-sky-300 sm:text-6xl">
                  119 / 150
                </div>
              </div>
            </div>
          ): (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {mode === "FROZEN" ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-amber-200">
                    <Snowflake className="h-4 w-4" />
                    <span>FREEZE MODE · ĐANG ĐÓNG BĂNG BẢNG XẾP HẠNG PHÚT CHÓT</span>
                  </span>
                ): (
                  <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
                    LIVE VOTING · ĐÊM GALA VĂN NGHỆ FIT 2026
                  </span>
                )}
                <span className="inline-flex items-center gap-2 tabular-mono text-sm font-semibold text-slate-300">
                  <Users className="h-4 w-4 text-sky-300" />
                  <span>429 lượt bình chọn</span>
                </span>
              </div>

              <h1 className="font-display text-3xl font-medium text-white sm:text-4xl">
                Bình chọn Tiết mục được Yêu thích nhất
              </h1>

              <div className="space-y-5 pt-2">
                {LED_ACTS.map((act, idx) => (
                  <div key={act.code} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="tabular-mono text-lg font-semibold text-sky-300">#{idx + 1}</span>
                        <span className="font-display text-xl font-medium text-white sm:text-2xl">
                          {act.name}
                        </span>
                      </div>
                      <span className="tabular-mono text-xl font-semibold text-white">
                        {mode === "FROZEN" ? "— %": `${act.votes} phiếu (${act.pct}%)`}
                      </span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#38BDF8] transition-all duration-500"
                        style={{ width: mode === "FROZEN" ? "50%": `${act.pct * 2.2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 30% QR + PIN Column */}
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-[#0E1529] p-8 text-center lg:col-span-4">
          <div className="rounded-2xl bg-white p-5">
            <QRCodeSVG value="https://yitzone.fit.hcmute.edu.vn/voting" size={184} level="M" />
          </div>
          <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-300">
            Quét QR tham gia Bình chọn
          </div>
          <div className="mt-1.5 tabular-mono text-4xl font-semibold tracking-[0.18em] text-white sm:text-5xl">
            904 218
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Hết pin điện thoại? Mang thẻ SV ra Quầy Kiosk 60s
          </p>
        </div>
      </div>
    </div>
  );
}
