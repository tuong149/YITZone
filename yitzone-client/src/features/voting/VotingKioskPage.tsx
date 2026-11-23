import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Barcode,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Radio,
  RotateCcw,
  ShieldCheck,
  Users,
  Vote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useHidBarcodeScanner } from "@/hooks/useHidBarcodeScanner";
import { cn } from "@/lib/utils";
import { useVotingStore } from "@/stores/voting-store";

export function VotingKioskPage() {
  const campaigns = useVotingStore((s) => s.campaigns);
  const activeStageCampaignId = useVotingStore((s) => s.activeStageCampaignId);
  const updateCampaign = useVotingStore((s) => s.updateCampaign);

  const publicOpenCampaigns = useMemo(
    () => campaigns.filter((c) => !c.isSecretBallot && c.status === "OPEN"),
    [campaigns]
  );

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    () => publicOpenCampaigns[0]?.id ?? activeStageCampaignId ?? campaigns[0]?.id ?? "gala-fit-2026"
  );

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? campaigns[0]!,
    [campaigns, selectedCampaignId]
  );

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [studentBarcode, setStudentBarcode] = useState("");
  const [activeMssv, setActiveMssv] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [votedByCampaign, setVotedByCampaign] = useState<Record<string, string[]>>({});
  const [sessionCount, setSessionCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const votedStudents = votedByCampaign[activeCampaign.id] ?? [];

  useEffect(() => {
    if (!activeMssv && !activeCampaign.isSecretBallot) {
      inputRef.current?.focus();
    }
  }, [activeMssv, activeCampaign.isSecretBallot]);

  useEffect(() => {
    if (!activeMssv) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setActiveMssv(null);
          setSelectedCandidateId("");
          setError("Phiên Kiosk 60 giây đã hết hạn. Vui lòng quét lại thẻ sinh viên.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeMssv]);

  const activateForCode = (rawCode: string) => {
    setError(null);
    setMessage(null);
    if (activeCampaign.isSecretBallot) {
      setError("Chiến dịch Bỏ phiếu Kín không hỗ trợ bỏ phiếu qua Quầy Kiosk.");
      return;
    }
    const code = rawCode.trim();
    if (!/^[0-9]{8}$/.test(code)) {
      setError("Mã vạch thẻ sinh viên phải gồm đúng 8 chữ số MSSV.");
      return;
    }
    if (votedStudents.includes(code)) {
      setError(`MSSV ${code} đã bỏ phiếu trong chiến dịch này (mỗi sinh viên chỉ bỏ phiếu 1 lần).`);
      return;
    }
    setActiveMssv(code);
    setSecondsLeft(60);
    setSelectedCandidateId("");
    setStudentBarcode("");
  };

  useHidBarcodeScanner({
    enabled: !activeMssv && !activeCampaign.isSecretBallot,
    maxCharIntervalMs: 50,
    onScan: (code) => {
      activateForCode(code);
    },
    onInvalidCode: (raw) => {
      setError(`Mã "${raw}" không hợp lệ. Vui lòng quét mã vạch 1D 8 số trên thẻ sinh viên.`);
    }
  });

  const handleConfirmVote = () => {
    if (!activeMssv || !selectedCandidateId) return;

    updateCampaign(activeCampaign.id, (c) => ({
      ...c,
      voterCount: c.voterCount + 1,
      candidates: c.candidates.map((cand) =>
        cand.id === selectedCandidateId ? { ...cand, audienceVotes: cand.audienceVotes + 1 } : cand
      )
    }));

    setVotedByCampaign((prev) => ({
      ...prev,
      [activeCampaign.id]: [...(prev[activeCampaign.id] ?? []), activeMssv]
    }));
    setSessionCount((n) => n + 1);
    setMessage(`Đã ghi nhận phiếu bình chọn cho MSSV ${activeMssv}. Quầy sẵn sàng đón lượt tiếp theo.`);
    setActiveMssv(null);
    setSelectedCandidateId("");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* 70% Main Kiosk Workspace — Exact 8/4 parity with VotingStagePage & DESIGN.md Section 4 */}
      <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-8 lg:p-10">
        {activeCampaign.isSecretBallot ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-amber-200">
              <Lock className="h-4 w-4" />
              <span>BỎ PHIẾU KÍN · TỰ ĐỘNG KHÓA QUẦY KIOSK</span>
            </span>
            <h1 className="font-display text-3xl font-medium text-white sm:text-4xl">
              {activeCampaign.title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-300">
              Để bảo mật tuyệt đối bí mật lá phiếu cá nhân, chiến dịch bỏ phiếu kín chỉ cho phép thực hiện trực tiếp trên thiết bị cá nhân của cử tri.
            </p>
            {publicOpenCampaigns[0] && (
              <Button
                type="button"
                size="lg"
                onClick={() => setSelectedCampaignId(publicOpenCampaigns[0]!.id)}
                className="rounded-xl"
              >
                Chuyển sang: {publicOpenCampaigns[0]!.title}
              </Button>
            )}
          </div>
        ) : !activeMssv ? (
          /* STEP 1: BARCODE SCAN / MSSV ACTIVATION */
          <div className="flex flex-1 flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
                  <Barcode className="h-4 w-4" />
                  <span>BƯỚC 1 / 2 · QUÉT THẺ SINH VIÊN 1D</span>
                </span>
                <span className="inline-flex items-center gap-2 tabular-mono text-sm font-semibold text-slate-300">
                  <Users className="h-4 w-4 text-sky-300" />
                  <span>{activeCampaign.voterCount} lượt bình chọn</span>
                </span>
              </div>

              <h1 className="font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
                {activeCampaign.title}
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                Cán bộ trực quầy đối chiếu ảnh trên thẻ sinh viên nhựa vật lý và quét mã vạch 1D để mở khóa phiên bình chọn 1 lần trong 60 giây.
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200"
                >
                  <span className="flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
                    <span>{error}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-xs font-semibold underline"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200"
                >
                  <span className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{message}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMessage(null)}
                    className="text-xs font-semibold underline"
                  >
                    Đóng
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  activateForCode(studentBarcode);
                }}
                className="space-y-2.5"
              >
                <label
                  htmlFor="kiosk-barcode"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Mã vạch 1D Thẻ Sinh viên (8 chữ số MSSV)
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    ref={inputRef}
                    id="kiosk-barcode"
                    maxLength={8}
                    inputMode="numeric"
                    autoComplete="off"
                    value={studentBarcode}
                    onChange={(e) => {
                      setStudentBarcode(e.target.value.replace(/\D/g, "").slice(0, 8));
                      if (error) setError(null);
                    }}
                    placeholder="Quét mã vạch hoặc nhập 8 số MSSV..."
                    className="tabular-mono h-12 flex-1 rounded-xl border-white/15 bg-[#050814] px-4 text-lg font-medium tracking-[0.18em] text-white placeholder:tracking-normal placeholder:text-slate-500"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={studentBarcode.trim().length !== 8}
                    className="h-12 shrink-0 rounded-xl px-6"
                  >
                    Mở phiên 60 giây
                  </Button>
                </div>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-300" />
                <span>Chỉ khả dụng cho bình chọn định danh · Khóa 1 MSSV / 1 lá phiếu</span>
              </span>
              <span className="tabular-mono">Tự động xóa phiên sau 60s</span>
            </div>
          </div>
        ) : (
          /* STEP 2: ACTIVE 60-SECOND TOUCH SELECTION */
          <div className="flex flex-1 flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
                  <Vote className="h-4 w-4" />
                  <span>BƯỚC 2 / 2 · MỜI SINH VIÊN CHẠM CHỌN</span>
                </span>
                <span className="tabular-mono rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-semibold text-white">
                  MSSV: {activeMssv}
                </span>
              </div>

              <h1 className="font-display text-3xl font-medium text-white sm:text-4xl">
                {activeCampaign.title}
              </h1>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    secondsLeft <= 15
                      ? "bg-rose-400"
                      : "bg-gradient-to-r from-[#3B5BFF] to-[#38BDF8]"
                  )}
                  style={{ width: `${(secondsLeft / 60) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {activeCampaign.candidates.map((cand) => {
                const isSelected = selectedCandidateId === cand.id;
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className={cn(
                      "flex items-start justify-between gap-4 rounded-xl border p-5 text-left transition-colors",
                      isSelected
                        ? "border-sky-400 bg-sky-400/15 text-white"
                        : "border-white/15 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10"
                    )}
                  >
                    <div className="space-y-1.5">
                      <span className="tabular-mono text-sm font-semibold text-sky-300">
                        #{cand.code}
                      </span>
                      <div className="font-display text-xl font-medium leading-snug text-white">
                        {cand.name}
                      </div>
                      {cand.subtitle && (
                        <div className="text-xs text-slate-300">{cand.subtitle}</div>
                      )}
                    </div>

                    <span
                      className={cn(
                        "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        isSelected
                          ? "border-sky-300 bg-sky-400 text-[#050814]"
                          : "border-white/25"
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setActiveMssv(null);
                  setSelectedCandidateId("");
                }}
                className="h-12 rounded-xl border-white/20 bg-white/5 px-5 text-slate-200 hover:bg-white/15 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Hủy phiên</span>
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={!selectedCandidateId}
                onClick={handleConfirmVote}
                className="h-12 flex-1 rounded-xl px-8 sm:flex-initial"
              >
                <Vote className="h-4 w-4" />
                <span>Xác nhận gửi lá phiếu</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 30% Right Kiosk Station Control & Telemetry Column — Exact parity with VotingStagePage */}
      <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-4">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Chiến dịch tại Quầy Kiosk
            </div>
            <Select
              value={activeCampaign.id}
              onValueChange={(val) => {
                setSelectedCampaignId(val);
                setActiveMssv(null);
                setSelectedCandidateId("");
                setError(null);
                setMessage(null);
              }}
            >
              <SelectTrigger
                aria-label="Chọn chiến dịch bình chọn"
                className="h-11 rounded-xl border-white/15 bg-[#050814] text-sm font-medium text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                    {c.isSecretBallot ? " (Bỏ phiếu kín)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/5 p-5 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300">
              <Clock className="h-3.5 w-3.5 text-sky-300" />
              <span>{activeMssv ? "Thời gian còn lại" : "Giới hạn mỗi phiên"}</span>
            </div>
            <div
              className={cn(
                "mt-2 tabular-mono text-5xl font-semibold tracking-wider",
                activeMssv && secondsLeft <= 15 ? "text-rose-300" : "text-white"
              )}
            >
              00:{String(activeMssv ? secondsLeft : 60).padStart(2, "0")}
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-white/10 bg-[#050814]/60 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Súng quét 1D (HID)</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                <Radio className="h-3.5 w-3.5" />
                {activeCampaign.isSecretBallot
                  ? "Đang khóa"
                  : activeMssv
                    ? "Đang thao tác"
                    : "Sẵn sàng"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Số phiếu tại quầy này</span>
              <span className="tabular-mono font-semibold text-white">{sessionCount} lượt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tổng lượt chiến dịch</span>
              <span className="tabular-mono font-semibold text-sky-300">
                {activeCampaign.voterCount} lượt
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">
          Quầy Kiosk tự động xóa trạng thái sinh viên ngay sau khi xác nhận lá phiếu hoặc khi hết 60 giây.
        </div>
      </div>
    </div>
  );
}
