import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Send,
  ShieldAlert,
  Slash,
  Tag,
  Trash2,
  UserCheck
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InternalBchNote } from "@/components/ui/internal-note";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type InboxStatus = "CHO_TIEP_NHAN" | "DANG_XU_LY" | "DA_GIAI_QUYET";

interface InboxItem {
  id: string;
  studentName: string;
  mssv: string;
  major: string;
  category: string;
  title: string;
  status: InboxStatus;
  slaOverdue: boolean;
  claimedBy: string | null;
  recentEvents: string[];
  sv5tOrderSummary: string;
  messages: {
    id: string;
    kind: "STUDENT" | "BCH_PUBLIC" | "BCH_INTERNAL";
    author: string;
    time: string;
    text: string;
  }[];
}

interface CannedReply {
  id: string;
  shortcut: string;
  content: string;
}

interface CategoryTagItem {
  id: string;
  name: string;
  usedCount: number;
  hidden: boolean;
}

const INITIAL_INBOX: InboxItem[] = [
  {
    id: "TH-2045",
    studentName: "Nguyễn Gia Bảo",
    mssv: "22110289",
    major: "Kỹ thuật Phần mềm (CLC)",
    category: "SV5T",
    title: "Phúc khảo minh chứng tiêu chí Tình nguyện tốt chưa hiện trên cổng SV5T",
    status: "CHO_TIEP_NHAN",
    slaOverdue: true,
    claimedBy: null,
    recentEvents: ["Xuân Tình nguyện 2026 (Đã điểm danh)", "FIT Tech Talk (Đã điểm danh)", "Hiến máu Nhân đạo (Chờ hậu kiểm)"],
    sv5tOrderSummary: "SV5T: Đạt 4/5 tiêu chí · Đơn hàng: Không có đơn tồn",
    messages: [
      {
        id: "im-1",
        kind: "STUDENT",
        author: "Nguyễn Gia Bảo (22110289)",
        time: "Hôm qua · 14:10",
        text: "Dạ BCH cho em hỏi chứng nhận Hiến máu tháng 10 của em chưa tự đồng bộ sang mục Tình nguyện tốt SV5T ạ."
      }
    ]
  },
  {
    id: "TH-2041",
    studentName: "Trần Đức Thịnh",
    mssv: "22110418",
    major: "Công nghệ Thông tin",
    category: "Điểm danh/Quyền lợi",
    title: "Bổ sung điểm danh sự kiện FIT Tech Talk (lỗi mạng hội trường)",
    status: "DANG_XU_LY",
    slaOverdue: false,
    claimedBy: "UV BCH Lê Minh Anh",
    recentEvents: ["FIT Tech Talk 2026 (Hàng chờ 48h)", "Hội thao Khoa CNTT (Đã điểm danh)", "Workshop AI Agent (Đã điểm danh)"],
    sv5tOrderSummary: "SV5T: Đạt 3/5 tiêu chí · Đơn #ORD-2026-084 (Áo Khoa Size L)",
    messages: [
      {
        id: "im-2",
        kind: "STUDENT",
        author: "Trần Đức Thịnh (22110418)",
        time: "19:12",
        text: "Em quét QR lúc 08:25 nhưng mất sóng, nhờ BCH kiểm tra giúp ạ."
      },
      {
        id: "im-3",
        kind: "BCH_INTERNAL",
        author: "UV BCH Lê Minh Anh",
        time: "19:25",
        text: "Đã đối chiếu log máy quét offline cổng B — có mã 1D lúc 08:26:14. Chờ chốt batch 48h để cấp E-Cert."
      },
      {
        id: "im-4",
        kind: "BCH_PUBLIC",
        author: "Ban Chấp hành Đoàn - Hội Khoa CNTT",
        time: "19:40",
        text: "Chào bạn, BCH đã xác nhận bản ghi ngoại tuyến của bạn và sẽ cập nhật trong cửa sổ hậu kiểm 48h."
      }
    ]
  }
];

const INITIAL_CANNED: CannedReply[] = [
  {
    id: "c1",
    shortcut: "/diem-danh",
    content: "BCH đã ghi nhận yêu cầu bổ sung điểm danh của bạn và đang đối chiếu trong cửa sổ hậu kiểm 48 giờ."
  },
  {
    id: "c2",
    shortcut: "/sv5t",
    content: "Hồ sơ Sinh viên 5 tốt sẽ tự động đồng bộ E-Cert hợp lệ; với minh chứng ngoài Khoa, bạn vui lòng tải ảnh rõ nét tại mục Nộp minh chứng."
  },
  {
    id: "c3",
    shortcut: "/ao-khoa",
    content: "Bạn có thể nhận/đổi size Áo Khoa CNTT tại Văn phòng Đoàn - Hội (Ban OFIT) trong khung giờ các ca trực T2–T7."
  }
];

