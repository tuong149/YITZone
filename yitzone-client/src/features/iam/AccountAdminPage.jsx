import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserCog,
  Users
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  createAccount,
  resetAccountPassword,
  updateAccountStatus,
  useAccounts
} from "./api";

const USER_TYPE_LABELS = {
  STUDENT: "Sinh viên",
  STAFF_LECTURER: "Giảng viên / Cán bộ",
  GRAD_SECOND_DEGREE: "Học viên SĐH / VB2",
  TEMP_GUEST: "Khách mời tạm thời"
};

const LIFECYCLE_LABELS = {
  ACTIVE_STUDY: "Đang hoạt động",
  GRADUATED: "Đã tốt nghiệp",
  ARCHIVED: "Lưu trữ"
};

const ROLE_LABELS = {
  STANDING_COMMITTEE: "Ban Thường vụ",
  EXECUTIVE_COMMITTEE: "Ban Chấp hành",
  COMMITTEE_HEAD: "Trưởng ban",
  VICE_COMMITTEE_HEAD: "Phó ban",
  TEAM_LEADER: "Tổ trưởng",
  DEPUTY_TEAM_LEADER: "Tổ phó",
  COLLABORATOR: "Cộng tác viên",
  SYSTEM_ADMIN: "Quản trị hệ thống"
};

