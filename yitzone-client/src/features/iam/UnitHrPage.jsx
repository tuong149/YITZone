import { useState } from "react";
import { AlertTriangle, CheckCircle2, Megaphone, PackageCheck, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/auth-store";

const INITIAL_MEMBERS = [];
const INITIAL_PROPOSALS = [];

export function UnitHrPage() {
  const activeScopeId = useAuthStore((s) => s.activeScopeId) || "FACULTY";
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
  const [statusModalMember, setStatusModalMember] = useState(null);
  const [nextStatus, setNextStatus] = useState("LEFT");
  const [announcementText, setAnnouncementText] = useState("");
  const [notice, setNotice] = useState(null);

  const hasAssetBlocker = Boolean(
    statusModalMember &&
      nextStatus === "LEFT" &&
      (statusModalMember.unreturnedAssets?.length ?? 0) > 0
  );

  const confirmStatusChange = () => {
    if (!statusModalMember || hasAssetBlocker) return;
    setMembers((prev) =>
      prev.map((m) => (m.id === statusModalMember.id ? { ...m, status: nextStatus } : m))
    );
    setNotice(
      `Đã chuyển ${statusModalMember.fullName} sang trạng thái ${
        nextStatus === "LEFT" ? "Đã rời" : "Tạm nghỉ"
      }, tự động thu hồi quyền đơn vị (≤ 5s), rút ca trực tương lai và gửi cảnh báo ca trống tới Ban Văn phòng.`
    );
    setStatusModalMember(null);
  };

  const memberCols = [
    { key: "code", header: "MSSV", render: (m) => <span className="tabular-mono font-semibold">{m.studentCode}</span> },
    { key: "name", header: "Họ và tên", render: (m) => <span className="font-medium">{m.fullName}</span> },
    { key: "team", header: "Tổ trực thuộc", render: (m) => <span className="text-muted-foreground">{m.team}</span> },
    {
      key: "assets",
      header: "Tài sản VP đang mượn",
      render: (m) =>
        (m.unreturnedAssets?.length ?? 0) > 0 ? (
          <Badge variant="danger">{m.unreturnedAssets.length} thiết bị chưa trả</Badge>
        ) : (
          <Badge variant="success">Không có nợ tài sản</Badge>
        )
    },
    {
      key: "status",
      header: "Vòng đời CTV",
      render: (m) => (
        <Badge
          variant={
            m.status === "ACTIVE" ? "success" : m.status === "ON_LEAVE" ? "warning" : "secondary"
          }
        >
          {m.status === "ACTIVE"
            ? "Đang hoạt động"
            : m.status === "ON_LEAVE"
              ? "Tạm nghỉ"
              : "Đã rời"}
        </Badge>
      )
    },
    {
      key: "action",
      header: "Thao tác",
      align: "right",
      render: (m) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusModalMember(m);
            setNextStatus("LEFT");
          }}
        >
          <UserCog className="h-3.5 w-3.5" />
          Chuyển trạng thái
        </Button>
      )
    }
  ];

  const proposalCols = [
    { key: "proposer", header: "Người đề xuất (Tầng 1–2)", render: (p) => <span className="font-medium">{p.proposer}</span> },
    { key: "action", header: "Nội dung đề xuất", render: (p) => <span>{p.action}</span> },
    { key: "target", header: "Nhân sự liên quan", render: (p) => <span className="tabular-mono text-xs">{p.target}</span> },
    {
      key: "status",
      header: "Phê duyệt (Trưởng Ban)",
      align: "right",
      render: (p) =>
        p.status === "APPROVED" ? (
          <Badge variant="success">Đã phê duyệt</Badge>
        ) : (
          <Button
            size="sm"
            onClick={() =>
              setProposals((prev) =>
                prev.map((x) => (x.id === p.id ? { ...x, status: "APPROVED" } : x))
              )
            }
          >
            Phê duyệt
          </Button>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Nhân sự Nội bộ 3 Tầng &amp; Vòng đời CTV
          </h1>
          <p className="text-sm text-muted-foreground">
            Ranh giới dữ liệu cô lập tuyệt đối theo đơn vị đang chọn (`X-Active-Scope-Id: {activeScopeId}`).
          </p>
        </div>
        <Badge variant="calOffice">Phạm vi cô lập: {activeScopeId}</Badge>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Danh bạ CTV &amp; Bàn giao</TabsTrigger>
          <TabsTrigger value="proposals">Phiếu Đề xuất 3 Tầng</TabsTrigger>
          <TabsTrigger value="announce">Thông báo Triệu tập Nội bộ</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <DataTable columns={memberCols} data={members} />
        </TabsContent>

        <TabsContent value="proposals">
          <DataTable columns={proposalCols} data={proposals} />
        </TabsContent>

        <TabsContent value="announce">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Gửi Thông báo Nội bộ Cô lập theo Đơn vị
              </CardTitle>
              <CardDescription>
                Chỉ gửi tới thành viên trực thuộc phạm vi <strong className="tabular-mono">{activeScopeId}</strong> (không ảnh hưởng 3 Ban còn lại).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="unit-announce">Nội dung triệu tập / thông báo nội bộ</Label>
                <Textarea
                  id="unit-announce"
                  placeholder="Nhập nội dung triệu tập họp hoặc thông báo nội bộ đơn vị..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={!announcementText.trim()}
                onClick={() => {
                  setNotice(`Đã phát thông báo nội bộ tới toàn bộ thành viên trong phạm vi ${activeScopeId}.`);
                  setAnnouncementText("");
                }}
              >
                <Megaphone className="h-4 w-4" />
                Gửi thông báo phạm vi {activeScopeId}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(statusModalMember)}
        onOpenChange={(open) => {
          if (!open) setStatusModalMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển Trạng thái Vòng đời CTV</DialogTitle>
            <DialogDescription>
              Kiểm tra ràng buộc bàn giao tài sản Ban Văn phòng (`OFIT`) trước khi chuyển sang trạng thái Đã rời.
            </DialogDescription>
          </DialogHeader>

          {statusModalMember && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <div className="font-semibold text-foreground">{statusModalMember.fullName}</div>
                <div className="tabular-mono text-xs text-muted-foreground">
                  {statusModalMember.studentCode} · {statusModalMember.team}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ctv-next-status">Trạng thái mục tiêu</Label>
                <Select value={nextStatus} onValueChange={(v) => setNextStatus(v)}>
                  <SelectTrigger id="ctv-next-status" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON_LEAVE">Tạm nghỉ (ON_LEAVE)</SelectItem>
                    <SelectItem value="LEFT">Đã rời đơn vị (LEFT — Thu hồi quyền &amp; rút ca trực)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasAssetBlocker ? (
                <div className="space-y-2 rounded-xl border border-status-danger/40 bg-status-danger/10 p-3.5 text-xs text-status-danger">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Bị chặn 409 Conflict (Edge 34): CTV còn giữ tài sản Văn phòng chưa trả</span>
                  </div>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {(statusModalMember.unreturnedAssets ?? []).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                  <p>Bắt buộc xác nhận trả đồ hoặc bàn giao người chịu trách nhiệm với Ban OFIT trước khi chuyển sang Đã rời.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-status-success/30 bg-status-success/10 p-3 text-xs text-status-success">
                  <PackageCheck className="h-4 w-4 shrink-0" />
                  <span>Không có tài sản VP đang giữ — đủ điều kiện hoàn tất bàn giao.</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalMember(null)}>
              Đóng
            </Button>
            <Button
              variant={nextStatus === "LEFT" ? "destructive" : "default"}
              disabled={hasAssetBlocker}
              onClick={confirmStatusChange}
            >
              Xác nhận chuyển trạng thái
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
