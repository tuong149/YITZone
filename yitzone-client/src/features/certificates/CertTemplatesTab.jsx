import { useState } from "react";
import { Archive, Award, CheckCircle2, Pencil, Plus, ShieldAlert, Star, Trash2 } from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
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

const CATEGORY_LABELS = {
  EVENT_ATTENDEE: "Tham dự Sự kiện",
  EVENT_BTC: "Ban Tổ chức Sự kiện",
  SV5T_AWARD: "Danh hiệu Sinh viên 5 tốt",
  ACADEMIC_PRIZE: "Giải thưởng Học thuật / Hackathon"
};

const INITIAL_TEMPLATES = [
  {
    id: "tpl-1",
    code: "TPL-EVT-2026-STD",
    name: "Phôi Chuẩn Hội thảo & Sự kiện FIT 2026",
    category: "EVENT_ATTENDEE",
    isDefault: true,
    status: "ACTIVE",
    issuedCount: 412,
    updatedAt: "18/11/2026"
  },
  {
    id: "tpl-2",
    code: "TPL-BTC-2026-STD",
    name: "Phôi Ghi nhận Đóng góp Ban Tổ chức",
    category: "EVENT_BTC",
    isDefault: true,
    status: "ACTIVE",
    issuedCount: 86,
    updatedAt: "15/11/2026"
  },
  {
    id: "tpl-3",
    code: "TPL-SV5T-2026-NAVY",
    name: "Phôi Danh hiệu Sinh viên 5 tốt FIT Academic Navy",
    category: "SV5T_AWARD",
    isDefault: true,
    status: "ACTIVE",
    issuedCount: 24,
    updatedAt: "10/11/2026"
  },
  {
    id: "tpl-4",
    code: "TPL-HACK-DRAFT",
    name: "Phôi Thử nghiệm FIT Hackathon 2026 (Chưa phát hành)",
    category: "ACADEMIC_PRIZE",
    isDefault: false,
    status: "ACTIVE",
    issuedCount: 0,
    updatedAt: "21/11/2026"
  }
];

export function CertTemplatesTab({ onNotify }) {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [errorMsg, setErrorMsg] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("EVENT_ATTENDEE");
  const [auditTarget, setAuditTarget] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setCode(`TPL-FIT-${crypto.randomUUID().slice(0, 6).toUpperCase()}`);
    setCategory("EVENT_ATTENDEE");
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setName(row.name);
    setCode(row.code);
    setCategory(row.category);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !code.trim()) return;
    setErrorMsg(null);
    if (editing) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {...t, name: name.trim(), code: code.trim().toUpperCase(), category, updatedAt: "21/11/2026" }
