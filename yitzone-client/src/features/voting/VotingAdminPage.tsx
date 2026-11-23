import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  Lock,
  MonitorPlay,
  Play,
  Plus,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Square,
  Trash2,
  Trophy,
  Users
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useEventStore } from "@/stores/event-store";

type CampaignStatus = "DRAFT" | "OPEN" | "CLOSED";
type CampaignSource = "EVENT" | "STANDALONE";

interface CandidateItem {
  id: string;
  code: string;
  name: string;
  audienceVotes: number;
  judgeScore: number;
}

interface AdminVotingCampaign {
  id: string;
  title: string;
  source: CampaignSource;
  eventId?: string;
  eventLabel?: string;
  sessionLabel?: string;
  status: CampaignStatus;
  isSecretBallot: boolean;
  usesJudges: boolean;
  judgeWeight: number;
  freezeMode: boolean;
  voterCount: number;
  expectedVoters?: number;
  candidates: CandidateItem[];
}

const INITIAL_CAMPAIGNS: AdminVotingCampaign[] = [
  {
    id: "gala-fit-2026",
    title: "Bình chọn Tiết mục Yêu thích — Đêm Gala FIT 2026",
    source: "EVENT",
    eventId: "evt-gala-fit-2026",
    eventLabel: "Đêm Gala Văn nghệ FIT 2026",
    sessionLabel: "Buổi 1 · Đêm công diễn",
    status: "OPEN",
    isSecretBallot: false,
    usesJudges: true,
    judgeWeight: 60,
    freezeMode: false,
    voterCount: 429,
    candidates: [
      { id: "c-1", code: "01", name: "Mashup Tuổi trẻ FIT (Đội Hát ARTIT)", audienceVotes: 148, judgeScore: 91 },
      { id: "c-2", code: "02", name: "Nhảy Hiện đại Cyber Pulse (Tổ Nhảy ARTIT)", audienceVotes: 162, judgeScore: 88 },
      { id: "c-3", code: "03", name: "Hòa tấu Guitar & Cajon (CLB Acoustic FIT)", audienceVotes: 119, judgeScore: 94 }
    ]
  },
  {
    id: "congress-2026",
    title: "Biểu quyết Nghị quyết Đại hội Đoàn Khoa CNTT 2026",
    source: "EVENT",
    eventId: "evt-congress-2026",
    eventLabel: "Đại hội Đại biểu Đoàn Khoa CNTT",
    sessionLabel: "Phiên toàn thể",
    status: "OPEN",
    isSecretBallot: true,
    usesJudges: false,
    judgeWeight: 0,
    freezeMode: false,
    voterCount: 118,
    expectedVoters: 150,
    candidates: [
      { id: "r-1", code: "01", name: "Tán thành Nghị quyết Đại hội nhiệm kỳ 2026–2027", audienceVotes: 0, judgeScore: 0 },
      { id: "r-2", code: "02", name: "Không tán thành", audienceVotes: 0, judgeScore: 0 },
      { id: "r-3", code: "03", name: "Không có ý kiến", audienceVotes: 0, judgeScore: 0 }
    ]
  },
  {
    id: "fit-shirt-2026",
    title: "Bình chọn Mẫu Áo Khoa CNTT Phiên bản 2026",
    source: "STANDALONE",
    status: "DRAFT",
    isSecretBallot: false,
    usesJudges: false,
    judgeWeight: 0,
    freezeMode: false,
    voterCount: 0,
    candidates: [
      { id: "s-1", code: "01", name: "Mẫu Cobalt Constellation", audienceVotes: 0, judgeScore: 0 },
      { id: "s-2", code: "02", name: "Mẫu Midnight Navy Tech", audienceVotes: 0, judgeScore: 0 },
      { id: "s-3", code: "03", name: "Mẫu Orbital White", audienceVotes: 0, judgeScore: 0 }
    ]
  }
];

function statusLabel(status: CampaignStatus): string {
  if (status === "DRAFT") return "Bản nháp";
  if (status === "OPEN") return "Đang mở cổng";
  return "Đã đóng cổng";
}

