import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ThumbsUp, Users } from "lucide-react";
import { useEventStore } from "@/stores/event-store";
import { DEFAULT_QA_SESSION, useLiveQaStore } from "@/stores/liveqa-store";

export function LiveQaStagePage() {
  const [searchParams] = useSearchParams();
  const storedEvents = useEventStore((s) => s.events);
  const questions = useLiveQaStore((s) => s.questions);
  const activeSessionId = useLiveQaStore((s) => s.activeSessionId);

  const sessionOptions = useMemo(() => {
    const derived = DEFAULT_QA_SESSION.id ? [DEFAULT_QA_SESSION] : [];
    for (const evt of storedEvents) {
      for (const ses of evt.sessions ?? []) {
        if (!ses.activities?.liveQa) continue;
        const id = `qa-${evt.id}-${ses.id}`;
        if (derived.some((s) => s.id === id)) continue;
        derived.push({
          id,
          eventId: evt.id,
          label: `${evt.title} · ${ses.name}`,
          pin: String(400000 + ((evt.id.length * 7919 + ses.id.length * 104729) % 599999))
        });
      }
    }
    return derived;
  }, [storedEvents]);

  const targetSessionId = searchParams.get("sessionId") ?? activeSessionId;
  const activeSession =
    sessionOptions.find((s) => s.id === targetSessionId) ?? sessionOptions[0] ?? null;

  const sessionQuestions = useMemo(
    () =>
      activeSession?.id ? questions.filter((q) => q.sessionId === activeSession.id) : questions,
    [questions, activeSession?.id]
  );

  const stageQuestion = useMemo(
    () =>
      sessionQuestions.find((q) => q.onStage) ??
      sessionQuestions.find((q) => q.status === "APPROVED") ??
      null,
    [sessionQuestions]
  );

  const rawPin = (activeSession?.pin ?? DEFAULT_QA_SESSION.pin ?? "").replace(/\D/g, "");
  const formattedPin =
    rawPin.length >= 6 ? `${rawPin.slice(0, 3)} ${rawPin.slice(3, 6)}` : "--- ---";
  const sessionLabel =
    activeSession?.label || DEFAULT_QA_SESSION.label || "Chưa mở phiên Live Q&A";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://yitzone.fit.hcmute.edu.vn";

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* 70% Main Question Stage — WCAG >= 7:1 on Stage Panel #0E1529 */}
      <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-8 lg:p-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
              LIVE Q&amp;A · {stageQuestion?.onStage ? "ĐANG GIẢI ĐÁP TRỰC TIẾP" : "SẢNH NHẬN CÂU HỎI"}
            </span>
            <span className="inline-flex items-center gap-2 tabular-mono text-sm font-semibold text-slate-300">
              <Users className="h-4 w-4 text-sky-300" />
              <span>{sessionLabel}</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-medium leading-[1.2] text-white sm:text-4xl lg:text-5xl">
            {stageQuestion
              ? stageQuestion.content
              : rawPin
                ? "Quét mã QR hoặc nhập mã PIN 6 số để gửi câu hỏi trực tiếp tới Diễn giả"
                : "Đang chờ Ban Tổ chức kích hoạt phiên Live Q&A trên màn hình LED"}
          </h1>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6">
          <span className="text-base font-medium text-slate-200">
            {stageQuestion
              ? stageQuestion.authorDisplay
              : "Chờ MC chọn câu hỏi đã kiểm duyệt lên màn hình"}
          </span>
          {stageQuestion && (
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-400/15 px-4 py-1.5 tabular-mono text-xl font-semibold text-sky-200">
              <ThumbsUp className="h-5 w-5" />
              <span>{stageQuestion.upvoterIds?.length ?? 0} lượt ủng hộ</span>
            </span>
          )}
        </div>
      </div>

      {/* 30% QR + PIN Column with clean 16px+ white quiet zone */}
      <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-[#0E1529] p-8 text-center lg:col-span-4">
        <div className="rounded-2xl bg-white p-5">
          <QRCodeSVG
            value={rawPin ? `${origin}/live-qa/${rawPin}` : `${origin}/live-qa`}
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
          Hỗ trợ đặt câu hỏi ẩn danh · Tự động lọc từ ngữ nhạy cảm
        </p>
      </div>
    </div>
  );
}
