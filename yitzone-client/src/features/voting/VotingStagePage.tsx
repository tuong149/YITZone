import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Lock, ShieldCheck, Snowflake, Users } from "lucide-react";
import { useEventStore } from "@/stores/event-store";
import { useVotingStore, type AdminVotingCampaign } from "@/stores/voting-store";

export function VotingStagePage() {
  const [searchParams] = useSearchParams();
  const campaigns = useVotingStore((s) => s.campaigns);
  const activeStageCampaignId = useVotingStore((s) => s.activeStageCampaignId);
  const storedEvents = useEventStore((s) => s.events);

  const allCampaigns = useMemo<AdminVotingCampaign[]>(() => {
    const existingIds = new Set(campaigns.map((c) => c.id));
    const derived: AdminVotingCampaign[] = [];
    for (const evt of storedEvents) {
      for (const ses of evt.sessions) {
        if (!ses.activities.liveVoting) continue;
        const id = `evt-vote-${evt.id}-${ses.id}`;
        if (existingIds.has(id)) continue;
        derived.push({
          id,
          title: `${evt.title} — ${ses.name}`,
          pin: String(500000 + ((evt.id.length * 4127 + ses.id.length * 8819) % 499999)),
          source: "EVENT",
          eventId: evt.id,
          eventLabel: evt.title,
          sessionLabel: ses.name,
          requireAttendance: true,
          status: "OPEN",
          isSecretBallot: Boolean(ses.activities.liveVotingSecret),
          usesJudges: !ses.activities.liveVotingSecret,
          judgeWeight: ses.activities.liveVotingSecret ? 0 : 60,
          freezeMode: false,
          voterCount: evt.registeredCount,
          expectedVoters: evt.capacity > 0 ? evt.capacity : undefined,
          candidates: []
        });
      }
    }
    return [...campaigns, ...derived];
  }, [campaigns, storedEvents]);

  const targetId = searchParams.get("campaignId") ?? activeStageCampaignId;
  const campaign = useMemo(
    () => allCampaigns.find((c) => c.id === targetId) ?? allCampaigns[0]!,
    [allCampaigns, targetId]
  );

  const isSecret = campaign.isSecretBallot && !campaign.secretUnsealed;
  const isFrozen = !isSecret && campaign.freezeMode;
  const totalVotes = Math.max(
    1,
    campaign.candidates.reduce((acc, c) => acc + c.audienceVotes, 0)
  );
  const sortedCandidates = useMemo(
    () => [...campaign.candidates].sort((a, b) => b.audienceVotes - a.audienceVotes),
    [campaign.candidates]
  );

  const formattedPin = `${campaign.pin.slice(0, 3)} ${campaign.pin.slice(3, 6)}`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://yitzone.fit.hcmute.edu.vn";

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* 70% Main LED Display — Zero operator buttons on stage projection */}
      <div className="flex flex-col justify-between rounded-[20px] border border-white/15 bg-[#0E1529] p-8 lg:col-span-8 lg:p-10">
        {isSecret ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
              <Lock className="h-4 w-4" />
              <span>CHẾ ĐỘ BỎ PHIẾU KÍN · KHÔNG HIỂN THỊ KIỂM PHIẾU THỜI GIAN THỰC</span>
            </span>
            <h1 className="font-display text-3xl font-medium text-white sm:text-5xl">
              {campaign.title}
            </h1>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-10 py-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                Tổng số cử tri đã bỏ phiếu
              </div>
              <div className="mt-2 tabular-mono text-5xl font-semibold text-sky-300 sm:text-6xl">
                {campaign.expectedVoters
                  ? `${campaign.voterCount} / ${campaign.expectedVoters}`
                  : campaign.voterCount}
              </div>
            </div>
            <p className="inline-flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              <span>Lá phiếu được niêm phong qua Outbox Shuffle · Cấp mã biên nhận SHA-256 một lần</span>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {isFrozen ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-amber-200">
                  <Snowflake className="h-4 w-4" />
                  <span>FREEZE MODE · ĐANG ĐÓNG BĂNG BẢNG XẾP HẠNG PHÚT CHÓT</span>
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-200">
                  LIVE VOTING · {campaign.eventLabel?.toUpperCase() ?? "BÌNH CHỌN TRỰC TIẾP"}
                </span>
              )}
              <span className="inline-flex items-center gap-2 tabular-mono text-sm font-semibold text-slate-300">
                <Users className="h-4 w-4 text-sky-300" />
                <span>{campaign.voterCount} lượt bình chọn</span>
              </span>
            </div>

            <h1 className="font-display text-3xl font-medium text-white sm:text-4xl">
              {campaign.title}
            </h1>

            <div className="space-y-5 pt-2">
              {sortedCandidates.map((act, idx) => {
                const pct = Math.round((act.audienceVotes / totalVotes) * 100);
                return (
                  <div key={act.id} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="tabular-mono text-lg font-semibold text-sky-300">
                          #{idx + 1}
                        </span>
                        <span className="font-display text-xl font-medium text-white sm:text-2xl">
                          {act.name}
                        </span>
                      </div>
                      <span className="tabular-mono text-xl font-semibold text-white">
                        {isFrozen ? "Đang đóng băng" : `${act.audienceVotes} phiếu (${pct}%)`}
                      </span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#38BDF8] transition-all duration-500"
                        style={{ width: isFrozen ? "50%" : `${Math.min(100, Math.max(6, pct * 1.8))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 30% QR + PIN Column */}
      <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-[#0E1529] p-8 text-center lg:col-span-4">
        <div className="rounded-2xl bg-white p-5">
          <QRCodeSVG
            value={`${origin}/voting?campaignId=${encodeURIComponent(campaign.id)}`}
            size={184}
            level="M"
          />
        </div>
        <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-300">
          Quét QR tham gia Bình chọn
        </div>
        <div className="mt-1.5 tabular-mono text-4xl font-semibold tracking-[0.18em] text-white sm:text-5xl">
          {formattedPin}
        </div>
        {!campaign.isSecretBallot && (
          <p className="mt-4 text-xs text-slate-400">
            Hết pin điện thoại? Mang thẻ SV ra Quầy Kiosk 60s
          </p>
        )}
      </div>
    </div>
  );
}
