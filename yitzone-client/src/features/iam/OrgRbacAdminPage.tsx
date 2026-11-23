import { useState } from "react";
import { Building2, KeyRound, Lock, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EXECUTIVE_BODIES = [
  {
    code: "BCH_DOAN",
    name: "Ban Chấp hành Đoàn Khoa CNTT (15 nhân sự)",
    governanceNote: "Bổ nhiệm/kiện toàn chỉ do BTV Đoàn thực hiện",
    slots: [
      "1 Bí thư Đoàn (BTV)",
      "2 Phó Bí thư Đoàn (BTV · 1 người kiêm LCH Trưởng)",
      "2 Ủy viên BTV Đoàn (BTV)",
      "10 Ủy viên BCH Đoàn (BCH)"
    ]
  },
  {
    code: "BCH_HOI",
    name: "Ban Chấp hành Liên Chi hội SV Khoa CNTT (15 nhân sự)",
    governanceNote: "Bổ nhiệm/kiện toàn chỉ do Thường trực LCH thực hiện",
    slots: [
      "1 Liên chi hội trưởng (BTV · bắt buộc kiêm PBT Đoàn)",
      "2 Liên chi hội phó (BTV)",
      "12 Ủy viên BCH LCH (BCH)"
    ]
  }
];

const ORG_TREE = [
  {
    code: "EMFIT",
    name: "Ban Sự kiện – Truyền thông (EMFIT)",
    teams: ["Tổ Truyền thông", "Tổ Thiết kế", "Tổ Hậu cần – Sự kiện"]
  },
  {
    code: "OFIT",
    name: "Ban Văn phòng (OFIT)",
    teams: ["Tổ Trực Văn phòng", "Tổ Kiểm kê Tài sản"]
  },
  {
    code: "ARTIT",
    name: "Ban Văn nghệ (ARTIT)",
    teams: ["Tổ Hát", "Tổ Nhảy – Múa", "Tổ Nhạc cụ"]
  },
  {
    code: "SV5T",
    name: "Ban Phong trào & Sinh viên 5 tốt (SV5T)",
    teams: ["Tổ Học thuật – SV5T"]
  }
];

interface ModuleRow {
  id: string;
  code: string;
  label: string;
  nonDelegable: boolean;
  note: string;
}

const SAMPLE_MODULES: ModuleRow[] = [
  { id: "m1", code: "MOD_EVENT_OPS", label: "Điều phối Sự kiện & BTC", nonDelegable: false, note: "Gắn phạm vi Sự kiện hoặc Toàn Khoa" },
  { id: "m2", code: "MOD_ATTENDANCE_STAFF", label: "Lễ tân Soát vé QR / Barcode 1D", nonDelegable: false, note: "Ủy quyền tạm thời theo sự kiện" },
  { id: "m3", code: "MOD_UNIT_HR_INTERNAL", label: "Quản lý Nhân sự Nội bộ Ban/Tổ", nonDelegable: false, note: "Tách biệt hoàn toàn khỏi 4 gói MOD_DEPT_*" },
  { id: "m4", code: "MOD_QUIZ_EXAM_HOST", label: "MC / Điều phối Minigame, Thi & Live Q&A", nonDelegable: false, note: "Chứa liveqa:moderate, không trùng liveqa:unmask" },
  { id: "m5", code: "MOD_LIVEQA_UNMASK", label: "Tra cứu Danh tính Ẩn danh Live Q&A", nonDelegable: true, note: "Non-delegable BTV · Cấm cấp cho SystemAdmin" },
  { id: "m6", code: "MOD_YITBOT_FULL", label: "Phê duyệt Kho Tri thức & Ngân sách YITBot", nonDelegable: true, note: "Non-delegable · Duy nhất BTV" },
  { id: "m7", code: "MOD_AUDIT_VIEWER", label: "Tra cứu Audit Log Hash-chain (Chỉ đọc)", nonDelegable: true, note: "Dành cho BTV & SystemAdmin" }
];

interface ActiveGrant {
  id: string;
  userCode: string;
  userName: string;
  moduleCode: string;
  scopeLabel: string;
  expiresAt: string;
}

const INITIAL_GRANTS: ActiveGrant[] = [
  {
    id: "g-1",
    userCode: "22110412",
    userName: "Trần Thảo Vy",
    moduleCode: "MOD_ATTENDANCE_STAFF",
    scopeLabel: "Sự kiện: Cloud Native 2026",
    expiresAt: "28/11/2026 18:00"
  },
  {
    id: "g-2",
    userCode: "23110188",
    userName: "Lê Hoàng Nam",
    moduleCode: "MOD_QUIZ_EXAM_HOST",
    scopeLabel: "Sự kiện: Đấu trường Code UTE",
    expiresAt: "12/12/2026 22:00"
  }
];

export function OrgRbacAdminPage(){
  const [grants, setGrants] = useState<ActiveGrant[]>(INITIAL_GRANTS);
  const [targetUser, setTargetUser] = useState("22110345");
  const [selectedModule, setSelectedModule] = useState("MOD_ATTENDANCE_STAFF");
  const [scopeText, setScopeText] = useState("Sự kiện: Cloud Native 2026");
  const [grantMsg, setGrantMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ActiveGrant | null>(null);

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const mod = SAMPLE_MODULES.find((m) => m.code === selectedModule);
    if (mod?.nonDelegable) {
      setGrantMsg({
        type: "err",
        text: `Từ chối 403: Gói ${mod.code} thuộc nhóm Non-delegable của BTV, không cho phép ủy quyền ngang/vượt thẩm quyền.`
      });
      return;
    }
    setGrants((prev) => [
      {
        id: `g-${Date.now()}`,
        userCode: targetUser,
        userName: `Cán bộ / CTV (${targetUser})`,
        moduleCode: selectedModule,
        scopeLabel: scopeText,
        expiresAt: "30/12/2026 23:59"
      },
...prev
    ]);
    setGrantMsg({
      type: "ok",
      text: `Đã cấp gói ${selectedModule} phạm vi "${scopeText}" cho ${targetUser} và ghi nhận Audit Log.`
    });
  };

  const moduleCols: DataTableColumn<ModuleRow>[] = [
    { key: "code", header: "Mã Gói", render: (m) => <span className="tabular-mono font-semibold">{m.code}</span> },
    { key: "label", header: "Tên Gói Quyền", render: (m) => <span className="font-medium">{m.label}</span> },
    {
      key: "delegation",
      header: "Phân loại Ủy quyền",
      render: (m) =>
        m.nonDelegable ? (
          <Badge variant="danger">
            <Lock className="h-3 w-3" />
            Non-delegable (BTV)
          </Badge>
        ): (
          <Badge variant="success">Ủy quyền theo Scope/TTL</Badge>
        )
    },
    { key: "note", header: "Nguyên tắc phân quyền", render: (m) => <span className="text-xs text-muted-foreground">{m.note}</span> }
  ];

  const grantCols: DataTableColumn<ActiveGrant>[] = [
    { key: "user", header: "Người nhận", render: (g) => <span className="font-medium">{g.userName} <span className="tabular-mono text-xs text-muted-foreground">({g.userCode})</span></span> },
    { key: "mod", header: "Gói Quyền", render: (g) => <Badge variant="default" className="tabular-mono">{g.moduleCode}</Badge> },
    { key: "scope", header: "Phạm vi (Scope)", render: (g) => <span className="text-sm">{g.scopeLabel}</span> },
    { key: "exp", header: "Hết hạn (TTL)", render: (g) => <span className="tabular-mono text-xs text-muted-foreground">{g.expiresAt}</span> },
    {
      key: "action",
      header: "Thu hồi ≤ 5s",
      align: "right",
      render: (g) => (
        <Button variant="destructive" size="sm" onClick={() => setRevokeTarget(g)}>
          <Trash2 className="h-3.5 w-3.5" />
          Thu hồi ngay
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-foreground">
          Cây Tổ chức 4 Ban – 9 Tổ &amp; 20 Gói Quyền Động
        </h1>
        <p className="text-sm text-muted-foreground">
          Hợp quyền Union đa chức vụ, kiểm soát phạm vi cô lập và thu hồi tức thì qua Redis Pub/Sub `rbac:invalidate` (≤ 5 giây).
        </p>
      </div>

      <Tabs defaultValue="grants">
        <TabsList>
          <TabsTrigger value="grants">Cấp phát &amp; Thu hồi ≤ 5s</TabsTrigger>
          <TabsTrigger value="tree">Cây Tổ chức 4 Ban – 9 Tổ</TabsTrigger>
          <TabsTrigger value="modules">Cấu trúc 20 Gói Quyền</TabsTrigger>
        </TabsList>

        <TabsContent value="grants" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Cấp phát Gói Quyền Theo Phạm vi &amp; Thời hạn
              </CardTitle>
              <CardDescription>
                Hệ thống tự động chặn vượt thẩm quyền và từ chối ủy quyền nhóm Non-delegable của BTV.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrant} className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="grant-user">MSSV người nhận</Label>
                  <Input
                    id="grant-user"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    className="tabular-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grant-mod">Gói Quyền</Label>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger id="grant-mod" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_MODULES.map((m) => (
                        <SelectItem key={m.code} value={m.code}>
                          {m.code} {m.nonDelegable ? "(Non-delegable)": ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grant-scope">Phạm vi (Toàn Khoa / Ban / Sự kiện)</Label>
                  <Input id="grant-scope" value={scopeText} onChange={(e) => setScopeText(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    <ShieldCheck className="h-4 w-4" />
                    Cấp quyền có TTL
                  </Button>
                </div>
              </form>

              {grantMsg && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
                    grantMsg.type === "ok"
                      ? "border-status-success/30 bg-status-success/10 text-status-success"
: "border-status-danger/30 bg-status-danger/10 text-status-danger"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{grantMsg.text}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <DataTable columns={grantCols} data={grants} />
        </TabsContent>

        <TabsContent value="tree" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {EXECUTIVE_BODIES.map((body) => (
              <Card key={body.code} className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      {body.name}
                    </span>
                    <Badge variant="default" className="tabular-mono">{body.code}</Badge>
                  </CardTitle>
                  <CardDescription>
                    ancestors: [&quot;FIT&quot;] · {body.governanceNote}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {body.slots.map((slot) => (
                    <Badge key={slot} variant="secondary">
                      {slot}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {ORG_TREE.map((dept) => (
              <Card key={dept.code}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {dept.name}
                    </span>
                    <Badge variant="secondary" className="tabular-mono">{dept.code}</Badge>
                  </CardTitle>
                  <CardDescription>ancestors: [&quot;FIT&quot;, &quot;{dept.code}&quot;]</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {dept.teams.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <DataTable columns={moduleCols} data={SAMPLE_MODULES} />
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Thu hồi Gói Quyền Tức thì (≤ 5 giây)"
        description="Hệ thống sẽ tăng permissionVersion và phát tín hiệu Redis Pub/Sub rbac:invalidate để mọi API kế tiếp của tài khoản này bị chặn 403 ngay lập tức."
        targetSummary={
          revokeTarget ? `${revokeTarget.userName} · ${revokeTarget.moduleCode} (${revokeTarget.scopeLabel})`: ""
        }
        actionCode="RBAC_GRANT_REVOKE"
        confirmLabel="Thu hồi ngay & Ghi Audit Log"
        onConfirm={() => {
          if (revokeTarget) {
            setGrants((prev) => prev.filter((item) => item.id !== revokeTarget.id));
            setGrantMsg({
              type: "ok",
              text: `Đã thu hồi ${revokeTarget.moduleCode} của ${revokeTarget.userName} và xóa cache quyền trên Redis (≤ 5s).`
            });
          }
        }}
      />
    </div>
  );
}
