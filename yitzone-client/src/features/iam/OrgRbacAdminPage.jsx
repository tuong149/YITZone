import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Eye,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mergeStoredAndApiEvents, useEvents } from "@/features/events/api";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useEventStore } from "@/stores/event-store";
import {
  createRbacGrant,
  revokeRbacGrant,
  updateRbacModule,
  useOrgUnits,
  useRbacGrants,
  useRbacModules
} from "./api";
import { PermissionModuleDialog } from "./PermissionModuleDialog";

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

const RBAC_MODULES = [
  { id: "m1", code: "MOD_EVENT_OPS", label: "Điều phối Sự kiện & BTC", nonDelegable: false, note: "Gắn phạm vi Sự kiện hoặc Toàn Khoa" },
  { id: "m2", code: "MOD_ATTENDANCE_STAFF", label: "Lễ tân Soát vé QR / Barcode 1D", nonDelegable: false, note: "Ủy quyền tạm thời theo sự kiện" },
  { id: "m3", code: "MOD_UNIT_HR_INTERNAL", label: "Quản lý Nhân sự Nội bộ Ban/Tổ", nonDelegable: false, note: "Tách biệt hoàn toàn khỏi 4 gói MOD_DEPT_*" },
  { id: "m4", code: "MOD_QUIZ_EXAM_HOST", label: "MC / Điều phối Minigame, Thi & Live Q&A", nonDelegable: false, note: "Chứa liveqa:moderate, không trùng liveqa:unmask" },
  { id: "m5", code: "MOD_LIVEQA_UNMASK", label: "Tra cứu Danh tính Ẩn danh Live Q&A", nonDelegable: true, note: "Non-delegable BTV · Cấm cấp cho SystemAdmin" },
  { id: "m6", code: "MOD_YITBOT_FULL", label: "Phê duyệt Kho Tri thức & Ngân sách YITBot", nonDelegable: true, note: "Non-delegable · Duy nhất BTV" },
  { id: "m7", code: "MOD_AUDIT_VIEWER", label: "Tra cứu Audit Log Hash-chain (Chỉ đọc)", nonDelegable: true, note: "Dành cho BTV & SystemAdmin" }
];

const INITIAL_GRANTS = [];

const FALLBACK_ORG_UNITS = [
  { code: "BCH_DOAN", name: "Ban Chấp hành Đoàn Khoa CNTT", unitType: "EXECUTIVE_BODY" },
  { code: "BCH_HOI", name: "Ban Chấp hành Liên Chi hội SV Khoa CNTT", unitType: "EXECUTIVE_BODY" },
  { code: "EMFIT", name: "Ban Sự kiện – Truyền thông (EMFIT)", unitType: "COMMITTEE" },
  { code: "OFIT", name: "Ban Văn phòng (OFIT)", unitType: "COMMITTEE" },
  { code: "ARTIT", name: "Ban Văn nghệ (ARTIT)", unitType: "COMMITTEE" },
  { code: "SV5T", name: "Ban Phong trào & Sinh viên 5 tốt (SV5T)", unitType: "COMMITTEE" }
];

const MANUAL_EVENT_VALUE = "__MANUAL_EVENT__";

