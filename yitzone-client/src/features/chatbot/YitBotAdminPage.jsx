import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Ban,
  BookOpenCheck,
  CheckCircle2,
  Coins,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INITIAL_DOCS = [];

const USAGE_LEDGER = [];

export function YitBotAdminPage() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [newTitle, setNewTitle] = useState("");
  const [newVersion, setNewVersion] = useState("v1.0");
  const [newKind, setNewKind] = useState("Quy chế RAG");
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [reindexingId, setReindexingId] = useState(null);

  const [budgetCeiling, setBudgetCeiling] = useState(1_500_000);
  const [quotas, setQuotas] = useState({ guest: 5, student: 30, ctv: 60, bch: 150 });
  const spentMonth = USAGE_LEDGER.reduce((sum, r) => sum + r.costVnd, 0);
  const spentPct = Math.min(100, Math.round((spentMonth / Math.max(1, budgetCeiling)) * 100));

  const handleAddDoc = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setDocs((prev) => [
      {
        id: `DOC-${String(prev.length + 1).padStart(2, "0")}`,
        title: newTitle.trim(),
        version: newVersion.trim() || "v1.0",
        kind: newKind,
        curator: "MOD_YITBOT_CURATOR",
        status: "PENDING_BTV",
        updatedAt: new Date().toLocaleDateString("vi-VN")
      },
      ...prev
    ]);
    setNewTitle("");
  };

  const handleApproveBtv = (docId) => {
    setReindexingId(docId);
    window.setTimeout(() => {
      setDocs((prev) => prev.map((d) => (d.id === docId ? {...d, status: "ACTIVE_RAG" }: d)));
      setReindexingId(null);
    }, 600);
  };

  const handleConfirmRevoke = () => {
    if (!revokeTarget) return;
    setDocs((prev) => prev.map((d) => (d.id === revokeTarget.id ? {...d, status: "REVOKED" }: d)));
    setRevokeTarget(null);
  };

  const docCols = [
    {
      key: "id",
      header: "Mã",
      render: (doc) => <span className="tabular-mono text-xs font-semibold">{doc.id}</span>
    },
    {
      key: "title",
      header: "Tên văn bản / Phiên bản",
      render: (doc) => (
        <div className={doc.status === "REVOKED" ? "opacity-60": undefined}>
          <div className="font-medium text-foreground">{doc.title}</div>
          <div className="text-xs text-muted-foreground">
            {doc.version} · {doc.curator} · {doc.updatedAt}
          </div>
        </div>
      )
    },
    {
      key: "kind",
      header: "Loại",
      render: (doc) => <Badge variant="secondary">{doc.kind}</Badge>
    },
    {
      key: "status",
      header: "Trạng thái RAG",
      render: (doc) =>
        doc.status === "ACTIVE_RAG" ? (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            Đang nạp RAG
          </Badge>
        ): doc.status === "PENDING_BTV" ? (
          <Badge variant="warning">Chờ BTV duyệt</Badge>
        ): (
          <Badge variant="danger">Hết hiệu lực · Đã gỡ</Badge>
        )
    },
    {
      key: "actions",
      header: "Phê duyệt BTV",
      align: "right",
      render: (doc) => (
        <div className="flex justify-end gap-1.5">
          {doc.status === "PENDING_BTV" && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleApproveBtv(doc.id)}
              disabled={reindexingId === doc.id}
            >
              <RefreshCw className={reindexingId === doc.id ? "h-3.5 w-3.5 animate-spin": "h-3.5 w-3.5"} />
              BTV Duyệt &amp; Re-index
            </Button>
          )}
          {doc.status === "ACTIVE_RAG" && (
            <Button type="button" size="sm" variant="destructive" onClick={() => setRevokeTarget(doc)}>
              <Ban className="h-3.5 w-3.5" />
              Gỡ khỏi RAG
            </Button>
          )}
        </div>
      )
    }
  ];

  const ledgerCols = [
    { key: "date", header: "Ngày", render: (r) => <span className="tabular-mono text-xs">{r.date}</span> },
    { key: "role", header: "Nhóm người dùng", render: (r) => <span className="font-medium">{r.role}</span> },
    { key: "queries", header: "Lượt hỏi", align: "right", render: (r) => <span className="tabular-mono text-xs">{r.queries}</span> },
    { key: "tokens", header: "Tổng Token", align: "right", render: (r) => <span className="tabular-mono text-xs">{r.tokens}</span> },
    {
      key: "cost",
      header: "Chi phí (VNĐ)",
      align: "right",
      render: (r) => <span className="tabular-mono text-xs font-semibold text-foreground">{r.costVnd.toLocaleString("vi-VN")} ₫</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản trị Kho Tri thức &amp; Ngân sách YITBot
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phân tách quyền Soạn thảo (CTV/BCH) &amp; Phê duyệt/Gỡ quy chế tri thức (BTV), cấu hình trần ngân sách AI.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/yitbot">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            <span>Mở giao diện YITBot</span>
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="rag" className="min-h-[460px]">
        <TabsList className="justify-start">
          <TabsTrigger value="rag">Kho Tri thức RAG &amp; FAQ ({docs.length})</TabsTrigger>
          <TabsTrigger value="budget">Ngân sách AI &amp; Sổ cái Chi phí</TabsTrigger>
        </TabsList>

        <TabsContent value="rag" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tải lên Văn bản Quy chế / FAQ vào Hàng chờ BTV</CardTitle>
              <CardDescription>
                Curator soạn thảo; duy nhất BTV phê duyệt nạp RAG (tự động re-index) hoặc đánh dấu Hết hiệu lực.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDoc} className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Tên văn bản quy chế hoặc tiêu đề FAQ tĩnh..."
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="Phiên bản"
                    className="h-10 rounded-xl tabular-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Select value={newKind} onValueChange={(v) => setNewKind(v)}>
                    <SelectTrigger aria-label="Loại tài liệu" className="h-10 rounded-xl">
                      <SelectValue placeholder="Loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quy chế RAG">Quy chế RAG</SelectItem>
                      <SelectItem value="FAQ Tĩnh">FAQ Tĩnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full rounded-xl">
                    <Plus className="h-4 w-4" />
                    Đưa vào chờ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                Danh mục Văn bản Quy chế &amp; FAQ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={docCols}
                data={docs}
                emptyTitle="Kho tri thức RAG đang trống"
                emptyDescription="Tải lên văn bản quy chế hoặc FAQ tĩnh mới để trình Ban Thường vụ phê duyệt nạp RAG."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Trần Ngân sách AI Tháng &amp; Circuit Breaker
                </CardTitle>
                <CardDescription>
                  Vượt trần ngân sách sẽ tự động ngắt LLM và chuyển sang Kho FAQ Tĩnh.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Đã sử dụng trong tháng hiện tại</span>
                    <span className="tabular-mono font-semibold text-foreground">
                      {spentMonth.toLocaleString("vi-VN")} / {budgetCeiling.toLocaleString("vi-VN")} ₫ ({spentPct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={spentPct >= 85 ? "h-full rounded-full bg-status-danger": "h-full rounded-full bg-primary"}
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ai-ceiling">Trần ngân sách tháng (VNĐ)</Label>
                  <Input
                    id="ai-ceiling"
                    type="number"
                    value={budgetCeiling}
                    onChange={(e) => setBudgetCeiling(Number(e.target.value))}
                    className="rounded-xl tabular-mono"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Hạn mức Câu hỏi / Ngày theo Vai trò
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Khách (Guest)</Label>
                  <Input type="number" value={quotas.guest} onChange={(e) => setQuotas({...quotas, guest: Number(e.target.value) })} className="rounded-xl tabular-mono" />
                </div>
                <div className="space-y-1">
                  <Label>Sinh viên</Label>
                  <Input type="number" value={quotas.student} onChange={(e) => setQuotas({...quotas, student: Number(e.target.value) })} className="rounded-xl tabular-mono" />
                </div>
                <div className="space-y-1">
                  <Label>Cộng tác viên (CTV)</Label>
                  <Input type="number" value={quotas.ctv} onChange={(e) => setQuotas({...quotas, ctv: Number(e.target.value) })} className="rounded-xl tabular-mono" />
                </div>
                <div className="space-y-1">
                  <Label>BCH / BTV</Label>
                  <Input type="number" value={quotas.bch} onChange={(e) => setQuotas({...quotas, bch: Number(e.target.value) })} className="rounded-xl tabular-mono" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sổ cái Chi phí AI Theo Ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={ledgerCols}
                data={USAGE_LEDGER}
                emptyTitle="Chưa có dữ liệu sổ cái chi phí AI"
                emptyDescription="Thống kê token và chi phí theo ngày sẽ tự động đồng bộ từ máy chủ YITBot."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Đánh dấu Hết hiệu lực & Gỡ khỏi Bộ nhớ RAG"
        description="Văn bản bị gỡ sẽ lập tức không còn được YITBot trích dẫn khi trả lời sinh viên. Thao tác chỉ dành cho Ban Thường vụ."
        targetSummary={revokeTarget ? `${revokeTarget.id} — ${revokeTarget.title}`: ""}
        actionCode="YITBOT_RAG_REVOKE"
        destructive
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}
