import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  FileAudio,
  Lock,
  Trash2,
  Unlock,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventStore } from "@/stores/event-store";
import { createArtsExportJob, getArtsExportJobStatus } from "./api";

const INITIAL_ACTS = [];

export function ArtsAdminPage() {
  const events = useEventStore((s) => s.events);
  const programs = useMemo(
    () => events.map((e) => ({ id: e.id, title: e.title })),
    [events]
  );

  const [selectedProgramId, setSelectedProgramId] = useState(() => programs[0]?.id ?? "");
  const activeProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId) ?? programs[0] ?? null,
    [programs, selectedProgramId]
  );

  const [acts, setActs] = useState(INITIAL_ACTS);
  const [zipFeedback, setZipFeedback] = useState(null);

  const visibleActs = useMemo(
    () =>
      activeProgram
        ? acts.filter((a) => a.eventId === activeProgram.id || a.eventName === activeProgram.title)
        : acts,
    [acts, activeProgram]
  );

  const moveAct = (id, delta) => {
    const idx = acts.findIndex((a) => a.id === id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= acts.length) return;
    setActs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      if (!moved) return prev;
      next.splice(target, 0, moved);
      return next;
    });
  };

  const toggleLock = (id) => {
    setActs((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === "DA_CHOT" ? "CHO_DUYET" : "DA_CHOT" } : a
      )
    );
  };

  const removeAct = (id) => {
    setActs((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDownloadZip = async () => {
    if (!activeProgram) return;
    try {
      const job = await createArtsExportJob(activeProgram.id);
      const status = await getArtsExportJobStatus(activeProgram.id, job.jobId);
      setZipFeedback(`Đã tạo gói tải source (${job.jobId}): ${status.presignedDownloadUrl}`);
    } catch {
      setZipFeedback(
        "Không thể kết nối máy chủ đóng gói source âm thanh/LED lúc này. Vui lòng thử lại sau."
      );
    }
  };

  const columns = [
    {
      key: "order",
      header: "Thứ tự",
      render: (act) => {
        const idx = visibleActs.findIndex((a) => a.id === act.id);
        return (
          <div className="flex items-center gap-1">
            <span className="w-7 tabular-mono text-xs font-semibold text-cal-arts">
              #{String(idx + 1).padStart(2, "0")}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              disabled={idx <= 0}
              onClick={() => moveAct(act.id, -1)}
              aria-label="Đẩy lên"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              disabled={idx === visibleActs.length - 1}
              onClick={() => moveAct(act.id, 1)}
              aria-label="Đẩy xuống"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      }
    },
    {
      key: "title",
      header: "Tiết mục",
      render: (act) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{act.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="calArts" className="py-0 text-[11px]">
              {act.genre}
            </Badge>
            <span className="tabular-mono">{act.duration}</span>
          </div>
        </div>
      )
    },
    {
      key: "source",
      header: "Source (Nhạc / LED)",
      render: (act) => (
        <span className="inline-flex items-center gap-1.5 tabular-mono text-xs text-foreground">
          <FileAudio className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{act.sourceLabel}</span>
        </span>
      )
    },
    {
      key: "performers",
      header: "Sinh viên biểu diễn",
      render: (act) =>
        (act.performers?.length ?? 0) === 0 ? (
          <span className="text-xs text-muted-foreground">Chưa đính kèm</span>
        ) : (
          <div className="space-y-0.5 text-xs text-foreground">
            <div className="inline-flex items-center gap-1 font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{act.performers.length} sinh viên</span>
            </div>
            <div className="line-clamp-1 text-muted-foreground">{act.performers.join(", ")}</div>
          </div>
        )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (act) =>
        act.status === "DA_CHOT" ? (
          <Badge variant="success">
            <Lock className="h-3 w-3" />
            Đã chốt
          </Badge>
        ) : (
          <Badge variant="secondary">Chờ duyệt</Badge>
        )
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (act) => (
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={act.status === "DA_CHOT" ? "outline" : "default"}
            onClick={() => toggleLock(act.id)}
          >
            {act.status === "DA_CHOT" ? (
              <>
                <Unlock className="h-3.5 w-3.5" />
                Mở lại
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Chốt
              </>
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => removeAct(act.id)}
            aria-label={`Xóa tiết mục ${act.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản lý Tiết mục Văn nghệ (ARTIT)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tiếp nhận danh sách tiết mục, source nhạc/LED và danh sách sinh viên biểu diễn theo từng chương trình.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {programs.length > 0 && activeProgram && (
            <div className="w-64">
              <Select value={activeProgram.id} onValueChange={setSelectedProgramId}>
                <SelectTrigger aria-label="Chọn chương trình">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!activeProgram || visibleActs.length === 0}
            onClick={() => void handleDownloadZip()}
          >
            <Download className="h-4 w-4" />
            <span>Tải trọn bộ Source (.zip)</span>
          </Button>
          <Button asChild size="sm">
            <Link to="/arts">Trang nộp tiết mục</Link>
          </Button>
        </div>
      </div>

      {zipFeedback && (
        <div className="rounded-xl border border-status-info/35 bg-status-info/10 px-4 py-2.5 tabular-mono text-xs text-status-info">
          {zipFeedback}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách Tiết mục{activeProgram ? ` — ${activeProgram.title}` : ""}
          </CardTitle>
          <CardDescription>
            Đổi thứ tự lên/xuống để đánh số tự động khi tải gói source cho kỹ thuật hội trường.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={visibleActs}
            emptyTitle="Chưa có tiết mục nào"
            emptyDescription="Ban Văn nghệ chưa có tiết mục nào được nộp cho chương trình hiện tại."
          />
        </CardContent>
      </Card>
    </div>
  );
}
