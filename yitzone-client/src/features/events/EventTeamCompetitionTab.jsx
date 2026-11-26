import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Crown,
  MailCheck,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  Video,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeQualifyingStandings,
  formatDurationMMSS,
  INITIAL_COMPETITION_TEAMS,
  MASTERING_IT_META
} from "@/features/competitions/competition-data";
import { useAuthStore } from "@/stores/auth-store";

const ROUND_STEPS = [
  { step: 1, title: "Đăng ký theo Đội", sub: "Thành viên (kể cả ngoài trường) tự đăng ký Email + OTP & xác nhận vào đội", state: "active" },
  { step: 2, title: "Thi Vòng loại Cá nhân", sub: "Các thành viên thi độc lập trên Phòng thi trực tuyến → Cộng/TB điểm đội", state: "upcoming" },
  { step: 3, title: "Chốt Top n vào Vòng sau", sub: "Xác nhận tham dự hoặc đôn đội dự bị kế tiếp", state: "upcoming" },
  { step: 4, title: "Vòng Chung kết Sân khấu", sub: "Chấm điểm Ban Giám khảo theo chặng + Bình chọn khán giả", state: "upcoming" }
];

export function EventTeamCompetitionTab({ event } = {}) {
  const userEmail = useAuthStore((s) => s.email) ?? "";
  const userFullName = useAuthStore((s) => s.fullName) ?? "Thành viên Đội thi";
  const userCode = useAuthStore((s) => s.userId) ?? "";

  const [teams, setTeams] = useState(INITIAL_COMPETITION_TEAMS);
  const [myTeamId, setMyTeamId] = useState("");
  const [subView, setSubView] = useState("team");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [isExternalAccount, setIsExternalAccount] = useState(false);
  const [extSchool, setExtSchool] = useState("");
  const [extStudentCode, setExtStudentCode] = useState("");
  const [extMajor, setExtMajor] = useState("");
  const [notice, setNotice] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [confirmWithdrawOpen, setConfirmWithdrawOpen] = useState(false);

  const maxTeamSize = event?.maxTeamSize ?? MASTERING_IT_META?.maxTeamSize ?? 5;
  const qualifyTopN = event?.qualifyTopN ?? MASTERING_IT_META?.qualifyTopN ?? 5;
  const rosterLockLabel = event?.lockNote || MASTERING_IT_META?.rosterLockAt || "Theo lịch Ban Tổ chức";
  const confirmDeadlineLabel = MASTERING_IT_META?.confirmDeadline || "Theo thông báo Ban Tổ chức";
  const examLink = event?.examPath ?? "/exams";

  const myTeam = useMemo(() => {
    if (myTeamId) {
      const byId = teams.find((t) => t.id === myTeamId);
      if (byId) return byId;
    }
    if (userEmail) {
      const byEmail = teams.find((t) =>
        (t.members ?? []).some((m) => m.email?.toLowerCase() === userEmail.toLowerCase())
      );
      if (byEmail) return byEmail;
    }
    return null;
  }, [teams, myTeamId, userEmail]);

  const standings = useMemo(
    () => computeQualifyingStandings(teams, "SUM_OF_MEMBERS", "ZERO_MEMBER_SCORE", qualifyTopN),
    [teams, qualifyTopN]
  );

  const myStanding = useMemo(
    () => (myTeam ? standings.find((s) => s.team.id === myTeam.id) : undefined),
    [standings, myTeam]
  );

  const teamMembers = myTeam?.members ?? [];
  const uteCount = teamMembers.filter((m) => !m.isExternal).length;
  const externalCount = teamMembers.length - uteCount;

  const handleCopyJoinCode = () => {
    if (!myTeam?.joinCode) return;
    void navigator.clipboard?.writeText(myTeam.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleJoinByCode = () => {
    setErrorMsg(null);
    setNotice(null);
    const normalized = joinCodeInput.trim().toUpperCase();
    if (!normalized) {
      setErrorMsg("Vui lòng nhập mã mời đội gồm 8 ký tự do Đội trưởng cung cấp.");
      return;
    }

    const target = teams.find((t) => t.joinCode?.toUpperCase() === normalized);
    if (!target) {
      setErrorMsg(`Không tìm thấy đội thi với mã mời "${normalized}".`);
      return;
    }

    if (userEmail) {
      const existingActiveTeam = teams.find(
        (t) =>
          ["DRAFT", "SUBMITTED", "WAITLISTED", "APPROVED"].includes(t.status) &&
          (t.members ?? []).some((m) => m.email?.toLowerCase() === userEmail.toLowerCase())
      );
      if (existingActiveTeam) {
        setErrorMsg(
          `Không thể tham gia "${target.teamName}": Tài khoản của bạn đang thuộc đội "${existingActiveTeam.teamName}" (${existingActiveTeam.teamCode}).`
        );
        return;
      }
    }

    if ((target.members ?? []).length >= maxTeamSize) {
      setErrorMsg(`Đội "${target.teamName}" đã đủ ${maxTeamSize}/${maxTeamSize} thành viên xác nhận.`);
      return;
    }

    if (isExternalAccount && (!extSchool.trim() || !extStudentCode.trim())) {
      setErrorMsg("Vui lòng nhập đầy đủ Tên trường và MSSV trường ngoài.");
      return;
    }

    const newMember = {
      userId: userCode || `u-${Date.now()}`,
      fullName: userFullName,
      email: userEmail || "member@student.edu.vn",
      role: "MEMBER",
      isExternal: isExternalAccount,
      studentCode: isExternalAccount ? extStudentCode.trim() : userCode || "HCM-UTE",
      schoolName: isExternalAccount ? extSchool.trim() : "ĐH Sư phạm Kỹ thuật TP.HCM (HCM-UTE)",
      facultyMajor: isExternalAccount ? extMajor.trim() || "Ngoài trường" : "Khoa Công nghệ Thông tin",
      otpVerified: true,
      confirmedAt: "Vừa xong",
      qualRawScore: 0,
      qualDurationSec: 0,
      qualViolations: 0,
      qualDisqualified: false,
      participated: false
    };

    setTeams((prev) =>
      prev.map((t) => (t.id === target.id ? { ...t, members: [...(t.members ?? []), newMember] } : t))
    );
    setMyTeamId(target.id);
    setJoinCodeInput("");
    setSubView("team");
    setNotice(`Đã xác nhận tham gia đội "${target.teamName}" thành công.`);
  };

  const handleCreateDraftTeam = () => {
    setErrorMsg(null);
    setNotice(null);
    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      setErrorMsg("Vui lòng nhập tên đội thi trước khi khởi tạo.");
      return;
    }
    if (myTeam && ["DRAFT", "SUBMITTED", "WAITLISTED", "APPROVED"].includes(myTeam.status)) {
      setErrorMsg(
        `Tài khoản hiện đang thuộc đội "${myTeam.teamName}" (${myTeam.teamCode}). Mỗi tài khoản chỉ tham gia 01 đội trong cùng sự kiện.`
      );
      return;
    }

    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const joinCode = `TEAM${suffix}`.slice(0, 8);
    const newId = `team-${Date.now()}`;
    const createdTeam = {
      id: newId,
      teamCode: `T-${String(teams.length + 1).padStart(2, "0")}`,
      teamName: trimmedName,
      joinCode,
      status: "DRAFT",
      advancementStatus: "PENDING",
      members: [
        {
          userId: userCode || `u-${Date.now()}`,
          fullName: userFullName,
          email: userEmail || "leader@student.hcmute.edu.vn",
          role: "LEADER",
          isExternal: false,
          studentCode: userCode || "HCM-UTE",
          schoolName: "ĐH Sư phạm Kỹ thuật TP.HCM (HCM-UTE)",
          facultyMajor: "Khoa Công nghệ Thông tin",
          otpVerified: true,
          confirmedAt: "Vừa xong",
          qualRawScore: 0,
          qualDurationSec: 0,
          qualViolations: 0,
          qualDisqualified: false,
          participated: false
        }
      ]
    };

    setTeams((prev) => [...prev, createdTeam]);
    setMyTeamId(newId);
    setNewTeamName("");
    setSubView("team");
    setNotice(
      `Đã khởi tạo đội bản nháp "${trimmedName}" (Mã mời: ${joinCode}). Chia sẻ mã mời để các thành viên xác nhận tham gia.`
    );
  };

  const handleConfirmFinals = (decision) => {
    if (!myTeam) return;
    setErrorMsg(null);
    setTeams((prev) =>
      prev.map((t) => (t.id === myTeam.id ? { ...t, advancementStatus: decision } : t))
    );
    setNotice(
      decision === "CONFIRMED"
        ? `Đội ${myTeam.teamName} đã xác nhận tham dự Đêm Chung kết.`
        : `Đội ${myTeam.teamName} đã báo rút lui khỏi Chung kết; BTC sẽ đôn đội dự bị kế tiếp.`
    );
  };

  const handleSubmitIntroVideo = () => {
    if (!myTeam) return;
    setErrorMsg(null);
    const trimmed = videoUrlInput.trim();
    if (!trimmed || (!trimmed.startsWith("http://") && !trimmed.startsWith("https://"))) {
      setErrorMsg("Vui lòng nhập đường dẫn video hợp lệ (YouTube, Google Drive hoặc liên kết bắt đầu bằng https://).");
      return;
    }
    setTeams((prev) =>
      prev.map((t) =>
        t.id === myTeam.id
          ? {
              ...t,
              introVideo: {
                url: trimmed,
                submittedAt: "Vừa xong",
                status: "PENDING_REVIEW",
                bgkVideoScore: t.introVideo?.bgkVideoScore ?? 0
              }
            }
          : t
      )
    );
    setNotice("Đã nộp Video giới thiệu đội thành công — đang chờ BTC duyệt để đưa lên Cổng Bình chọn Chung kết.");
  };

  return (
    <div className="space-y-4">
      {/* 4-Step Compact Lifecycle Strip */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {ROUND_STEPS.map((s) => (
          <div
            key={s.step}
            className={`rounded-2xl border p-3.5 ${
              s.state === "active"
                ? "border-primary bg-primary/5"
                : s.state === "done"
                  ? "border-status-success/30 bg-card"
                  : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="tabular-mono text-[11px] font-semibold text-muted-foreground">
                BƯỚC {s.step}/4
              </span>
              {s.state === "done" ? (
                <Badge variant="success">Xong</Badge>
              ) : s.state === "active" ? (
                <Badge variant="default">
                  <Clock className="h-3 w-3" />
                  <span>Đang mở</span>
                </Badge>
              ) : (
                <Badge variant="secondary">Sắp tới</Badge>
              )}
            </div>
            <div className="mt-1.5 font-display text-sm font-medium text-foreground">{s.title}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sub-navigation pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex flex-wrap gap-1.5 rounded-full border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setSubView("team")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              subView === "team"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đội của tôi {myTeam ? `(${teamMembers.length}/${maxTeamSize} SV)` : ""}
          </button>
          <button
            type="button"
            onClick={() => setSubView("ranking")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              subView === "ranking"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            BXH Vòng loại &amp; Top {qualifyTopN}
          </button>
          <button
            type="button"
            onClick={() => setSubView("join")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              subView === "join"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tạo / Tham gia Đội
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={examLink}>
              <BookOpenCheck className="h-3.5 w-3.5" />
              <span>Thi Vòng loại</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/voting">
              <Vote className="h-3.5 w-3.5" />
              <span>Bình chọn CK</span>
            </Link>
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-xs font-medium text-status-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-xs font-medium text-status-danger">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button type="button" onClick={() => setErrorMsg(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      {subView === "team" && (
        !myTeam ? (
          <Card className="rounded-[20px] border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-display text-lg font-medium text-foreground">
                  Bạn chưa tham gia đội thi nào
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Khởi tạo đội thi mới để nhận mã mời 8 ký tự cho đồng đội hoặc nhập mã mời từ Đội trưởng để xác nhận tham gia.
                </p>
              </div>
              <Button
                type="button"
                className="liquid-glass-btn-cobalt mt-1 rounded-full px-5"
                onClick={() => setSubView("join")}
              >
                <UserPlus className="h-4 w-4" />
                <span>Tạo hoặc Tham gia Đội thi</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="rounded-[20px]">
              <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{myTeam.teamName}</CardTitle>
                    <Badge variant="outline" className="tabular-mono">
                      {myTeam.teamCode}
                    </Badge>
                    <Badge variant={myTeam.status === "APPROVED" ? "success" : "secondary"}>
                      {myTeam.status === "APPROVED"
                        ? `Đã duyệt (${teamMembers.length}/${maxTeamSize} SV)`
                        : `Bản nháp (${teamMembers.length}/${maxTeamSize} SV)`}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    Đội hình: {uteCount} SV HCM-UTE · {externalCount} SV Ngoài trường · Khóa đổi thành viên:{" "}
                    <span className="tabular-mono">{rosterLockLabel}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Mã mời:</span>
                  <span className="tabular-mono text-sm font-semibold text-foreground">{myTeam.joinCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyJoinCode}
                    aria-label="Sao chép mã mời đội"
                    className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </button>
                  {copiedCode && <span className="text-xs text-status-success">Đã chép</span>}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5">Thành viên</th>
                        <th className="px-4 py-2.5">Trường / Mã SV</th>
                        <th className="px-4 py-2.5">Xác thực</th>
                        <th className="px-4 py-2.5 text-right">Điểm Vòng loại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {teamMembers.map((m) => (
                        <tr key={m.userId} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{m.fullName}</span>
                              {m.role === "LEADER" && (
                                <Badge variant="default">
                                  <Crown className="h-3 w-3" />
                                  <span>Đội trưởng</span>
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.email}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={m.isExternal ? "warning" : "info"}>
                                <Building2 className="h-3 w-3" />
                                <span>{m.isExternal ? "Ngoài trường" : "HCM-UTE"}</span>
                              </Badge>
                              <span className="tabular-mono text-xs text-muted-foreground">{m.studentCode}</span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{m.schoolName}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="success">
                              <MailCheck className="h-3 w-3" />
                              <span>Email + OTP</span>
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="tabular-mono font-semibold text-foreground">{m.qualRawScore}/100</span>
                            <div className="tabular-mono text-xs text-muted-foreground">
                              {formatDurationMMSS(m.qualDurationSec)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Finals Confirmation + Mixed E-Cert / Benefits Notice */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-[20px] border-primary/30 bg-primary/5">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="info">
                      <Trophy className="h-3 w-3" />
                      <span>
                        {myStanding ? `Hạng Vòng loại #${myStanding.rank}` : "Trạng thái Vòng Chung kết"}
                      </span>
                    </Badge>
                    <span className="tabular-mono text-xs font-semibold text-foreground">
                      {myStanding?.aggregatedScore ?? 0}/{maxTeamSize * 100}đ
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Hạn xác nhận tham dự Chung kết:{" "}
                    <strong className="tabular-mono text-foreground">{confirmDeadlineLabel}</strong>. Trạng thái:{" "}
                    <strong className="text-foreground">
                      {myTeam.advancementStatus === "CONFIRMED"
                        ? "Đã xác nhận"
                        : myTeam.advancementStatus === "WITHDRAWN"
                          ? "Đã rút lui"
                          : "Chờ kết quả / xác nhận"}
                    </strong>
                    .
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleConfirmFinals("CONFIRMED")}
                      disabled={myTeam.advancementStatus === "CONFIRMED"}
                    >
                      Xác nhận Chung kết
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setConfirmWithdrawOpen(true)}
                      disabled={myTeam.advancementStatus === "WITHDRAWN"}
                    >
                      Rút lui
                    </Button>
                  </div>

                  {/* Top X Deliverable / Intro Video Submission */}
                  <div className="space-y-2 border-t border-border/70 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Video className="h-3.5 w-3.5 text-primary" />
                        <span>Nộp Video Giới thiệu Đội</span>
                      </span>
                      <Badge
                        variant={
                          myTeam.introVideo?.status === "APPROVED"
                            ? "success"
                            : myTeam.introVideo?.status === "PENDING_REVIEW"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {myTeam.introVideo?.status === "APPROVED"
                          ? "Đã duyệt · Đã lên Cổng Bình chọn"
                          : myTeam.introVideo?.status === "PENDING_REVIEW"
                            ? "Chờ BTC duyệt"
                            : "Chưa nộp"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://youtu.be/... hoặc link Google Drive"
                        className="h-8 flex-1 rounded-lg bg-card text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg px-3 text-xs"
                        onClick={handleSubmitIntroVideo}
                      >
                        Nộp / Cập nhật
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[20px]">
                <CardContent className="space-y-2.5 p-4 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Award className="h-4 w-4 text-primary" />
                      Quyền lợi &amp; E-Cert Đội hỗn hợp
                    </span>
                    <VerifiedBadge label="QR trọn đời" />
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">E-Certificate:</strong> Cấp đủ cho toàn bộ thành viên hợp lệ trong đội (ghi Tên đội + Giải thưởng, kể cả SV ngoài trường).
                  </p>
                  <p className="flex items-start gap-1.5 leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-success" />
                    <span>
                      <strong className="text-foreground">Cộng ĐRL / CĐDN:</strong> Tự động ghi nhận cho{" "}
                      <strong>{uteCount} SV HCM-UTE</strong>, bỏ qua an toàn với {externalCount} SV ngoài trường.
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      )}

      {subView === "ranking" && (
        <Card className="rounded-[20px]">
          <CardHeader className="border-b border-border/70 pb-3">
            <CardTitle className="text-lg">
              Bảng xếp hạng Vòng loại — Lấy Top {qualifyTopN} vào Chung kết
            </CardTitle>
            <CardDescription>
              Các thành viên thi cá nhân độc lập trên Phòng thi trực tuyến → Cộng tổng điểm đội (bằng điểm xét tổng thời gian ngắn hơn).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Hạng</th>
                    <th className="px-4 py-2.5">Đội thi</th>
                    <th className="px-4 py-2.5 text-right">Tổng điểm</th>
                    <th className="px-4 py-2.5 text-right">TB/SV</th>
                    <th className="px-4 py-2.5">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {standings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        Chưa có dữ liệu bảng xếp hạng đội thi cho vòng loại.
                      </td>
                    </tr>
                  ) : (
                    standings.map((row) => (
                      <tr
                        key={row.team.id}
                        className={row.team.id === myTeam?.id ? "bg-primary/5" : "hover:bg-muted/30"}
                      >
                        <td className="px-4 py-2.5 tabular-mono font-semibold">#{row.rank}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-foreground">{row.team.teamName}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.validMemberCount}/{maxTeamSize} bài hợp lệ · {formatDurationMMSS(row.totalDurationSec)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-mono font-semibold">
                          {row.aggregatedScore}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-mono text-muted-foreground">
                          {(row.aggregatedScore / Math.max(1, maxTeamSize)).toFixed(1)}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.team.advancementStatus === "CONFIRMED" ? (
                            <Badge variant="success">Đã XN Chung kết</Badge>
                          ) : row.rank <= qualifyTopN ? (
                            <Badge variant="default">Top {qualifyTopN} · Chờ XN</Badge>
                          ) : (
                            <Badge variant="warning">Dự bị (Standby)</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {subView === "join" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base">Tham gia Đội bằng Mã mời</CardTitle>
              <CardDescription>
                Mọi thành viên (kể cả SV ngoài trường) tự đăng nhập tài khoản Email + OTP và xác nhận vào đội.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="evt-join-code">Mã mời đội (8 ký tự)</Label>
                <Input
                  id="evt-join-code"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="Nhập mã mời từ Đội trưởng"
                  className="tabular-mono uppercase"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={isExternalAccount}
                  onChange={(e) => setIsExternalAccount(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span>Tôi là sinh viên ngoài trường HCM-UTE</span>
              </label>
              {isExternalAccount && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/35 p-3">
                  <Input
                    value={extSchool}
                    onChange={(e) => setExtSchool(e.target.value)}
                    placeholder="Tên trường Đại học / Cao đẳng"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={extStudentCode}
                      onChange={(e) => setExtStudentCode(e.target.value)}
                      placeholder="MSSV trường ngoài"
                      className="tabular-mono"
                    />
                    <Input
                      value={extMajor}
                      onChange={(e) => setExtMajor(e.target.value)}
                      placeholder="Khoa / Ngành"
                    />
                  </div>
                </div>
              )}
              <Button type="button" onClick={handleJoinByCode} className="w-full rounded-full">
                <UserPlus className="h-4 w-4" />
                <span>Xác nhận vào đội</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base">Tạo Đội thi Mới (Đội trưởng)</CardTitle>
              <CardDescription>
                Đủ số thành viên tự xác nhận mới mở nút Nộp đăng ký; mỗi tài khoản chỉ thuộc 01 đội trong cùng sự kiện.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="evt-team-name">Tên đội thi</Label>
                <Input
                  id="evt-team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Nhập tên đội thi..."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateDraftTeam}
                className="w-full rounded-full"
              >
                <Users className="h-4 w-4" />
                <span>Tạo đội bản nháp &amp; lấy Mã mời</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={confirmWithdrawOpen} onOpenChange={setConfirmWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
              <AlertTriangle className="h-5 w-5 text-status-warning" />
              <span>Xác nhận rút lui khỏi Vòng Chung kết?</span>
            </DialogTitle>
            <DialogDescription>
              Đội <strong className="text-foreground">{myTeam?.teamName ?? ""}</strong> đang xác nhận rút lui. Ban Tổ chức sẽ đôn đội dự bị kế tiếp lên thay thế.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setConfirmWithdrawOpen(false)}
            >
              Giữ suất Chung kết
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={() => {
                handleConfirmFinals("WITHDRAWN");
                setConfirmWithdrawOpen(false);
              }}
            >
              Xác nhận rút lui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
