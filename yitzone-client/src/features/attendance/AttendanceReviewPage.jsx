import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  MonitorPlay,
  QrCode,
  Search,
  ShieldAlert,
  UserCheck
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
import { useEventStore } from "@/stores/event-store";

const INITIAL_QUEUE = [
  {
    id: "rq-1",
    studentCode: "22110345",
    fullName: "Nguyễn Minh Khoa",
    flagLabel: "Tọa độ GPS lệch nhẹ (+1đ)",
    flagCode: "GPS_MINOR_DRIFT",
    riskWeight: 1,
    scannedAt: "08:12:04"
  },
  {
    id: "rq-2",
    studentCode: "22110489",
    fullName: "Trần Thảo Vy",
    flagLabel: "Khóa thiết bị mới tạo < 15 phút (+1đ)",
    flagCode: "RECENT_DEVICE_BINDING",
    riskWeight: 1,
    scannedAt: "08:14:31"
  },
  {
    id: "rq-3",
    studentCode: "23110219",
    fullName: "Lê Quốc Bảo",
    flagLabel: "Trùng thiết bị điểm danh (+2đ · Tín hiệu Mạnh)",
    flagCode: "DEVICE_TOKEN_COLLISION",
    riskWeight: 2,
    scannedAt: "08:18:10"
  },
  {
    id: "rq-4",
    studentCode: "24110077",
    fullName: "Phạm Gia Bảo (Vãng lai)",
    flagLabel: "Thẻ SV vãng lai chưa đăng ký (+2đ · Tín hiệu Mạnh)",
    flagCode: "BARCODE_WALKIN_UNVERIFIED",
    riskWeight: 2,
    scannedAt: "08:21:55"
  }
];

const STUDENT_DIRECTORY = [
  { mssv: "22110345", fullName: "Nguyễn Minh Khoa", major: "K22 Công nghệ Phần mềm (110)", registered: true },
  { mssv: "22110418", fullName: "Trần Đức Thịnh", major: "K22 Hệ thống Thông tin (110)", registered: true },
  { mssv: "23110214", fullName: "Nguyễn Minh Khôi", major: "K23 Công nghệ Thông tin (110)", registered: true },
  { mssv: "23110308", fullName: "Trần Thảo Vy", major: "K23 Công nghệ Thông tin (110)", registered: true },
  { mssv: "24162019", fullName: "Lê Quốc Bảo", major: "K24 An toàn Thông tin (162)", registered: false }
];

