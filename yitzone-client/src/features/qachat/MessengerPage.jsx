import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCheck,
  ImagePlus,
  MessageSquarePlus,
  Reply,
  RotateCcw,
  Send,
  X
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORY_TAGS = [
  "Điểm danh/Quyền lợi",
  "SV5T",
  "Sự kiện/BTC",
  "Cửa hàng",
  "Trực VP",
  "Thắc mắc chung"
];

const INITIAL_THREADS = [
  {
    id: "TH-2041",
    category: "Điểm danh/Quyền lợi",
    title: "Bổ sung điểm danh sự kiện FIT Tech Talk (lỗi mạng tại hội trường)",
    status: "DANG_XU_LY",
    updatedAt: "21/11 · 19:40",
    messages: [
      {
        id: "m1",
        sender: "STUDENT",
        senderLabel: "Bạn (22110418)",
        text: "Chào BCH, em có quét QR check-in lúc 08:25 nhưng hội trường mất sóng nên chưa hiện trên hệ thống. Em đính kèm ảnh chụp thẻ sinh viên và ảnh hội trường ạ.",
        time: "19:12",
        seen: true,
        attachmentName: "minh-chung-checkin.jpg (1.4 MB)"
      },
      {
        id: "m2",
        sender: "BCH",
        senderLabel: "Ban Chấp hành Đoàn - Hội Khoa CNTT",
        text: "Chào bạn, BCH đã tiếp nhận yêu cầu và kiểm tra hàng chờ đồng bộ ngoại tuyến. Vui lòng chờ trong cửa sổ hậu kiểm 48h, hệ thống sẽ gửi Web Push ngay khi cập nhật E-Cert.",
        time: "19:40",
        seen: true
      }
    ]
  },
  {
    id: "TH-2018",
    category: "Cửa hàng",
    title: "Đổi size Áo Khoa CNTT từ M sang L (Đơn #ORD-2026-084)",
    status: "DA_GIAI_QUYET",
    updatedAt: "18/11 · 15:20",
    messages: [
      {
        id: "m3",
        sender: "STUDENT",
        senderLabel: "Bạn (22110418)",
        text: "Em muốn đổi size áo đơn #ORD-2026-084 sang size L trước khi nhận tại bàn trực OFIT được không ạ?",
        time: "14:05",
        seen: true
      },
      {
        id: "m4",
        sender: "BCH",
        senderLabel: "Ban Chấp hành Đoàn - Hội Khoa CNTT",
        text: "Đã cập nhật đơn #ORD-2026-084 sang size L. Bạn ghé Văn phòng Đoàn - Hội các ca trực T2–T7 để nhận áo nhé!",
        time: "15:20",
        seen: true
      }
    ]
  }
];