function statusBadgeVariant(status: CampaignStatus): "secondary" | "success" | "outline" {
  if (status === "OPEN") return "success";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

export function VotingAdminPage() {
  const storedEvents = useEventStore((s) => s.events);
  const [campaigns, setCampaigns] = useState<AdminVotingCampaign[]>(INITIAL_CAMPAIGNS);
  const [sourceFilter, setSourceFilter] = useState<"ALL" | CampaignSource>("ALL");
  const [selectedId, setSelectedId] = useState<string>(INITIAL_CAMPAIGNS[0]!.id);
  const [activeTab, setActiveTab] = useState<string>("options");

  const [newCandName, setNewCandName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create standalone campaign modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBallotType, setDraftBallotType] = useState<"PUBLIC" | "PUBLIC_JUDGE" | "SECRET">("PUBLIC");

  const [auditModal, setAuditModal] = useState<{
    title: string;
    description: string;
    targetSummary: string;
    code: string;
    destructive?: boolean;
    onDone: () => void;
  } | null>(null);

  // Merge liveVoting sessions created in EventCreateWizard into the campaign list (read-only derivation for unsynced ones)
  const allCampaigns = useMemo(() => {
    const existingIds = new Set(campaigns.map((c) => c.id));
    const derivedFromEvents: AdminVotingCampaign[] = [];

    for (const evt of storedEvents) {
      for (const ses of evt.sessions) {
        if (!ses.activities.liveVoting) continue;
        const derivedId = `evt-vote-${evt.id}-${ses.id}`;
        if (existingIds.has(derivedId)) continue;
        derivedFromEvents.push({
          id: derivedId,
          title: `${evt.title} — ${ses.name}`,
          source: "EVENT",
          eventId: evt.id,
          eventLabel: evt.title,
          sessionLabel: ses.name,
          status: "DRAFT",
          isSecretBallot: Boolean(ses.activities.liveVotingSecret),
          usesJudges: !ses.activities.liveVotingSecret,
          judgeWeight: ses.activities.liveVotingSecret ? 0 : 60,
          freezeMode: false,
          voterCount: 0,
          candidates: []
        });
      }
    }

    return [...campaigns, ...derivedFromEvents];
  }, [campaigns, storedEvents]);

  const filteredCampaigns = useMemo(() => {
    if (sourceFilter === "ALL") return allCampaigns;
    return allCampaigns.filter((c) => c.source === sourceFilter);
  }, [allCampaigns, sourceFilter]);

  const activeCampaign = useMemo(
    () => allCampaigns.find((c) => c.id === selectedId) ?? allCampaigns[0]!,
    [allCampaigns, selectedId]
  );

  // Persist edits on either an existing campaign or a newly materialized event-derived campaign
  const updateCampaign = (
    campaignId: string,
    updater: (campaign: AdminVotingCampaign) => AdminVotingCampaign
  ) => {
    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === campaignId);
      if (exists) {
        return prev.map((c) => (c.id === campaignId ? updater(c) : c));
      }
      const derived = allCampaigns.find((c) => c.id === campaignId);
      if (!derived) return prev;
      return [...prev, updater(derived)];
    });
  };

  const isLocked = activeCampaign.status !== "DRAFT" || activeCampaign.voterCount > 0;
  const audienceWeight = 100 - activeCampaign.judgeWeight;
  const maxVotes = Math.max(1, ...activeCampaign.candidates.map((c) => c.audienceVotes));
  const totalAudienceVotes = activeCampaign.candidates.reduce((sum, c) => sum + c.audienceVotes, 0);

  const ranked = useMemo(() => {
    return [...activeCampaign.candidates]
      .map((c) => {
        const normalizedAudience = (c.audienceVotes / maxVotes) * 100;
        const finalScore =
          (activeCampaign.judgeWeight / 100) * c.judgeScore +
          (audienceWeight / 100) * normalizedAudience;
        return { ...c, normalizedAudience, finalScore };
      })
      .sort((a, b) => b.finalScore - a.finalScore || b.judgeScore - a.judgeScore);
  }, [activeCampaign.candidates, activeCampaign.judgeWeight, audienceWeight, maxVotes]);

  const handleSelectCampaign = (campaign: AdminVotingCampaign) => {
    setSelectedId(campaign.id);
    setErrorMsg(null);
    setNotice(null);
    setNewCandName("");
    setActiveTab("options");
  };

  const handleAddCandidate = (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg(null);
    if (isLocked) {
      setErrorMsg("Chiến dịch đã mở cổng hoặc đã có phiếu — danh sách phương án đã được khóa.");
      return;
    }
    const trimmed = newCandName.trim();
    if (!trimmed) return;

    updateCampaign(activeCampaign.id, (c) => ({
      ...c,
      candidates: [
        ...c.candidates,
        {
          id: `cand-${crypto.randomUUID().slice(0, 8)}`,
          code: String(c.candidates.length + 1).padStart(2, "0"),
          name: trimmed,
          audienceVotes: 0,
          judgeScore: c.usesJudges ? 85 : 0
        }
      ]
    }));
    setNewCandName("");
    setNotice(`Đã thêm "${trimmed}" vào bản nháp.`);
  };

  const handleDeleteCandidate = (candId: string) => {
    if (isLocked) return;
    updateCampaign(activeCampaign.id, (c) => ({
      ...c,
      candidates: c.candidates
        .filter((item) => item.id !== candId)
        .map((item, idx) => ({ ...item, code: String(idx + 1).padStart(2, "0") }))
    }));
  };

  const handleCreateStandalone = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;

    const created: AdminVotingCampaign = {
      id: `vote-${crypto.randomUUID().slice(0, 8)}`,
      title,
      source: "STANDALONE",
      status: "DRAFT",
      isSecretBallot: draftBallotType === "SECRET",
      usesJudges: draftBallotType === "PUBLIC_JUDGE",
      judgeWeight: draftBallotType === "PUBLIC_JUDGE" ? 60 : 0,
      freezeMode: false,
      voterCount: 0,
      candidates: []
    };

    setCampaigns((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setActiveTab("options");
    setDraftTitle("");
    setDraftBallotType("PUBLIC");
    setCreateOpen(false);
    setNotice(`Đã tạo chiến dịch độc lập "${title}" ở trạng thái Bản nháp. Hãy thêm ít nhất 2 phương án trước khi mở cổng.`);
  };

  const requestOpenCampaign = () => {
    setErrorMsg(null);
    if (activeCampaign.candidates.length < 2) {
      setErrorMsg("Cần ít nhất 2 ứng viên / phương án trước khi mở cổng bình chọn.");
      return;
    }
    setAuditModal({
      title: "Mở cổng Bình chọn & Khóa danh sách phương án",
      description:
        "Sau khi mở cổng, danh sách ứng viên/phương án sẽ bị khóa cứng để đảm bảo công bằng kiểm phiếu và không thể thêm hay xóa.",
      targetSummary: activeCampaign.title,
      code: "VOTING_CAMPAIGN_OPEN",
      onDone: () => {
        updateCampaign(activeCampaign.id, (c) => ({ ...c, status: "OPEN" }));
        setNotice(`Đã mở cổng "${activeCampaign.title}" và khóa danh sách phương án (đã ghi Audit Log).`);
      }
    });
  };

  const requestCloseCampaign = () => {
    setAuditModal({
      title: "Đóng cổng Bình chọn & Chốt kết quả",
      description:
        "Hệ thống sẽ ngừng tiếp nhận phiếu bầu mới và sẵn sàng xuất Biên bản Kiểm phiếu chính thức.",
      targetSummary: activeCampaign.title,
      code: "VOTING_CAMPAIGN_CLOSE",
      destructive: true,
      onDone: () => {
        updateCampaign(activeCampaign.id, (c) => ({ ...c, status: "CLOSED", freezeMode: false }));
        setNotice(`Đã đóng cổng "${activeCampaign.title}" (đã ghi Audit Log).`);
      }
    });
  };

  const requestToggleFreeze = () => {
    const nextFreeze = !activeCampaign.freezeMode;
    setAuditModal({
      title: nextFreeze
        ? "Bật Chế độ Đóng băng Phút chót (Freeze Mode)"
        : "Mở băng & Công bố Kết quả LED",
      description:
        "Khi đóng băng, màn hình LED công khai ngừng cập nhật số mới trong khi server vẫn tiếp nhận phiếu hợp lệ.",
      targetSummary: activeCampaign.title,
      code: nextFreeze ? "VOTING_FREEZE_MODE_ON" : "VOTING_UNFREEZE_PUBLISH",
      onDone: () => {
        updateCampaign(activeCampaign.id, (c) => ({ ...c, freezeMode: nextFreeze }));
        setNotice(
          nextFreeze
            ? "Đã bật FREEZE MODE trên màn hình LED công khai (đã ghi Audit Log)."
            : "Đã mở băng & công bố kết quả chính thức trên màn hình LED (đã ghi Audit Log)."
        );
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-medium text-foreground">
            Điều hành Bình chọn, Biểu quyết &amp; Ban Giám khảo
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý chiến dịch gắn sự kiện và chiến dịch độc lập, chấm điểm trọng số BGK và điều khiển hiển thị LED.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/kiosk/voting">
              <QrCode className="h-4 w-4" />
              <span>Quầy Kiosk 60s</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Tạo chiến dịch độc lập</span>
          </Button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setNotice(null)}
            className="h-7 px-2.5 text-xs text-status-success hover:bg-status-success/15 hover:text-status-success"
          >
            Đóng
          </Button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-sm text-status-danger"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setErrorMsg(null)}
            className="h-7 px-2.5 text-xs text-status-danger hover:bg-status-danger/15 hover:text-status-danger"
          >
            Đóng
          </Button>
        </div>
      )}

      {/* Master-Detail Operations Grid */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column: Campaign Rail */}
        <Card className="h-fit lg:col-span-4">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Chiến dịch ({allCampaigns.length})</CardTitle>
              <Badge variant="outline" className="tabular-mono">
                {allCampaigns.filter((c) => c.status === "OPEN").length} đang mở
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "ALL", label: "Tất cả" },
                  { id: "EVENT", label: "Gắn sự kiện" },
                  { id: "STANDALONE", label: "Độc lập" }
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSourceFilter(pill.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    sourceFilter === pill.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-2 pt-0">
            {filteredCampaigns.map((campaign) => {
              const selected = campaign.id === activeCampaign.id;
              return (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => handleSelectCampaign(campaign)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/8"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/35"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {campaign.title}
                    </span>
                    <Badge variant={statusBadgeVariant(campaign.status)} className="shrink-0 text-[10px]">
                      {statusLabel(campaign.status)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {campaign.isSecretBallot ? (
                        <>
                          <Lock className="h-3 w-3 text-brand-navy dark:text-brand-cyan" />
                          <span>Phiếu kín</span>
                        </>
                      ) : campaign.source === "EVENT" ? (
                        <>
                          <QrCode className="h-3 w-3 text-primary" />
                          <span>Gắn sự kiện</span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3 text-brand-cyan" />
                          <span>Độc lập</span>
                        </>
                      )}
                    </span>
                    <span className="tabular-mono">
                      {campaign.expectedVoters
                        ? `${campaign.voterCount}/${campaign.expectedVoters} đại biểu`
                        : `${campaign.voterCount} phiếu`}
                    </span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Column: Active Campaign Control & Content */}
        <div className="space-y-4 lg:col-span-8">
          {/* Active Campaign Control Header */}
          <Card>
            <CardHeader className="space-y-3 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusBadgeVariant(activeCampaign.status)}>
                    {statusLabel(activeCampaign.status)}
                  </Badge>
                  <Badge variant={activeCampaign.source === "EVENT" ? "warning" : "info"} className="gap-1">
                    {activeCampaign.source === "EVENT" ? (
                      <QrCode className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    <span>
                      {activeCampaign.source === "EVENT"
                        ? "Gắn sự kiện · Cần điểm danh"
                        : "Chiến dịch độc lập"}
                    </span>
                  </Badge>
                  {activeCampaign.isSecretBallot && (
                    <VerifiedBadge label="Bỏ phiếu Kín · Outbox Shuffle" />
                  )}
                </div>

                {activeCampaign.eventId && (
                  <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                    <Link to={`/admin/events/${activeCampaign.eventId}`}>
                      <span>Mở sự kiện</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>

              <div>
                <CardTitle className="font-display text-xl font-medium leading-snug">
                  {activeCampaign.title}
                </CardTitle>
                {activeCampaign.eventLabel && (
                  <CardDescription className="mt-1">
                    {activeCampaign.eventLabel}
                    {activeCampaign.sessionLabel ? ` · ${activeCampaign.sessionLabel}` : ""}
                  </CardDescription>
                )}
              </div>

              {/* Lifecycle & Stage Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                {activeCampaign.status === "DRAFT" && (
                  <Button type="button" size="sm" onClick={requestOpenCampaign}>
                    <Play className="h-3.5 w-3.5" />
                    <span>Mở cổng bình chọn</span>
                  </Button>
                )}

                {activeCampaign.status === "OPEN" && !activeCampaign.isSecretBallot && (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/stage/voting">
                        <MonitorPlay className="h-3.5 w-3.5" />
                        <span>LED Đua Top</span>
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activeCampaign.freezeMode ? "default" : "outline"}
                      onClick={requestToggleFreeze}
                    >
                      <Snowflake className="h-3.5 w-3.5" />
                      <span>
                        {activeCampaign.freezeMode ? "Đang đóng băng (Mở băng)" : "Bật Freeze Mode"}
                      </span>
                    </Button>
                  </>
                )}

                {activeCampaign.status === "OPEN" && (
                  <Button type="button" size="sm" variant="destructive" onClick={requestCloseCampaign}>
                    <Square className="h-3.5 w-3.5" />
                    <span>Đóng cổng</span>
                  </Button>
                )}

                {activeCampaign.status !== "DRAFT" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNotice(
                        `Đã xuất Biên bản Kiểm phiếu PDF/Excel cho "${activeCampaign.title}".`
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Biên bản Kiểm phiếu</span>
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Operational Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-[380px]">
            <TabsList className="justify-start">
              <TabsTrigger value="options">
                Danh sách Ứng viên / Phương án ({activeCampaign.candidates.length})
              </TabsTrigger>
              {!activeCampaign.isSecretBallot && activeCampaign.usesJudges && (
                <TabsTrigger value="judge">Chấm điểm BGK &amp; Trọng số</TabsTrigger>
              )}
              {activeCampaign.isSecretBallot && (
                <TabsTrigger value="secret">Giám sát Phiếu kín</TabsTrigger>
              )}
            </TabsList>

            {/* TAB 1: Candidates / Options */}
            <TabsContent value="options" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {activeCampaign.isSecretBallot
                          ? "Các phương án biểu quyết"
                          : "Danh sách Ứng viên / Tiết mục"}
                      </CardTitle>
                      <CardDescription>
                        {isLocked
                          ? "Danh sách đã tự động khóa sau khi mở cổng để đảm bảo tính toàn vẹn kiểm phiếu."
                          : "Chiến dịch đang ở Bản nháp — bạn có thể thêm hoặc xóa phương án trước khi mở cổng."}
                      </CardDescription>
                    </div>
                    {isLocked && (
                      <Badge variant="outline" className="gap-1 shrink-0">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span>Đã khóa danh sách</span>
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Only show composer when campaign is editable (DRAFT) */}
                  {!isLocked && (
                    <form onSubmit={handleAddCandidate} className="flex gap-2">
                      <Input
                        value={newCandName}
                        onChange={(e) => setNewCandName(e.target.value)}
                        placeholder="Nhập tên ứng viên, tiết mục hoặc phương án biểu quyết..."
                        aria-label="Tên ứng viên hoặc phương án mới"
                      />
                      <Button type="submit" disabled={!newCandName.trim()}>
                        <Plus className="h-4 w-4" />
                        <span>Thêm</span>
                      </Button>
                    </form>
                  )}

                  {activeCampaign.candidates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/25 px-6 py-10 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Chưa có ứng viên hoặc phương án nào
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Thêm ít nhất 2 phương án ở ô phía trên để có thể mở cổng bình chọn.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeCampaign.candidates.map((c) => {
                        const pct =
                          totalAudienceVotes > 0
                            ? Math.round((c.audienceVotes / totalAudienceVotes) * 100)
                            : 0;

                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <Badge variant="outline" className="tabular-mono shrink-0">
                                #{c.code}
                              </Badge>
                              <span className="truncate text-sm font-medium text-foreground">
                                {c.name}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              {/* Secret ballot NEVER displays live vote counts (DESIGN.md rule) */}
                              {!activeCampaign.isSecretBallot && activeCampaign.status !== "DRAFT" && (
                                <span className="tabular-mono text-xs text-muted-foreground">
                                  {c.audienceVotes} phiếu ({pct}%)
                                </span>
                              )}

                              {!isLocked && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  aria-label={`Xóa ${c.name}`}
                                  className="text-brand-crimson hover:bg-brand-crimson/10"
                                  onClick={() => handleDeleteCandidate(c.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2A: Judge Scoring & Weighted Ranking (non-secret judge campaigns only) */}
            {!activeCampaign.isSecretBallot && activeCampaign.usesJudges && (
              <TabsContent value="judge" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span>Chấm điểm Ban Giám khảo &amp; Công thức Trọng số</span>
                      </CardTitle>
                      <CardDescription>
                        Đồng điểm ưu tiên điểm trung bình BGK cao hơn. Tổng trọng số luôn đủ 100%.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="judge-weight" className="whitespace-nowrap text-xs">
                        Trọng số BGK (%):
                      </Label>
                      <Input
                        id="judge-weight"
                        type="number"
                        min={0}
                        max={100}
                        value={activeCampaign.judgeWeight}
                        onChange={(e) => {
                          const w = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          updateCampaign(activeCampaign.id, (c) => ({ ...c, judgeWeight: w }));
                        }}
                        className="tabular-mono h-8 w-20"
                      />
                      <Badge variant="secondary" className="tabular-mono">
                        Khán giả: {audienceWeight}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ranked.map((row, idx) => (
                      <div
                        key={row.id}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant={idx === 0 ? "success" : "outline"} className="tabular-mono">
                              Hạng {idx + 1}
                            </Badge>
                            <span className="truncate font-medium text-foreground">{row.name}</span>
                          </div>
                          <div className="tabular-mono mt-1 text-xs text-muted-foreground">
                            Khán giả: {row.audienceVotes} phiếu ({row.normalizedAudience.toFixed(1)}đ quy đổi)
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Điểm BGK:</span>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={row.judgeScore}
                              aria-label={`Điểm BGK cho ${row.name}`}
                              onChange={(e) => {
                                const score = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                updateCampaign(activeCampaign.id, (c) => ({
                                  ...c,
                                  candidates: c.candidates.map((item) =>
                                    item.id === row.id ? { ...item, judgeScore: score } : item
                                  )
                                }));
                              }}
                              className="tabular-mono h-8 w-20"
                            />
                          </div>
                          <div className="tabular-mono rounded-lg bg-primary/12 px-3 py-1 text-sm font-semibold text-primary">
                            Tổng: {row.finalScore.toFixed(2)}đ
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* TAB 2B: Secret Ballot Monitor (zero live tally, turnout only) */}
            {activeCampaign.isSecretBallot && (
              <TabsContent value="secret" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-4 w-4 text-brand-navy dark:text-brand-cyan" />
                      <span>Giám sát Tiến độ Bỏ phiếu Kín</span>
                    </CardTitle>
                    <CardDescription>
                      Chế độ Bỏ phiếu Kín tắt hoàn toàn kiểm phiếu thời gian thực kể cả trên màn hình điều hành. Kết quả chỉ được mở niêm phong sau khi đóng cổng.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-muted/35 p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span>Tổng số cử tri đã bỏ phiếu</span>
                        </div>
                        <div className="tabular-mono mt-1 text-2xl font-semibold text-foreground">
                          {activeCampaign.expectedVoters
                            ? `${activeCampaign.voterCount} / ${activeCampaign.expectedVoters}`
                            : activeCampaign.voterCount}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/35 p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Lock className="h-3.5 w-3.5 text-primary" />
                          <span>Trạng thái niêm phong Outbox Shuffle</span>
                        </div>
                        <div className="mt-1.5 text-sm font-semibold text-foreground">
                          {activeCampaign.status === "CLOSED"
                            ? "Đã đóng cổng — Sẵn sàng kiểm phiếu"
                            : "Đang niêm phong — Ẩn tỷ lệ từng phương án"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Create Standalone Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo chiến dịch Bình chọn độc lập</DialogTitle>
            <DialogDescription>
              Dùng cho các đợt bình chọn trực tuyến không gắn với buổi sự kiện hội trường (VD: bình chọn mẫu áo Khoa, gương mặt tiêu biểu). Các phiên Live Voting gắn sự kiện sẽ tự động đồng bộ từ trình Tạo Sự kiện.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStandalone} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-campaign-title">Tên chiến dịch</Label>
              <Input
                id="new-campaign-title"
                required
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="VD: Bình chọn Ấn phẩm Truyền thông FIT 2026"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-campaign-type">Hình thức kiểm phiếu</Label>
              <Select
                value={draftBallotType}
                onValueChange={(v) => setDraftBallotType(v as "PUBLIC" | "PUBLIC_JUDGE" | "SECRET")}
              >
                <SelectTrigger id="new-campaign-type" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Bình chọn công khai (Chỉ khán giả)</SelectItem>
                  <SelectItem value="PUBLIC_JUDGE">Bình chọn công khai + Chấm điểm BGK</SelectItem>
                  <SelectItem value="SECRET">Bỏ phiếu kín (Outbox Shuffle · Ẩn kiểm phiếu trực tiếp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!draftTitle.trim()}>
                Tạo Bản nháp
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AuditActionDialog
        open={Boolean(auditModal)}
        onOpenChange={(o) => !o && setAuditModal(null)}
        title={auditModal?.title ?? ""}
        description={auditModal?.description ?? ""}
        targetSummary={auditModal?.targetSummary ?? activeCampaign.title}
        actionCode={auditModal?.code ?? "VOTING_AUDIT"}
        destructive={auditModal?.destructive ?? false}
        onConfirm={() => {
          auditModal?.onDone();
          setAuditModal(null);
        }}
      />
    </div>
  );
}
