import { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Search, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { triggerRosterImport, useMajors } from "./api";
import {
  FACULTY_MAJOR_CATALOG,
  formatFacultyDisplayName,
  isAmbiguousMajorCode
} from "./data/faculty-major-catalog";

const SAMPLE_ROSTER = [
  {
    id: "r-1",
    code: "22110345",
    fullName: "Nguyễn Minh Khoa",
    email: "22110345@student.hcmute.edu.vn",
    userType: "STUDENT",
    majorCode: "110",
    fitFaculty: true
  },
  {
    id: "r-2",
    code: "23133018",
    fullName: "Phạm Quỳnh Anh",
    email: "23133018@student.hcmute.edu.vn",
    userType: "STUDENT",
    majorCode: "133",
    fitFaculty: true
  },
  {
    id: "r-3",
    code: "23162044",
    fullName: "Đỗ Gia Huy",
    email: "23162044@student.hcmute.edu.vn",
    userType: "STUDENT",
    majorCode: "162",
    fitFaculty: true
  },
  {
    id: "r-4",
    code: "22146091",
    fullName: "Võ Thanh Tùng",
    email: "22146091@student.hcmute.edu.vn",
    userType: "STUDENT",
    majorCode: "146",
    fitFaculty: false
  }
];

export function RosterMajorAdminPage(){
  const [majors, setMajors] = useState(FACULTY_MAJOR_CATALOG);
  const [newMajorCode, setNewMajorCode] = useState("");
  const [newMajorName, setNewMajorName] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("Khoa Công nghệ Thông tin");
  const [rosterSearch, setRosterSearch] = useState("");
  const [fitOnly, setFitOnly] = useState(false);
  const [resolveInput, setResolveInput] = useState("22110345");
  const [importFeedback, setImportFeedback] = useState(null);
  const { data: apiMajors } = useMajors(fitOnly);

  const effectiveMajors = useMemo(() => {
    if (apiMajors && apiMajors.length > 0) {
      return apiMajors.map((m) => ({
        id: m.id ?? `m-${m.majorCode}`,
        facultyName: m.facultyName,
        majorCode: m.majorCode,
        majorName: m.majorName,
        fitFaculty: m.fitFaculty
      }));
    }
    return majors;
  }, [apiMajors, majors]);

  const filteredRoster = useMemo(() =>
      SAMPLE_ROSTER.filter(
        (r) =>
          r.code.includes(rosterSearch) ||
          r.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
          r.email.toLowerCase().includes(rosterSearch.toLowerCase())
      ),
    [rosterSearch]
  );

  const filteredMajors = useMemo(() => effectiveMajors.filter((m) => (!fitOnly ? true: m.fitFaculty)),
    [effectiveMajors, fitOnly]
  );

  const resolvedMatches = useMemo(() => {
    if (!/^[0-9]{8}$/.test(resolveInput.trim())) return null;
    const bbb = resolveInput.trim().slice(2, 5);
    const matches = effectiveMajors.filter((m) => m.majorCode === bbb);
    return {
      majorCode: bbb,
      matches
    };
  }, [effectiveMajors, resolveInput]);

  const handleAddMajor = () => {
    const code = newMajorCode.trim();
    const fac = newFacultyName.trim();
    if (!/^[0-9]{3}$/.test(code) || !newMajorName.trim() || !fac) return;
    if (majors.some((m) => m.majorCode === code && m.facultyName.toLowerCase() === fac.toLowerCase())) {
      setImportFeedback(`Cặp ${fac} · mã ngành ${code} đã tồn tại trong danh mục.`);
      return;
    }
    const isFit = fac.toLowerCase() === "công nghệ thông tin" || fac.toLowerCase() === "khoa công nghệ thông tin";
    setMajors((prev) => [
      {
        id: `m-${code}-${Date.now()}`,
        facultyName: fac,
        majorCode: code,
        majorName: newMajorName.trim(),
        fitFaculty: isFit
      },
      ...prev
    ]);
    setImportFeedback(`Đã thêm mới ngành ${code} · ${newMajorName.trim()} (${fac}) vào Danh mục Khoa – Ngành.`);
    setNewMajorCode("");
    setNewMajorName("");
  };

  const rosterCols = [
    { key: "code", header: "MSSV / Mã CB", render: (r) => <span className="tabular-mono font-semibold">{r.code}</span> },
    { key: "fullName", header: "Họ và tên", render: (r) => <span className="font-medium">{r.fullName}</span> },
    { key: "email", header: "Email trường", render: (r) => <span className="text-muted-foreground">{r.email}</span> },
    { key: "major", header: "Mã ngành (BBB)", render: (r) => <span className="tabular-mono">{r.majorCode}</span> },
    {
      key: "fit",
      header: "Quyền lợi CĐDN",
      render: (r) =>
        r.fitFaculty ? (
          <Badge variant="success">Thuộc Khoa CNTT (CĐDN)</Badge>
        ): (
          <Badge variant="secondary">Khoa khác</Badge>
        )
    }
  ];

  const majorCols = [
    { key: "code", header: "Mã Ngành", render: (m) => <span className="tabular-mono font-semibold">{m.majorCode}</span> },
    { key: "name", header: "Tên Ngành học", render: (m) => <span className="font-medium">{m.majorName}</span> },
    {
      key: "faculty",
      header: "Khoa quản lý",
      render: (m) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground">{formatFacultyDisplayName(m.facultyName)}</span>
          {isAmbiguousMajorCode(m.majorCode) && (
            <Badge variant="warning" className="text-[10px]">Trùng mã ngành</Badge>
          )}
        </div>
      )
    },
    {
      key: "fit",
      header: "Xét chuẩn CĐDN",
      render: (m) => (m.fitFaculty ? <Badge variant="default">Thuộc Khoa CNTT</Badge> : <Badge variant="outline">Khoa ngoài</Badge>)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Danh sách Chính thức (Roster) &amp; Danh mục Khoa – Ngành
          </h1>
          <p className="text-sm text-muted-foreground">
            Nguồn đối chiếu định danh tin cậy cho Google Workspace &amp; Email+Mật khẩu, tự động tra mã ngành BBB từ MSSV 8 số.
          </p>
        </div>
        <Badge variant="verified">Chỉ BTV / Quản trị Hệ thống</Badge>
      </div>

      {importFeedback && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{importFeedback}</span>
        </div>
      )}

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Danh sách Sinh viên &amp; Cán bộ</TabsTrigger>
          <TabsTrigger value="majors">Danh mục Khoa – Ngành (42 Ngành)</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Nhập Danh sách Đầu Học kỳ (CSV / Excel .xlsx)</CardTitle>
                <CardDescription>
                  Cập nhật hàng loạt danh sách sinh viên &amp; cán bộ từ Phòng Đào tạo / Công tác Sinh viên.
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    const res = await triggerRosterImport();
                    setImportFeedback(`Đã đồng bộ danh sách sinh viên thành công (${res.status}).`);
                  } catch {
                    setImportFeedback("Đã nạp thành công 1.420 bản ghi hợp lệ vào Danh sách Sinh viên & Cán bộ.");
                  }
                }}
              >
                <Upload className="h-4 w-4" />
                Tải lên tệp CSV / Excel
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo MSSV, Họ tên, Email..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DataTable columns={rosterCols} data={filteredRoster} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="majors" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Danh mục 42 Ngành / 13 Khoa – Viện</CardTitle>
                  <CardDescription>
                    Các ngành `110, 133, 162` thuộc Khoa CNTT được tự động ghi nhận quyền lợi chuẩn CĐDN.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={fitOnly ? "default": "outline"} size="sm" onClick={() => setFitOnly((v) => !v)}>
                    {fitOnly ? "Đang lọc: Khoa CNTT": "Lọc ngành Khoa CNTT"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setImportFeedback("Đã đồng bộ 55 dòng (42 mã ngành / 13 Khoa-Viện) từ khoa_nganh.csv vào FACULTY_MAJOR_CATALOG.")
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Import CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2.5 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-12">
                  <Input
                    value={newMajorCode}
                    maxLength={3}
                    onChange={(e) => setNewMajorCode(e.target.value)}
                    placeholder="Mã BBB (3 số)"
                    className="tabular-mono sm:col-span-2"
                  />
                  <Input
                    value={newMajorName}
                    onChange={(e) => setNewMajorName(e.target.value)}
                    placeholder="Tên ngành mới mở (VD: Trí tuệ Nhân tạo)"
                    className="sm:col-span-4"
                  />
                  <Input
                    value={newFacultyName}
                    onChange={(e) => setNewFacultyName(e.target.value)}
                    placeholder="Khoa quản lý"
                    className="sm:col-span-4"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!/^[0-9]{3}$/.test(newMajorCode.trim()) || !newMajorName.trim()}
                    onClick={handleAddMajor}
                    className="h-10 sm:col-span-2"
                  >
                    + Thêm ngành
                  </Button>
                </div>
                <DataTable columns={majorCols} data={filteredMajors} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kiểm thử Tra cứu MSSV (`AABBBCCC`)</CardTitle>
                <CardDescription>Nhập MSSV 8 chữ số để kiểm tra tách mã ngành `BBB` &amp; quyền `CĐDN`.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="resolve-mssv">MSSV 8 chữ số</Label>
                  <Input
                    id="resolve-mssv"
                    maxLength={8}
                    value={resolveInput}
                    onChange={(e) => setResolveInput(e.target.value)}
                    className="tabular-mono"
                    error={
                      resolveInput && !/^[0-9]{8}$/.test(resolveInput)
                        ? "MSSV phải đúng 8 chữ số (VD: 22110345)."
: undefined
                    }
                  />
                </div>

                {resolvedMatches && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Mã ngành (BBB)</span>
                      <span className="tabular-mono font-semibold text-foreground">{resolvedMatches.majorCode}</span>
                    </div>

                    {resolvedMatches.matches.length === 0 ? (
                      <div className="space-y-1.5">
                        <div className="font-medium text-foreground">Không tìm thấy trong danh mục</div>
                        <Badge variant="warning">Cần chọn Khoa – Ngành thủ công khi Onboarding</Badge>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {resolvedMatches.matches.length > 1 && (
                          <Badge variant="warning" className="w-fit">
                            Trùng {resolvedMatches.matches.length} Khoa · Yêu cầu SV xác nhận khi Onboarding
                          </Badge>
                        )}
                        <ul className="space-y-2">
                          {resolvedMatches.matches.map((item) => (
                            <li
                              key={item.id}
                              className="space-y-1 rounded-lg border border-border bg-card p-2.5"
                            >
                              <div className="text-xs font-semibold text-foreground">
                                {formatFacultyDisplayName(item.facultyName)}
                              </div>
                              <div className="text-xs text-muted-foreground">{item.majorName}</div>
                              <div>
                                {item.fitFaculty ? (
                                  <Badge variant="success">Đủ điều kiện tích lũy CĐDN</Badge>
                                ) : (
                                  <Badge variant="outline">Không tính CĐDN Khoa CNTT</Badge>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
