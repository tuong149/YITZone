import { QRCodeSVG } from "qrcode.react";
import { ThumbsUp, Users } from "lucide-react";

export function LiveQaStagePage(){
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* 70% Main Question Stage — WCAG >= 7:1 on Stage Panel #0E1529 */}
      <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-8 lg:p-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
              LIVE Q&amp;A · ĐANG GIẢI ĐÁP TRỰC TIẾP
            </span>
            <span className="inline-flex items-center gap-2 tabular-mono text-sm font-semibold text-slate-300">
              <Users className="h-4 w-4 text-sky-300" />
              <span>312 sinh viên đang tham gia</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-medium leading-[1.2] text-white sm:text-4xl lg:text-5xl">
            Sinh viên chuyển ngành vào Khoa CNTT nhưng giữ MSSV cũ có được ghi nhận chuẩn CĐDN không?
          </h1>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6">
          <span className="text-base font-medium text-slate-200">Sinh viên Khoa CNTT (Ẩn danh)</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-400/15 px-4 py-1.5 tabular-mono text-xl font-semibold text-sky-200">
            <ThumbsUp className="h-5 w-5" />
            <span>42 lượt ủng hộ</span>
          </span>
        </div>
      </div>

      {/* 30% QR + PIN Column with clean 16px+ white quiet zone */}
      <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-[#0E1529] p-8 text-center lg:col-span-4">
        <div className="rounded-2xl bg-white p-5">
          <QRCodeSVG value="https://yitzone.fit.hcmute.edu.vn/live-qa/482910" size={184} level="M" />
        </div>
        <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-300">
          Quét QR hoặc nhập Mã PIN
        </div>
        <div className="mt-1.5 tabular-mono text-4xl font-semibold tracking-[0.18em] text-white sm:text-5xl">
          482 910
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Hỗ trợ đặt câu hỏi ẩn danh · Tự động lọc từ ngữ nhạy cảm
        </p>
      </div>
    </div>
  );
}
