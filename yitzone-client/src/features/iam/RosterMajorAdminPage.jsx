import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Upload,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractApiErrorMessage } from "@/lib/api-client";
import {
  createMajorEntry,
  importMajorsCsv,
  importRosterFile,
  updateMajorEntry,
  useMajors,
  useRoster
} from "./api";
import {
  FACULTY_MAJOR_CATALOG,
  formatFacultyDisplayName,
  isAmbiguousMajorCode
} from "./data/faculty-major-catalog";

const SAMPLE_ROSTER_CSV = [
  "email;studentCode;fullName;className",
  "22110123@student.hcmute.edu.vn;22110123;Nguyễn Văn An;22110ST1A",
  "22133045@student.hcmute.edu.vn;22133045;Trần Thị Bình;22133KT1A",
  "22162018@student.hcmute.edu.vn;22162018;Lê Minh Quân;22162AI1A"
].join("\n");

function downloadSampleRosterCsv() {
  const blob = new Blob(["\uFEFF" + SAMPLE_ROSTER_CSV], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "yitzone_roster_mau.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function RosterMajorAdminPage() {
  const [activeTab, setActiveTab] = useState("roster");
  const [majors, setMajors] = useState(FACULTY_MAJOR_CATALOG);
  const [showAddMajor, setShowAddMajor] = useState(false);
  const [newMajorCode, setNewMajorCode] = useState("");
  const [newMajorName, setNewMajorName] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("Khoa Công nghệ Thông tin");

  const [rosterSearch, setRosterSearch] = useState("");
  const [majorSearch, setMajorSearch] = useState("");
  const [majorScopeFilter, setMajorScopeFilter] = useState("ALL");

  const [rosterUploading, setRosterUploading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [addingMajor, setAddingMajor] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);
  const [importError, setImportError] = useState(null);

  const csvInputRef = useRef(null);
  const rosterFileInputRef = useRef(null);

  const {
    data: apiMajors,
    isLoading: majorsLoading,
    refetch: refetchMajors
  } = useMajors(false, true);

  const {
    data: apiRoster,
    isLoading: rosterLoading,
    error: rosterQueryError,
    refetch: refetchRoster
  } = useRoster(rosterSearch.trim());

  const effectiveMajors = useMemo(() => {
    if (Array.isArray(apiMajors) && apiMajors.length > 0) {
      return apiMajors.map((m) => ({
        id: m.id ?? `m-${m.majorCode}-${m.facultyName}`,
        facultyName: m.facultyName,
        majorCode: m.majorCode,
        majorName: m.majorName,
        fitFaculty: Boolean(m.fitFaculty),
        active: m.active !== false
      }));
    }
    return majors.map((m) => ({ ...m, active: m.active !== false }));
  }, [apiMajors, majors]);

  const handleToggleMajorFlag = async (major, patch, label) => {
    setImportError(null);
    setImportFeedback(null);
    try {
      await updateMajorEntry(major.majorCode, patch);
      void refetchMajors();
      setImportFeedback(`Đã cập nhật ngành ${major.majorCode} (${label}).`);
    } catch (err) {
      setImportError(extractApiErrorMessage(err, "Không thể cập nhật cấu hình ngành học."));
    }
  };

  const rosterCount = Array.isArray(apiRoster) ? apiRoster.length : 0;
  const fitMajorCount = useMemo(
    () => effectiveMajors.filter((m) => m.fitFaculty).length,
    [effectiveMajors]
  );

  const filteredRoster = useMemo(() => {
    const source = Array.isArray(apiRoster) ? apiRoster : [];
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (r) =>
        String(r.code ?? "").toLowerCase().includes(q) ||
        String(r.fullName ?? "").toLowerCase().includes(q) ||
        String(r.email ?? "").toLowerCase().includes(q) ||
        String(r.className ?? "").toLowerCase().includes(q)
    );
  }, [apiRoster, rosterSearch]);

  const filteredMajors = useMemo(() => {
    const q = majorSearch.trim().toLowerCase();
    return effectiveMajors.filter((m) => {
      if (majorScopeFilter === "FIT" && !m.fitFaculty) return false;
      if (majorScopeFilter === "OTHER" && m.fitFaculty) return false;
      if (!q) return true;
      return (
        m.majorCode.toLowerCase().includes(q) ||
        m.majorName.toLowerCase().includes(q) ||
        m.facultyName.toLowerCase().includes(q)
      );
    });
  }, [effectiveMajors, majorScopeFilter, majorSearch]);

  const handleAddMajor = async (e) => {
    e.preventDefault();
    const code = newMajorCode.trim();
    const name = newMajorName.trim();
    const fac = newFacultyName.trim();
    if (!/^[0-9]{3}$/.test(code) || !name || !fac) return;

    setAddingMajor(true);
    setImportError(null);
    setImportFeedback(null);
    try {
      const saved = await createMajorEntry({
        majorCode: code,
        majorName: name,
        facultyName: fac
      });
      setMajors((prev) => [
        {
          id: saved.id ?? `m-${saved.majorCode}-${Date.now()}`,
          facultyName: saved.facultyName,
          majorCode: saved.majorCode,
          majorName: saved.majorName,
          fitFaculty: Boolean(saved.fitFaculty)
        },
        ...prev.filter((m) => m.majorCode !== saved.majorCode)
      ]);
      void refetchMajors();
      setImportFeedback(`Đã thêm ngành ${saved.majorCode} — ${saved.majorName}.`);
      setNewMajorCode("");
      setNewMajorName("");
      setShowAddMajor(false);
    } catch (err) {
      setImportError(
        extractApiErrorMessage(err, "Không thể lưu ngành mới. Vui lòng thử lại.")
      );
    } finally {
      setAddingMajor(false);
    }
  };

  const handleRosterFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setRosterUploading(true);
    setImportFeedback(null);
    setImportError(null);
    try {
      const res = await importRosterFile(file);
      void refetchRoster();
      setImportFeedback(
        `Đã nhập ${res.importedCount} hồ sơ (${res.insertedCount} mới, ${res.updatedCount} cập nhật${res.skippedCount > 0 ? `, ${res.skippedCount} bỏ qua` : ""}).`
      );
    } catch (err) {
      setImportError(
        extractApiErrorMessage(err, "Không thể nhập tệp CSV/Excel. Vui lòng kiểm tra định dạng cột.")
      );
    } finally {
      setRosterUploading(false);
    }
  };

  const handleCsvFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setCsvUploading(true);
    setImportFeedback(null);
    setImportError(null);
    try {
      const res = await importMajorsCsv(file);
      void refetchMajors();
      setImportFeedback(`Đã nhập ${res.importedCount} ngành vào danh mục Khoa – Ngành.`);
    } catch (err) {
      setImportError(
        extractApiErrorMessage(err, "Không thể nhập tệp CSV danh mục Khoa – Ngành.")
      );
    } finally {
      setCsvUploading(false);
    }
  };

  const rosterCols = [
    {
      key: "code",
      header: "MSSV / Mã CB",
      render: (r) => <span className="tabular-mono font-semibold text-foreground">{r.code || "—"}</span>
    },
    {
      key: "fullName",
      header: "Họ và tên",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{r.fullName || "—"}</div>
          {r.className && <div className="tabular-mono text-[11px] text-muted-foreground">{r.className}</div>}
        </div>
      )
    },
    {
      key: "email",
      header: "Email trường",
      render: (r) => <span className="text-muted-foreground">{r.email}</span>
    },
    {
      key: "major",
      header: "Mã ngành",
      render: (r) => <span className="tabular-mono text-foreground">{r.majorCode || "—"}</span>
    },
    {
      key: "fit",
      header: "Quyền lợi CĐDN",
      align: "right",
      render: (r) =>
        r.fitFaculty ? (
          <Badge variant="success">Khoa CNTT · CĐDN</Badge>
        ) : (
          <Badge variant="secondary">Khoa khác</Badge>
        )
    }
  ];

  const majorCols = [
    {
      key: "code",
      header: "Mã ngành",
      render: (m) => <span className="tabular-mono font-semibold text-foreground">{m.majorCode}</span>
    },
    {
      key: "name",
      header: "Tên ngành học",
      render: (m) => <span className="font-medium text-foreground">{m.majorName}</span>
    },
    {
      key: "faculty",
      header: "Khoa quản lý",
      render: (m) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground">{formatFacultyDisplayName(m.facultyName)}</span>
          {isAmbiguousMajorCode(m.majorCode) && (
            <Badge variant="warning" className="text-[10px]">Trùng mã</Badge>
          )}
        </div>
      )
    },
    {
      key: "fit",
      header: "Xét CĐDN",
      align: "right",
      render: (m) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {m.fitFaculty ? (
            <Badge variant="success">Thuộc Khoa CNTT</Badge>
          ) : (
            <Badge variant="outline">Khoa ngoài</Badge>
          )}
          {!m.active && <Badge variant="secondary">Tạm ẩn</Badge>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() =>
              void handleToggleMajorFlag(
                m,
                { fitFaculty: !m.fitFaculty },
                !m.fitFaculty ? "Bật CĐDN Khoa CNTT" : "Tắt CĐDN Khoa CNTT"
              )
            }
          >
            {m.fitFaculty ? "Bỏ CNTT" : "Đặt CNTT"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() =>
              void handleToggleMajorFlag(
                m,
                { active: !m.active },
                m.active ? "Tạm ẩn ngành ngừng tuyển" : "Kích hoạt lại ngành"
              )
            }
          >
            {m.active ? "Tạm ẩn" : "Hiện lại"}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Danh sách chính thức &amp; Ngành học
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách sinh viên, cán bộ từ nhà trường và danh mục Khoa – Ngành xét quyền lợi CĐDN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary" className="rounded-full px-3 py-1 tabular-mono">
            {rosterCount} hồ sơ Roster
          </Badge>
          <Badge variant="success" className="rounded-full px-3 py-1 tabular-mono">
            {fitMajorCount}/{effectiveMajors.length} ngành CNTT
          </Badge>
          <input
            ref={rosterFileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => void handleRosterFileChange(e)}
          />
          <Button
            type="button"
            size="sm"
            className="rounded-full px-4"
            disabled={rosterUploading}
            onClick={() => rosterFileInputRef.current?.click()}
          >
            {rosterUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{rosterUploading ? "Đang nhập..." : "Nhập Roster CSV / Excel"}</span>
          </Button>
        </div>
      </div>

      {importFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{importFeedback}</span>
          </span>
          <button type="button" onClick={() => setImportFeedback(null)} className="px-1 py-0.5 underline">
            Đóng
          </button>
        </div>
      )}

      {importError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-xs font-medium text-status-danger"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{importError}</span>
          </span>
          <button type="button" onClick={() => setImportError(null)} className="px-1 py-0.5 underline">
            Đóng
          </button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="roster">Sinh viên &amp; Cán bộ ({rosterCount})</TabsTrigger>
          <TabsTrigger value="majors">Danh mục Khoa – Ngành ({effectiveMajors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-3.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm trong danh sách chính thức"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Tìm theo MSSV, họ tên, lớp hoặc email..."
                className="h-9 rounded-xl pl-9 pr-8 text-xs"
              />
              {rosterSearch && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa tìm kiếm"
                  onClick={() => setRosterSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs"
                onClick={downloadSampleRosterCsv}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Tải file mẫu CSV</span>
              </Button>
            </div>
          </div>

          <DataTable
            columns={rosterCols}
            data={filteredRoster}
            loading={rosterLoading}
            error={
              rosterQueryError
                ? extractApiErrorMessage(rosterQueryError, "Không thể tải danh sách từ máy chủ.")
                : null
            }
            onRetry={() => void refetchRoster()}
            emptyTitle={
              rosterSearch.trim()
                ? "Không tìm thấy hồ sơ khớp từ khóa"
                : "Chưa có danh sách sinh viên nào"
            }
            emptyDescription={
              rosterSearch.trim()
                ? "Thử kiểm tra lại MSSV, họ tên hoặc xóa bộ lọc đang nhập."
                : "Tải lên tệp CSV hoặc Excel (.xlsx) từ Phòng Đào tạo để hệ thống tự đối chiếu MSSV khi sinh viên đăng nhập."
            }
            emptyAction={
              !rosterSearch.trim() ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full px-4"
                    disabled={rosterUploading}
                    onClick={() => rosterFileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Nhập tệp CSV / Excel</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                    onClick={downloadSampleRosterCsv}
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải file mẫu</span>
                  </Button>
                </div>
              ) : null
            }
          />
        </TabsContent>

        <TabsContent value="majors" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-3.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm mã ngành, tên ngành hoặc khoa"
                value={majorSearch}
                onChange={(e) => setMajorSearch(e.target.value)}
                placeholder="Tìm theo mã ngành, tên ngành hoặc khoa quản lý..."
                className="h-9 rounded-xl pl-9 pr-8 text-xs"
              />
              {majorSearch && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa tìm ngành"
                  onClick={() => setMajorSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44">
                <Select value={majorScopeFilter} onValueChange={setMajorScopeFilter}>
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Phạm vi khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả ngành ({effectiveMajors.length})</SelectItem>
                    <SelectItem value="FIT">Thuộc Khoa CNTT ({fitMajorCount})</SelectItem>
                    <SelectItem value="OTHER">Khoa ngoài ({effectiveMajors.length - fitMajorCount})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => void handleCsvFileChange(e)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs"
                disabled={csvUploading}
                onClick={() => csvInputRef.current?.click()}
              >
                {csvUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                <span>{csvUploading ? "Đang nhập..." : "Nhập CSV"}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant={showAddMajor ? "secondary" : "default"}
                className="h-9 rounded-full px-4 text-xs"
                onClick={() => setShowAddMajor((v) => !v)}
              >
                {showAddMajor ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{showAddMajor ? "Đóng form" : "Thêm ngành"}</span>
              </Button>
            </div>
          </div>

          {showAddMajor && (
            <form
              onSubmit={(e) => void handleAddMajor(e)}
              className="rounded-2xl border border-border/80 bg-card/70 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Thêm ngành học mới</h2>
                <span className="text-xs text-muted-foreground">
                  Mã ngành gồm 3 chữ số (vị trí thứ 3–5 trong MSSV)
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="new-major-code" className="text-xs">
                    Mã ngành
                  </Label>
                  <Input
                    id="new-major-code"
                    value={newMajorCode}
                    maxLength={3}
                    inputMode="numeric"
                    onChange={(e) => setNewMajorCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="162"
                    className="h-9 rounded-xl tabular-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-5">
                  <Label htmlFor="new-major-name" className="text-xs">
                    Tên ngành học
                  </Label>
                  <Input
                    id="new-major-name"
                    value={newMajorName}
                    onChange={(e) => setNewMajorName(e.target.value)}
                    placeholder="VD: Trí tuệ Nhân tạo"
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-5">
                  <Label htmlFor="new-faculty-name" className="text-xs">
                    Khoa quản lý
                  </Label>
                  <Input
                    id="new-faculty-name"
                    value={newFacultyName}
                    onChange={(e) => setNewFacultyName(e.target.value)}
                    placeholder="Khoa Công nghệ Thông tin"
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowAddMajor(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={
                    addingMajor ||
                    !/^[0-9]{3}$/.test(newMajorCode.trim()) ||
                    !newMajorName.trim() ||
                    !newFacultyName.trim()
                  }
                >
                  {addingMajor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>{addingMajor ? "Đang lưu..." : "Lưu ngành học"}</span>
                </Button>
              </div>
            </form>
          )}

          <DataTable
            columns={majorCols}
            data={filteredMajors}
            loading={majorsLoading && effectiveMajors.length === 0}
            emptyTitle="Không tìm thấy ngành học phù hợp"
            emptyDescription="Thử đổi từ khóa hoặc chọn lại bộ lọc phạm vi khoa."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
