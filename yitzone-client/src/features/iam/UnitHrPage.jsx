import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Megaphone, PackageCheck, Plus, UserCog } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  changeCtvStatus,
  createHrProposal,
  reviewHrProposal,
  sendUnitAnnouncement,
  useHrProposals,
  useUnitMembers
} from "./api";

export function UnitHrPage() {
  const activeScopeId = useAuthStore((s) => s.activeScopeId) || "EMFIT";
  const effectiveUnitId = activeScopeId === "FACULTY" ? "EMFIT" : activeScopeId;

  const {
    data: members = [],
    isLoading: loadingMembers,
    error: membersError,
    refetch: refetchMembers
  } = useUnitMembers(effectiveUnitId);

  const {
    data: proposals = [],
    isLoading: loadingProposals,
    refetch: refetchProposals
  } = useHrProposals(effectiveUnitId);

  const [statusModalMember, setStatusModalMember] = useState(null);
  const [nextStatus, setNextStatus] = useState("LEFT");
  const [handoverAssignee, setHandoverAssignee] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [proposalTarget, setProposalTarget] = useState("");
  const [proposalType, setProposalType] = useState("ONBOARD_CTV");
  const [proposalTransferUnit, setProposalTransferUnit] = useState("");
  const [proposalReason, setProposalReason] = useState("");
  const [proposalSubmitting, setProposalSubmitting] = useState(false);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [announceSubmitting, setAnnounceSubmitting] = useState(false);

  const [notice, setNotice] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const hasAssetBlocker = Boolean(
    statusModalMember &&
      nextStatus === "LEFT" &&
      (statusModalMember.unreturnedAssets?.length ?? 0) > 0 &&
      !handoverAssignee.trim()
  );

  const confirmStatusChange = async () => {
    if (!statusModalMember || hasAssetBlocker) return;
    setStatusSubmitting(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const res = await changeCtvStatus(effectiveUnitId, statusModalMember.id, {
        targetStatus: nextStatus,
        handoverAssigneeUserId: handoverAssignee.trim() || null,
        reason: statusReason.trim() || `Chuyển trạng thái CTV sang ${nextStatus}`
      });
      void refetchMembers();
      setNotice(
        `Đã chuyển ${statusModalMember.fullName} sang ${nextStatus === "LEFT" ? "Đã rời" : "Tạm nghỉ"} (rút ${res.removedFutureShifts} ca trực tương lai, bàn giao ${res.handedOverAssets} tài sản, thu hồi quyền ≤ 5s).`
      );
      setStatusModalMember(null);
      setHandoverAssignee("");
      setStatusReason("");
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err, "Không thể chuyển trạng thái CTV."));
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!proposalTarget.trim()) return;
    setProposalSubmitting(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      await createHrProposal(effectiveUnitId, {
        targetIdentifier: proposalTarget.trim(),
        proposalType,
        targetTransferUnitId: proposalType === "TRANSFER_TEAM" ? proposalTransferUnit.trim() : null,
        reason: proposalReason.trim() || "Đề xuất nhân sự đơn vị"
      });
      setProposalTarget("");
      setProposalTransferUnit("");
      setProposalReason("");
      void refetchProposals();
      setNotice("Đã gửi phiếu đề xuất nhân sự vào hàng chờ phê duyệt.");
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err, "Không thể tạo phiếu đề xuất nhân sự."));
    } finally {
      setProposalSubmitting(false);
    }
  };

  const handleReviewProposal = async (proposalId, approved) => {
    setErrorMsg(null);
    setNotice(null);
    try {
      await reviewHrProposal(effectiveUnitId, proposalId, {
        approved,
        reviewNote: approved ? "Đã phê duyệt theo thẩm quyền" : "Từ chối đề xuất"
      });
      void refetchProposals();
      void refetchMembers();
      setNotice(approved ? "Đã phê duyệt phiếu đề xuất và cập nhật nhân sự." : "Đã từ chối phiếu đề xuất.");
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err, "Không đủ thẩm quyền phê duyệt phiếu đề xuất này."));
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setAnnounceSubmitting(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const res = await sendUnitAnnouncement(effectiveUnitId, {
        title: announcementTitle.trim() || undefined,
        content: announcementText.trim()
      });
      setAnnouncementTitle("");
      setAnnouncementText("");
      setNotice(`Đã phát thông báo nội bộ tới ${res.recipientCount} thành viên thuộc phạm vi ${res.unitId}.`);
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err, "Không thể gửi thông báo nội bộ cho đơn vị này."));
    } finally {
      setAnnounceSubmitting(false);
    }
  };

  const memberCols = [
    { key: "code", header: "MSSV", render: (m) => <span className="tabular-mono font-semibold">{m.studentCode || "—"}</span> },
    { key: "name", header: "Họ và tên", render: (m) => <span className="font-medium">{m.fullName}</span> },
    { key: "team", header: "Đơn vị trực thuộc", render: (m) => <span className="text-muted-foreground">{m.unitName || m.unitId}</span> },
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
            setHandoverAssignee("");
            setStatusReason("");
          }}
        >
          <UserCog className="h-3.5 w-3.5" />
          Chuyển trạng thái
        </Button>
      )
    }
  ];

  const proposalCols = [
    { key: "proposer", header: "Người đề xuất", render: (p) => <span className="font-medium">{p.proposerName || p.proposedBy}</span> },
    { key: "action", header: "Loại đề xuất", render: (p) => <Badge variant="secondary">{p.proposalType}</Badge> },
    { key: "target", header: "Nhân sự liên quan", render: (p) => <span className="tabular-mono text-xs">{p.targetSummary}</span> },
    { key: "reason", header: "Lý do", render: (p) => <span className="text-xs text-muted-foreground">{p.reason || "—"}</span> },
    {
      key: "status",
      header: "Phê duyệt",
      align: "right",
      render: (p) =>
        p.status === "APPROVED" ? (
          <Badge variant="success">Đã phê duyệt</Badge>
        ) : p.status === "REJECTED" ? (
          <Badge variant="danger">Đã từ chối</Badge>
        ) : (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" onClick={() => void handleReviewProposal(p.id, false)}>
              Từ chối
            </Button>
            <Button size="sm" onClick={() => void handleReviewProposal(p.id, true)}>
              Phê duyệt
            </Button>
          </div>
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
            Ranh giới dữ liệu cô lập tuyệt đối theo đơn vị đang chọn (`X-Active-Scope-Id: {effectiveUnitId}`).
          </p>
        </div>
        <Badge variant="calOffice">Phạm vi cô lập: {effectiveUnitId}</Badge>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-xs font-medium text-status-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Danh bạ CTV &amp; Bàn giao ({members.length})</TabsTrigger>
          <TabsTrigger value="proposals">Phiếu Đề xuất 3 Tầng ({proposals.length})</TabsTrigger>
          <TabsTrigger value="announce">Thông báo Triệu tập Nội bộ</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <DataTable
            columns={memberCols}
            data={members}
            loading={loadingMembers}
            error={membersError ? extractApiErrorMessage(membersError, "Không thể tải danh bạ đơn vị (kiểm tra phạm vi 403).") : null}
            onRetry={() => void refetchMembers()}
          />
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />
                Tạo Phiếu Đề xuất Nhân sự (Tổ phó / Phó Ban / Tổ trưởng)
              </CardTitle>
              <CardDescription>
                Phiếu đề xuất sẽ được gửi tới cấp có thẩm quyền trong đơn vị {effectiveUnitId} để phê duyệt và ghi Audit Log.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleCreateProposal(e)} className="grid gap-3 md:grid-cols-12">
                <div className="space-y-1 md:col-span-3">
                  <Label htmlFor="prop-target" className="text-xs">MSSV hoặc Email CTV</Label>
                  <Input
                    id="prop-target"
                    value={proposalTarget}
                    onChange={(e) => setProposalTarget(e.target.value)}
                    placeholder="22110123"
                    className="h-9 rounded-xl tabular-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label htmlFor="prop-type" className="text-xs">Loại đề xuất</Label>
                  <Select value={proposalType} onValueChange={setProposalType}>
                    <SelectTrigger id="prop-type" className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONBOARD_CTV">Tiếp nhận CTV mới</SelectItem>
                      <SelectItem value="TRANSFER_TEAM">Điều chuyển Tổ trong Ban</SelectItem>
                      <SelectItem value="CHANGE_MEMBER_STATUS">Đổi trạng thái CTV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {proposalType === "TRANSFER_TEAM" && (
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="prop-dest" className="text-xs">Mã Tổ đích</Label>
                    <Input
                      id="prop-dest"
                      value={proposalTransferUnit}
                      onChange={(e) => setProposalTransferUnit(e.target.value)}
                      placeholder="EMFIT_VH"
                      className="h-9 rounded-xl tabular-mono text-xs"
                      required
                    />
                  </div>
                )}
                <div className={`space-y-1 ${proposalType === "TRANSFER_TEAM" ? "md:col-span-2" : "md:col-span-4"}`}>
                  <Label htmlFor="prop-reason" className="text-xs">Lý do đề xuất</Label>
                  <Input
                    id="prop-reason"
                    value={proposalReason}
                    onChange={(e) => setProposalReason(e.target.value)}
                    placeholder="Ghi rõ lý do..."
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="flex items-end md:col-span-2">
                  <Button type="submit" size="sm" className="h-9 w-full rounded-xl" disabled={proposalSubmitting}>
                    {proposalSubmitting ? "Đang gửi..." : "Gửi đề xuất"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <DataTable columns={proposalCols} data={proposals} loading={loadingProposals} />
        </TabsContent>

        <TabsContent value="announce">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Gửi Thông báo Nội bộ Cô lập theo Đơn vị
              </CardTitle>
              <CardDescription>
                Chỉ gửi tới thành viên trực thuộc phạm vi <strong className="tabular-mono">{effectiveUnitId}</strong> (không ảnh hưởng 3 Ban còn lại).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="unit-announce-title">Tiêu đề thông báo (tùy chọn)</Label>
                <Input
                  id="unit-announce-title"
                  placeholder={`[Triệu tập nội bộ ${effectiveUnitId}] ...`}
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                />
              </div>
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
                disabled={!announcementText.trim() || announceSubmitting}
                onClick={() => void handleSendAnnouncement()}
              >
                <Megaphone className="h-4 w-4" />
                {announceSubmitting ? "Đang gửi..." : `Gửi thông báo phạm vi ${effectiveUnitId}`}
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
                  {statusModalMember.studentCode || statusModalMember.email} · {statusModalMember.unitName || statusModalMember.unitId}
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

              {(statusModalMember.unreturnedAssets?.length ?? 0) > 0 && nextStatus === "LEFT" ? (
                <div className="space-y-2 rounded-xl border border-status-danger/40 bg-status-danger/10 p-3.5 text-xs text-status-danger">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Cảnh báo 409 Conflict (Edge 34): CTV còn giữ tài sản Văn phòng chưa trả</span>
                  </div>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {(statusModalMember.unreturnedAssets ?? []).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                  <div className="space-y-1 pt-1 text-foreground">
                    <Label htmlFor="handover-user" className="text-xs">ID người nhận bàn giao tài sản (nếu chuyển trách nhiệm)</Label>
                    <Input
                      id="handover-user"
                      value={handoverAssignee}
                      onChange={(e) => setHandoverAssignee(e.target.value)}
                      placeholder="Nhập userId cán bộ nhận bàn giao..."
                      className="h-9 bg-background text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-status-success/30 bg-status-success/10 p-3 text-xs text-status-success">
                  <PackageCheck className="h-4 w-4 shrink-0" />
                  <span>Không có tài sản VP đang giữ — đủ điều kiện hoàn tất bàn giao.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="ctv-reason" className="text-xs">Lý do chuyển trạng thái (ghi Audit Log)</Label>
                <Input
                  id="ctv-reason"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="VD: Xin nghỉ tập trung đồ án tốt nghiệp..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalMember(null)}>
              Đóng
            </Button>
            <Button
              variant={nextStatus === "LEFT" ? "destructive" : "default"}
              disabled={hasAssetBlocker || statusSubmitting}
              onClick={() => void confirmStatusChange()}
            >
              {statusSubmitting ? "Đang xử lý..." : "Xác nhận chuyển trạng thái"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