export function AttendanceReviewPage() {
  const [searchParams] = useSearchParams();
  const events = useEventStore((s) => s.events);

  const [selectedEventId, setSelectedEventId] = useState(
    () => searchParams.get("eventId") ?? events[0]?.id ?? "EVT-2026-CLOUD"
  );
  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? events[0],
    [events, selectedEventId]
  );
  const sessions = selectedEvent?.sessions ?? [];
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => sessions[0]?.id ?? "S1"
  );

  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [selectedIds, setSelectedIds] = useState([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [pickedStudent, setPickedStudent] = useState(
    STUDENT_DIRECTORY[0]
  );
  const [auditModal, setAuditModal] = useState(null);
  const [notice, setNotice] = useState(null);

  const filteredDirectory = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return STUDENT_DIRECTORY;
    return STUDENT_DIRECTORY.filter(
      (s) => s.mssv.includes(q) || s.fullName.toLowerCase().includes(q)
    );
  }, [studentQuery]);

  const columns = [
    {
      key: "code",
      header: "MSSV",
      render: (r) => <span className="tabular-mono font-semibold">{r.studentCode}</span>
    },
    {
      key: "name",
      header: "Họ và tên",
      render: (r) => <span className="font-medium">{r.fullName}</span>
    },
    {
      key: "flags",
      header: "Cờ Rủi ro Trọng số",
      render: (r) => (
        <span title={`Mã kỹ thuật: ${r.flagCode}`}>
          <Badge variant={r.riskWeight === 2 ? "danger" : "warning"}>{r.flagLabel}</Badge>
        </span>
      )
    },
    {
      key: "time",
      header: "Giờ quét",
      render: (r) => <span className="tabular-mono text-xs text-muted-foreground">{r.scannedAt}</span>
    },
    {
      key: "actions",
      header: "Quyết định (Hạn 48h)",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setAuditModal({
                title: "Chấp nhận Lượt Điểm danh Hậu kiểm",
                summary: `${r.fullName} (${r.studentCode}) · ${r.flagLabel}`,
                code: "ATTENDANCE_REVIEW_APPROVE",
                destructive: false,
                onDone: () => {
                  setQueue((prev) => prev.filter((x) => x.id !== r.id));
                  setNotice(`Đã chấp nhận lượt điểm danh của ${r.fullName} và ghi Audit Log.`);
                }
              })
            }
          >
            Chấp nhận
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              setAuditModal({
                title: "Từ chối Lượt Điểm danh Vi phạm",
                summary: `${r.fullName} (${r.studentCode}) · ${r.flagLabel}`,
                code: "ATTENDANCE_REVIEW_REJECT",
                destructive: true,
                onDone: () => {
                  setQueue((prev) => prev.filter((x) => x.id !== r.id));
                  setNotice(`Đã từ chối lượt điểm danh của ${r.fullName} (không cấp E-Cert).`);
                }
              })
            }
          >
            Từ chối
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Hậu kiểm Điểm danh 48 giờ &amp; Điểm danh Bù Có Kiểm toán
          </h1>
          <p className="text-sm text-muted-foreground">
            Chấm điểm rủi ro trọng số, khóa duyệt hàng loạt nhóm Tín hiệu Mạnh (+2đ) và điểm danh bù có tra cứu hồ sơ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="warning">
            <Clock className="h-3.5 w-3.5" />
            Hạn hậu kiểm còn: 41h 20p
          </Badge>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to={`/stage/checkin?eventId=${selectedEvent?.id ?? "EVT-2026-CLOUD"}`}>
              <MonitorPlay className="h-4 w-4 text-primary" />
              <span>Chiếu QR Động LED 16:9</span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to={`/staff/scanner?eventId=${selectedEvent?.id ?? "EVT-2026-CLOUD"}`}>
              <QrCode className="h-4 w-4" />
              <span>Mở Máy Soát vé Hiện trường</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Event & Session Context Selector */}
      <div className="grid gap-3 rounded-2xl border border-border/80 bg-card/70 p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sự kiện đang rà soát hậu kiểm</Label>
          <Select
            value={selectedEvent?.id ?? ""}
            onValueChange={(val) => {
              setSelectedEventId(val);
              const ev = events.find((e) => e.id === val);
              if (ev?.sessions[0]) setSelectedSessionId(ev.sessions[0].id);
            }}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Buổi / Ca điểm danh</Label>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.timeRange})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <Tabs defaultValue="review" className="w-full">
        <TabsList>
          <TabsTrigger value="review">Hàng chờ Hậu kiểm 48h ({queue.length})</TabsTrigger>
          <TabsTrigger value="manual">Điểm danh Sớm BTC &amp; Bù tay</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-status-danger/25 bg-status-danger/5 px-4 py-2.5 text-xs text-status-danger">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Quy tắc duyệt: Chỉ cho phép &ldquo;Xác nhận hàng loạt&rdquo; với cảnh báo nhẹ (+1đ). Các ca Tín hiệu Mạnh (+2đ) bị khóa checkbox hàng loạt và bắt buộc xét duyệt thủ công từng trường hợp.
            </span>
          </div>

          <DataTable
            columns={columns}
            data={queue}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            isRowBulkDisabled={(row) => row.riskWeight === 2}
            bulkDisabledReason="Cấm duyệt hàng loạt với cờ Tín hiệu Mạnh (+2đ)"
            bulkActions={
              <Button
                size="sm"
                onClick={() =>
                  setAuditModal({
                    title: "Xác nhận hàng loạt nhóm Cảnh báo Nhẹ (+1đ)",
                    summary: `${selectedIds.length} lượt điểm danh · ${selectedEvent?.title ?? ""}`,
                    code: "ATTENDANCE_BULK_APPROVE_WEAK",
                    destructive: false,
                    onDone: () => {
                      setQueue((prev) => prev.filter((x) => !selectedIds.includes(x.id)));
                      setSelectedIds([]);
                      setNotice(`Đã duyệt hàng loạt ${selectedIds.length} lượt cảnh báo nhẹ (+1đ).`);
                    }
                  })
                }
              >
                Chấp nhận {selectedIds.length} lượt nhẹ
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="manual" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Điểm danh Bù Bằng tay Có Tra cứu Hồ sơ
              </CardTitle>
              <CardDescription>
                Tìm kiếm sinh viên theo MSSV hoặc Họ tên để kiểm tra trạng thái đăng ký trước khi xác nhận điểm danh bù.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="manual-student-search">Tìm sinh viên theo MSSV hoặc Họ tên</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="manual-student-search"
                    placeholder="Nhập MSSV hoặc tên (VD: 22110345, Nguyễn Minh...)"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-border/80 bg-muted/25 p-2">
                {filteredDirectory.map((stu) => {
                  const isPicked = pickedStudent?.mssv === stu.mssv;
                  return (
                    <button
                      key={stu.mssv}
                      type="button"
                      onClick={() => setPickedStudent(stu)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        isPicked
                          ? "bg-primary/12 font-semibold text-primary"
                          : "hover:bg-card text-foreground"
                      }`}
                    >
                      <span>
                        <span className="tabular-mono font-semibold">{stu.mssv}</span> · {stu.fullName}
                      </span>
                      <Badge variant={stu.registered ? "success" : "warning"}>
                        {stu.registered ? "Đã đăng ký" : "Vãng lai"}
                      </Badge>
                    </button>
                  );
                })}
              </div>

              {pickedStudent && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-xs space-y-1">
                  <div className="font-semibold text-foreground">
                    Hồ sơ xác nhận: {pickedStudent.fullName} ({pickedStudent.mssv})
                  </div>
                  <div className="text-muted-foreground">
                    {pickedStudent.major} · Sự kiện: <strong>{selectedEvent?.title}</strong>
                  </div>
                </div>
              )}

              <Button
                type="button"
                disabled={!pickedStudent}
                onClick={() => {
                  if (!pickedStudent) return;
                  setAuditModal({
                    title: "Xác nhận Điểm danh Bù Bằng tay",
                    summary: `${pickedStudent.fullName} (${pickedStudent.mssv}) · ${selectedEvent?.title ?? ""} (${selectedSessionId})`,
                    code: "ATTENDANCE_MANUAL_OVERRIDE",
                    destructive: false,
                    onDone: () => {
                      setNotice(
                        `Đã ghi nhận điểm danh bù cho ${pickedStudent.fullName} (${pickedStudent.mssv}) tại "${selectedEvent?.title}" và lưu Audit Log.`
                      );
                    }
                  });
                }}
              >
                Ghi nhận Điểm danh Bù (Yêu cầu lý do Audit)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Điểm danh Sớm Thành viên BTC (Trước 1–2 giờ)</CardTitle>
              <CardDescription>
                Ghi nhận thành viên BTC đã duyệt đến làm nhiệm vụ sớm — là điều kiện miễn bài thu hoạch khi chốt E-Cert.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                <div>
                  <div className="font-medium text-foreground">Trần Thảo Vy (Lễ tân)</div>
                  <div className="tabular-mono text-xs text-muted-foreground">22110412 · Đã duyệt BTC</div>
                </div>
                <Badge variant="success">Đã điểm danh sớm</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                <div>
                  <div className="font-medium text-foreground">Lê Hoàng Nam (Kỹ thuật LED)</div>
                  <div className="tabular-mono text-xs text-muted-foreground">23110188 · Đã duyệt BTC</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNotice("Đã điểm danh sớm BTC cho Lê Hoàng Nam (23110188).")}
                >
                  Xác nhận có mặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(auditModal)}
        onOpenChange={(open) => {
          if (!open) setAuditModal(null);
        }}
        title={auditModal?.title ?? ""}
        description="Quyết định hậu kiểm và điểm danh bù được lưu bất biến vào Audit Log."
        targetSummary={auditModal?.summary ?? ""}
        actionCode={auditModal?.code ?? "ATTENDANCE_AUDIT"}
        destructive={auditModal?.destructive ?? false}
        onConfirm={() => {
          auditModal?.onDone();
        }}
      />
    </div>
  );
}
