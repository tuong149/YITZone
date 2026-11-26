import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bold,
  Check,
  CheckCircle2,
  Code2,
  Columns2,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  PenLine,
  Quote,
  Save,
  Send,
  ShieldAlert,
  Table2,
  Trash2,
  Upload,
  Video,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { slugifyVietnamese } from "./cms-data";

const DRAFT_STORAGE_KEY = "yitzone_cms_compose_draft_v1";

const SUGGESTED_TAGS = ["Học thuật", "Hackathon", "SV5T", "Kinh nghiệm", "Đoàn - Hội", "Chia sẻ", "Nghiên cứu"];

function loadDraft(defaultCategoryId) {
  const empty = {
    title: "",
    excerpt: "",
    categoryId: defaultCategoryId,
    tags: ["Học thuật", "Chia sẻ"],
    body: "",
    coverImage: ""
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      title: typeof parsed.title === "string" ? parsed.title : empty.title,
      excerpt: typeof parsed.excerpt === "string" ? parsed.excerpt : empty.excerpt,
      categoryId: typeof parsed.categoryId === "string" ? parsed.categoryId : defaultCategoryId,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === "string") : empty.tags,
      body: typeof parsed.body === "string" ? parsed.body : empty.body,
      coverImage: typeof parsed.coverImage === "string" ? parsed.coverImage : empty.coverImage
    };
  } catch {
    return empty;
  }
}

function resolveImageSrc(rawSrc, inlineImages) {
  if (rawSrc.startsWith("yit-img://")) {
    const key = rawSrc.slice("yit-img://".length);
    return inlineImages[key] ?? "";
  }
  return rawSrc;
}