export function MessengerPage(){
  const location = useLocation();
  const navState = (location.state) ?? null;

  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [activeId, setActiveId] = useState(INITIAL_THREADS[0].id);
  const [mobileView, setMobileView] = useState("list");
  const [composerText, setComposerText] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [reopenBanner, setReopenBanner] = useState(null);

  const [creating, setCreating] = useState(Boolean(navState?.fromYitBot));
  const [newCategory, setNewCategory] = useState("Thắc mắc chung");
  const [newTitle, setNewTitle] = useState(navState?.prefillTitle ?? "");
  const [newBody, setNewBody] = useState(
    navState?.prefillSummary
      ? `[Ngữ cảnh chuyển tiếp từ YITBot]\n${navState.prefillSummary}\n\nCâu hỏi bổ sung của em: `
: ""
  );
  const [newAttachment, setNewAttachment] = useState(null);

  useEffect(() => {
    if (navState?.fromYitBot) setCreating(true);
  }, [navState?.fromYitBot]);

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0];

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    const id = `TH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const created = {
      id,
      category: newCategory,
      title: newTitle.trim(),
      status: "CHO_BCH",
      updatedAt: "Vừa xong",
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: "STUDENT",
          senderLabel: "Bạn (22110418)",
          text: newBody.trim(),
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          seen: false,
          attachmentName: newAttachment ?? undefined
        }
      ]
    };
    setThreads((prev) => [created,...prev]);
    setActiveId(id);
    setMobileView("chat");
    setCreating(false);
    setNewTitle("");
    setNewBody("");
    setNewAttachment(null);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!composerText.trim()) return;
    const wasClosed = activeThread.status === "DA_GIAI_QUYET";
    const entry = {
      id: `m-${Date.now()}`,
      sender: "STUDENT",
      senderLabel: "Bạn (22110418)",
      text: composerText.trim(),
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      seen: false,
      replyToText: replyTarget?.text.slice(0, 90)
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
...t,
              status: wasClosed ? "CHO_BCH": t.status,
              updatedAt: "Vừa xong",
              messages: [...t.messages, entry]
            }
: t
      )
    );
    if (wasClosed) {
      setReopenBanner(
        `Luồng ${activeThread.id} đã tự động mở lại trạng thái "Chờ BCH trả lời" và đẩy lên đầu Hộp thư Chung.`
      );
    }
    setComposerText("");
    setReplyTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Liquid Glass Top Container */}
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Hộp thư Hỏi - Đáp BCH (Q&amp;A Messenger)
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Mọi yêu cầu được định tuyến tập trung về Hộp thư Chung BCH/BTV, trao đổi thời gian thực và cam kết SLA phản hồi trong 24 giờ làm việc.
            </p>
          </div>
          <Button type="button" className="h-11 w-full rounded-full sm:h-10 sm:w-auto" onClick={() => setCreating((v) => !v)}>
            <MessageSquarePlus className="h-4 w-4" />
            <span>{creating ? "Đóng biểu mẫu": "Tạo câu hỏi mới"}</span>
          </Button>
        </div>
      </section>

      {reopenBanner && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-status-info/35 bg-status-info/10 px-4 py-2.5 text-xs font-medium text-status-info">
          <span className="inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4 shrink-0" />
            {reopenBanner}
          </span>
          <button type="button" onClick={() => setReopenBanner(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      {creating && (
        <Card className="rounded-[20px]">
          <CardHeader>
            <CardTitle>Gửi Cuộc trò chuyện Mới tới Ban Chấp hành</CardTitle>
            <CardDescription>
              Chọn đúng nhãn chủ đề và đính kèm ảnh chụp màn hình (≤ 5MB) nếu cần đối chiếu minh chứng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-4">
                  <Label>Nhãn chủ đề</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger aria-label="Chọn nhãn chủ đề" className="h-10 rounded-xl">
                      <SelectValue placeholder="Nhãn chủ đề" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_TAGS.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-8">
                  <Label htmlFor="msg-title">Tiêu đề thắc mắc</Label>
                  <Input
                    id="msg-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-10 rounded-xl"
                    placeholder="Tóm tắt ngắn gọn vấn đề bạn cần hỗ trợ..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="msg-body">Nội dung chi tiết</Label>
                <Textarea
                  id="msg-body"
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="rounded-xl"
                  placeholder="Mô tả chi tiết kèm mã sự kiện / mã đơn hàng (nếu có)..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setNewAttachment("anh-chup-man-hinh.png (1.2 MB)")}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Đính kèm ảnh (≤ 5MB)
                  </Button>
                  {newAttachment && (
                    <Badge variant="secondary" className="rounded-full">
                      {newAttachment}
                      <button
                        type="button"
                        onClick={() => setNewAttachment(null)}
                        aria-label="Xóa tệp đính kèm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
                <Button type="submit" className="rounded-full">
                  Gửi về Hộp thư Chung BCH
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className={cn("rounded-[20px] lg:col-span-4", mobileView === "chat" && "hidden lg:block")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cuộc trò chuyện của tôi ({threads.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveId(t.id);
                  setMobileView("chat");
                }}
                className={cn(
                  "w-full rounded-xl border p-3.5 text-left transition-colors",
                  t.id === activeThread.id
                    ? "border-primary bg-primary/8"
: "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {t.category}
                  </Badge>
                  <span className="tabular-mono text-[11px] text-muted-foreground">{t.updatedAt}</span>
                </div>
                <div className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground">{t.title}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="tabular-mono text-[11px] text-muted-foreground">{t.id}</span>
                  {t.status === "CHO_BCH" && <Badge variant="warning">Chờ BCH trả lời</Badge>}
                  {t.status === "DANG_XU_LY" && <Badge variant="info">Đang xử lý</Badge>}
                  {t.status === "DA_GIAI_QUYET" && <Badge variant="success">Đã giải quyết</Badge>}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "flex flex-col overflow-hidden rounded-[20px] lg:col-span-8",
            mobileView === "list" && "hidden lg:flex"
          )}
        >
          <CardHeader className="border-b border-border/80 px-4 py-3.5 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Danh sách hội thoại ({threads.length})</span>
            </button>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {activeThread.category}
                  </Badge>
                  <span className="tabular-mono text-xs text-muted-foreground">{activeThread.id}</span>
                </div>
                <CardTitle className="mt-1.5 text-base">{activeThread.title}</CardTitle>
              </div>
              <VerifiedBadge label="Ban Chấp hành Đoàn - Hội Khoa CNTT" />
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            <div className="min-h-[280px] max-h-[55dvh] flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:min-h-[320px] sm:max-h-[460px] sm:px-5 sm:py-5">
              {activeThread.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col gap-1",
                    m.sender === "STUDENT" ? "items-end": "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 text-sm leading-relaxed",
                      m.sender === "STUDENT"
                        ? "rounded-2xl rounded-tr-md bg-primary text-primary-foreground"
: "rounded-2xl rounded-tl-md bg-muted/55 text-foreground"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-85">
                      <span className="font-semibold">{m.senderLabel}</span>
                      <button
                        type="button"
                        onClick={() => setReplyTarget(m)}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <Reply className="h-3 w-3" />
                        Trích dẫn
                      </button>
                    </div>

                    {m.replyToText && (
                      <div className="mb-2 rounded-lg bg-black/10 px-2.5 py-1 text-xs italic dark:bg-white/10">
                        Trích dẫn: “{m.replyToText}”
                      </div>
                    )}

                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.attachmentName && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-black/10 px-2.5 py-1 text-xs dark:bg-white/10">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>{m.attachmentName}</span>
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center justify-end gap-1 tabular-mono text-[10px] opacity-80">
                      <span>{m.time}</span>
                      {m.seen && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 border-t border-border/80 bg-muted/25 px-4 py-3.5">
              {activeThread.status === "DA_GIAI_QUYET" && (
                <div className="rounded-xl bg-muted/70 px-3.5 py-2 text-xs text-muted-foreground">
                  Cuộc trò chuyện này đã được đánh dấu <strong>Đã giải quyết</strong>. Nhắn thêm câu hỏi mới sẽ tự động mở lại trạng thái <strong>Chờ BCH trả lời</strong>.
                </div>
              )}

              {replyTarget && (
                <div className="flex items-center justify-between rounded-xl bg-card px-3 py-1.5 text-xs shadow-sm">
                  <span className="truncate text-muted-foreground">
                    Đang trích dẫn: <strong className="text-foreground">{replyTarget.text.slice(0, 70)}</strong>
                  </span>
                  <button type="button" onClick={() => setReplyTarget(null)}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSendReply}
                className="flex items-center gap-2 rounded-full border border-input bg-card p-1.5 pl-4 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <Input
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Nhập tin nhắn trao đổi với BCH..."
                  className="h-10 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 sm:h-9 sm:text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="liquid-glass-btn-cobalt h-10 rounded-full px-4 disabled:opacity-45 sm:h-9"
                  disabled={!composerText.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Gửi</span>
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