const INITIAL_TAGS: CategoryTagItem[] = [
  { id: "t1", name: "Điểm danh/Quyền lợi", usedCount: 42, hidden: false },
  { id: "t2", name: "SV5T", usedCount: 28, hidden: false },
  { id: "t3", name: "Cửa hàng", usedCount: 15, hidden: false },
  { id: "t4", name: "Góp ý Khác (Mới)", usedCount: 0, hidden: false }
];

export function InboxAdminPage(){
  const [items, setItems] = useState<InboxItem[]>(INITIAL_INBOX);
  const [activeId, setActiveId] = useState<string>(INITIAL_INBOX[0]!.id);
  const [filter, setFilter] = useState<"ALL" | "SLA" | "UNCLAIMED">("ALL");
  const [composeMode, setComposeMode] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [draft, setDraft] = useState("");
  const [revealedIds, setRevealedIds] = useState<Record<string, string>>({});
  const [canned, setCanned] = useState<CannedReply[]>(INITIAL_CANNED);
  const [tags, setTags] = useState<CategoryTagItem[]>(INITIAL_TAGS);
  const [newShortcut, setNewShortcut] = useState("");
  const [newCannedText, setNewCannedText] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [hideTagTarget, setHideTagTarget] = useState<CategoryTagItem | null>(null);

  const activeItem = items.find((i) => i.id === activeId) ?? items[0]!;
  const filteredItems = items.filter((i) => {
    if (filter === "SLA") return i.slaOverdue;
    if (filter === "UNCLAIMED") return i.status === "CHO_TIEP_NHAN";
    return true;
  });

  const matchingSlash = draft.startsWith("/")
    ? canned.filter((c) => c.shortcut.toLowerCase().includes(draft.trim().toLowerCase()))
: [];

  const handleClaim = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {...item, status: "DANG_XU_LY", claimedBy: "Tôi (UV BCH Trực ca)", slaOverdue: false }
: item
      )
    );
  };

  const handleCloseTicket = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? {...item, status: "DA_GIAI_QUYET" }: item))
    );
  };

  const handleRevealSummary = (id: string) => {
    const ts = new Date().toLocaleTimeString("vi-VN");
    setRevealedIds((prev) => ({...prev, [id]: ts }));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeItem) return;
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setItems((prev) =>
      prev.map((item) =>
        item.id === activeItem.id
          ? {
...item,
            messages: [
...item.messages,
              {
                id: `m-${Date.now()}`,
                kind: composeMode === "INTERNAL" ? "BCH_INTERNAL": "BCH_PUBLIC",
                author:
                  composeMode === "INTERNAL"
                    ? "Tôi (UV BCH Trực ca)"
: "Ban Chấp hành Đoàn - Hội Khoa CNTT",
                time: now,
                text: draft.trim()
              }
            ]
          }
: item
      )
    );
    setDraft("");
  };

  const handleAddCanned = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.trim() || !newCannedText.trim()) return;
    const normalized = newShortcut.startsWith("/") ? newShortcut.trim(): `/${newShortcut.trim()}`;
    setCanned((prev) => [
      { id: `c-${Date.now()}`, shortcut: normalized, content: newCannedText.trim() },
...prev
    ]);
    setNewShortcut("");
    setNewCannedText("");
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setTags((prev) => [
      { id: `t-${Date.now()}`, name: newTagName.trim(), usedCount: 0, hidden: false },
...prev
    ]);
    setNewTagName("");
  };

  const handleConfirmHideTag = () => {
    if (!hideTagTarget) return;
    setTags((prev) =>
      prev.map((t) => (t.id === hideTagTarget.id ? {...t, hidden: true }: t))
    );
    setHideTagTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground">
          Hộp thư Chung BCH &amp; Giám sát SLA 24h
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tiếp nhận khóa nguyên tử chống trùng, Ghi chú nội bộ màu vàng ẩn với SV, phím tắt `/` và Audit Log xem hồ sơ.
        </p>
      </div>

      <Tabs defaultValue="inbox" className="min-h-[480px]">
        <TabsList className="justify-start">
          <TabsTrigger value="inbox">Hộp thư Chung BCH ({items.length})</TabsTrigger>
          <TabsTrigger value="templates">Kho Mẫu `/` &amp; Nhãn Chủ đề</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Queue Column */}
            <Card className="lg:col-span-3">
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-base">Hàng chờ ({filteredItems.length})</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={filter === "ALL" ? "default": "outline"}
                    onClick={() => setFilter("ALL")}
                  >
                    Tất cả
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={filter === "SLA" ? "destructive": "outline"}
                    onClick={() => setFilter("SLA")}
                  >
                    Quá SLA 24h
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={filter === "UNCLAIMED" ? "default": "outline"}
                    onClick={() => setFilter("UNCLAIMED")}
                  >
                    Chờ nhận
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors",
                      item.id === activeItem.id
                        ? "border-primary bg-primary/8"