function ArticlePreview({
  title,
  excerpt,
  categoryName,
  tags,
  coverImage,
  body,
  inlineImages,
  readingMinutes
}) {
  const blocks = useMemo(() => {
    const lines = body.split("\n");
    const result = [];
    let idx = 0;

    while (idx < lines.length) {
      const line = lines[idx] ?? "";
      if (line.trim().startsWith("```")) {
        const codeLines = [];
        idx++;
        while (idx < lines.length && !(lines[idx] ?? "").trim().startsWith("```")) {
          codeLines.push(lines[idx] ?? "");
          idx++;
        }
        result.push(
          <pre
            key={`code-${idx}`}
            className="my-3 overflow-x-auto rounded-xl border border-border bg-muted/60 p-3.5 text-xs leading-relaxed tabular-mono text-foreground"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        idx++;
        continue;
      }

      const imgMatch = line.trim().match(/^!\[(.*?)\]\((.+?)\)$/);
      if (imgMatch) {
        const caption = imgMatch[1] ?? "";
        const rawSrc = imgMatch[2] ?? "";
        const resolved = resolveImageSrc(rawSrc, inlineImages);
        if (resolved) {
          result.push(
            <figure key={`img-${idx}`} className="my-4 space-y-1.5">
              <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                <img src={resolved} alt={caption || "Ảnh minh họa"} className="max-h-[380px] w-full object-cover" />
              </div>
              {caption && (
                <figcaption className="text-center text-xs italic text-muted-foreground">{caption}</figcaption>
              )}
            </figure>
          );
          idx++;
          continue;
        }
      }

      const videoMatch = line.trim().match(/^\[Video:\s*(.+?)\]\((.+?)\)$/);
      if (videoMatch) {
        const videoTitle = videoMatch[1] ?? "Video đính kèm";
        const videoUrl = videoMatch[2] ?? "";
        result.push(
          <a
            key={`vid-${idx}`}
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="my-3 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm transition-colors hover:border-primary/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Video className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground">{videoTitle}</span>
              <span className="block truncate text-xs text-muted-foreground">{videoUrl}</span>
            </span>
          </a>
        );
        idx++;
        continue;
      }

      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines = [];
        while (idx < lines.length && (lines[idx] ?? "").trim().startsWith("|")) {
          tableLines.push((lines[idx] ?? "").trim());
          idx++;
        }
        const parsedRows = tableLines
          .filter((row) => !/^\|\s*(?:[-:|]|\s)+\|$/.test(row))
          .map((row) =>
            row
              .slice(1, -1)
              .split("|")
              .map((cell) => cell.trim())
          );
        const [headerRow, ...bodyRows] = parsedRows;
        if (headerRow && headerRow.length > 0) {
          result.push(
            <div key={`tbl-${idx}`} className="my-4 overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-muted/60 text-xs font-semibold text-muted-foreground">
                  <tr>
                    {headerRow.map((cell, cIdx) => (
                      <th key={cIdx} className="border-b border-border px-3.5 py-2">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-border/60 last:border-b-0">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      if (line.startsWith("### ")) {
        result.push(
          <h3 key={`h3-${idx}`} className="mt-5 font-display text-lg font-medium text-foreground">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        result.push(
          <h2 key={`h2-${idx}`} className="mt-6 font-display text-xl font-medium text-foreground">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("> ")) {
        result.push(
          <blockquote
            key={`q-${idx}`}
            className="my-3 rounded-r-xl border-l-2 border-primary bg-primary/5 px-4 py-2.5 text-sm italic text-foreground/90"
          >
            {line.slice(2)}
          </blockquote>
        );
      } else if (line.startsWith("- ")) {
        result.push(
          <li key={`li-${idx}`} className="ml-5 list-disc text-sm leading-relaxed text-foreground/90">
            {line.slice(2)}
          </li>
        );
      } else if (line.trim().length > 0) {
        result.push(
          <p key={`p-${idx}`} className="my-2.5 text-sm leading-relaxed text-foreground/90">
            {line}
          </p>
        );
      }
      idx++;
    }
    return result;
  }, [body, inlineImages]);

  return (
    <article className="space-y-4">
      {coverImage && (
        <div className="aspect-[16/8] w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <img src={coverImage} alt={title || "Ảnh bìa bài viết"} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{categoryName}</Badge>
        <span>·</span>
        <span className="tabular-mono">{readingMinutes} phút đọc</span>
      </div>

      <h1 className="font-display text-2xl font-medium leading-[1.2] text-foreground sm:text-3xl">
        {title.trim() || "Tiêu đề bài viết sẽ hiển thị tại đây"}
      </h1>

      {excerpt.trim() && (
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">{excerpt.trim()}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-border/70 pt-3">
        {body.trim() ? (
          blocks
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Nội dung xem trước sẽ tự động cập nhật khi bạn soạn thảo bài viết...
          </p>
        )}
      </div>
    </article>
  );
}

export function NewsComposePage() {
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const inlineImageInputRef = useRef(null);

  const categories = useCmsStore((s) => s.categories);
  const addArticle = useCmsStore((s) => s.addArticle);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const userId = useAuthStore((s) => s.userId);
  const fullName = useAuthStore((s) => s.fullName);

  const canContribute = isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.CMS_CONTRIBUTE);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  const defaultCatId = activeCategories[0]?.id ?? "";
  const initialDraft = useMemo(() => loadDraft(defaultCatId), [defaultCatId]);

  const [title, setTitle] = useState(initialDraft.title);
  const [excerpt, setExcerpt] = useState(initialDraft.excerpt);
  const [categoryId, setCategoryId] = useState(initialDraft.categoryId);
  const [tags, setTags] = useState(initialDraft.tags);
  const [tagInput, setTagInput] = useState("");
  const [body, setBody] = useState(initialDraft.body);
  const [coverImage, setCoverImage] = useState(initialDraft.coverImage);
  const [coverError, setCoverError] = useState(null);
  const [mode, setMode] = useState("write");
  const [savedAt, setSavedAt] = useState(null);

  // Unified Insert Modal state ("image" | "link" | "code" | "table" | "video" | null)
  const [inlineImages, setInlineImages] = useState({});
  const [activeInsertModal, setActiveInsertModal] = useState(null);
  const [modalError, setModalError] = useState(null);

  // Image modal fields
  const [imgDraftSrc, setImgDraftSrc] = useState("");
  const [imgDraftCaption, setImgDraftCaption] = useState("");

  // Link modal fields
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Code modal fields
  const [codeLang, setCodeLang] = useState("ts");
  const [codeContent, setCodeContent] = useState("");

  // Table modal fields (visual mini-grid)
  const [tableCols, setTableCols] = useState(3);
  const [tableHeaders, setTableHeaders] = useState(["Hạng mục", "Thời gian", "Ghi chú"]);
  const [tableRows, setTableRows] = useState([
    ["Vòng loại", "08:00 - 11:00", "Phòng máy A5"],
    ["Chung kết", "13:30 - 16:30", "Hội trường lớn"]
  ]);

  // Video modal fields
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const wordCount = useMemo(() => {
    const trimmed = body.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [body]);

  const readingMinutes = Math.max(1, Math.round(wordCount / 200));
  const previewSlug = slugifyVietnamese(title) || "tieu-de-bai-viet";
  const categoryName = activeCategories.find((c) => c.id === categoryId)?.name ?? "Bản tin FIT";

  // Auto-save local draft
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ title, excerpt, categoryId, tags, body, coverImage })
        );
        if (title.trim() || body.trim()) {
          setSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }
      } catch {
        // Ignore storage quota errors for large images
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [title, excerpt, categoryId, tags, body, coverImage]);

  const insertFormat = (prefix, suffix = "", placeholder = "") => {
    const el = textareaRef.current;
    if (!el) {
      setBody((prev) => `${prev}${prefix}${placeholder}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    const next = `${body.slice(0, start)}${prefix}${selected}${suffix}${body.slice(end)}`;
    setBody(next);
    window.requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleCoverUpload = (file) => {
    setCoverError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCoverError("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Ảnh bìa vượt quá 5MB. Vui lòng nén ảnh trước khi tải lên.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openInsertModal = (kind) => {
    setModalError(null);
    setActiveInsertModal(kind);
  };

  const handleInlineImageFile = (file) => {
    setModalError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setModalError("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setModalError("Ảnh vượt quá 5MB. Vui lòng nén ảnh trước khi chèn.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImgDraftSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInsertInlineImage = () => {
    const src = imgDraftSrc.trim();
    if (!src) {
      setModalError("Vui lòng tải ảnh lên hoặc dán đường dẫn ảnh.");
      return;
    }
    const caption = imgDraftCaption.trim() || "Ảnh minh họa";
    let tokenUrl = src;
    if (src.startsWith("data:")) {
      const id = `img-${Date.now().toString(36)}`;
      setInlineImages((prev) => ({ ...prev, [id]: src }));
      tokenUrl = `yit-img://${id}`;
    }
    insertFormat(`\n![${caption}](${tokenUrl})\n`);
    setImgDraftSrc("");
    setImgDraftCaption("");
    setModalError(null);
    setActiveInsertModal(null);
  };

  const handleInsertLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      setModalError("Vui lòng nhập đường dẫn liên kết (URL).");
      return;
    }
    const label = linkLabel.trim() || url;
    insertFormat(`[${label}](${url})`);
    setLinkLabel("");
    setLinkUrl("");
    setModalError(null);
    setActiveInsertModal(null);
  };

  const handleInsertCode = () => {
    if (!codeContent.trim()) {
      setModalError("Vui lòng nhập hoặc dán đoạn mã nguồn.");
      return;
    }
    insertFormat(`\n\`\`\`${codeLang}\n${codeContent.trim()}\n\`\`\`\n`);
    setCodeContent("");
    setModalError(null);
    setActiveInsertModal(null);
  };

  const handleChangeTableCols = (cols) => {
    setTableCols(cols);
    setTableHeaders((prev) =>
      Array.from({ length: cols }, (_, i) => prev[i] ?? `Cột ${i + 1}`)
    );
    setTableRows((prev) =>
      prev.map((row) => Array.from({ length: cols }, (_, i) => row[i] ?? ""))
    );
  };

  const handleInsertTable = () => {
    const headers = tableHeaders.slice(0, tableCols).map((h, i) => h.trim() || `Cột ${i + 1}`);
    const divider = headers.map(() => "---");
    const rows = tableRows.map((r) =>
      Array.from({ length: tableCols }, (_, i) => (r[i] ?? "").trim() || "—")
    );
    const md = [
      `| ${headers.join(" | ")} |`,
      `| ${divider.join(" | ")} |`,
      ...rows.map((r) => `| ${r.join(" | ")} |`)
    ].join("\n");
    insertFormat(`\n${md}\n`);
    setModalError(null);
    setActiveInsertModal(null);
  };

  const handleInsertVideo = () => {
    const url = videoUrl.trim();
    if (!url) {
      setModalError("Vui lòng nhập đường dẫn video (YouTube, Drive, Vimeo...).");
      return;
    }
    const label = videoTitle.trim() || "Video minh họa";
    insertFormat(`\n[Video: ${label}](${url})\n`);
    setVideoTitle("");
    setVideoUrl("");
    setModalError(null);
    setActiveInsertModal(null);
  };

  const handleTextareaPaste = (e) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (!file || file.size > 5 * 1024 * 1024) return;
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const id = `img-${Date.now().toString(36)}`;
        setInlineImages((prev) => ({ ...prev, [id]: reader.result }));
        insertFormat(`\n![Ảnh dán từ clipboard](yit-img://${id})\n`);
      }
    };
    reader.readAsDataURL(file);
  };

  const addTag = (raw) => {
    const cleaned = raw.trim().replace(/^#/, "");
    if (!cleaned || tags.includes(cleaned) || tags.length >= 6) return;
    setTags((prev) => [...prev, cleaned]);
    setTagInput("");
  };

  const removeTag = (target) => {
    setTags((prev) => prev.filter((t) => t !== target));
  };

  const handleManualDraftSave = () => {
    try {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ title, excerpt, categoryId, tags, body, coverImage })
      );
      setSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // Ignore quota errors
    }
  };

  const checks = {
    hasTitle: title.trim().length >= 10,
    hasBody: body.trim().length >= 60,
    hasTags: tags.length > 0,
    hasCover: Boolean(coverImage)
  };

  const canSubmit = checks.hasTitle && checks.hasBody && !coverError;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const finalSlug = slugifyVietnamese(title) || `bai-cong-tac-${Date.now()}`;
    const newItem = {
      id: `art-stu-${Date.now()}`,
      slug: finalSlug,
      title: title.trim(),
      excerpt: excerpt.trim() || body.trim().slice(0, 160),
      categoryId,
      tags: tags.length > 0 ? tags : ["Chia sẻ"],
      coverImage: coverImage || "/images/card-hackathon.jpg",
      authorName: fullName || (userId ? `CTV · ${userId}` : "Cộng tác viên Truyền thông"),
      authorRole: "CTV Truyền thông · Khoa CNTT",
      authorMssv: userId ?? undefined,
      source: "STUDENT_CONTRIBUTION",
      status: "PENDING_REVIEW",
      publishedAt: "Vừa gửi biên tập",
      readingMinutes,
      views: 0,
      sections: body
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((block) => {
          const imgMatch = block.match(/^!\[(.*?)\]\((.+?)\)$/);
          if (imgMatch) {
            return {
              type: "image",
              src: resolveImageSrc(imgMatch[2] ?? "", inlineImages),
              caption: imgMatch[1] || undefined
            };
          }
          if (block.startsWith("## ") || block.startsWith("### ")) {
            return { type: "heading", text: block.replace(/^#{2,3}\s+/, "") };
          }
          return { type: "paragraph", text: block };
        })
    };

    addArticle(newItem);
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    void navigate("/news", {
      state: {
        submittedTitle: newItem.title
      }
    });
  };

  if (!canContribute) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card className="rounded-[24px]">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-medium text-foreground">
                Không có quyền viết bài cộng tác
              </h1>
              <p className="text-sm text-muted-foreground">
                Trang soạn thảo bài viết chỉ dành cho CTV Truyền thông được cấp quyền, Ban Chấp hành hoặc Ban Thường vụ.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/news">
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại Bản tin</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Action Bar */}
      <section className="liquid-glass flex flex-col gap-4 rounded-[24px] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full px-3">
            <Link to="/news">
              <ArrowLeft className="h-4 w-4" />
              <span>Bản tin</span>
            </Link>
          </Button>
          <div className="h-5 w-px bg-border/80" />
          <div>
            <h1 className="font-display text-xl font-medium leading-tight text-foreground sm:text-2xl">
              Soạn bài Cộng tác
            </h1>
            <p className="tabular-mono text-xs text-muted-foreground">
              {wordCount} từ · {readingMinutes} phút đọc
              {savedAt ? ` · Đã lưu nháp lúc ${savedAt}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted/80 p-1">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                mode === "write"
                  ? "bg-card text-foreground shadow-sm dark:bg-white/15"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("split")}
              className={cn(
                "hidden xl:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                mode === "split"
                  ? "bg-card text-foreground shadow-sm dark:bg-white/15"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>Song song</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                mode === "preview"
                  ? "bg-card text-foreground shadow-sm dark:bg-white/15"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Xem trước</span>
            </button>
          </div>

          <Button type="button" variant="outline" size="sm" className="h-9 rounded-full" onClick={handleManualDraftSave}>
            <Save className="h-3.5 w-3.5" />
            <span>Lưu nháp</span>
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="liquid-glass-btn-cobalt h-9 rounded-full px-4"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Gửi biên tập</span>
          </Button>
        </div>
      </section>

      {/* Main 2-Column Studio Workspace */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Writing / Preview Canvas */}
        <div className={cn("space-y-5", mode === "split" ? "lg:col-span-12" : "lg:col-span-8")}>
          <div className={cn("grid gap-5", mode === "split" ? "xl:grid-cols-2" : "grid-cols-1")}>
            {(mode === "write" || mode === "split") && (
              <div className="overflow-hidden rounded-[22px] border border-border bg-card">
                {/* Cover Image Dropzone / Preview */}
                <div className="border-b border-border/80 bg-muted/25 p-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                    className="hidden"
                  />

                  {coverImage ? (
                    <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border bg-muted">
                      <img src={coverImage} alt="Ảnh bìa bài viết" className="h-full w-full object-cover" />
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 rounded-full bg-card/90 backdrop-blur"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                          <span>Đổi ảnh</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 rounded-full bg-card/90 p-0 text-status-danger backdrop-blur"
                          onClick={() => setCoverImage("")}
                          aria-label="Xóa ảnh bìa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-background/60 p-5 sm:flex-row">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Thêm ảnh bìa bài viết</p>
                          <p className="text-xs text-muted-foreground">
                            Tỷ lệ ngang 16:9 đẹp nhất · Hỗ trợ JPG, PNG, WebP tối đa 5MB.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Tải ảnh lên</span>
                      </Button>
                    </div>
                  )}

                  {coverError && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-status-danger/35 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{coverError}</span>
                    </div>
                  )}
                </div>

                {/* Title & Excerpt */}
                <div className="space-y-3 px-6 pt-5 pb-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                    className="w-full bg-transparent font-display text-2xl font-medium tracking-tight text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-3xl"
                  />
                  <input
                    type="text"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Viết đoạn mở đầu ngắn (sapo) để thu hút người đọc..."
                    className="w-full bg-transparent text-sm leading-relaxed text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>

                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-y border-border/80 bg-muted/30 px-4 py-2">
                  {[
                    { icon: Heading2, label: "Tiêu đề mục (H2)", action: () => insertFormat("\n## ", "\n", "Tiêu đề mục") },
                    { icon: Heading3, label: "Tiêu đề phụ (H3)", action: () => insertFormat("\n### ", "\n", "Tiêu đề phụ") },
                    { icon: Bold, label: "In đậm", action: () => insertFormat("**", "**", "văn bản in đậm") },
                    { icon: Italic, label: "In nghiêng", action: () => insertFormat("*", "*", "văn bản in nghiêng") },
                    { icon: List, label: "Danh sách", action: () => insertFormat("\n- ", "", "Nội dung mục") },
                    { icon: Quote, label: "Trích dẫn", action: () => insertFormat("\n> ", "\n", "Câu trích dẫn nổi bật") },
                    { icon: Link2, label: "Liên kết", action: () => openInsertModal("link") },
                    { icon: ImageIcon, label: "Ảnh minh họa", action: () => openInsertModal("image") },
                    { icon: Code2, label: "Khối mã nguồn", action: () => openInsertModal("code") },
                    { icon: Table2, label: "Bảng dữ liệu", action: () => openInsertModal("table") },
                    { icon: Video, label: "Nhúng video", action: () => openInsertModal("video") }
                  ].map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.label}
                        type="button"
                        title={tool.label}
                        onClick={tool.action}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tool.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Spacious Body Editor */}
                <div className="p-6">
                  <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onPaste={handleTextareaPaste}
                    placeholder="Bắt đầu viết nội dung bài viết tại đây... Bạn có thể dùng thanh công cụ phía trên để chèn ảnh, tiêu đề, danh sách, bảng, mã nguồn hoặc nhấn Ctrl+V để dán ảnh trực tiếp."
                    className="min-h-[380px] w-full resize-y bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {(mode === "preview" || mode === "split") && (
              <div className="rounded-[22px] border border-border bg-card p-6 sm:p-8">
                <ArticlePreview
                  title={title}
                  excerpt={excerpt}
                  categoryName={categoryName}
                  tags={tags}
                  coverImage={coverImage}
                  body={body}
                  inlineImages={inlineImages}
                  readingMinutes={readingMinutes}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Publishing Sidebar */}
        <aside className={cn("space-y-4", mode === "split" ? "lg:col-span-12 xl:grid xl:grid-cols-2 xl:gap-5 xl:space-y-0" : "lg:col-span-4")}>
          <Card className="rounded-[20px]">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg font-medium">Thiết lập bài viết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Chuyên mục</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compose-tag-input">Thẻ chủ đề (tối đa 6 thẻ)</Label>
                <div className="flex gap-2">
                  <Input
                    id="compose-tag-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Nhập thẻ rồi nhấn Enter..."
                    className="h-9 rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 shrink-0 rounded-xl"
                    onClick={() => addTag(tagInput)}
                  >
                    Thêm
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          aria-label={`Xóa thẻ ${tag}`}
                          className="rounded-full p-0.5 hover:bg-primary/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">Đường dẫn dự kiến</p>
                <p className="mt-0.5 truncate text-xs text-foreground tabular-mono">/news/{previewSlug}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px]">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg font-medium">Kiểm tra trước khi gửi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              {[
                { ok: checks.hasTitle, label: "Tiêu đề rõ ràng (từ 10 ký tự trở lên)" },
                { ok: checks.hasBody, label: "Nội dung bài viết đầy đủ (từ 60 ký tự trở lên)" },
                { ok: checks.hasTags, label: "Đã gắn ít nhất 1 thẻ chủ đề" },
                { ok: checks.hasCover, label: "Đã chọn ảnh bìa minh họa (khuyến nghị)" }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                      item.ok
                        ? "bg-status-success/15 text-status-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.ok ? <Check className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3 opacity-40" />}
                  </span>
                  <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
              <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                Sau khi gửi, bài viết sẽ chuyển vào hàng chờ duyệt của Tổ Truyền thông để biên tập và lên lịch xuất bản.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Unified Friendly Insert Dialog (Image / Link / Code / Table / Video) */}
      <Dialog open={activeInsertModal !== null} onOpenChange={(open) => !open && setActiveInsertModal(null)}>
        <DialogContent className={cn("rounded-[24px]", activeInsertModal === "table" ? "max-w-2xl" : "max-w-lg")}>
          {activeInsertModal === "image" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-medium">Chèn ảnh vào bài viết</DialogTitle>
                <DialogDescription>
                  Tải ảnh từ máy tính hoặc dán đường dẫn URL (bạn cũng có thể nhấn Ctrl+V trực tiếp trong khung viết).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {imgDraftSrc && (
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                    <img src={imgDraftSrc} alt={imgDraftCaption || "Xem trước ảnh"} className="max-h-48 w-full object-cover" />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="space-y-1.5 sm:col-span-5">
                    <Label>Tải ảnh từ máy</Label>
                    <input
                      ref={inlineImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleInlineImageFile(e.target.files?.[0])}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-xl"
                      onClick={() => inlineImageInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Tải ảnh lên (≤ 5MB)</span>
                    </Button>
                  </div>

                  <div className="space-y-1.5 sm:col-span-7">
                    <Label htmlFor="inline-img-url">Hoặc dán URL ảnh</Label>
                    <Input
                      id="inline-img-url"
                      value={imgDraftSrc.startsWith("data:") ? "" : imgDraftSrc}
                      onChange={(e) => {
                        setImgDraftSrc(e.target.value);
                        setModalError(null);
                      }}
                      placeholder="https://... hoặc /images/..."
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inline-img-caption">Chú thích ảnh (tùy chọn)</Label>
                  <Input
                    id="inline-img-caption"
                    value={imgDraftCaption}
                    onChange={(e) => setImgDraftCaption(e.target.value)}
                    placeholder="VD: Không khí vòng chung kết FIT Hackathon 2026"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {modalError && (
                <p className="rounded-xl border border-status-danger/35 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
                  {modalError}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveInsertModal(null)}>
                  Hủy
                </Button>
                <Button type="button" className="liquid-glass-btn-cobalt rounded-full px-5" onClick={handleInsertInlineImage}>
                  Chèn ảnh
                </Button>
              </DialogFooter>
            </>
          )}

          {activeInsertModal === "link" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-medium">Chèn liên kết</DialogTitle>
                <DialogDescription>
                  Thêm đường dẫn tới tài liệu, biểu mẫu đăng ký hoặc trang tham khảo ngoài.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="insert-link-label">Văn bản hiển thị</Label>
                  <Input
                    id="insert-link-label"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="VD: Thể lệ cuộc thi UTE Hackathon 2026"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="insert-link-url">Đường dẫn (URL)</Label>
                  <Input
                    id="insert-link-url"
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      setModalError(null);
                    }}
                    placeholder="https://fit.hcmute.edu.vn/..."
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {modalError && (
                <p className="rounded-xl border border-status-danger/35 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
                  {modalError}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveInsertModal(null)}>
                  Hủy
                </Button>
                <Button type="button" className="liquid-glass-btn-cobalt rounded-full px-5" onClick={handleInsertLink}>
                  Chèn liên kết
                </Button>
              </DialogFooter>
            </>
          )}

          {activeInsertModal === "code" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-medium">Chèn khối mã nguồn</DialogTitle>
                <DialogDescription>
                  Chọn ngôn ngữ lập trình và dán đoạn mã minh họa cho bài viết học thuật.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Ngôn ngữ</Label>
                  <Select value={codeLang} onValueChange={setCodeLang}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ts">TypeScript / JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C / C++</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                      <SelectItem value="bash">Bash / Terminal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="insert-code-body">Nội dung mã nguồn</Label>
                  <Textarea
                    id="insert-code-body"
                    rows={7}
                    value={codeContent}
                    onChange={(e) => {
                      setCodeContent(e.target.value);
                      setModalError(null);
                    }}
                    placeholder={'console.log("YITZone FIT");'}
                    className="rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {modalError && (
                <p className="rounded-xl border border-status-danger/35 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
                  {modalError}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveInsertModal(null)}>
                  Hủy
                </Button>
                <Button type="button" className="liquid-glass-btn-cobalt rounded-full px-5" onClick={handleInsertCode}>
                  Chèn mã nguồn
                </Button>
              </DialogFooter>
            </>
          )}

          {activeInsertModal === "table" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-medium">Chèn bảng dữ liệu</DialogTitle>
                <DialogDescription>
                  Điền trực tiếp tiêu đề cột và nội dung từng ô — hệ thống tự căn chỉnh bảng chuẩn.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Số cột:</span>
                    {[2, 3, 4].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleChangeTableCols(c)}
                        className={cn(
                          "h-7 w-7 rounded-full text-xs font-semibold transition-colors",
                          tableCols === c
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full text-xs"
                      onClick={() => setTableRows((prev) => [...prev, Array.from({ length: tableCols }, () => "")])}
                    >
                      + Thêm dòng
                    </Button>
                    {tableRows.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full text-xs text-status-danger"
                        onClick={() => setTableRows((prev) => prev.slice(0, -1))}
                      >
                        Bớt dòng
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 overflow-x-auto">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${tableCols}, minmax(110px, 1fr))` }}
                  >
                    {Array.from({ length: tableCols }).map((_, colIdx) => (
                      <Input
                        key={`th-${colIdx}`}
                        value={tableHeaders[colIdx] ?? ""}
                        onChange={(e) =>
                          setTableHeaders((prev) => {
                            const next = [...prev];
                            next[colIdx] = e.target.value;
                            return next;
                          })
                        }
                        placeholder={`Tiêu đề cột ${colIdx + 1}`}
                        className="h-9 rounded-lg bg-muted/50 text-xs font-semibold"
                      />
                    ))}
                  </div>

                  {tableRows.map((row, rowIdx) => (
                    <div
                      key={`tr-${rowIdx}`}
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${tableCols}, minmax(110px, 1fr))` }}
                    >
                      {Array.from({ length: tableCols }).map((_, colIdx) => (
                        <Input
                          key={`td-${rowIdx}-${colIdx}`}
                          value={row[colIdx] ?? ""}
                          onChange={(e) =>
                            setTableRows((prev) =>
                              prev.map((r, rI) =>
                                rI === rowIdx
                                  ? Array.from({ length: tableCols }, (_, cI) =>
                                      cI === colIdx ? e.target.value : (r[cI] ?? "")
                                    )
                                  : r
                              )
                            )
                          }
                          placeholder="Nhập nội dung..."
                          className="h-9 rounded-lg text-xs"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveInsertModal(null)}>
                  Hủy
                </Button>
                <Button type="button" className="liquid-glass-btn-cobalt rounded-full px-5" onClick={handleInsertTable}>
                  Chèn bảng
                </Button>
              </DialogFooter>
            </>
          )}

          {activeInsertModal === "video" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-medium">Nhúng video</DialogTitle>
                <DialogDescription>
                  Dán liên kết video từ YouTube, Google Drive hoặc Vimeo để đính kèm vào bài viết.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="insert-video-title">Tiêu đề video</Label>
                  <Input
                    id="insert-video-title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="VD: Recap Đêm Chung kết FIT Hackathon 2026"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="insert-video-url">Đường dẫn video (URL)</Label>
                  <Input
                    id="insert-video-url"
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setModalError(null);
                    }}
                    placeholder="https://youtu.be/..."
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {modalError && (
                <p className="rounded-xl border border-status-danger/35 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
                  {modalError}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveInsertModal(null)}>
                  Hủy
                </Button>
                <Button type="button" className="liquid-glass-btn-cobalt rounded-full px-5" onClick={handleInsertVideo}>
                  Chèn video
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