: t
        )
      );
      onNotify(`Đã cập nhật mẫu phôi E-Cert "${name.trim()}".`);
    } else {
      setTemplates((prev) => [
        {
          id: `tpl-${Date.now()}`,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          category,
          isDefault: false,
          status: "ACTIVE",
          issuedCount: 0,
          updatedAt: "21/11/2026"
        },
...prev
      ]);
      onNotify(`Đã tạo mới mẫu phôi E-Cert "${name.trim()}".`);
    }
    setDialogOpen(false);
  };

  const setDefaultTemplate = (row) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.category === row.category ? {...t, isDefault: t.id === row.id }: t
      )
    );
    onNotify(`Đã đặt "${row.name}" làm mẫu phôi mặc định cho nhóm ${CATEGORY_LABELS[row.category]}.`);
  };

  const handleDeleteClick = (row) => {
    setErrorMsg(null);
    if (row.issuedCount > 0) {
      setErrorMsg(
        `Không thể xóa phôi "${row.name}": đã phát hành ${row.issuedCount} E-Certificate chính thức. Vui lòng dùng nút "Lưu trữ" thay thế.`
      );
      return;
    }
    setAuditTarget({ row, mode: "DELETE" });
  };

  const columns = [
    {
      key: "name",
      header: "Mẫu phôi E-Certificate",
      render: (row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{row.name}</span>
            {row.isDefault && (
              <Badge variant="info">
                <Star className="h-3 w-3" />
                <span>Mặc định</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-mono">{row.code}</span>
            <span>·</span>
            <span>{CATEGORY_LABELS[row.category]}</span>
          </div>
        </div>
      )
    },
    {
      key: "issued",
      header: "Đã phát hành",
      align: "right",
      render: (row) => (
        <span className="tabular-mono font-medium text-foreground">
          {row.issuedCount.toLocaleString("vi-VN")} bản
        </span>
      )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) =>
        row.status === "ACTIVE" ? (
          <Badge variant="success">Đang sử dụng</Badge>
        ): (
          <Badge variant="secondary">Đã lưu trữ</Badge>
        )
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          {row.status === "ACTIVE" && !row.isDefault && (
            <Button type="button" size="sm" variant="outline" onClick={() => setDefaultTemplate(row)}>
              Đặt mặc định
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => openEdit(row)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {row.status === "ACTIVE" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAuditTarget({ row, mode: "ARCHIVE" })}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Lưu trữ</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
            onClick={() => handleDeleteClick(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Quản trị kho mẫu phôi E-Certificate theo loại. Chặn xóa mẫu phôi đã phát hành
          chứng nhận để bảo toàn đối chiếu xác thực QR.
        </p>
        <Button type="button" size="sm" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Thêm Mẫu Phôi</span>
        </Button>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-xs font-medium text-status-danger">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {errorMsg}
          </span>
          <button type="button" onClick={() => setErrorMsg(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      <DataTable columns={columns} data={templates} />

      {/* Live Standardized Layout Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-brand-navy dark:text-brand-cyan" />
            <span>Bố cục Trường dữ liệu Chuẩn trên Phôi E-Certificate</span>
          </CardTitle>
          <CardDescription>
            Đồng bộ danh sách trường bắt buộc (Họ tên, MSSV, Tư cách, Nhãn quyền lợi không số điểm, Số phiên
            bản và Mã QR độc lập).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="yit-node-grid flex flex-col justify-between gap-4 rounded-xl border border-brand-navy/25 bg-brand-navy/[0.04] p-5 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <VerifiedBadge />
              <div className="font-display text-lg font-medium text-foreground">
                GIẤY CHỨNG NHẬN THAM GIA HOẠT ĐỘNG ĐOÀN – HỘI
              </div>
              <div className="text-xs text-muted-foreground">
                Cấp cho: <strong className="text-foreground">Nguyễn Minh Khôi</strong>MSSV:{" "}
                <span className="tabular-mono">22110345</span>Nhãn: <Badge variant="info">Cộng ĐRL</Badge>{" "}
                <Badge variant="info">Cộng CĐDN</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-status-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="tabular-mono">v1 · QR Verify Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Chỉnh sửa Mẫu Phôi E-Cert": "Tạo Mẫu Phôi E-Cert mới"}</DialogTitle>
            <DialogDescription>Cấu hình tên mẫu, mã phôi và nhóm chứng nhận áp dụng.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Tên mẫu phôi</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Phôi Chuẩn Hội thảo Chuyên đề 2026"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-code">Mã phôi</Label>
                <Input
                  id="tpl-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nhóm chứng nhận</Label>
                <Select value={category} onValueChange={(v) => setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={!name.trim() || !code.trim()} onClick={handleSave}>
              {editing ? "Lưu thay đổi": "Tạo Mẫu Phôi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuditActionDialog
        open={Boolean(auditTarget)}
        onOpenChange={(o) => !o && setAuditTarget(null)}
        title={auditTarget?.mode === "ARCHIVE" ? "Lưu trữ Mẫu Phôi E-Certificate": "Xóa Mẫu Phôi E-Certificate"}
        description={
          auditTarget?.mode === "ARCHIVE"
            ? "Mẫu phôi sẽ chuyển sang trạng thái Đã lưu trữ (ngưng chọn cho sự kiện mới, vẫn giữ nguyên lịch sử các chứng nhận đã cấp)."
: "Mẫu phôi chưa phát hành chứng nhận nào sẽ bị xóa khỏi hệ thống."
        }
        targetSummary={auditTarget ? `${auditTarget.row.name} (${auditTarget.row.code})`: ""}
        actionCode={auditTarget?.mode === "ARCHIVE" ? "CERT_TEMPLATE_ARCHIVE": "CERT_TEMPLATE_DELETE"}
        destructive={auditTarget?.mode === "DELETE"}
        confirmLabel="Xác nhận & Ghi Audit Log"
        onConfirm={() => {
          if (!auditTarget) return;
          if (auditTarget.mode === "ARCHIVE") {
            setTemplates((prev) =>
              prev.map((t) => (t.id === auditTarget.row.id ? {...t, status: "ARCHIVED", isDefault: false }: t))
            );
            onNotify(`Đã lưu trữ mẫu phôi "${auditTarget.row.name}" và ghi Audit Log.`);
          } else {
            setTemplates((prev) => prev.filter((t) => t.id !== auditTarget.row.id));
            onNotify(`Đã xóa mẫu phôi "${auditTarget.row.name}" và ghi Audit Log.`);
          }
          setAuditTarget(null);
        }}
      />
    </div>
  );
}
