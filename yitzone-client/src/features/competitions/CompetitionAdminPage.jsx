import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpCircle,
  Award,
  Building2,
  CheckCircle2,
  Lock,
  MonitorPlay,
  RefreshCw,
  ShieldAlert,
  Trophy,
  Users,
  Video
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computeQualifyingStandings,
  formatDurationMMSS,
  INITIAL_COMPETITION_TEAMS,
  MASTERING_IT_META,
  STAGE_SEGMENTS
} from "@/features/competitions/competition-data";

export function CompetitionAdminPage({ embedded = false } = {}) {
  const [teams, setTeams] = useState(INITIAL_COMPETITION_TEAMS);
  const [scoringMode, setScoringMode] = useState("SUM_OF_MEMBERS");
  const [cheatingPolicy, setCheatingPolicy] = useState("ZERO_MEMBER_SCORE");
  const [qualifyTopN, setQualifyTopN] = useState(MASTERING_IT_META?.qualifyTopN ?? 5);
  const [minParticipated, setMinParticipated] = useState(5);
  const [qualFinalized, setQualFinalized] = useState(false);
  const [votingSynced, setVotingSynced] = useState(false);
  const [awardsFinalized, setAwardsFinalized] = useState(false);
  const [votingMode, setVotingMode] = useState(
    "SEPARATE_AWARD"
  );
  const [separateAwardTitle, setSeparateAwardTitle] = useState(
    "Video Giới thiệu Ấn tượng"
  );
  const [separateAwardJudgeWeight, setSeparateAwardJudgeWeight] = useState(50);
  const [judgeWeight, setJudgeWeight] = useState(80);

  const [notice, setNotice] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [auditModal, setAuditModal] = useState(null);

  const standings = useMemo(
    () => computeQualifyingStandings(teams, scoringMode, cheatingPolicy, minParticipated),
    [teams, scoringMode, cheatingPolicy, minParticipated]
  );

  // Phát hiện đồng điểm ở biên hạng n (Edge 45)
  const boundaryTieDetected = useMemo(() => {
    const atN = standings[qualifyTopN - 1];
    const nextN = standings[qualifyTopN];
    if (!atN || !nextN) return false;
    return (
      atN.aggregatedScore === nextN.aggregatedScore &&
      atN.totalDurationSec === nextN.totalDurationSec &&
      atN.totalViolations === nextN.totalViolations
    );
  }, [standings, qualifyTopN]);

  const finalistTeams = useMemo(
    () =>
      teams.filter(
        (t) =>
          t.status === "APPROVED" &&
          (t.advancementStatus === "CONFIRMED" || t.advancementStatus === "QUALIFIED")
      ),
    [teams]
  );

  const standbyTeams = useMemo(
    () => standings.filter((s) => s.team.advancementStatus === "STANDBY"),
    [standings]
  );

  const maxAudienceVotes = Math.max(
    1,
    ...finalistTeams.map((t) => Number(t.stageScores?.audienceVotes) || 0)
  );

  const rankedFinals = useMemo(() => {
    const audienceWeight = 100 - judgeWeight;
    return finalistTeams
      .map((team) => {
        const warmup = Number(team.stageScores?.warmup) || 0;
        const accel = Number(team.stageScores?.accel) || 0;
        const finish = Number(team.stageScores?.finish) || 0;
        const votes = Number(team.stageScores?.audienceVotes) || 0;
        const bgk100 =
          (warmup / 20) * 20 +
          (accel / 30) * 30 +
          (finish / 50) * 50;
        const audience100 = (votes / maxAudienceVotes) * 100;
        const finalWeighted =
          votingMode === "WEIGHTED_INTO_MAIN"
            ? (judgeWeight / 100) * bgk100 + (audienceWeight / 100) * audience100
            : bgk100;
        return { team, bgk100, audience100, finalWeighted };
      })
      .sort((a, b) => b.finalWeighted - a.finalWeighted || b.bgk100 - a.bgk100);
  }, [finalistTeams, judgeWeight, maxAudienceVotes, votingMode]);

  const rankedSeparateAward = useMemo(() => {
    if (votingMode !== "SEPARATE_AWARD") return [];
    const voteWeight = 100 - separateAwardJudgeWeight;
    return finalistTeams
      .map((team) => {
        const bgkVideo = Number(team.introVideo?.bgkVideoScore) || 0;
        const votes = Number(team.stageScores?.audienceVotes) || 0;
        const vote100 = (votes / maxAudienceVotes) * 100;
        const total =
          (separateAwardJudgeWeight / 100) * bgkVideo + (voteWeight / 100) * vote100;
        return { team, bgkVideo, vote100, total };
      })
      .sort((a, b) => b.total - a.total || b.bgkVideo - a.bgkVideo);
  }, [votingMode, finalistTeams, separateAwardJudgeWeight, maxAudienceVotes]);

  const popularAwardWinnerId = useMemo(() => {
    if (votingMode !== "SEPARATE_AWARD") return null;
    const top = rankedSeparateAward[0];
    return top && top.total > 0 ? top.team.id : null;
  }, [votingMode, rankedSeparateAward]);

  const handleReviewTeam = (teamId, nextStatus) => {
    setErrorMsg(null);
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status: nextStatus } : t))
    );
    setNotice(
      nextStatus === "APPROVED"
        ? "Đã duyệt hồ sơ đội (5/5 thành viên đã xác thực Email + OTP) — mở quyền dự thi Vòng loại."
        : "Đã từ chối hồ sơ đội và gửi thông báo lý do tới Đội trưởng."
    );
  };

  const handleFinalizeQualifying = () => {
    setErrorMsg(null);
    if (boundaryTieDetected) {
      setErrorMsg(
        `Phát hiện đồng điểm tuyệt đối tại biên hạng #${qualifyTopN}. Cần BGK xác nhận phương án phân định trước khi đóng băng BXH.`
      );
      return;
    }
    setAuditModal({
      title: `Chốt BXH Vòng loại & Chọn Top ${qualifyTopN} vào Chung kết`,
      description: `Đóng băng bảng xếp hạng theo công thức đã chọn, tự động gắn trạng thái Vào Chung kết cho Top ${qualifyTopN}, Dự bị cho các đội kế tiếp và gửi thông báo hạn xác nhận.`,
      code: "COMP_ROUND_FINALIZE",
      onDone: () => {
        const topIds = new Set(standings.slice(0, qualifyTopN).map((s) => s.team.id));
        setTeams((prev) =>
          prev.map((t) => {
            if (t.status !== "APPROVED") return t;
            if (topIds.has(t.id)) {
              return {
                ...t,
                advancementStatus:
                  t.advancementStatus === "CONFIRMED" ? "CONFIRMED" : "QUALIFIED"
              };
            }
            return { ...t, advancementStatus: "STANDBY" };
          })
        );
        setQualFinalized(true);
        setNotice(`Đã đóng băng BXH Vòng loại và gửi thông báo xác nhận tới Top ${qualifyTopN} đội.`);
      }
    });
  };

  const handleWithdrawAndPromote = (withdrawnTeam) => {
    const nextStandby = standbyTeams[0]?.team;
    setAuditModal({
      title: "Ghi nhận rút lui & Đôn đội dự bị kế tiếp",
      description: nextStandby
        ? `Chuyển ${withdrawnTeam.teamName} sang Đã rút lui và đôn đội dự bị #1 (${nextStandby.teamName} · ${nextStandby.teamCode}) lên Vào Chung kết.`
        : `Chuyển ${withdrawnTeam.teamName} sang Đã rút lui (hiện không còn đội dự bị).`,
      code: "COMP_PROMOTE_STANDBY",
      onDone: () => {
        setTeams((prev) =>
          prev.map((t) => {
            if (t.id === withdrawnTeam.id) {
              return { ...t, advancementStatus: "WITHDRAWN" };
            }
            if (nextStandby && t.id === nextStandby.id) {
              return { ...t, advancementStatus: "QUALIFIED" };
            }
            return t;
          })
        );
        setNotice(
          nextStandby
            ? `Đã đôn đội dự bị ${nextStandby.teamName} thay thế ${withdrawnTeam.teamName} (đã ghi Audit Log).`
            : `Đã ghi nhận ${withdrawnTeam.teamName} rút lui.`
        );
      }
    });
  };

  const handleStageScoreChange = (
    teamId,
    field,
    raw
  ) => {
    const maxMap = { warmup: 20, accel: 30, finish: 50 };
    const parsed = Math.max(0, Math.min(maxMap[field], Number(raw) || 0));
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, stageScores: { ...t.stageScores, [field]: parsed } }
          : t
      )
    );
  };

  const handleVideoScoreChange = (teamId, raw) => {
    const parsed = Math.max(0, Math.min(100, Number(raw) || 0));
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              introVideo: {
                url: t.introVideo?.url ?? "",
                submittedAt: t.introVideo?.submittedAt ?? "",
                status: t.introVideo?.status ?? "APPROVED",
                bgkVideoScore: parsed
              }
            }
          : t
      )
    );
  };

  const handleReviewVideo = (teamId, status) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId && t.introVideo
          ? { ...t, introVideo: { ...t.introVideo, status } }
          : t
      )
    );
    setNotice(
      status === "APPROVED"
        ? "Đã duyệt Video giới thiệu đội — sẵn sàng đồng bộ sang thẻ ứng viên 4.20 Live Voting."
        : "Đã từ chối Video giới thiệu và yêu cầu Đội trưởng nộp lại."
    );
  };

  const handleSyncToVoting = () => {
    setVotingSynced(true);
    setNotice(
      `Đã đồng bộ 1 chạm ${finalistTeams.length} đội Chung kết sang danh sách VOTING_CANDIDATES của Phân hệ 4.20 Live Voting.`
    );
  };

  const handleFinalizeAwards = () => {
    setAuditModal({
      title: "BTV Chốt Giải thưởng Chung cuộc & Phát hành E-Certificate (FR-COMP-06)",
      description:
        "Phát hành E-Certificate (ghi rõ Tên đội + Hạng giải) cho cả 5/5 thành viên mỗi đội (bao gồm SV ngoài trường); tự động lọc chỉ cộng ĐRL/CĐDN cho SV HCM-UTE (Edge 44).",
      code: "COMP_FINALIZE_AWARDS_ECERT",
      onDone: () => {
        setAwardsFinalized(true);
        setNotice(
          "Đã chốt giải thưởng Mastering IT 2026: phát hành E-Cert cho toàn bộ thành viên hợp lệ và ghi nhận quyền lợi riêng cho SV HCM-UTE."
        );
      }
    });
  };

  const totalApprovedTeams = teams.filter((t) => t.status === "APPROVED").length;
  const pendingReviewTeams = teams.filter((t) => t.status === "SUBMITTED").length;
  const totalUteMembers = teams
    .filter((t) => t.status === "APPROVED")
    .reduce((acc, t) => acc + (t.members ?? []).filter((m) => !m.isExternal).length, 0);
  const totalExternalMembers = teams
    .filter((t) => t.status === "APPROVED")
    .reduce((acc, t) => acc + (t.members ?? []).filter((m) => m.isExternal).length, 0);

  return (
    <div className="space-y-6">
      {/* Page Header (hidden when embedded inside EventAdminPage) */}
      {!embedded && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">
              Điều hành Cuộc thi Học thuật Đa vòng (Mastering IT 2026)
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý sự kiện theo đội 5 SV (UTE + Ngoài trường), Vòng loại 4.6.2, Chốt Top n &amp; Chung kết 4.20.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={MASTERING_IT_META.eventId ? `/events/${MASTERING_IT_META.eventId}` : "/events"}>
                <Users className="h-4 w-4" />
                <span>Xem trang Sự kiện</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/stage/voting">
                <MonitorPlay className="h-4 w-4" />
                <span>Màn hình LED Chung kết</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Compact Operational Metrics Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">Đội đã duyệt / Trần</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-foreground">
            {totalApprovedTeams} / {MASTERING_IT_META?.maxTeams ?? 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {pendingReviewTeams} hồ sơ đội đang chờ duyệt
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">Thí sinh (UTE / Ngoài trường)</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-foreground">
            {totalUteMembers} / {totalExternalMembers}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            100% tự xác thực tài khoản Email + OTP
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">Chỉ tiêu Chung kết</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-foreground">
            Top {qualifyTopN} đội
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {qualFinalized ? "BXH Vòng loại đã đóng băng" : "Đang hậu kiểm Vòng loại"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">Liên kết 4.20 Live Voting</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={votingSynced ? "success" : "warning"}>
              {votingSynced ? "Đã đồng bộ ứng viên" : "Chưa đồng bộ Top n"}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {votingMode === "NONE"
              ? "Không mở bình chọn · 100% BGK"
              : votingMode === "SEPARATE_AWARD"
                ? `Giải phụ riêng: ${separateAwardTitle.trim() || "Yêu thích nhất"}`
                : `Trọng số ${judgeWeight}% BGK + ${100 - judgeWeight}% Khán giả`}
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-sm text-status-danger">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-xs font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      <Tabs defaultValue="qualifying" className="space-y-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/70 p-1">
          <TabsTrigger value="teams">1. Duyệt Đội thi</TabsTrigger>
          <TabsTrigger value="qualifying">2. Vòng loại &amp; Chốt Top n</TabsTrigger>
          <TabsTrigger value="finals">3. Chung kết, Rubric BGK &amp; 4.20</TabsTrigger>
          <TabsTrigger value="awards">4. Chốt Giải &amp; E-Cert (BTV)</TabsTrigger>
        </TabsList>

        {/* TAB 1: TEAM APPROVAL */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle>Danh sách Đội thi Đăng ký (FR-EVT-08)</CardTitle>
              <CardDescription>
                Chỉ các đội đủ sĩ số cấu hình (tất cả thành viên đã tự đăng ký Email + OTP và xác nhận tham gia) mới được đưa vào hàng chờ duyệt.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-display text-base font-medium text-foreground">
                    Chưa có đội thi nào đăng ký
                  </p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Danh sách các đội hoàn tất xác thực thành viên và gửi hồ sơ dự thi sẽ hiển thị tại đây để BTC xét duyệt.
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Mã / Tên đội</th>
                      <th className="px-4 py-3">Đội trưởng</th>
                      <th className="px-4 py-3">Cơ cấu 5 thành viên</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teams.map((team) => {
                      const members = team.members ?? [];
                      const leader = members.find((m) => m.role === "LEADER");
                      const extCount = members.filter((m) => m.isExternal).length;
                      return (
                        <tr key={team.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{team.teamName}</div>
                            <div className="tabular-mono text-xs text-muted-foreground">
                              {team.teamCode} · Join: {team.joinCode}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-foreground">{leader?.fullName}</div>
                            <div className="text-xs text-muted-foreground">{leader?.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="info">{members.length - extCount} UTE</Badge>
                              {extCount > 0 && (
                                <Badge variant="warning">
                                  <Building2 className="h-3 w-3" />
                                  <span>{extCount} Ngoài trường</span>
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {team.status === "APPROVED" ? (
                              <Badge variant="success">Đã duyệt</Badge>
                            ) : team.status === "SUBMITTED" ? (
                              <Badge variant="warning">Chờ BTC duyệt</Badge>
                            ) : (
                              <Badge variant="danger">Đã từ chối</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {team.status === "SUBMITTED" ? (
                              <div className="inline-flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleReviewTeam(team.id, "APPROVED")}
                                >
                                  Duyệt đội
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReviewTeam(team.id, "REJECTED")}
                                >
                                  Từ chối
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Đã xử lý</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: QUALIFYING & TOP N */}
        <TabsContent value="qualifying" className="space-y-4">
          <Card>
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle>Quy tắc Tổng hợp Điểm Đội &amp; Chọn Top n</CardTitle>
              <CardDescription>
                Thay đổi công thức tổng hợp hoặc chính sách xử lý vi phạm để xem bảng xếp hạng tính lại tức thì trước khi đóng băng.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="scoring-mode">Công thức gộp điểm đội</Label>
                <Select
                  value={scoringMode}
                  onValueChange={(v) => setScoringMode(v)}
                  disabled={qualFinalized}
                >
                  <SelectTrigger id="scoring-mode" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUM_OF_MEMBERS">Tổng điểm 5 thành viên (SUM)</SelectItem>
                    <SelectItem value="AVG_OF_MEMBERS">Điểm trung bình đội (AVG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cheating-policy">Chính sách vi phạm quy chế</Label>
                <Select
                  value={cheatingPolicy}
                  onValueChange={(v) => setCheatingPolicy(v)}
                  disabled={qualFinalized}
                >
                  <SelectTrigger id="cheating-policy" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZERO_MEMBER_SCORE">Tính 0đ thành viên vi phạm</SelectItem>
                    <SelectItem value="DISQUALIFY_TEAM">Loại cả đội (Cần BTV duyệt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="top-n">Chỉ tiêu Top n vào Chung kết</Label>
                <Input
                  id="top-n"
                  type="number"
                  min={2}
                  max={10}
                  value={qualifyTopN}
                  disabled={qualFinalized}
                  onChange={(e) => setQualifyTopN(Math.max(2, Number(e.target.value) || 5))}
                  className="tabular-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="min-part">Tối thiểu SV dự thi / đội</Label>
                <Input
                  id="min-part"
                  type="number"
                  min={1}
                  max={5}
                  value={minParticipated}
                  disabled={qualFinalized}
                  onChange={(e) => setMinParticipated(Math.max(1, Math.min(5, Number(e.target.value) || 5)))}
                  className="tabular-mono"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Bảng xếp hạng Vòng loại (Tự động gộp từ 4.6.2)</CardTitle>
                <CardDescription>
                  Tiêu chí phân định: Điểm đội giảm dần → Tổng thời gian tăng dần → Tổng vi phạm tăng dần.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleFinalizeQualifying}
                disabled={qualFinalized || standings.length === 0}
              >
                <Lock className="h-4 w-4" />
                <span>{qualFinalized ? "Đã chốt BXH Top n" : `Chốt BXH & Chọn Top ${qualifyTopN}`}</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {standings.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-display text-base font-medium text-foreground">
                    Chưa có dữ liệu xếp hạng Vòng loại
                  </p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Bảng xếp hạng tự động gộp điểm các thành viên sẽ hiển thị sau khi có đội được duyệt và hoàn thành bài thi Vòng loại.
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Hạng</th>
                      <th className="px-4 py-3">Đội thi</th>
                      <th className="px-4 py-3 text-right">
                        {scoringMode === "SUM_OF_MEMBERS" ? "Tổng điểm" : "Điểm TB"}
                      </th>
                      <th className="px-4 py-3 text-right">Tổng thời gian</th>
                      <th className="px-4 py-3">Hậu kiểm / Vi phạm</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Điều phối Top n</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {standings.map((row) => (
                      <tr key={row.team.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 tabular-mono font-semibold text-foreground">
                          #{row.rank}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{row.team.teamName}</div>
                          <div className="tabular-mono text-xs text-muted-foreground">
                            {row.team.teamCode} · {row.validMemberCount}/5 bài hợp lệ
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-mono font-semibold text-foreground">
                          {row.teamDisqualifiedByPolicy ? "0 (Loại)" : row.aggregatedScore}
                        </td>
                        <td className="px-4 py-3 text-right tabular-mono text-xs text-muted-foreground">
                          {formatDurationMMSS(row.totalDurationSec)}
                        </td>
                        <td className="px-4 py-3">
                          {row.hasDisqualifiedMember ? (
                            <Badge variant={row.teamDisqualifiedByPolicy ? "danger" : "warning"}>
                              <AlertTriangle className="h-3 w-3" />
                              <span>
                                {row.teamDisqualifiedByPolicy
                                  ? "Loại cả đội"
                                  : "1 SV bị hủy bài (0đ)"}
                              </span>
                            </Badge>
                          ) : (
                            <Badge variant="success">Sạch ({row.totalViolations} cảnh báo)</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.team.advancementStatus === "CONFIRMED" ? (
                            <Badge variant="success">Đã xác nhận CK</Badge>
                          ) : row.team.advancementStatus === "QUALIFIED" ? (
                            <Badge variant="default">Top {qualifyTopN} · Chờ XN</Badge>
                          ) : row.team.advancementStatus === "WITHDRAWN" ? (
                            <Badge variant="danger">Đã rút lui</Badge>
                          ) : row.team.advancementStatus === "STANDBY" ? (
                            <Badge variant="warning">Dự bị (Standby)</Badge>
                          ) : (
                            <Badge variant="secondary">Chờ chốt</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(row.team.advancementStatus === "QUALIFIED" ||
                            row.team.advancementStatus === "CONFIRMED") && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleWithdrawAndPromote(row.team)}
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                              <span>Rút lui &amp; Đôn dự bị</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FINALS RUBRIC & LIVE VOTING SYNC */}
        <TabsContent value="finals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Chấm điểm Rubric 3 Chặng Chung kết &amp; Đồng bộ 4.20 Live Voting (FR-EVT-11)</CardTitle>
                <CardDescription>
                  Hỗ trợ 3 chế độ bình chọn: Không mở, Gộp trọng số vào điểm chính, hoặc Tách riêng làm 1 Giải Bình chọn độc lập.
                </CardDescription>
              </div>
              {votingMode !== "NONE" && (
                <Button
                  type="button"
                  size="sm"
                  disabled={finalistTeams.length === 0}
                  onClick={handleSyncToVoting}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{votingSynced ? "Đồng bộ lại sang 4.20" : "Đồng bộ Top n sang 4.20"}</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Audience Voting Mode Selector */}
              <div className="grid gap-3 rounded-xl border border-border bg-muted/25 p-3.5 lg:grid-cols-12">
                <div className="space-y-1.5 lg:col-span-7">
                  <Label className="text-xs font-semibold text-foreground">
                    Chế độ Bình chọn Khán giả (4.20 Live Voting)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "SEPARATE_AWARD", label: "Giải phụ độc lập (Vote + BGK)" },
                        { id: "WEIGHTED_INTO_MAIN", label: "Gộp trọng số vào điểm chính" },
                        { id: "NONE", label: "Không mở bình chọn" }
                      ]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVotingMode(opt.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          votingMode === opt.id
                            ? "border-primary bg-primary/12 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {votingMode === "SEPARATE_AWARD" && (
                  <div className="grid gap-2.5 sm:grid-cols-12 lg:col-span-5">
                    <div className="space-y-1.5 sm:col-span-7">
                      <Label htmlFor="sep-award-title" className="text-xs">
                        Tên giải phụ độc lập
                      </Label>
                      <Input
                        id="sep-award-title"
                        value={separateAwardTitle}
                        onChange={(e) => setSeparateAwardTitle(e.target.value)}
                        placeholder="VD: Video Giới thiệu Ấn tượng"
                        className="h-9 rounded-lg bg-card text-xs"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-5">
                      <Label htmlFor="sep-bgk-weight" className="text-xs">
                        BGK / Vote ({separateAwardJudgeWeight}% / {100 - separateAwardJudgeWeight}%)
                      </Label>
                      <Input
                        id="sep-bgk-weight"
                        type="number"
                        min={0}
                        max={100}
                        value={separateAwardJudgeWeight}
                        onChange={(e) =>
                          setSeparateAwardJudgeWeight(
                            Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          )
                        }
                        className="h-9 tabular-mono rounded-lg bg-card text-xs"
                      />
                    </div>
                  </div>
                )}

                {votingMode === "WEIGHTED_INTO_MAIN" && (
                  <div className="space-y-1.5 lg:col-span-5">
                    <Label htmlFor="bgk-weight" className="text-xs">
                      Trọng số BGK (%) — Khán giả tự động còn {100 - judgeWeight}%
                    </Label>
                    <Input
                      id="bgk-weight"
                      type="number"
                      min={50}
                      max={100}
                      value={judgeWeight}
                      onChange={(e) =>
                        setJudgeWeight(Math.max(50, Math.min(100, Number(e.target.value) || 80)))
                      }
                      className="h-9 w-28 tabular-mono rounded-lg bg-card text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {(STAGE_SEGMENTS ?? []).map((seg) => (
                  <div key={seg.code} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground text-sm">{seg.title}</span>
                      <Badge variant="outline" className="tabular-mono">
                        {seg.weightPercent}% (max {seg.maxScore})
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{seg.criteriaNote}</p>
                  </div>
                ))}
              </div>

              {rankedFinals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                  <p className="font-display text-base font-medium text-foreground">
                    Chưa có đội thi nào vào Vòng Chung kết
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hãy chốt Bảng xếp hạng Vòng loại ở Tab 2 để xác định danh sách các đội bước vào đêm Chung kết sân khấu.
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3">Hạng CK</th>
                      <th className="px-3 py-3">Đội Chung kết</th>
                      <th className="px-3 py-3">Khởi động (/20)</th>
                      <th className="px-3 py-3">Tăng tốc (/30)</th>
                      <th className="px-3 py-3">Về đích (/50)</th>
                      <th className="px-3 py-3 text-right">BGK (/100)</th>
                      {votingMode !== "NONE" && (
                        <th className="px-3 py-3 text-right">Phiếu KG (4.20)</th>
                      )}
                      <th className="px-3 py-3 text-right">
                        {votingMode === "WEIGHTED_INTO_MAIN" ? "Tổng trọng số" : "Điểm chính thức"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rankedFinals.map((item, idx) => {
                      const isPopularWinner = popularAwardWinnerId === item.team.id;
                      return (
                        <tr key={item.team.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 tabular-mono font-semibold text-foreground">
                            #{idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-medium text-foreground">{item.team.teamName}</span>
                              {isPopularWinner && (
                                <Badge variant="calArts">
                                  <Trophy className="h-3 w-3" />
                                  <span>{separateAwardTitle.trim() || "Yêu thích nhất"}</span>
                                </Badge>
                              )}
                            </div>
                            <div className="tabular-mono text-xs text-muted-foreground">
                              {item.team.teamCode}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              type="number"
                              step="0.5"
                              min={0}
                              max={20}
                              value={item.team.stageScores.warmup}
                              onChange={(e) =>
                                handleStageScoreChange(item.team.id, "warmup", e.target.value)
                              }
                              className="h-8 w-20 tabular-mono"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              type="number"
                              step="0.5"
                              min={0}
                              max={30}
                              value={item.team.stageScores.accel}
                              onChange={(e) =>
                                handleStageScoreChange(item.team.id, "accel", e.target.value)
                              }
                              className="h-8 w-20 tabular-mono"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              type="number"
                              step="0.5"
                              min={0}
                              max={50}
                              value={item.team.stageScores.finish}
                              onChange={(e) =>
                                handleStageScoreChange(item.team.id, "finish", e.target.value)
                              }
                              className="h-8 w-20 tabular-mono"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-mono font-medium text-foreground">
                            {item.bgk100.toFixed(1)}
                          </td>
                          {votingMode !== "NONE" && (
                            <td className="px-3 py-2.5 text-right tabular-mono text-muted-foreground">
                              {item.team.stageScores.audienceVotes} phiếu
                            </td>
                          )}
                          <td className="px-3 py-2.5 text-right tabular-mono text-base font-semibold text-primary">
                            {item.finalWeighted.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}

              {/* Dedicated Separate Award (Intro Video + BGK & Vote Weighted) Panel */}
              {votingMode === "SEPARATE_AWARD" && rankedSeparateAward.length > 0 && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-primary" />
                      <h3 className="font-display text-base font-medium text-foreground">
                        Duyệt Video Giới thiệu &amp; Chấm Giải Phụ: {separateAwardTitle.trim() || "Video Ấn tượng"}
                      </h3>
                    </div>
                    <Badge variant="info" className="tabular-mono">
                      Trọng số: {separateAwardJudgeWeight}% BGK Video + {100 - separateAwardJudgeWeight}% Vote 4.20
                    </Badge>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border bg-card">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2.5">Hạng</th>
                          <th className="px-3 py-2.5">Đội thi</th>
                          <th className="px-3 py-2.5">Video giới thiệu (Top X)</th>
                          <th className="px-3 py-2.5">BGK chấm Video (/100)</th>
                          <th className="px-3 py-2.5 text-right">Vote (4.20)</th>
                          <th className="px-3 py-2.5 text-right">Tổng Giải phụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rankedSeparateAward.map((row, idx) => {
                          const vid = row.team.introVideo;
                          return (
                            <tr key={row.team.id} className="hover:bg-muted/30">
                              <td className="px-3 py-2.5 tabular-mono font-semibold text-foreground">
                                #{idx + 1}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="font-medium text-foreground">{row.team.teamName}</div>
                                <div className="tabular-mono text-xs text-muted-foreground">
                                  {row.team.teamCode}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-xs">
                                {vid?.url ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <a
                                      href={vid.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="max-w-[180px] truncate font-medium text-primary underline"
                                    >
                                      {vid.url}
                                    </a>
                                    {vid.status === "APPROVED" ? (
                                      <Badge variant="success">Đã duyệt</Badge>
                                    ) : vid.status === "PENDING_REVIEW" ? (
                                      <div className="inline-flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="h-6 rounded-full px-2 text-[11px]"
                                          onClick={() => handleReviewVideo(row.team.id, "APPROVED")}
                                        >
                                          Duyệt
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-6 rounded-full px-2 text-[11px]"
                                          onClick={() => handleReviewVideo(row.team.id, "REJECTED")}
                                        >
                                          Từ chối
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge variant="danger">Yêu cầu nộp lại</Badge>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="secondary">Chưa nộp video</Badge>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={separateAwardJudgeWeight === 0}
                                  value={vid?.bgkVideoScore ?? 0}
                                  onChange={(e) => handleVideoScoreChange(row.team.id, e.target.value)}
                                  className="h-8 w-20 tabular-mono"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-mono text-muted-foreground">
                                {row.team.stageScores.audienceVotes} phiếu
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-mono font-semibold text-primary">
                                {row.total.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: FINALIZE AWARDS & E-CERT */}
        <TabsContent value="awards" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Chốt Giải thưởng Chung cuộc &amp; Phát hành E-Certificate</CardTitle>
                <CardDescription>
                  Chỉ BTV có quyền chốt cuối. Hệ thống tự động tách bạch E-Cert (5/5 thành viên) và Quyền lợi nội bộ ĐRL/CĐDN (chỉ SV HCM-UTE).
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleFinalizeAwards}
                disabled={awardsFinalized || rankedFinals.length === 0}
              >
                <Award className="h-4 w-4" />
                <span>{awardsFinalized ? "Đã chốt Giải & Cấp E-Cert" : "Chốt Giải & Phát hành E-Cert"}</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {rankedFinals.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <Award className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-display text-base font-medium text-foreground">
                    Chưa có kết quả xếp hạng Chung kết để xét trao giải
                  </p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Sau khi BGK hoàn tất chấm điểm Vòng Chung kết tại Tab 3, danh sách phân bổ giải thưởng và E-Certificate sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Giải thưởng</th>
                      <th className="px-4 py-3">Đội đạt giải</th>
                      <th className="px-4 py-3">Cấp E-Certificate</th>
                      <th className="px-4 py-3">Ghi nhận ĐRL / CĐDN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rankedFinals.map((item, idx) => {
                      const awardLabel =
                        idx === 0
                          ? "Giải Nhất"
                          : idx === 1
                            ? "Giải Nhì"
                            : idx === 2
                              ? "Giải Ba"
                              : "Khuyến khích";
                      const uteMembers = item.team.members.filter((m) => !m.isExternal).length;
                      const extMembers = item.team.members.length - uteMembers;
                      const alsoPopularWinner = popularAwardWinnerId === item.team.id;
                      return (
                        <tr key={item.team.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant={idx === 0 ? "verified" : idx < 3 ? "default" : "secondary"}>
                                <Trophy className="h-3 w-3" />
                                <span>{awardLabel}</span>
                              </Badge>
                              {alsoPopularWinner && (
                                <Badge variant="calArts">
                                  <Trophy className="h-3 w-3" />
                                  <span>{separateAwardTitle.trim() || "Đội thi được Yêu thích nhất"}</span>
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{item.team.teamName}</div>
                            <div className="tabular-mono text-xs text-muted-foreground">
                              Điểm chung cuộc: {item.finalWeighted.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="success">
                              Cấp đủ {item.team.members.length}/5 thành viên (QR công khai)
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{uteMembers} SV HCM-UTE</span>{" "}
                            nhận <span className="font-medium text-status-success">Cộng ĐRL, Cộng CĐDN</span>
                            {extMembers > 0 && (
                              <span> · Bỏ qua an toàn {extMembers} SV ngoài trường</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {auditModal && (
        <AuditActionDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setAuditModal(null);
          }}
          title={auditModal.title}
          description={auditModal.description}
          targetSummary={`${MASTERING_IT_META?.title ?? "Cuộc thi Học thuật"} (${MASTERING_IT_META?.id ?? "COMP"})`}
          actionCode={auditModal.code}
          confirmLabel="Xác nhận & Ghi Audit Log"
          onConfirm={async () => {
            auditModal.onDone();
            setAuditModal(null);
          }}
        />
      )}
    </div>
  );
}