export function OrgRbacAdminPage() {
  const [targetUser, setTargetUser] = useState("");
  const [selectedModule, setSelectedModule] = useState("MOD_ATTENDANCE_STAFF");
  const [scopeKind, setScopeKind] = useState("FACULTY");
  const [selectedUnitCode, setSelectedUnitCode] = useState("OFIT");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [manualEventCode, setManualEventCode] = useState("");
  const [expiresAtInput, setExpiresAtInput] = useState("");
  const [grantMsg, setGrantMsg] = useState(null);
  const [submittingGrant, setSubmittingGrant] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleNotice, setModuleNotice] = useState(null);
  const [toggleModuleTarget, setToggleModuleTarget] = useState(null);

  const { data: apiModules, refetch: refetchModules } = useRbacModules(true);
  const { data: apiGrants, refetch: refetchGrants } = useRbacGrants();
  const { data: apiOrgUnits } = useOrgUnits();
  const { data: apiEvents, isLoading: loadingEvents } = useEvents();
  const storedEvents = useEventStore((s) => s.events);

  const effectiveModules = useMemo(() => {
    if (Array.isArray(apiModules) && apiModules.length > 0) {
      return apiModules.map((m) => ({
        id: m.id ?? m.moduleCode,
        code: m.moduleCode,
        label: m.name,
        nonDelegable: Boolean(m.nonDelegable),
        systemDefault: m.systemDefault !== false,
        active: m.active !== false,
        includedPermissions: Array.isArray(m.includedPermissions) ? m.includedPermissions : [],
        note: m.description ?? ""
      }));
    }
    return RBAC_MODULES.map((m) => ({
      ...m,
      systemDefault: true,
      active: true,
      includedPermissions: []
    }));
  }, [apiModules]);

  const activeGrantableModules = useMemo(
    () => effectiveModules.filter((m) => m.active !== false),
    [effectiveModules]
  );

  const filteredModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    return effectiveModules.filter((m) => {
      if (moduleFilter === "DEFAULT" && !m.systemDefault) return false;
      if (moduleFilter === "CUSTOM" && m.systemDefault) return false;
      if (moduleFilter === "INACTIVE" && m.active !== false) return false;
      if (!q) return true;
      const hay = `${m.code} ${m.label} ${m.note} ${(m.includedPermissions || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [effectiveModules, moduleSearch, moduleFilter]);

  const moduleCounts = useMemo(
    () => ({
      all: effectiveModules.length,
      defaultCount: effectiveModules.filter((m) => m.systemDefault).length,
      customCount: effectiveModules.filter((m) => !m.systemDefault).length,
      inactiveCount: effectiveModules.filter((m) => m.active === false).length
    }),
    [effectiveModules]
  );

  const moduleMap = useMemo(
    () => new Map(effectiveModules.map((m) => [m.code, m])),
    [effectiveModules]
  );

  const orgUnits = useMemo(() => {
    if (Array.isArray(apiOrgUnits) && apiOrgUnits.length > 0) {
      return apiOrgUnits
        .filter((u) => u && u.code && u.code !== "FIT" && u.unitType !== "FACULTY")
        .map((u) => ({
          code: u.code,
          name: u.name || u.code,
          unitType: u.unitType || u.type || "COMMITTEE",
          parentId: u.parentId || u.parentUnitId || null
        }));
    }
    return FALLBACK_ORG_UNITS;
  }, [apiOrgUnits]);

  const groupedOrgUnits = useMemo(() => {
    const executive = orgUnits.filter((u) => u.unitType === "EXECUTIVE_BODY");
    const committees = orgUnits.filter((u) => u.unitType === "COMMITTEE");
    const teams = orgUnits.filter((u) => u.unitType === "TEAM");
    const others = orgUnits.filter(
      (u) => !["EXECUTIVE_BODY", "COMMITTEE", "TEAM"].includes(u.unitType)
    );
    return { executive, committees, teams, others };
  }, [orgUnits]);

  const eventOptions = useMemo(
    () => mergeStoredAndApiEvents(storedEvents, apiEvents),
    [storedEvents, apiEvents]
  );

  const scopeLabelMap = useMemo(() => {
    const map = new Map([
      ["FACULTY", "Toàn Khoa CNTT"],
      ["FIT", "Toàn Khoa CNTT"]
    ]);
    for (const unit of orgUnits) {
      map.set(unit.code, unit.name);
    }
    for (const ev of eventOptions) {
      map.set(ev.id, ev.title);
    }
    return map;
  }, [orgUnits, eventOptions]);

  const selectedModuleInfo = moduleMap.get(selectedModule) ?? null;

  const grants = useMemo(() => {
    if (!Array.isArray(apiGrants)) return INITIAL_GRANTS;
    return apiGrants.map((g) => ({
      id: g.id,
      userId: g.userId,
      userCode: g.userCode,
      userName: g.userName,
      moduleCode: g.moduleCode,
      moduleLabel: moduleMap.get(g.moduleCode)?.label ?? g.moduleCode,
      scopeId: g.scopeId,
      scopeLabel: scopeLabelMap.get(g.scopeId) ?? g.scopeId,
      expiresAt: g.expiresAt ? new Date(g.expiresAt).toLocaleString("vi-VN") : "Không giới hạn"
    }));
  }, [apiGrants, moduleMap, scopeLabelMap]);

  const resolvedScope = useMemo(() => {
    if (scopeKind === "FACULTY") {
      return {
        scopeType: "FACULTY",
        scopeId: "FACULTY",
        label: "Toàn Khoa CNTT"
      };
    }
    if (scopeKind === "ORG_UNIT") {
      const unit = orgUnits.find((u) => u.code === selectedUnitCode);
      if (!unit) return { scopeType: "COMMITTEE", scopeId: "", label: "" };
      return {
        scopeType: unit.unitType === "TEAM" ? "TEAM" : "COMMITTEE",
        scopeId: unit.code,
        label: unit.name
      };
    }
    if (selectedEventId === MANUAL_EVENT_VALUE) {
      const cleaned = manualEventCode.trim();
      return {
        scopeType: "EVENT",
        scopeId: cleaned,
        label: cleaned
      };
    }
    const ev = eventOptions.find((item) => item.id === selectedEventId);
    return {
      scopeType: "EVENT",
      scopeId: ev?.id ?? "",
      label: ev?.title ?? ""
    };
  }, [scopeKind, selectedUnitCode, orgUnits, selectedEventId, manualEventCode, eventOptions]);

  const handleGrant = async (e) => {
    e.preventDefault();
    const cleanedUser = targetUser.trim();
    if (!cleanedUser) {
      setGrantMsg({
        type: "err",
        text: "Vui lòng nhập MSSV hoặc Email người nhận trước khi cấp quyền."
      });
      return;
    }
    if (!resolvedScope.scopeId) {
      setGrantMsg({
        type: "err",
        text:
          scopeKind === "EVENT"
            ? "Vui lòng chọn sự kiện hoặc nhập mã sự kiện áp dụng."
            : "Vui lòng chọn đơn vị (Ban / Tổ) áp dụng."
      });
      return;
    }
    setSubmittingGrant(true);
    setGrantMsg(null);
    try {
      const expiresAtIso = expiresAtInput ? new Date(expiresAtInput).toISOString() : null;
      const created = await createRbacGrant({
        targetIdentifier: cleanedUser,
        moduleCode: selectedModule,
        scopeType: resolvedScope.scopeType,
        scopeId: resolvedScope.scopeId,
        expiresAt: expiresAtIso,
        reason: `Cấp gói ${selectedModule} phạm vi ${resolvedScope.scopeId}`
      });
      void refetchGrants();
      setTargetUser("");
      setManualEventCode("");
      setExpiresAtInput("");
      const createdLabel = moduleMap.get(created.moduleCode)?.label ?? created.moduleCode;
      const createdScopeLabel = scopeLabelMap.get(created.scopeId) ?? resolvedScope.label ?? created.scopeId;
      setGrantMsg({
        type: "ok",
        text: `Đã cấp "${createdLabel}" phạm vi "${createdScopeLabel}" cho ${created.userName} và ghi nhận Audit Log.`
      });
    } catch (err) {
      setGrantMsg({
        type: "err",
        text: extractApiErrorMessage(err, "Không thể cấp gói quyền. Vui lòng kiểm tra thẩm quyền và thử lại.")
      });
    } finally {
      setSubmittingGrant(false);
    }
  };

  const moduleCols = [
    {
      key: "code",
      header: "Mã Gói",
      render: (m) => (
        <div className="space-y-1">
          <div className="tabular-mono font-semibold text-foreground">{m.code}</div>
          <div className="flex flex-wrap items-center gap-1">
            {m.systemDefault ? (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                Mặc định
              </Badge>
            ) : (
              <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                Tùy chỉnh
              </Badge>
            )}
            {m.active === false && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-muted-foreground">
                Tạm ngưng
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: "label",
      header: "Tên & Mô tả Gói Quyền",
      render: (m) => (
        <div className="space-y-0.5">
          <div className={`font-medium ${m.active === false ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {m.label}
          </div>
          {m.note && <div className="text-xs text-muted-foreground">{m.note}</div>}
        </div>
      )
    },
    {
      key: "permissions",
      header: "Quyền hạn",
      render: (m) => {
        const perms = m.includedPermissions || [];
        return (
          <div className="space-y-1">
            <span className="tabular-mono text-xs font-medium text-foreground">
              {perms.length} quyền
            </span>
            {perms.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {perms.slice(0, 2).map((p) => (
                  <span
                    key={p}
                    className="tabular-mono rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
                {perms.length > 2 && (
                  <span className="tabular-mono text-[10px] text-muted-foreground">
                    +{perms.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: "delegation",
      header: "Ủy quyền",
      render: (m) =>
        m.nonDelegable ? (
          <Badge variant="danger">
            <Lock className="h-3 w-3" />
            Chỉ BTV
          </Badge>
        ) : (
          <Badge variant="success">Có thể ủy quyền</Badge>
        )
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingModule(m);
              setModuleDialogOpen(true);
            }}
          >
            {m.systemDefault ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            <span>{m.systemDefault ? "Chi tiết" : "Sửa"}</span>
          </Button>
          {!m.systemDefault && (
            <Button
              variant={m.active === false ? "secondary" : "outline"}
              size="sm"
              onClick={() => setToggleModuleTarget(m)}
            >
              <Power className="h-3.5 w-3.5" />
              <span>{m.active === false ? "Kích hoạt" : "Tạm ngưng"}</span>
            </Button>
          )}
        </div>
      )
    }
  ];

  const grantCols = [
    {
      key: "user",
      header: "Người nhận",
      render: (g) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{g.userName}</div>
          <div className="tabular-mono text-[11px] text-muted-foreground">{g.userCode}</div>
        </div>
      )
    },
    {
      key: "mod",
      header: "Tên gói quyền",
      render: (g) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{g.moduleLabel}</div>
          <div className="tabular-mono text-[11px] text-muted-foreground">{g.moduleCode}</div>
        </div>
      )
    },
    {
      key: "scope",
      header: "Phạm vi",
      render: (g) => (
        <div className="space-y-0.5">
          <Badge variant="secondary">{g.scopeLabel}</Badge>
          {g.scopeLabel !== g.scopeId && (
            <div className="tabular-mono pl-1 text-[11px] text-muted-foreground">{g.scopeId}</div>
          )}
        </div>
      )
    },
    { key: "exp", header: "Hết hạn", render: (g) => <span className="tabular-mono text-xs text-muted-foreground">{g.expiresAt}</span> },
    {
      key: "action",
      header: "Thao tác",
      align: "right",
      render: (g) => (
        <Button variant="destructive" size="sm" onClick={() => setRevokeTarget(g)}>
          <Trash2 className="h-3.5 w-3.5" />
          Thu hồi
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-foreground">
          Tổ chức &amp; Phân quyền
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý cơ cấu đơn vị, gói quyền và ủy quyền theo phạm vi.
        </p>
      </div>

      <Tabs defaultValue="grants">
        <TabsList>
          <TabsTrigger value="grants">Cấp phát &amp; Thu hồi</TabsTrigger>
          <TabsTrigger value="tree">Cây Tổ chức</TabsTrigger>
          <TabsTrigger value="modules">Gói Quyền</TabsTrigger>
        </TabsList>

        <TabsContent value="grants" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Cấp phát Gói Quyền
              </CardTitle>
              <CardDescription>
                Gán gói quyền cho tài khoản theo đơn vị hoặc sự kiện.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => void handleGrant(e)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-12">
                  <div className="space-y-1.5 md:col-span-7">
                    <Label htmlFor="grant-mod">Tên gói quyền</Label>
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                      <SelectTrigger id="grant-mod" className="h-10 rounded-xl">
                        <SelectValue placeholder="Chọn tên gói quyền..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 max-w-[min(92vw,520px)]">
                        {activeGrantableModules.map((m) => (
                          <SelectItem key={m.code} value={m.code} className="py-2">
                            {m.label}
                            {m.nonDelegable ? " · Chỉ BTV" : ""}
                            {!m.systemDefault ? " · Tùy chỉnh" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedModuleInfo && (
                      <p className="text-xs text-muted-foreground">
                        <span className="tabular-mono font-medium text-foreground/80">
                          {selectedModuleInfo.code}
                        </span>
                        {selectedModuleInfo.note ? ` — ${selectedModuleInfo.note}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-5">
                    <Label htmlFor="grant-user">MSSV hoặc Email người nhận</Label>
                    <Input
                      id="grant-user"
                      value={targetUser}
                      placeholder="VD: 22110123 hoặc 22110123@student.hcmute.edu.vn"
                      onChange={(e) => setTargetUser(e.target.value)}
                      className="h-10 rounded-xl tabular-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-12">
                  <div className={`space-y-1.5 ${scopeKind === "FACULTY" ? "md:col-span-5" : "md:col-span-4"}`}>
                    <Label htmlFor="grant-scope-kind">Phạm vi áp dụng</Label>
                    <Select
                      value={scopeKind}
                      onValueChange={(next) => {
                        setScopeKind(next);
                        if (next === "EVENT" && eventOptions.length > 0 && !selectedEventId) {
                          setSelectedEventId(eventOptions[0].id);
                        }
                      }}
                    >
                      <SelectTrigger id="grant-scope-kind" className="h-10 rounded-xl">
                        <SelectValue placeholder="Chọn phạm vi áp dụng..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FACULTY">Toàn Khoa CNTT</SelectItem>
                        <SelectItem value="ORG_UNIT">Theo Ban / Tổ trực thuộc</SelectItem>
                        <SelectItem value="EVENT">Theo Sự kiện cụ thể</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {scopeKind === "ORG_UNIT" && (
                    <div className="space-y-1.5 md:col-span-8">
                      <Label htmlFor="grant-org-unit">Đơn vị áp dụng (Ban / Tổ)</Label>
                      <Select value={selectedUnitCode} onValueChange={setSelectedUnitCode}>
                        <SelectTrigger id="grant-org-unit" className="h-10 rounded-xl">
                          <SelectValue placeholder="Chọn Ban hoặc Tổ..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {groupedOrgUnits.committees.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Ban Chức năng</SelectLabel>
                              {groupedOrgUnits.committees.map((u) => (
                                <SelectItem key={u.code} value={u.code}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {groupedOrgUnits.teams.length > 0 && (
                            <>
                              <SelectSeparator />
                              <SelectGroup>
                                <SelectLabel>Tổ Trực thuộc</SelectLabel>
                                {groupedOrgUnits.teams.map((u) => (
                                  <SelectItem key={u.code} value={u.code}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </>
                          )}
                          {groupedOrgUnits.executive.length > 0 && (
                            <>
                              <SelectSeparator />
                              <SelectGroup>
                                <SelectLabel>Ban Chấp hành</SelectLabel>
                                {groupedOrgUnits.executive.map((u) => (
                                  <SelectItem key={u.code} value={u.code}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </>
                          )}
                          {groupedOrgUnits.others.length > 0 && (
                            <>
                              <SelectSeparator />
                              <SelectGroup>
                                <SelectLabel>Đơn vị khác</SelectLabel>
                                {groupedOrgUnits.others.map((u) => (
                                  <SelectItem key={u.code} value={u.code}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {scopeKind === "EVENT" && (
                    <div className="space-y-1.5 md:col-span-8">
                      <Label htmlFor="grant-event">Sự kiện áp dụng</Label>
                      <div className="space-y-2">
                        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                          <SelectTrigger id="grant-event" className="h-10 rounded-xl">
                            <SelectValue
                              placeholder={
                                loadingEvents
                                  ? "Đang tải danh sách sự kiện..."
                                  : eventOptions.length > 0
                                    ? "Chọn sự kiện..."
                                    : "Chưa có sự kiện nào — chọn hoặc nhập mã..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {eventOptions.length > 0 ? (
                              <SelectGroup>
                                <SelectLabel>Sự kiện trong hệ thống</SelectLabel>
                                {eventOptions.map((ev) => (
                                  <SelectItem key={ev.id} value={ev.id}>
                                    {ev.title}
                                    {ev.dateSummary ? ` (${ev.dateSummary})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ) : (
                              <SelectGroup>
                                <SelectLabel>Chưa có sự kiện nào được tạo</SelectLabel>
                                <SelectItem value="__EMPTY_EVENT__" disabled>
                                  Danh sách sự kiện đang trống
                                </SelectItem>
                              </SelectGroup>
                            )}
                            <SelectSeparator />
                            <SelectItem value={MANUAL_EVENT_VALUE}>Nhập mã sự kiện thủ công...</SelectItem>
                          </SelectContent>
                        </Select>

                        {selectedEventId === MANUAL_EVENT_VALUE && (
                          <Input
                            value={manualEventCode}
                            onChange={(e) => setManualEventCode(e.target.value)}
                            placeholder="Nhập mã sự kiện..."
                            className="h-10 rounded-xl tabular-mono"
                          />
                        )}

                        {!loadingEvents && eventOptions.length === 0 && selectedEventId !== MANUAL_EVENT_VALUE && (
                          <p className="text-xs text-muted-foreground">
                            Chưa có sự kiện nào trong hệ thống. Bạn có thể tạo mới tại{" "}
                            <Link to="/admin/events" className="font-medium text-primary hover:underline">
                              Quản lý Sự kiện
                            </Link>{" "}
                            hoặc chọn &ldquo;Nhập mã sự kiện thủ công...&rdquo; trong danh sách trên.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {scopeKind === "FACULTY" && (
                    <>
                      <div className="space-y-1.5 md:col-span-4">
                        <Label htmlFor="grant-exp">Thời hạn hết hiệu lực (tùy chọn)</Label>
                        <Input
                          id="grant-exp"
                          type="datetime-local"
                          value={expiresAtInput}
                          onChange={(e) => setExpiresAtInput(e.target.value)}
                          className="h-10 rounded-xl tabular-mono"
                        />
                      </div>

                      <div className="flex items-end md:col-span-3">
                        <Button
                          type="submit"
                          disabled={submittingGrant}
                          className="h-10 w-full rounded-full"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{submittingGrant ? "Đang cấp quyền..." : "Cấp gói quyền"}</span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {scopeKind !== "FACULTY" && (
                  <div className="grid gap-4 md:grid-cols-12">
                    <div className="space-y-1.5 md:col-span-5">
                      <Label htmlFor="grant-exp">Thời hạn hết hiệu lực (tùy chọn)</Label>
                      <Input
                        id="grant-exp"
                        type="datetime-local"
                        value={expiresAtInput}
                        onChange={(e) => setExpiresAtInput(e.target.value)}
                        className="h-10 rounded-xl tabular-mono"
                      />
                    </div>
                    <div className="flex items-end md:col-span-4">
                      <p className="pb-2.5 text-xs text-muted-foreground">
                        Để trống nếu cấp quyền không giới hạn thời gian.
                      </p>
                    </div>
                    <div className="flex items-end md:col-span-3">
                      <Button
                        type="submit"
                        disabled={submittingGrant}
                        className="h-10 w-full rounded-full"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{submittingGrant ? "Đang cấp quyền..." : "Cấp gói quyền"}</span>
                      </Button>
                    </div>
                  </div>
                )}
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
                  <CardDescription>{body.governanceNote}</CardDescription>
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

        <TabsContent value="modules" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Tìm mã gói, tên hoặc mã quyền..."
                  className="h-9 rounded-full pl-9 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "ALL", label: "Tất cả", count: moduleCounts.all },
                  { key: "DEFAULT", label: "Mặc định", count: moduleCounts.defaultCount },
                  { key: "CUSTOM", label: "Tùy chỉnh", count: moduleCounts.customCount },
                  { key: "INACTIVE", label: "Tạm ngưng", count: moduleCounts.inactiveCount }
                ].map((chip) => {
                  const active = moduleFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setModuleFilter(chip.key)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span className="tabular-mono opacity-80">{chip.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              className="h-9 rounded-full"
              onClick={() => {
                setEditingModule(null);
                setModuleDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Tạo gói quyền mới</span>
            </Button>
          </div>

          {moduleNotice && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                moduleNotice.type === "ok"
                  ? "border-status-success/30 bg-status-success/10 text-status-success"
                  : "border-status-danger/30 bg-status-danger/10 text-status-danger"
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>{moduleNotice.text}</span>
            </div>
          )}

          <DataTable columns={moduleCols} data={filteredModules} />
        </TabsContent>
      </Tabs>

      <PermissionModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        moduleItem={editingModule}
        onSaved={(saved, mode) => {
          void refetchModules();
          setModuleNotice({
            type: "ok",
            text:
              mode === "create"
                ? `Đã tạo gói quyền ${saved.moduleCode} (${saved.name}).`
                : `Đã cập nhật gói quyền ${saved.moduleCode}.`
          });
        }}
      />

      <AuditActionDialog
        open={Boolean(toggleModuleTarget)}
        onOpenChange={(open) => {
          if (!open) setToggleModuleTarget(null);
        }}
        title={
          toggleModuleTarget?.active === false
            ? "Kích hoạt lại Gói Quyền"
            : "Tạm ngưng Gói Quyền"
        }
        description={
          toggleModuleTarget?.active === false
            ? "Gói quyền sẽ hoạt động trở lại và có thể tiếp tục cấp phát."
            : "Gói quyền sẽ bị ẩn khỏi danh sách cấp phát mới và ngừng hiệu lực với các tài khoản đang giữ."
        }
        targetSummary={
          toggleModuleTarget ? `${toggleModuleTarget.code} · ${toggleModuleTarget.label}` : ""
        }
        actionCode={
          toggleModuleTarget?.active === false ? "RBAC_MODULE_REACTIVATE" : "RBAC_MODULE_DISABLE"
        }
        confirmLabel={
          toggleModuleTarget?.active === false ? "Kích hoạt" : "Tạm ngưng"
        }
        onConfirm={async (reason) => {
          if (!toggleModuleTarget) return;
          try {
            const nextActive = toggleModuleTarget.active === false;
            await updateRbacModule(toggleModuleTarget.code, {
              active: nextActive,
              reason
            });
            void refetchModules();
            setModuleNotice({
              type: "ok",
              text: nextActive
                ? `Đã kích hoạt lại gói quyền ${toggleModuleTarget.code}.`
                : `Đã tạm ngưng gói quyền ${toggleModuleTarget.code}.`
            });
          } catch (err) {
            setModuleNotice({
              type: "err",
              text: extractApiErrorMessage(err, "Không thể cập nhật trạng thái gói quyền.")
            });
          }
        }}
      />

      <AuditActionDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Thu hồi Gói Quyền"
        description="Quyền truy cập của tài khoản sẽ bị thu hồi ngay sau khi xác nhận."
        targetSummary={
          revokeTarget ? `${revokeTarget.userName} · ${revokeTarget.moduleCode} (${revokeTarget.scopeLabel})` : ""
        }
        actionCode="RBAC_GRANT_REVOKE"
        confirmLabel="Xác nhận thu hồi"
        onConfirm={async (reason) => {
          if (!revokeTarget) return;
          try {
            await revokeRbacGrant({
              userId: revokeTarget.userId,
              moduleCode: revokeTarget.moduleCode,
              scopeId: revokeTarget.scopeId,
              reason
            });
            void refetchGrants();
            setGrantMsg({
              type: "ok",
              text: `Đã thu hồi gói ${revokeTarget.moduleCode} của ${revokeTarget.userName}.`
            });
          } catch (err) {
            setGrantMsg({
              type: "err",
              text: extractApiErrorMessage(err, "Không thể thu hồi gói quyền. Vui lòng thử lại.")
            });
          }
        }}
      />
    </div>
  );
}