: "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="tabular-mono text-[11px] font-semibold text-muted-foreground">
                        {item.id}
                      </span>
                      {item.slaOverdue && (
                        <Badge variant="danger" className="text-[10px]">
                          <AlertTriangle className="h-3 w-3" />
                          Quá SLA 24h
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 font-medium text-sm text-foreground">{item.studentName}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.title}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {item.category}
                      </Badge>
                      {item.status === "DA_GIAI_QUYET" && (
                        <Badge variant="success" className="text-[10px]">
                          Đã đóng
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Conversation Column */}
            <Card className="flex flex-col overflow-hidden lg:col-span-6">
              <CardHeader className="border-b border-border pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{activeItem.category}</Badge>
                      {activeItem.slaOverdue && (
                        <Badge variant="danger">
                          <ShieldAlert className="h-3 w-3" />
                          Đã leo thang cảnh báo lên BTV
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-1.5 text-base">{activeItem.title}</CardTitle>
                    <CardDescription>
                      Phụ trách:{" "}
                      <strong className="text-foreground">
                        {activeItem.claimedBy ?? "Chưa có cán bộ tiếp nhận"}
                      </strong>
                    </CardDescription>
                  </div>

                  <div className="flex gap-1.5">
                    {!activeItem.claimedBy && (
                      <Button type="button" size="sm" onClick={() => handleClaim(activeItem.id)}>
                        <UserCheck className="h-3.5 w-3.5" />
                        Tiếp nhận
                      </Button>
                    )}
                    {activeItem.status !== "DA_GIAI_QUYET" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseTicket(activeItem.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Hoàn tất &amp; Đóng
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col p-0">
                <div className="flex-1 min-h-[300px] max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
                  {activeItem.messages.map((m) =>
                    m.kind === "BCH_INTERNAL" ? (
                      <InternalBchNote key={m.id} author={m.author} timestamp={m.time}>
                        {m.text}
                      </InternalBchNote>
                    ): (
                      <div
                        key={m.id}
                        className={cn(
                          "flex flex-col",
                          m.kind === "BCH_PUBLIC" ? "items-end": "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] px-3.5 py-2.5 text-sm leading-relaxed",
                            m.kind === "BCH_PUBLIC"
                              ? "rounded-2xl rounded-tr-md bg-primary text-primary-foreground"
: "rounded-2xl rounded-tl-md bg-muted/55 text-foreground"
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-80">
                            <span className="font-semibold">{m.author}</span>
                            <span className="tabular-mono">{m.time}</span>
                          </div>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Mode Switcher: Public Reply vs Internal Yellow Note — Pinned to bottom */}
                <div className="space-y-2.5 border-t border-border/80 bg-muted/25 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setComposeMode("PUBLIC")}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                        composeMode === "PUBLIC"
                          ? "bg-primary text-primary-foreground"
: "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Trả lời Sinh viên (gõ `/` chọn mẫu)
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeMode("INTERNAL")}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        composeMode === "INTERNAL"
                          ? "border-internalNote-border bg-internalNote-bg text-internalNote-ink"
: "border-border bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Lock className="h-3 w-3" />
                      Ghi chú nội bộ (Màu vàng · Ẩn với SV)
                    </button>
                  </div>

                  {composeMode === "PUBLIC" && matchingSlash.length > 0 && (
                    <div className="rounded-lg border border-border bg-card p-1.5 shadow-sm space-y-1">
                      {matchingSlash.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setDraft(c.content)}
                          className="flex w-full items-start gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-muted"
                        >
                          <span className="tabular-mono font-semibold text-primary">{c.shortcut}</span>
                          <span className="line-clamp-1 text-muted-foreground">{c.content}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={
                        composeMode === "INTERNAL"
                          ? "Ghi chú nội bộ chỉ BCH/BTV nhìn thấy..."
: "Nhập phản hồi sinh viên hoặc gõ /diem-danh, /sv5t..."
                      }
                      className={cn(
                        "flex-1 rounded-xl",
                        composeMode === "INTERNAL"
                          ? "border-internalNote-border bg-internalNote-bg text-internalNote-ink placeholder:text-internalNote-ink/60"
: ""
                      )}
                    />
                    <Button type="submit" className="rounded-xl" disabled={!draft.trim()}>
                      <Send className="h-4 w-4" />
                      {composeMode === "INTERNAL" ? "Lưu ghi chú": "Gửi SV"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Right Student Minimal Summary (Audit-logged) */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hồ sơ SV Tối thiểu</CardTitle>
                <CardDescription>
                  Mọi lượt mở xem tóm tắt hồ sơ sinh viên đều được ghi nhận tự động vào Nhật ký Kiểm toán.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {!revealedIds[activeItem.id] ? (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3.5 text-center">
                    <EyeOff className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Thông tin tóm tắt đang được ẩn theo nguyên tắc tối thiểu dữ liệu cá nhân.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleRevealSummary(activeItem.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Mở xem &amp; Ghi Audit Log
                    </Button>
                  </div>
                ): (
                  <div className="space-y-3">
                    <Badge variant="info" className="w-full justify-center tabular-mono text-[10px]">
                      Đã ghi nhận xem hồ sơ · {revealedIds[activeItem.id]}
                    </Badge>
                    <div className="rounded-lg border border-border bg-muted/35 p-3 space-y-1">
                      <div className="font-semibold text-foreground">{activeItem.studentName}</div>
                      <div className="tabular-mono text-muted-foreground">{activeItem.mssv}</div>
                      <div className="text-muted-foreground">{activeItem.major}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="font-semibold text-foreground">3 Sự kiện gần nhất</div>
                      <ul className="space-y-1 text-muted-foreground">
                        {activeItem.recentEvents.map((ev) => (
                          <li key={ev} className="rounded border border-border bg-card px-2.5 py-1.5">
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground">
                      <div className="font-semibold text-foreground">SV5T &amp; Đơn hàng</div>
                      <div className="mt-1">{activeItem.sv5tOrderSummary}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="grid gap-5 lg:grid-cols-12">
          {/* Canned Replies CRUD */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Slash className="h-4 w-4 text-primary" />
                Kho Câu trả lời Mẫu (`/`) Dùng chung BCH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddCanned} className="grid gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-3">
                  <Input
                    value={newShortcut}
                    onChange={(e) => setNewShortcut(e.target.value)}
                    placeholder="/phim-tat"
                    className="tabular-mono"
                  />
                </div>
                <div className="sm:col-span-7">
                  <Input
                    value={newCannedText}
                    onChange={(e) => setNewCannedText(e.target.value)}
                    placeholder="Nội dung câu trả lời chuẩn..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" />
                    Thêm
                  </Button>
                </div>
              </form>

              <div className="space-y-2">
                {canned.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
                  >
                    <div>
                      <span className="tabular-mono text-xs font-semibold text-primary">{c.shortcut}</span>
                      <p className="mt-1 text-xs text-muted-foreground">{c.content}</p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setCanned((prev) => prev.filter((item) => item.id !== c.id))}
                      aria-label={`Xóa mẫu ${c.shortcut}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Tags CRUD */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Nhãn Chủ đề Hộp thư
              </CardTitle>
              <CardDescription>
                Chặn xóa nhãn đã gắn hội thoại — chỉ cho phép Tạm ẩn (ghi Audit Log).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddTag} className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tên nhãn chủ đề mới..."
                />
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  Thêm
                </Button>
              </form>

              <div className="space-y-2">
                {tags.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm",
                      t.hidden && "opacity-60"
                    )}
                  >
                    <div>
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="tabular-mono text-xs text-muted-foreground">
                        {t.usedCount} hội thoại {t.hidden ? "· Đã tạm ẩn": ""}
                      </div>
                    </div>
                    {t.usedCount > 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={t.hidden}
                        onClick={() => setHideTagTarget(t)}
                      >
                        {t.hidden ? "Đã ẩn": "Tạm ẩn"}
                      </Button>
                    ): (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setTags((prev) => prev.filter((item) => item.id !== t.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(hideTagTarget)}
        onOpenChange={(open) => !open && setHideTagTarget(null)}
        title="Tạm ẩn Nhãn Chủ đề Đã sử dụng"
        description="Nhãn chủ đề này đang gắn với các hội thoại lịch sử nên bị chặn xóa cứng. Tạm ẩn sẽ không hiển thị khi sinh viên tạo câu hỏi mới."
        targetSummary={hideTagTarget ? `${hideTagTarget.name} (${hideTagTarget.usedCount} hội thoại)`: ""}
        actionCode="QACHAT_TAG_HIDE"
        destructive={false}
        onConfirm={handleConfirmHideTag}
      />
    </div>
  );
}
