import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  MonitorPlay,
  QrCode,
  ShieldAlert,
  UserCheck,
  Users
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
import { mergeStoredAndApiEvents, useEvents } from "@/features/events/api";
import { useEventStore } from "@/stores/event-store";

const INITIAL_QUEUE = [];

export function AttendanceReviewPage() {
  const [searchParams] = useSearchParams();
  const queryEventId = searchParams.get("eventId") ?? "";
  const storedEvents = useEventStore((s) => s.events);
  const { data: apiEventsData } = useEvents();
  const events = useMemo(
    () => mergeStoredAndApiEvents(storedEvents, apiEventsData),
    [storedEvents, apiEventsData]
  );

  const [selectedEventId, setSelectedEventId] = useState(
    () => queryEventId || events[0]?.id || ""
  );
  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId]
  );
  const sessions = useMemo(
    () => selectedEvent?.sessions ?? [],
    [selectedEvent]
  );
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => sessions[0]?.id ?? ""
  );
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? sessions[0] ?? null,
    [sessions, selectedSessionId]
  );

  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [selectedIds, setSelectedIds] = useState([]);
  const [manualMssv, setManualMssv] = useState("");
  const [manualFullName, setManualFullName] = useState("");
  const [auditModal, setAuditModal] = useState(null);
  const [notice, setNotice] = useState(null);

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

  const stageCheckinUrl = selectedEvent
    ? `/stage/checkin?eventId=${encodeURIComponent(selectedEvent.id)}`
    : "/stage/checkin";
  const staffScannerUrl = selectedEvent
    ? `/staff/scanner?eventId=${encodeURIComponent(selectedEvent.id)}`
    : "/staff/scanner";
  const isManualValid = /^[0-9]{8}$/.test(manualMssv.trim()) && Boolean(selectedEvent);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Hậu kiểm Điểm danh 48 giờ &amp; Điểm danh Bù Có Kiểm toán
          </h1>
          <p className="text-sm text-muted-foreground">
            Chấm điểm rủi ro trọng số, khóa duyệt hàng loạt nhóm Tín hiệu Mạnh (+2đ) và điểm danh bù có kiểm toán.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            <Clock className="h-3.5 w-3.5" />
            <span>Cửa sổ hậu kiểm 48 giờ</span>
          </Badge>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to={stageCheckinUrl}>
              <MonitorPlay className="h-4 w-4 text-primary" />
              <span>Chiếu QR Động LED 16:9</span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to={staffScannerUrl}>
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
            disabled={events.length === 0}
            onValueChange={(val) => {
              setSelectedEventId(val);
              const ev = events.find((e) => e.id === val);
              setSelectedSessionId(ev?.sessions?.[0]?.id ?? "");
            }}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue
                placeholder={
                  events.length === 0 ? "Chưa có sự kiện nào trong hệ thống" : "Chọn sự kiện"
                }
              />
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
          <Select
            value={activeSession?.id ?? ""}
            disabled={sessions.length === 0}
            onValueChange={setSelectedSessionId}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue
                placeholder={
                  sessions.length === 0 ? "Chưa có buổi điểm danh" : "Chọn buổi điểm danh"
                }
              />
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
            emptyTitle="Chưa có lượt điểm danh nào cần hậu kiểm"
            emptyDescription="Các bản ghi điểm danh có cờ cảnh báo rủi ro (+1đ / +2đ) sẽ xuất hiện tại đây trong vòng 48 giờ sau sự kiện."
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
                Điểm danh Bù Bằng tay Có Kiểm toán
              </CardTitle>
              <CardDescription>
                Nhập MSSV 8 chữ số của sinh viên gặp sự cố thiết bị để ghi nhận điểm danh bù kèm lý do lưu vào Audit Log.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="manual-student-mssv">Mã số sinh viên (8 chữ số) *</Label>
                  <Input
                    id="manual-student-mssv"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="VD: 23110001"
                    value={manualMssv}
                    onChange={(e) => setManualMssv(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="tabular-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-student-name">Họ và tên (tùy chọn)</Label>
                  <Input
                    id="manual-student-name"
                    placeholder="Nhập họ tên sinh viên..."
                    value={manualFullName}
                    onChange={(e) => setManualFullName(e.target.value)}
                  />
                </div>
              </div>

              {!selectedEvent && (
                <p className="text-xs text-muted-foreground">
                  Vui lòng tạo và chọn sự kiện ở thanh phía trên trước khi thực hiện điểm danh bù.
                </p>
              )}

              <Button
                type="button"
                disabled={!isManualValid}
                onClick={() => {
                  if (!selectedEvent) return;
                  const code = manualMssv.trim();
                  const labelName = manualFullName.trim() || `Sinh viên (${code})`;
                  setAuditModal({
                    title: "Xác nhận Điểm danh Bù Bằng tay",
                    summary: `${labelName} (${code}) · ${selectedEvent.title}${activeSession ? ` (${activeSession.name})` : ""}`,
                    code: "ATTENDANCE_MANUAL_OVERRIDE",
                    destructive: false,
                    onDone: () => {
                      setNotice(
                        `Đã ghi nhận điểm danh bù cho ${labelName} (${code}) tại "${selectedEvent.title}" và lưu Audit Log.`
                      );
                      setManualMssv("");
                      setManualFullName("");
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
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
                <Users className="h-5 w-5 text-primary/70" />
                <span>
                  {selectedEvent
                    ? `Chưa có danh sách thành viên BTC đã duyệt cho "${selectedEvent.title}".`
                    : "Chọn sự kiện để hiển thị danh sách thành viên Ban Tổ chức cần điểm danh sớm."}
                </span>
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
