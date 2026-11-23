import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  Lock,
  MonitorPlay,
  Plus,
  ShieldAlert,
  Snowflake,
  Trash2,
  Trophy
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CandidateItem {
  id: string;
  code: string;
  name: string;
  audienceVotes: number;
  judgeScore: number;
}

const INITIAL_CANDIDATES: CandidateItem[] = [
  { id: "c-1", code: "01", name: "Mashup Tuổi trẻ FIT (Đội Hát ARTIT)", audienceVotes: 148, judgeScore: 91 },
  { id: "c-2", code: "02", name: "Nhảy Hiện đại Cyber Pulse (Tổ Nhảy ARTIT)", audienceVotes: 162, judgeScore: 88 },
  { id: "c-3", code: "03", name: "Hòa tấu Guitar & Cajon (CLB Acoustic FIT)", audienceVotes: 119, judgeScore: 94 }
];

export function VotingAdminPage(){
  const [candidates, setCandidates] = useState<CandidateItem[]>(INITIAL_CANDIDATES);
  const [campaignLocked, setCampaignLocked] = useState(true); // True = opened / >= 1 ballot -> hard-lock CRUD!
  const [freezeMode, setFreezeMode] = useState(false);
  const [judgeWeight, setJudgeWeight] = useState(60);
  const [newCandName, setNewCandName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [auditModal, setAuditModal] = useState<{
    title: string;
    description: string;
    code: string;
    onDone: () => void;
  } | null>(null);

  const audienceWeight = 100 - judgeWeight;
  const maxVotes = Math.max(1,...candidates.map((c) => c.audienceVotes));

  const ranked = [...candidates]
.map((c) => {
      const normalizedAudience = (c.audienceVotes / maxVotes) * 100;
      const finalScore = (judgeWeight / 100) * c.judgeScore + (audienceWeight / 100) * normalizedAudience;
      return {...c, normalizedAudience, finalScore };
    })
.sort((a, b) => b.finalScore - a.finalScore || b.judgeScore - a.judgeScore);

  const handleAddCandidate = () => {
    setErrorMsg(null);
    if (campaignLocked) {
      setErrorMsg("Chiến dịch đã mở cổng / có lá phiếu bầu — Khóa cứng thêm/sửa/xóa ứng viên.");
      return;
    }
    if (!newCandName.trim()) return;
    setCandidates((prev) => [
...prev,
      {
        id: `c-${Date.now()}`,
        code: String(prev.length + 1).padStart(2, "0"),
        name: newCandName.trim(),
        audienceVotes: 0,
        judgeScore: 85
      }
    ]);
    setNewCandName("");
    setNotice("Đã thêm ứng viên/tiết mục vào danh sách bản nháp.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Điều hành Bình chọn, Biểu quyết &amp; Ban Giám khảo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CRUD ứng viên có khóa cứng khi mở cổng, chấm điểm trọng số BGK + Khán giả và điều khiển Freeze Mode LED
.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/stage/voting">
              <MonitorPlay className="h-4 w-4" />
              <span>LED Đua Top</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={freezeMode ? "default": "outline"}
            onClick={() =>
              setAuditModal({
                title: freezeMode ? "Mở băng & Công bố Kết quả LED": "Bật Chế độ Đóng băng Phút chót (Freeze Mode)",
                description:
                  "Khi đóng băng, màn hình LED công khai ngừng cập nhật số mới trong khi server vẫn tiếp nhận phiếu hợp lệ.",
                code: freezeMode ? "VOTING_UNFREEZE_PUBLISH": "VOTING_FREEZE_MODE_ON",
                onDone: () => {
                  setFreezeMode((v) => !v);
                  setNotice(
                    freezeMode
                      ? "Đã mở băng & công bố kết quả chính thức (đã ghi Audit Log)."
: "Đã bật FREEZE MODE trên màn hình LED công khai (đã ghi Audit Log)."
                  );
                }
              })
            }
          >
            <Snowflake className="h-4 w-4" />
            <span>{freezeMode ? "Đang Đóng băng (Bấm Mở băng)": "Bật Freeze Mode"}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setNotice("Đã xuất Biên bản Kiểm phiếu PDF/Excel kèm bảng điểm từng Giám khảo.")}
          >
            <Download className="h-4 w-4" />
            <span>Biên bản Kiểm phiếu</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-sm text-status-danger">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {errorMsg}
          </span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-xs font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      <Tabs defaultValue="candidates" className="min-h-[460px]">
        <TabsList className="justify-start">
          <TabsTrigger value="candidates">CRUD Ứng viên &amp; Khóa cứng</TabsTrigger>
          <TabsTrigger value="judge">Bảng điểm BGK &amp; Trọng số</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <Lock className={`h-4 w-4 ${campaignLocked ? "text-status-danger": "text-status-success"}`} />
              <span>
                Trạng thái chiến dịch:{" "}
                <strong className="text-foreground">
                  {campaignLocked
                    ? "Đang mở cổng (429 phiếu) — Đã khóa cứng sửa/xóa ứng viên"
: "Bản nháp (0 phiếu) — Cho phép CRUD ứng viên"}
                </strong>
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCampaignLocked((v) => !v)}
            >
              {campaignLocked ? "Mô phỏng Bản nháp (0 phiếu)": "Mô phỏng Đã mở cổng"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách Ứng viên / Tiết mục Biểu diễn</CardTitle>
              <CardDescription>
                Đồng bộ từ Văn nghệ hoặc nhập trực tiếp. Khóa chỉnh sửa ngay khi phát sinh lá phiếu đầu tiên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newCandName}
                  onChange={(e) => setNewCandName(e.target.value)}
                  disabled={campaignLocked}
                  placeholder={
                    campaignLocked
                      ? "Đã khóa cứng thêm ứng viên khi chiến dịch đang mở cổng..."
: "Nhập tên tiết mục / ứng viên mới..."
                  }
                />
                <Button type="button" disabled={campaignLocked || !newCandName.trim()} onClick={handleAddCandidate}>
                  <Plus className="h-4 w-4" />
                  <span>Thêm</span>
                </Button>
              </div>

              <div className="space-y-2">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Badge variant="outline" className="tabular-mono">
                        #{c.code}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-mono text-xs text-muted-foreground">{c.audienceVotes} phiếu KG</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={campaignLocked}
                        className="text-brand-crimson hover:bg-brand-crimson/10"
                        onClick={() => setCandidates((prev) => prev.filter((x) => x.id !== c.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judge" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Chấm điểm Ban Giám khảo &amp; Công thức Trọng số (`VOTING_JUDGE_SCORES`)</span>
                </CardTitle>
                <CardDescription>
                  Đồng điểm ưu tiên điểm trung bình BGK cao hơn. Trọng số luôn cộng đủ 100%.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="judge-weight" className="text-xs whitespace-nowrap">
                  Trọng số BGK (%):
                </Label>
                <Input
                  id="judge-weight"
                  type="number"
                  min={0}
                  max={100}
                  value={judgeWeight}
                  onChange={(e) => setJudgeWeight(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="h-8 w-20 tabular-mono"
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
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={idx === 0 ? "success": "outline"} className="tabular-mono">
                        Hạng {idx + 1}
                      </Badge>
                      <span className="font-medium text-foreground">{row.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground tabular-mono">
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
                        onChange={(e) => {
                          const score = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setCandidates((prev) =>
                            prev.map((c) => (c.id === row.id ? {...c, judgeScore: score }: c))
                          );
                        }}
                        className="h-8 w-20 tabular-mono"
                      />
                    </div>
                    <div className="rounded-lg bg-primary/12 px-3 py-1 tabular-mono text-sm font-semibold text-primary">
                      Tổng: {row.finalScore.toFixed(2)}đ
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(auditModal)}
        onOpenChange={(o) => !o && setAuditModal(null)}
        title={auditModal?.title ?? ""}
        description={auditModal?.description ?? ""}
        targetSummary="Chiến dịch Bình chọn Đêm Gala FIT 2026"
        actionCode={auditModal?.code ?? "VOTING_AUDIT"}
        destructive={false}
        onConfirm={() => {
          auditModal?.onDone();
          setAuditModal(null);
        }}
      />
    </div>
  );
}
