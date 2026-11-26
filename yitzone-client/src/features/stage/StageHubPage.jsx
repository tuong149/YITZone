import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CalendarDays,
  Gamepad2,
  MapPin,
  MessageSquareMore,
  MonitorPlay,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Vote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { mergeStoredAndApiEvents, useEvents } from "@/features/events/api";
import { useEventStore } from "@/stores/event-store";
import { DEFAULT_QA_SESSION } from "@/stores/liveqa-store";
import { useVotingStore } from "@/stores/voting-store";

export function StageHubPage({ mode = "hub" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryEventId = searchParams.get("eventId") ?? "";
  const querySessionId = searchParams.get("sessionId") ?? "";

  const storedEvents = useEventStore((s) => s.events);
  const { data: apiEventsData } = useEvents();
  const events = useMemo(
    () => mergeStoredAndApiEvents(storedEvents, apiEventsData),
    [storedEvents, apiEventsData]
  );

  const votingCampaigns = useVotingStore((s) => s.campaigns);
  const activeStageCampaignId = useVotingStore((s) => s.activeStageCampaignId);

  const selectedEvent = useMemo(() => {
    if (queryEventId) {
      const matched = events.find((e) => e.id === queryEventId);
      if (matched) return matched;
      return {
        id: queryEventId,
        title: `Sự kiện (${queryEventId})`,
        location: "Hội trường Khoa CNTT",
        sessions: querySessionId
          ? [{ id: querySessionId, name: `Phiên ${querySessionId}`, date: "", timeRange: "" }]
          : []
      };
    }
    return events[0] ?? null;
  }, [events, queryEventId, querySessionId]);

  const sessions = useMemo(
    () => selectedEvent?.sessions ?? [],
    [selectedEvent]
  );
  const selectedSession = useMemo(() => {
    if (querySessionId) {
      return sessions.find((s) => s.id === querySessionId) ?? sessions[0] ?? null;
    }
    return sessions[0] ?? null;
  }, [sessions, querySessionId]);

  const [secondsLeft, setSecondsLeft] = useState(10);
  const [nonce, setNonce] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()
  );
  const [rotationCount, setRotationCount] = useState(1);

  useEffect(() => {
    if (mode !== "checkin" || !selectedEvent) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextHex = Math.floor(100000 + Math.random() * 900000)
            .toString(16)
            .toUpperCase();
          setNonce(nextHex);
          setRotationCount((c) => c + 1);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, selectedEvent]);

  const sessionPin = useMemo(() => {
    if (!selectedEvent) return "";
    const digits = selectedEvent.id.replace(/\D/g, "");
    return digits.length >= 6 ? digits.slice(0, 6) : digits.padEnd(6, "0");
  }, [selectedEvent]);

  const qrPayload = useMemo(
    () =>
      selectedEvent
        ? JSON.stringify({
            t: "YIT_STAGE_QR_10S",
            evt: selectedEvent.id,
            ses: selectedSession?.id ?? "SESSION-1",
            pin: sessionPin,
            nonce,
            seq: rotationCount
          })
        : "",
    [selectedEvent, selectedSession, sessionPin, nonce, rotationCount]
  );

  const matchedVotingCampaign = useMemo(
    () =>
      (selectedEvent
        ? votingCampaigns.find((c) => c.eventId === selectedEvent.id)
        : undefined) ??
      votingCampaigns.find((c) => c.id === activeStageCampaignId) ??
      votingCampaigns[0] ??
      null,
    [votingCampaigns, selectedEvent, activeStageCampaignId]
  );

  if (!selectedEvent) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-[20px] border border-white/15 bg-[#0E1529] p-8 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/15 text-sky-300">
          <MonitorPlay className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h1 className="font-display text-2xl font-medium text-white sm:text-3xl">
            Chưa có sự kiện đang mở trình chiếu
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Hãy tạo hoặc xuất bản sự kiện trong trang Quản trị Sự kiện, sau đó mở chế độ trình chiếu LED 16:9 từ bàn điều hành.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-2 h-10 rounded-xl border-white/20 bg-white/5 px-5 text-white hover:bg-white/15"
        >
          <Link to="/admin/events">
            <ArrowLeft className="h-4 w-4" />
            <span>Mở Quản trị Sự kiện</span>
          </Link>
        </Button>
      </div>
    );
  }

  if (mode === "checkin") {
    return (
      <div className="grid gap-8 lg:grid-cols-12">
        {/* 70% Left Event & Rotation Info Panel — Flat #0E1529 per DESIGN.md */}
        <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-8 lg:p-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
                <QrCode className="h-4 w-4" />
                <span>ĐIỂM DANH QR ĐỘNG 10 GIÂY</span>
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300">
                {selectedSession?.name ?? "Phiên chính"}
                {selectedSession?.date ? ` · ${selectedSession.date}` : ""}
              </span>
            </div>

            <h1 className="font-display text-4xl font-medium leading-[1.15] text-white sm:text-5xl">
              {selectedEvent.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-base text-slate-300">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-sky-300" />
                {selectedSession?.location || selectedEvent.location || "Hội trường Khoa CNTT"}
              </span>
              {selectedSession?.timeRange && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-sky-300" />
                  <span className="tabular-mono">{selectedSession.timeRange}</span>
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
                <span>Chu kỳ đổi khóa chống chụp màn hình</span>
                <span className="inline-flex items-center gap-1.5 tabular-mono text-sky-300">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Nonce #{nonce}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="tabular-mono text-4xl font-semibold text-white">
                  {secondsLeft}s
                </span>
                <span className="tabular-mono text-xs text-slate-400">
                  Chu kỳ #{rotationCount}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#38BDF8] transition-all duration-500"
                  style={{ width: `${(secondsLeft / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-sky-300" />
            <span>Mở YITZone → Quét QR Điểm danh hoặc nhập 6 chữ số PIN bên phải để xác nhận có mặt.</span>
          </div>
        </div>

        {/* 30% Right QR + PIN Panel — White quiet zone >= 16px per DESIGN.md */}
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-[#0E1529] p-8 text-center lg:col-span-4">
          <div className="rounded-2xl bg-white p-6">
            <QRCodeSVG
              value={qrPayload}
              size={220}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#0B1636"
            />
          </div>
          <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-300">
            Mã PIN Dự phòng 6 số
          </div>
          <div className="mt-1 tabular-mono text-4xl font-semibold tracking-widest text-white">
            {sessionPin.slice(0, 3)} {sessionPin.slice(3)}
          </div>
        </div>
      </div>
    );
  }

  const encodedEventId = encodeURIComponent(selectedEvent.id);
  const checkinStageUrl = selectedSession
    ? `/stage/checkin?eventId=${encodedEventId}&sessionId=${encodeURIComponent(selectedSession.id)}`
    : `/stage/checkin?eventId=${encodedEventId}`;
  const votingStageUrl = matchedVotingCampaign
    ? `/stage/voting?campaignId=${encodeURIComponent(matchedVotingCampaign.id)}&eventId=${encodedEventId}`
    : `/stage/voting?eventId=${encodedEventId}`;
  const qaPinBadge = DEFAULT_QA_SESSION.pin
    ? `PIN ${DEFAULT_QA_SESSION.pin}`
    : "Theo phiên Live Q&A";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[20px] border border-white/15 bg-[#0E1529] p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-medium text-white sm:text-3xl">
            Bộ chọn Màn chiếu LED Hội trường (16:9)
          </h1>
          <p className="text-sm text-slate-300">
            Chọn sự kiện và buổi hoạt động, sau đó mở chế độ trình chiếu toàn màn hình. Khi đang chiếu, nhấn <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-xs text-white">Esc</kbd> để quay lại.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {events.length > 0 && (
            <div className="w-64">
              <Select
                value={selectedEvent.id}
                onValueChange={(val) => {
                  const next = new URLSearchParams(searchParams);
                  next.set("eventId", val);
                  next.delete("sessionId");
                  setSearchParams(next);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-white/15 bg-[#050814] text-sm text-white">
                  <SelectValue placeholder="Chọn sự kiện trình chiếu" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="w-48">
              <Select
                value={selectedSession?.id ?? ""}
                onValueChange={(val) => {
                  const next = new URLSearchParams(searchParams);
                  next.set("sessionId", val);
                  setSearchParams(next);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-white/15 bg-[#050814] text-sm text-white">
                  <SelectValue placeholder="Chọn buổi" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.timeRange ? `(${s.timeRange})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/15"
          >
            <Link to={`/admin/events/${encodedEventId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span>Điều hành Sự kiện</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link
          to={checkinStageUrl}
          className="group flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-6 transition-colors hover:border-sky-400/50"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/15 text-sky-300">
                <QrCode className="h-5 w-5" />
              </span>
              <span className="tabular-mono rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
                Chu kỳ 10s · PIN {sessionPin}
              </span>
            </div>
            <h2 className="font-display text-2xl font-medium text-white group-hover:text-sky-300">
              1. QR Điểm danh Động 10 giây
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Trình chiếu mã QR đổi khóa tự động mỗi 10 giây kèm mã PIN 6 số cho sinh viên dưới hội trường quét điểm danh.
            </p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-300">
            <MonitorPlay className="h-4 w-4" />
            <span>Mở màn chiếu QR Điểm danh</span>
          </div>
        </Link>

        <Link
          to={`/stage/live-qa?eventId=${encodedEventId}`}
          className="group flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-6 transition-colors hover:border-sky-400/50"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/15 text-sky-300">
                <MessageSquareMore className="h-5 w-5" />
              </span>
              <span className="tabular-mono rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {qaPinBadge}
              </span>
            </div>
            <h2 className="font-display text-2xl font-medium text-white group-hover:text-sky-300">
              2. Live Q&amp;A Hội trường
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Hiển thị câu hỏi đang được Bàn Kiểm duyệt ghim lên sân khấu để diễn giả trả lời trực tiếp cùng mã QR đặt câu hỏi.
            </p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-300">
            <MonitorPlay className="h-4 w-4" />
            <span>Mở màn chiếu Live Q&amp;A</span>
          </div>
        </Link>

        <Link
          to={votingStageUrl}
          className="group flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-6 transition-colors hover:border-sky-400/50"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/15 text-sky-300">
                <Vote className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {matchedVotingCampaign
                  ? matchedVotingCampaign.isSecretBallot
                    ? "Bỏ phiếu Kín"
                    : "Đua Top Công khai"
                  : "Chờ chiến dịch"}
              </span>
            </div>
            <h2 className="font-display text-2xl font-medium text-white group-hover:text-sky-300">
              3. Bình chọn &amp; Biểu quyết Đại hội
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              {matchedVotingCampaign?.title ?? "Biểu đồ đua top trực tiếp hoặc màn hình tiến độ bỏ phiếu kín."}
            </p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-300">
            <MonitorPlay className="h-4 w-4" />
            <span>Mở màn chiếu Bình chọn</span>
          </div>
        </Link>

        <Link
          to={`/stage/minigame?eventId=${encodedEventId}`}
          className="group flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-6 transition-colors hover:border-sky-400/50"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/15 text-sky-300">
                <Gamepad2 className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                Che 5 số đầu MSSV
              </span>
            </div>
            <h2 className="font-display text-2xl font-medium text-white group-hover:text-sky-300">
              4. Minigame Trắc nghiệm Tốc độ
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Sảnh chờ PIN + QR, đồng hồ đếm ngược từng câu hỏi và bảng xếp hạng Vinh danh che 5 số đầu MSSV.
            </p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-300">
            <MonitorPlay className="h-4 w-4" />
            <span>Mở màn chiếu Minigame</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
