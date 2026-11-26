import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Lock,
  MapPin,
  MonitorPlay,
  QrCode,
  ShieldCheck,
  Users,
  Vote
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractApiErrorMessage } from "@/lib/api-client";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useVotingStore } from "@/stores/voting-store";
import { castVotingBallot } from "./api";

const VOTING_CAMPAIGNS = [];

export function VotingPage() {
  const authorities = useAuthStore((s) => s.authorities);
  const canControlStage = hasAnyPermission(authorities, PERMISSIONS.STAGE_CONTROL);
  const storeCampaigns = useVotingStore((s) => s.campaigns);
  const updateStoreCampaign = useVotingStore((s) => s.updateCampaign);

  const [accessFilter, setAccessFilter] = useState("ALL");
  const [activeCampaignId, setActiveCampaignId] = useState(null);

  // Per-campaign selections & submission state
  const [selections, setSelections] = useState({});
  const [submittedMap, setSubmittedMap] = useState({});
  const [secretReceipts, setSecretReceipts] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmSecretCampaign, setConfirmSecretCampaign] = useState(null);

  const allCampaigns = useMemo(() => {
    const mappedFromStore = storeCampaigns
      .filter((sc) => !VOTING_CAMPAIGNS.some((vc) => vc.id === sc.id))
      .map((sc) => {
        const mappedStatus =
          sc.status === "CLOSED" ? "CLOSED" : sc.status === "OPEN" ? "OPEN" : "UPCOMING";
        return {
          id: sc.id,
          title: sc.title,
          eventLabel: sc.eventLabel ?? "Sự kiện Khoa CNTT",
          description: sc.isSecretBallot
            ? "Chế độ Bỏ phiếu Kín tắt hoàn toàn kiểm phiếu thời gian thực, tách danh tính cử tri khỏi lá phiếu và cấp mã biên nhận SHA-256 một lần."
            : "Chương trình bình chọn trực tiếp đồng bộ từ sự kiện Đoàn - Hội Khoa CNTT.",
          requireAttendance: sc.requireAttendance,
          userCheckedIn: true,
          accessRuleNote: sc.requireAttendance
            ? "Yêu cầu đã quét QR điểm danh sự kiện · Đã xác nhận có mặt"
            : "Không cần điểm danh sự kiện · Mở tự do cho sinh viên đã đăng nhập",
          status: mappedStatus,
          timeWindow: sc.status === "OPEN" ? "Đang mở bình chọn" : sc.status === "CLOSED" ? "Đã đóng cổng" : "Sắp mở",
          location: "Hội trường Khoa CNTT · HCM-UTE",
          isSecretBallot: sc.isSecretBallot,
          isResolution: sc.id.includes("congress"),
          allowChangeVote: !sc.isSecretBallot,
          minSelect: 1,
          maxSelect: 1,
          voterCount: sc.voterCount ?? 0,
          expectedVoters: sc.expectedVoters,
          turnoutText: `${sc.voterCount ?? 0} lượt đã bỏ phiếu`,
          options: sc.candidates.map((cand) => ({
            id: cand.id,
            code: cand.code,
            title: cand.name,
            subtitle: cand.subtitle,
            votes: cand.audienceVotes
          }))
        };
      });

    return [
      ...mappedFromStore,
      ...VOTING_CAMPAIGNS.map((vc) => {
        const synced = storeCampaigns.find((sc) => sc.id === vc.id);
        if (!synced) return vc;
        const syncedStatus =
          synced.status === "CLOSED" ? "CLOSED" : synced.status === "OPEN" ? "OPEN" : "UPCOMING";
        return {
          ...vc,
          status: syncedStatus,
          isSecretBallot: synced.isSecretBallot,
          turnoutText: `${synced.voterCount} lượt bình chọn`,
          options: synced.candidates.map((cand) => ({
            id: cand.id,
            code: cand.code,
            title: cand.name,
            subtitle: cand.subtitle,
            votes: cand.audienceVotes
          }))
        };
      })
    ];
  }, [storeCampaigns]);

  const filteredCampaigns = useMemo(
    () =>
      allCampaigns.filter((c) => {
        if (accessFilter === "REQUIRE_ATTENDANCE") return c.requireAttendance;
        if (accessFilter === "NO_ATTENDANCE") return !c.requireAttendance;
        return true;
      }),
    [accessFilter, allCampaigns]
  );

  const activeCampaign = useMemo(
    () => allCampaigns.find((c) => c.id === activeCampaignId) ?? null,
    [activeCampaignId, allCampaigns]
  );

  const toggleOption = (campaign, optionId) => {
    if (campaign.isSecretBallot && secretReceipts[campaign.id]) return;

    setSelections((prev) => {
      const current = prev[campaign.id] ?? [];
      if (campaign.maxSelect === 1) {
        return { ...prev, [campaign.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [campaign.id]: current.filter((x) => x !== optionId) };
      }
      if (current.length >= campaign.maxSelect) return prev;
      return { ...prev, [campaign.id]: [...current, optionId] };
    });
  };

  const handleSubmitCampaign = async (campaign) => {
    if (submitting) return;
    const picked = selections[campaign.id] ?? [];
    if (picked.length < campaign.minSelect) return;
    if (campaign.isSecretBallot && secretReceipts[campaign.id]) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      const selectedCandidateIds = campaign.isResolution ? [] : picked;
      const resolutionChoice = campaign.isResolution ? picked[0] : undefined;
      const res = await castVotingBallot(campaign.id, selectedCandidateIds, resolutionChoice);
      updateStoreCampaign(campaign.id, (c) => ({
        ...c,
        voterCount: c.voterCount + 1,
        candidates: c.candidates.map((cand) =>
          picked.includes(cand.id)
            ? { ...cand, audienceVotes: cand.audienceVotes + 1 }
            : cand
        )
      }));
      if (campaign.isSecretBallot) {
        setSecretReceipts((prev) => ({ ...prev, [campaign.id]: res.receiptCode }));
      } else {
        setSubmittedMap((prev) => ({ ...prev, [campaign.id]: true }));
      }
    } catch (err) {
      setSubmitError(
        extractApiErrorMessage(
          err,
          "Không thể gửi lá phiếu lên máy chủ. Phiếu của bạn CHƯA được ghi nhận — vui lòng kiểm tra kết nối và thử lại."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Bình chọn &amp; Bầu cử
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Danh sách các chương trình, hoạt động đang mở cổng bình chọn theo quy định cần điểm danh hoặc không cần điểm danh.
          </p>
        </div>

        {canControlStage && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="h-10 rounded-full sm:h-9">
              <Link to="/kiosk/voting">
                <QrCode className="h-4 w-4" />
                <span>Quầy Kiosk 60s</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-10 rounded-full sm:h-9">
              <Link to="/stage/voting">
                <MonitorPlay className="h-4 w-4" />
                <span>LED Đua Top</span>
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* VIEW 1: CAMPAIGN CATALOG */}
      {!activeCampaign && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={accessFilter}
              onValueChange={(v) => setAccessFilter(v)}
            >
              <TabsList>
                <TabsTrigger value="ALL">Tất cả ({allCampaigns.length})</TabsTrigger>
                <TabsTrigger value="REQUIRE_ATTENDANCE">
                  Cần điểm danh ({allCampaigns.filter((c) => c.requireAttendance).length})
                </TabsTrigger>
                <TabsTrigger value="NO_ATTENDANCE">
                  Không cần điểm danh ({allCampaigns.filter((c) => !c.requireAttendance).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button asChild variant="outline" size="sm" className="h-9 w-full rounded-full sm:w-auto">
              <Link to="/scanner">
                <QrCode className="h-3.5 w-3.5 text-primary" />
                <span>Quét QR điểm danh</span>
              </Link>
            </Button>
          </div>

          {filteredCampaigns.length === 0 ? (
            <Card className="rounded-[22px] border border-dashed border-border/80">
              <CardContent className="px-6 py-12 text-center">
                <Vote className="mx-auto h-9 w-9 text-muted-foreground/70" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Chưa có đợt bình chọn hoặc biểu quyết nào đang mở
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Các đợt bình chọn gắn sự kiện hoặc chiến dịch trực tuyến sẽ xuất hiện tại đây khi mở cổng.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredCampaigns.map((campaign) => {
              const isDone = Boolean(submittedMap[campaign.id] || secretReceipts[campaign.id]);
              const canEnter =
                campaign.status === "OPEN" && (!campaign.requireAttendance || campaign.userCheckedIn);
              const needsCheckin =
                campaign.status === "OPEN" && campaign.requireAttendance && !campaign.userCheckedIn;

              return (
                <Card
                  key={campaign.id}
                  className="liquid-glass-card flex flex-col justify-between rounded-[22px] border border-border/80"
                >
                  <CardHeader className="space-y-2.5 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={campaign.requireAttendance ? "warning" : "info"}
                          className="gap-1"
                        >
                          {campaign.requireAttendance ? (
                            <QrCode className="h-3 w-3" />
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
                          <span>
                            {campaign.requireAttendance ? "Cần điểm danh" : "Không cần điểm danh"}
                          </span>
                        </Badge>
                        {campaign.isSecretBallot && (
                          <Badge variant="calDept" className="gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Bỏ phiếu kín</span>
                          </Badge>
                        )}
                      </div>

                      <Badge
                        variant={
                          isDone
                            ? "success"
                            : needsCheckin
                              ? "secondary"
                              : campaign.status === "OPEN"
                                ? "default"
                                : "secondary"
                        }
                      >
                        {isDone
                          ? "Đã bỏ phiếu"
                          : needsCheckin
                            ? "Chưa điểm danh"
                            : campaign.status === "OPEN"
                              ? "Đang mở"
                              : "Sắp mở"}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-primary">{campaign.eventLabel}</p>
                      <CardTitle className="mt-1 font-display text-lg font-medium leading-snug">
                        {campaign.title}
                      </CardTitle>
                    </div>

                    <CardDescription className="text-xs leading-relaxed">
                      {campaign.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/35 p-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 text-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{campaign.accessRuleNote}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {campaign.timeWindow}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.turnoutText}
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
                        onClick={() => setActiveCampaignId(campaign.id)}
                        className={cn("h-11 w-full rounded-full", canEnter && "liquid-glass-btn-cobalt")}
                        variant={canEnter ? "default" : "outline"}
                      >
                        <Vote className="h-4 w-4" />
                        <span>
                          {!canEnter
                            ? "Chưa đến giờ mở cổng"
                            : isDone
                              ? campaign.allowChangeVote
                                ? "Xem / Thay đổi phiếu bình chọn"
                                : "Xem biên nhận phiếu kín"
                              : "Vào bỏ phiếu ngay"}
                        </span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ACTIVE CAMPAIGN BALLOT */}
      {activeCampaign && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-full sm:h-9"
            onClick={() => setActiveCampaignId(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Danh sách chương trình bỏ phiếu</span>
          </Button>

          <Card className={cn("rounded-[22px]", activeCampaign.isSecretBallot && "border-brand-navy/30")}>
            <CardHeader className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant={activeCampaign.requireAttendance ? "warning" : "info"}
                  className="gap-1"
                >
                  {activeCampaign.requireAttendance ? (
                    <QrCode className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  <span>
                    {activeCampaign.requireAttendance ? "Cần điểm danh" : "Không cần điểm danh"}
                  </span>
                </Badge>
                {activeCampaign.isSecretBallot ? (
                  <VerifiedBadge label="Bỏ phiếu Kín · Outbox Shuffle" />
                ) : (
                  <Badge variant="secondary" className="tabular-mono">
                    Chọn {activeCampaign.minSelect === activeCampaign.maxSelect
                      ? activeCampaign.maxSelect
                      : `${activeCampaign.minSelect}–${activeCampaign.maxSelect}`} mục
                    {activeCampaign.allowChangeVote ? " · Cho phép đổi phiếu" : ""}
                  </Badge>
                )}
              </div>

              <CardTitle className="font-display text-xl font-medium leading-snug sm:text-2xl">
                {activeCampaign.title}
              </CardTitle>
              <CardDescription>{activeCampaign.description}</CardDescription>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  {activeCampaign.timeWindow}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {activeCampaign.location}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {submitError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-status-danger/35 bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {activeCampaign.isSecretBallot ? (
                <>
                  {/* Secret ballot: ONLY total voter turnout, NEVER live candidate tally */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                    <span className="text-muted-foreground">
                      Tổng số cử tri đã bỏ phiếu (tắt kiểm phiếu trực tiếp)
                    </span>
                    <span className="tabular-mono text-base font-semibold text-foreground">
                      {activeCampaign.expectedVoters
                        ? `${activeCampaign.voterCount ?? 0} / ${activeCampaign.expectedVoters} cử tri`
                        : activeCampaign.turnoutText}
                    </span>
                  </div>

                  {secretReceipts[activeCampaign.id] ? (
                    <div className="space-y-3 rounded-xl border border-status-success/35 bg-status-success/10 p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-status-success">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <span>Đã bỏ phiếu kín thành công — Lá phiếu đã được bảo mật ẩn danh</span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground">
                        Lưu lại <strong>Mã Biên nhận 1 lần</strong> bên dưới để tự kiểm chứng sau khi Ban Kiểm phiếu công bố kết quả:
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                        <span className="tabular-mono text-base font-semibold tracking-wider text-primary sm:text-lg">
                          {secretReceipts[activeCampaign.id]}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            void navigator.clipboard?.writeText(secretReceipts[activeCampaign.id] ?? "");
                            setCopiedId(activeCampaign.id);
                          }}
                        >
                          {copiedId === activeCampaign.id ? (
                            <Check className="h-3.5 w-3.5 text-status-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedId === activeCampaign.id ? "Đã sao chép" : "Sao chép mã"}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2.5">
                        {activeCampaign.options.map((opt) => {
                          const selected = (selections[activeCampaign.id] ?? []).includes(opt.id);
                          return (
                            <label
                              key={opt.id}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium transition-colors",
                                selected
                                  ? "border-brand-navy bg-brand-navy/8 text-foreground dark:border-brand-cyan dark:bg-brand-cyan/10"
                                  : "border-border bg-card hover:bg-muted/40"
                              )}
                            >
                              <input
                                type="radio"
                                name={`ballot-${activeCampaign.id}`}
                                checked={selected}
                                onChange={() => toggleOption(activeCampaign, opt.id)}
                                className="h-4 w-4 shrink-0 accent-primary"
                              />
                              <span>{opt.title}</span>
                            </label>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        className="h-12 w-full rounded-full sm:h-11"
                        disabled={
                          submitting ||
                          (selections[activeCampaign.id] ?? []).length < activeCampaign.minSelect
                        }
                        onClick={() => setConfirmSecretCampaign(activeCampaign)}
                      >
                        <Lock className="h-4 w-4" />
                        <span>
                          {submitting
                            ? "Đang gửi lá phiếu kín..."
                            : "Xem lại & Xác nhận Lá phiếu Kín"}
                        </span>
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {(() => {
                    const totalVotes = activeCampaign.options.reduce((sum, o) => sum + (o.votes ?? 0), 0) || 1;
                    const picked = selections[activeCampaign.id] ?? [];
                    const isSubmitted = Boolean(submittedMap[activeCampaign.id]);
                    const canShowPublicResults = isSubmitted || activeCampaign.status === "CLOSED";

                    return (
                      <>
                        {!canShowPublicResults && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-muted/35 px-4 py-2.5 text-xs text-muted-foreground">
                            <span>Tỷ lệ bình chọn chi tiết sẽ hiển thị sau khi bạn xác nhận gửi lá phiếu (tránh hiệu ứng đám đông).</span>
                            <span className="tabular-mono font-semibold text-foreground">{activeCampaign.turnoutText}</span>
                          </div>
                        )}
                        <div className="space-y-3">
                          {activeCampaign.options.map((opt) => {
                            const checked = picked.includes(opt.id);
                            const pct = Math.round(((opt.votes ?? 0) / totalVotes) * 100);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleOption(activeCampaign, opt.id)}
                                className={cn(
                                  "w-full rounded-xl border p-4 text-left transition-colors",
                                  checked
                                    ? "border-primary bg-primary/8"
                                    : "border-border bg-card hover:border-primary/40"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {opt.code && (
                                        <Badge variant="outline" className="tabular-mono">
                                          #{opt.code}
                                        </Badge>
                                      )}
                                      <span className="font-medium text-foreground">{opt.title}</span>
                                    </div>
                                    {opt.subtitle && (
                                      <div className="mt-1 text-xs text-muted-foreground">{opt.subtitle}</div>
                                    )}
                                  </div>
                                  {canShowPublicResults && (
                                    <div className="shrink-0 text-right tabular-mono">
                                      <div className="text-sm font-semibold text-foreground">
                                        {opt.votes ?? 0} phiếu
                                      </div>
                                      <div className="text-xs text-muted-foreground">{pct}%</div>
                                    </div>
                                  )}
                                </div>
                                {canShowPublicResults && (
                                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isSubmitted && (
                          <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-xs font-medium text-status-success">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>
                              Đã ghi nhận lựa chọn ({picked.length} mục). Bạn có thể thay đổi trước khi đóng cổng.
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="tabular-mono text-xs text-muted-foreground">
                            Đã chọn: {picked.length}/{activeCampaign.maxSelect} mục
                          </span>
                          <Button
                            type="button"
                            className="liquid-glass-btn-cobalt h-11 w-full rounded-full sm:w-auto sm:px-6"
                            disabled={submitting || picked.length < activeCampaign.minSelect}
                            onClick={() => void handleSubmitCampaign(activeCampaign)}
                          >
                            <Vote className="h-4 w-4" />
                            <span>
                              {submitting
                                ? "Đang gửi phiếu..."
                                : isSubmitted
                                  ? "Cập nhật phiếu bình chọn"
                                  : "Xác nhận Bình chọn"}
                            </span>
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={Boolean(confirmSecretCampaign)}
        onOpenChange={(open) => {
          if (!open) setConfirmSecretCampaign(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
              <Lock className="h-5 w-5 text-primary" />
              <span>Xem lại lá phiếu kín trước khi gửi</span>
            </DialogTitle>
            <DialogDescription>
              {confirmSecretCampaign?.title}
            </DialogDescription>
          </DialogHeader>

          {confirmSecretCampaign && (
            <div className="space-y-3">
              <div className="space-y-1.5 rounded-xl border border-border bg-muted/35 p-3.5 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lựa chọn của bạn
                </div>
                <ul className="space-y-1">
                  {(selections[confirmSecretCampaign.id] ?? []).map((optId) => {
                    const opt = confirmSecretCampaign.options.find((o) => o.id === optId);
                    return (
                      <li key={optId} className="flex items-center gap-2 font-medium text-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        <span>{opt?.title ?? optId}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="rounded-xl border border-status-warning/35 bg-status-warning/10 px-3.5 py-2.5 text-xs leading-relaxed text-status-warning">
                Phiếu kín <strong>không thể thay đổi hoặc rút lại</strong> sau khi gửi. Hệ thống sẽ cấp cho bạn 1 mã biên nhận duy nhất để tự đối chiếu kết quả.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setConfirmSecretCampaign(null)}
            >
              Quay lại chọn lại
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={submitting}
              onClick={() => {
                if (!confirmSecretCampaign) return;
                const campaignToSubmit = confirmSecretCampaign;
                setConfirmSecretCampaign(null);
                void handleSubmitCampaign(campaignToSubmit);
              }}
            >
              <Lock className="h-4 w-4" />
              <span>Xác nhận gửi phiếu kín</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