export function AccountAdminPage() {
  const currentUserId = useAuthStore((s) => s.userId);

  const [search, setSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState(null);

  // Create account dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newStudentCode, setNewStudentCode] = useState("");
  const [newUserType, setNewUserType] = useState("STUDENT");
  const [newRoleCode, setNewRoleCode] = useState("NONE");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Lock/Unlock audit dialog state
  const [lockTarget, setLockTarget] = useState(null);

  // Reset password dialog state
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetting, setResetting] = useState(false);

  const {
    data: apiAccounts,
    isLoading,
    isFetching,
    refetch
  } = useAccounts({
    search: search.trim(),
    userType: userTypeFilter,
    status: statusFilter
  });

  const accounts = useMemo(() => (Array.isArray(apiAccounts) ? apiAccounts : []), [apiAccounts]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => !a.locked && a.lifecycleStatus === "ACTIVE_STUDY").length;
    const locked = accounts.filter((a) => a.locked).length;
    const secured = accounts.filter((a) => a.mfaTotpEnabled || a.googleLinked).length;
    return { total, active, locked, secured };
  }, [accounts]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      setFeedback({ type: "err", text: "Vui lòng nhập đầy đủ Họ tên và Email tài khoản." });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setFeedback({ type: "err", text: "Mật khẩu ban đầu phải có tối thiểu 8 ký tự." });
      return;
    }
    setCreating(true);
    setFeedback(null);
    try {
      const created = await createAccount({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        studentCode: newStudentCode.trim() || null,
        userType: newUserType,
        roleCode: newRoleCode === "NONE" ? null : newRoleCode,
        scopeId: "FACULTY",
        initialPassword: newPassword.trim() || null
      });
      setCreateOpen(false);
      setNewFullName("");
      setNewEmail("");
      setNewStudentCode("");
      setNewUserType("STUDENT");
      setNewRoleCode("NONE");
      setNewPassword("");
      void refetch();
      setFeedback({
        type: "ok",
        text: `Đã tạo tài khoản "${created.fullName}" (${created.email}) thành công.`
      });
    } catch (err) {
      setFeedback({
        type: "err",
        text: extractApiErrorMessage(err, "Không thể tạo tài khoản. Vui lòng kiểm tra thông tin và thử lại.")
      });
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (resetPwd.length < 8) {
      setFeedback({ type: "err", text: "Mật khẩu mới phải có tối thiểu 8 ký tự." });
      return;
    }
    setResetting(true);
    setFeedback(null);
    try {
      await resetAccountPassword(resetTarget.id, {
        newPassword: resetPwd,
        reason: resetReason.trim() || "Quản trị viên đặt lại mật khẩu"
      });
      setResetTarget(null);
      setResetPwd("");
      setResetReason("");
      void refetch();
      setFeedback({
        type: "ok",
        text: `Đã đặt lại mật khẩu cho ${resetTarget.fullName} và thu hồi các phiên đăng nhập cũ.`
      });
    } catch (err) {
      setFeedback({
        type: "err",
        text: extractApiErrorMessage(err, "Không thể đặt lại mật khẩu. Vui lòng thử lại.")
      });
    } finally {
      setResetting(false);
    }
  };

  const columns = [
    {
      key: "account",
      header: "Tài khoản",
      render: (a) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{a.fullName || "Chưa cập nhật"}</span>
            {a.id === currentUserId && (
              <Badge variant="info" className="text-[10px]">
                Bạn
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{a.email}</div>
          {(a.studentCode || a.staffId) && (
            <div className="tabular-mono text-[11px] text-muted-foreground">
              {a.studentCode ? `MSSV: ${a.studentCode}` : `Mã CB: ${a.staffId}`}
            </div>
          )}
        </div>
      )
    },
    {
      key: "role",
      header: "Phân loại & Vai trò",
      render: (a) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{USER_TYPE_LABELS[a.userType] ?? a.userType}</Badge>
          {Array.isArray(a.roles) &&
            a.roles.map((r) => (
              <Badge key={r} variant="secondary">
                {ROLE_LABELS[r] ?? r}
              </Badge>
            ))}
          {a.assignedModuleCount > 0 && (
            <Badge variant="info">+{a.assignedModuleCount} gói quyền</Badge>
          )}
        </div>
      )
    },
    {
      key: "auth",
      header: "Phương thức xác thực",
      render: (a) => (
        <div className="flex flex-wrap gap-1.5">
          {a.googleLinked && <Badge variant="secondary">Google</Badge>}
          {a.hasPassword && <Badge variant="outline">Mật khẩu</Badge>}
          {a.mfaTotpEnabled && (
            <Badge variant="success">
              <ShieldCheck className="h-3 w-3" />
              2FA
            </Badge>
          )}
          {!a.googleLinked && !a.hasPassword && (
            <span className="text-xs text-muted-foreground">Chưa thiết lập</span>
          )}
        </div>
      )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (a) =>
        a.locked ? (
          <Badge variant="danger">
            <Lock className="h-3 w-3" />
            Đang bị khóa
          </Badge>
        ) : (
          <Badge variant={a.lifecycleStatus === "ACTIVE_STUDY" ? "success" : "secondary"}>
            {LIFECYCLE_LABELS[a.lifecycleStatus] ?? a.lifecycleStatus}
          </Badge>
        )
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (a) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResetTarget(a);
              setResetPwd("");
              setResetReason("");
            }}
            title="Đặt lại mật khẩu"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Đổi mật khẩu</span>
          </Button>
          {a.id !== currentUserId && (
            <Button
              variant={a.locked ? "outline" : "destructive"}
              size="sm"
              onClick={() => setLockTarget(a)}
            >
              {a.locked ? (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Mở khóa</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Khóa</span>
                </>
              )}
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản lý Tài khoản
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tra cứu tài khoản người dùng, cấp mới tài khoản nội bộ, đặt lại mật khẩu và khóa/mở khóa truy cập tức thì.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="h-10 rounded-full">
            <Link to="/admin/iam/rbac">
              <UserCog className="h-4 w-4" />
              <span>Phân quyền RBAC</span>
            </Link>
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="h-10 rounded-full">
            <Plus className="h-4 w-4" />
            <span>Tạo tài khoản mới</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng tài khoản</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đang hoạt động</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-status-success">
                {stats.active}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-success/10 text-status-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đang bị khóa</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-status-danger">
                {stats.locked}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-danger/10 text-status-danger">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Google / 2FA</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                {stats.secured}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === "ok"
              ? "border-status-success/30 bg-status-success/10 text-status-success"
              : "border-status-danger/30 bg-status-danger/10 text-status-danger"
          }`}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo họ tên, email hoặc MSSV..."
                className="h-10 rounded-xl pl-10"
              />
            </div>

            <div className="md:col-span-3">
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Phân loại tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả phân loại</SelectItem>
                  <SelectItem value="STUDENT">Sinh viên</SelectItem>
                  <SelectItem value="STAFF_LECTURER">Giảng viên / Cán bộ</SelectItem>
                  <SelectItem value="GRAD_SECOND_DEGREE">Học viên SĐH / VB2</SelectItem>
                  <SelectItem value="TEMP_GUEST">Khách mời tạm thời</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE_STUDY">Đang hoạt động</SelectItem>
                  <SelectItem value="LOCKED">Đang bị khóa</SelectItem>
                  <SelectItem value="GRADUATED">Đã tốt nghiệp</SelectItem>
                  <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end md:col-span-1">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl"
                onClick={() => void refetch()}
                disabled={isFetching}
                title="Làm mới danh sách"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={accounts}
        emptyTitle={isLoading ? "Đang tải danh sách tài khoản..." : "Chưa có tài khoản phù hợp"}
        emptyDescription={
          isLoading
            ? "Vui lòng chờ trong giây lát."
            : "Thử thay đổi bộ lọc tìm kiếm hoặc tạo tài khoản mới."
        }
      />

      {/* Create Account Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản mới</DialogTitle>
            <DialogDescription>
              Tài khoản được tạo từ cổng quản trị sẽ được xác thực email sẵn và có thể đăng nhập ngay.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleCreateSubmit(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="acc-fullname">Họ và tên</Label>
                <Input
                  id="acc-fullname"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="acc-email">Email đăng nhập</Label>
                <Input
                  id="acc-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="VD: 22110123@student.hcmute.edu.vn"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-mssv">MSSV (tùy chọn)</Label>
                <Input
                  id="acc-mssv"
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value)}
                  placeholder="VD: 22110123"
                  className="h-10 rounded-xl tabular-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-type">Phân loại</Label>
                <Select value={newUserType} onValueChange={setNewUserType}>
                  <SelectTrigger id="acc-type" className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Sinh viên</SelectItem>
                    <SelectItem value="STAFF_LECTURER">Giảng viên / Cán bộ</SelectItem>
                    <SelectItem value="GRAD_SECOND_DEGREE">Học viên SĐH / VB2</SelectItem>
                    <SelectItem value="TEMP_GUEST">Khách mời tạm thời</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-role">Vai trò ban đầu</Label>
                <Select value={newRoleCode} onValueChange={setNewRoleCode}>
                  <SelectTrigger id="acc-role" className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Mặc định (Sinh viên)</SelectItem>
                    <SelectItem value="COLLABORATOR">Cộng tác viên</SelectItem>
                    <SelectItem value="EXECUTIVE_COMMITTEE">Ban Chấp hành</SelectItem>
                    <SelectItem value="STANDING_COMMITTEE">Ban Thường vụ</SelectItem>
                    <SelectItem value="SYSTEM_ADMIN">Quản trị hệ thống</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-pwd">Mật khẩu ban đầu (tùy chọn)</Label>
                <Input
                  id="acc-pwd"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={creating} className="rounded-full">
                {creating ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt mật khẩu tạm mới cho <strong>{resetTarget?.fullName}</strong> ({resetTarget?.email}). Các phiên đăng nhập cũ sẽ bị đăng xuất ngay.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-pwd">Mật khẩu mới</Label>
              <Input
                id="reset-pwd"
                type="password"
                required
                minLength={8}
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
                placeholder="Nhập mật khẩu mới (≥ 8 ký tự)"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-reason">Lý do (ghi Audit Log)</Label>
              <Input
                id="reset-reason"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="VD: Hỗ trợ sinh viên quên mật khẩu"
                className="h-10 rounded-xl"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setResetTarget(null)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={resetting} className="rounded-full">
                {resetting ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lock / Unlock Audit Dialog */}
      <AuditActionDialog
        open={Boolean(lockTarget)}
        onOpenChange={(open) => {
          if (!open) setLockTarget(null);
        }}
        title={lockTarget?.locked ? "Mở khóa tài khoản" : "Khóa tài khoản tức thì"}
        description={
          lockTarget?.locked
            ? "Khôi phục quyền đăng nhập và xóa bộ đếm đăng nhập sai cho tài khoản này."
            : "Tài khoản sẽ bị chặn đăng nhập và toàn bộ phiên/quyền đang hoạt động sẽ bị thu hồi ngay lập tức."
        }
        targetSummary={lockTarget ? `${lockTarget.fullName} · ${lockTarget.email}` : ""}
        actionCode={lockTarget?.locked ? "IAM_ACCOUNT_UNLOCK" : "IAM_ACCOUNT_LOCK"}
        confirmLabel={lockTarget?.locked ? "Mở khóa tài khoản" : "Khóa ngay & Ghi Audit Log"}
        onConfirm={async (reason) => {
          if (!lockTarget) return;
          const nextLocked = !lockTarget.locked;
          try {
            await updateAccountStatus(lockTarget.id, {
              locked: nextLocked,
              reason
            });
            void refetch();
            setFeedback({
              type: "ok",
              text: nextLocked
                ? `Đã khóa tài khoản ${lockTarget.fullName} và thu hồi phiên đăng nhập.`
                : `Đã mở khóa tài khoản ${lockTarget.fullName}.`
            });
          } catch (err) {
            setFeedback({
              type: "err",
              text: extractApiErrorMessage(err, "Không thể cập nhật trạng thái tài khoản.")
            });
          }
        }}
      />
    </div>
  );
}
