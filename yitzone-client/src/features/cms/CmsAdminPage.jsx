import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Code2,
  Eye,
  EyeOff,
  ExternalLink,
  FileEdit,
  FolderKanban,
  Globe,
  MessageSquareWarning,
  Pencil,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCmsStore } from "@/stores/cms-store";
import { slugifyVietnamese } from "./cms-data";

function renderStatusBadge(status) {
  switch (status) {
    case "PUBLISHED":
      return (
        <Badge variant="success">
          <Globe className="h-3 w-3" />
          <span>Đã xuất bản</span>
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge variant="info">
          <CalendarClock className="h-3 w-3" />
          <span>Đã hẹn giờ</span>
        </Badge>
      );
    case "PENDING_REVIEW":
      return (
        <Badge variant="warning">
          <FileEdit className="h-3 w-3" />
          <span>Chờ biên tập</span>
        </Badge>
      );
    case "REVISION_REQUESTED":
      return (
        <Badge variant="danger">
          <MessageSquareWarning className="h-3 w-3" />
          <span>Yêu cầu sửa</span>
        </Badge>
      );
    case "DRAFT":
      return <Badge variant="secondary">Bản nháp</Badge>;
  }
}

export function CmsAdminPage(){
  const categories = useCmsStore((s) => s.categories);
  const articles = useCmsStore((s) => s.articles);
  const addArticle = useCmsStore((s) => s.addArticle);
  const updateArticle = useCmsStore((s) => s.updateArticle);
  const addCategory = useCmsStore((s) => s.addCategory);
  const updateCategory = useCmsStore((s) => s.updateCategory);
  const deleteCategory = useCmsStore((s) => s.deleteCategory);

  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Editorial review dialog (UC-CMS-02)
  const [reviewingArticle, setReviewingArticle] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [scheduleDatetime, setScheduleDatetime] = useState("");

  // Unpublish audit dialog
  const [unpublishTarget, setUnpublishTarget] = useState(null);

  // Internal composer state (UC-CMS-01)
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState(() => categories[0]?.id ?? "");
  const [draftTags, setDraftTags] = useState("Đoàn - Hội, FIT HCM-UTE");
  const [draftBody, setDraftBody] = useState("");
  const [draftCoverError, setDraftCoverError] = useState(null);
  const [draftCoverLabel, setDraftCoverLabel] = useState("Ảnh mặc định: card-hackathon.jpg");

  // UC-CMS-03 Category CRUD state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catOrder, setCatOrder] = useState("1");
  const [catFormError, setCatFormError] = useState(null);

  // Category hide/delete with referential protection + AuditActionDialog
  const [hideCategoryTarget, setHideCategoryTarget] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [deleteConfirmAuditOpen, setDeleteConfirmAuditOpen] = useState(false);

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const articleCountByCategory = useMemo(() => {
    const map = new Map;
    articles.forEach((a) => {
      map.set(a.categoryId, (map.get(a.categoryId) ?? 0) + 1);
    });
    return map;
  }, [articles]);

  const queueItems = useMemo(() =>
      articles.filter((a) =>
        ["PENDING_REVIEW", "REVISION_REQUESTED", "DRAFT"].includes(a.status)
      ),
    [articles]
  );

  const liveItems = useMemo(() => articles.filter((a) => ["PUBLISHED", "SCHEDULED"].includes(a.status)),
    [articles]
  );

  const openReview = (article) => {
    setReviewingArticle(article);
    setFeedbackNote(article.editorialNote ?? "");
  };

  const handlePublishNow = (article) => {
    updateArticle(article.id, {
      status: "PUBLISHED",
      publishedAt: `${new Date().toLocaleDateString("vi-VN")} · Vừa xuất bản`,
      scheduledAt: undefined,
      editorialNote: undefined
    });
    setReviewingArticle(null);
    setStatusMessage(`Đã xuất bản ngay bài viết "${article.title}" lên trang chủ /news.`);
  };

  const handleSchedulePublish = (article) => {
    if (!scheduleDatetime) return;
    const formatted = scheduleDatetime.replace("T", " ");
    updateArticle(article.id, {
      status: "SCHEDULED",
      scheduledAt: formatted,
      editorialNote: feedbackNote.trim() || undefined
    });
    setReviewingArticle(null);
    setStatusMessage(
      `Đã hẹn giờ tự động đăng bài "${article.title}" lúc ${formatted} (sai số đồng bộ ≤ 60s).`
    );
  };

  const handleRequestRevision = (article) => {
    if (!feedbackNote.trim()) return;
    updateArticle(article.id, {
      status: "REVISION_REQUESTED",
      editorialNote: feedbackNote.trim()
    });
    setReviewingArticle(null);
    setStatusMessage(`Đã gửi góp ý chỉnh sửa cho tác giả ${article.authorName}.`);
  };

  const handleSaveInternalDraft = (submitToReview) => {
    if (!draftTitle.trim() || !draftBody.trim() || draftCoverError) return;
    const slug = slugifyVietnamese(draftTitle) || `ban-tin-${Date.now()}`;

    const created = {
      id: `art-emfit-${Date.now()}`,
      slug,
      title: draftTitle.trim(),
      excerpt: draftBody.trim().slice(0, 150),
      categoryId: draftCategoryId,
      tags: draftTags
.split(",")
.map((t) => t.trim())
.filter(Boolean),
      coverImage: "/images/card-hackathon.jpg",
      authorName: "Biên tập viên Tổ Truyền thông",
      authorRole: "Ban Truyền thông · EMFIT",
      source: "INTERNAL_EMFIT",
      status: submitToReview ? "PENDING_REVIEW": "DRAFT",
      publishedAt: submitToReview ? "Chờ cấp duyệt EMFIT": "Bản nháp nội bộ",
      readingMinutes: Math.max(2, Math.ceil(draftBody.split(/\s+/).length / 180)),
      views: 0,
      sections: [{ type: "paragraph", text: draftBody.trim() }]
    };

    addArticle(created);
    setDraftTitle("");
    setDraftBody("");
    setStatusMessage(
      submitToReview
        ? `Đã gửi bài "${created.title}" sang Hàng chờ Phê duyệt & Hẹn giờ.`
: `Đã lưu Bản nháp "${created.title}".`
    );
  };

  // --- UC-CMS-03 Category CRUD Handlers ---
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatDesc("");
    setCatOrder(String(categories.length + 1));
    setCatFormError(null);
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description);
    setCatOrder(String(cat.displayOrder));
    setCatFormError(null);
    setCatDialogOpen(true);
  };

  const handleSaveCategory = () => {
    const trimmedName = catName.trim();
    const normalizedSlug = slugifyVietnamese(catSlug.trim() || trimmedName);
    if (!trimmedName || !normalizedSlug) {
      setCatFormError("Vui lòng nhập tên chuyên mục và đường dẫn SEO (slug) hợp lệ.");
      return;
    }

    const duplicateSlug = categories.find(
      (c) => c.slug === normalizedSlug && c.id !== editingCategory?.id
    );
    if (duplicateSlug) {
      setCatFormError(`Slug "${normalizedSlug}" đã tồn tại ở chuyên mục "${duplicateSlug.name}".`);
      return;
    }

    const orderNum = Math.max(1, Number(catOrder) || categories.length + 1);

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: trimmedName,
        slug: normalizedSlug,
        description: catDesc.trim(),
        displayOrder: orderNum
      });
      setStatusMessage(`Đã cập nhật chuyên mục "${trimmedName}" (/${normalizedSlug}).`);
    } else {
      addCategory({
        id: `cat-${Date.now()}`,
        name: trimmedName,
        slug: normalizedSlug,
        description: catDesc.trim(),
        displayOrder: orderNum,
        isActive: true
      });
      setStatusMessage(`Đã thêm chuyên mục mới "${trimmedName}" — hiển thị ngay trên trang /news.`);
    }

    setErrorMessage(null);
    setCatDialogOpen(false);
  };

  const initiateDeleteCategory = (cat) => {
    setErrorMessage(null);
    const linkedCount = articleCountByCategory.get(cat.id) ?? 0;
    const otherCategories = categories.filter((c) => c.id !== cat.id);
    setDeleteCategoryTarget(cat);
    setReassignTargetId(otherCategories[0]?.id ?? "");

    if (linkedCount === 0) {
      // No articles -> proceed directly to AuditActionDialog
      setDeleteConfirmAuditOpen(true);
    }
  };

  const queueColumns = [
    {
      key: "title",
      header: "Bài viết & Nguồn gửi",
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{row.title}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{row.authorName}</span>
            {row.authorMssv && <span className="tabular-mono">({row.authorMssv})</span>}
            <span>·</span>
            <span>{categoryNameById.get(row.categoryId) ?? "Chuyên mục"}</span>
            {row.source === "STUDENT_CONTRIBUTION" && (
              <Badge variant="info" className="text-[11px]">
                <UserCheck className="h-3 w-3" />
                <span>Cộng tác SV</span>
              </Badge>
            )}
          </div>
          {row.editorialNote && (
            <p className="text-xs text-status-warning">Ghi chú biên tập: {row.editorialNote}</p>
          )}
        </div>
      )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => renderStatusBadge(row.status)
    },
    {
      key: "actions",
      header: "Thao tác biên tập",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" onClick={() => openReview(row)}>
            Biên tập &amp; Duyệt
          </Button>
        </div>
      )
    }
  ];

  const liveColumns = [
    {
      key: "title",
      header: "Bài viết",
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.title}</div>
          <div className="text-xs text-muted-foreground">
            {categoryNameById.get(row.categoryId) ?? "Chuyên mục"} · {row.authorName}
          </div>
        </div>
      )
    },
    {
      key: "schedule",
      header: "Thời điểm đăng",
      render: (row) => (
        <span className="tabular-mono text-xs text-muted-foreground">
          {row.status === "SCHEDULED" ? `Hẹn: ${row.scheduledAt}`: row.publishedAt}
        </span>
      )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => renderStatusBadge(row.status)
    },
    {
      key: "views",
      header: "Lượt đọc",
      align: "right",
      render: (row) => <span className="tabular-mono font-medium">{row.views.toLocaleString("vi-VN")}</span>
    },
    {
      key: "actions",
      header: "Điều hành",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === "PUBLISHED" ? (
            <Button asChild size="sm" variant="outline">
              <Link to={`/news/${row.slug}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Xem</span>
              </Link>
            </Button>
          ): (
            <Button type="button" size="sm" onClick={() => handlePublishNow(row)}>
              Đăng ngay
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
            onClick={() => setUnpublishTarget(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Gỡ</span>
          </Button>
        </div>
      )
    }
  ];

  const categoryColumns = [
    {
      key: "order",
      header: "Thứ tự",
      render: (row) => <span className="tabular-mono font-semibold text-muted-foreground">#{row.displayOrder}</span>
    },
    {
      key: "name",
      header: "Tên Chuyên mục & Slug SEO",
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.name}</div>
          <div className="tabular-mono text-xs text-primary">/news?category={row.slug}</div>
          {row.description && <p className="text-xs text-muted-foreground">{row.description}</p>}
        </div>
      )
    },
    {
      key: "count",
      header: "Bài viết gắn",
      align: "right",
      render: (row) => {
        const count = articleCountByCategory.get(row.id) ?? 0;
        return (
          <Badge variant={count > 0 ? "secondary": "outline"} className="tabular-mono">
            {count} bài
          </Badge>
        );
      }
    },
    {
      key: "status",
      header: "Hiển thị",
      render: (row) =>
        row.isActive ? (
          <Badge variant="success">
            <Eye className="h-3 w-3" />
            <span>Đang hiển thị</span>
          </Badge>
        ): (
          <Badge variant="warning">
            <EyeOff className="h-3 w-3" />
            <span>Tạm ẩn</span>
          </Badge>
        )
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={() => openEditCategory(row)}>
            <Pencil className="h-3.5 w-3.5" />
            <span>Sửa</span>
          </Button>
          {row.isActive ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setHideCategoryTarget(row)}
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Ẩn</span>
            </Button>
          ): (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                updateCategory(row.id, { isActive: true });
                setStatusMessage(`Đã bật hiển thị lại chuyên mục "${row.name}".`);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Hiện</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
            onClick={() => initiateDeleteCategory(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  const deleteLinkedCount = deleteCategoryTarget
    ? articleCountByCategory.get(deleteCategoryTarget.id) ?? 0
: 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản trị Bản tin &amp; Tòa soạn Truyền thông
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quy trình biên tập, tiếp nhận bài cộng tác sinh viên, hẹn giờ xuất bản và quản lý chuyên mục.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="verified">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Tòa soạn Tổ Truyền thông (EMFIT)</span>
          </Badge>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/news">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Xem trang Bản tin</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/admin/cms/compose">
              <Plus className="h-3.5 w-3.5" />
              <span>Soạn bài viết mới</span>
            </Link>
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center justify-between rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {statusMessage}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline"
          >
            Đóng
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-sm text-status-danger">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {errorMessage}
          </span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground">Chờ biên tập / Cộng tác</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-status-warning">
            {articles.filter((a) => a.status === "PENDING_REVIEW").length}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground">Đã hẹn giờ (≤ 60s)</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-status-info">
            {articles.filter((a) => a.status === "SCHEDULED").length}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground">Đang xuất bản</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-status-success">
            {articles.filter((a) => a.status === "PUBLISHED").length}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground">Chuyên mục đang bật</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-primary">
            {categories.filter((c) => c.isActive).length}/{categories.length}
          </div>
        </div>
      </div>

      <Tabs defaultValue="queue" className="min-h-[480px]">
        <TabsList className="justify-start">
          <TabsTrigger value="queue">Hàng chờ Biên tập ({queueItems.length})</TabsTrigger>
          <TabsTrigger value="live">Đã lên lịch &amp; Xuất bản ({liveItems.length})</TabsTrigger>
          <TabsTrigger value="categories">Quản lý Chuyên mục ({categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
            Phân quyền cô lập: Chỉ Tổ Truyền thông (`EMFIT`), Phó Ban `EMFIT`, `BCH`, `BTV` có gói{" "}
            <span className="font-semibold text-foreground">Tổ Truyền thông (EMFIT)</span> mới xem và
            duyệt hàng chờ này (Tổ trưởng các Tổ khác như Tổ Hát không thể truy cập).
          </div>
          <DataTable
            columns={queueColumns}
            data={queueItems}
            emptyTitle="Không có bài chờ biên tập"
            emptyDescription="Mọi bài viết nội bộ và bài cộng tác sinh viên đã được xử lý."
          />
        </TabsContent>

        <TabsContent value="compose" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle>Trình soạn thảo Đa phương tiện</CardTitle>
                <CardDescription>
                  Hỗ trợ ảnh ≤ 5MB, bảng biểu, video nhúng và khối mã nguồn (Code block) cho chuyên mục học thuật.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cms-title">Tiêu đề bản tin</Label>
                  <Input
                    id="cms-title"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Chuyên mục</Label>
                    <Select value={draftCategoryId} onValueChange={setDraftCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chuyên mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
.filter((c) => c.isActive)
.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cms-tags">Thẻ (tags)</Label>
                    <Input
                      id="cms-tags"
                      value={draftTags}
                      onChange={(e) => setDraftTags(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="cms-body">Nội dung</Label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg px-2 text-xs"
                        onClick={() =>
                          setDraftBody((p) => `${p}\n\`\`\`java\n// Code block\n\`\`\`\n`)
                        }
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Code</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg px-2 text-xs"
                        onClick={() =>
                          setDraftBody((p) => `${p}\n| Cột 1 | Cột 2 |\n| --- | --- |\n| Giá trị | Mô tả |\n`)
                        }
                      >
                        <span>Bảng</span>
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="cms-body"
                    rows={8}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    placeholder="Soạn nội dung bản tin truyền thông..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cms-cover">Tải ảnh bìa (≤ 5MB)</Label>
                  <Input
                    id="cms-cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setDraftCoverError(null);
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) {
                        setDraftCoverError("Ảnh bìa vượt quá dung lượng tối đa 5MB.");
                      } else {
                        setDraftCoverLabel(`${f.name} (${(f.size / 1024).toFixed(0)} KB)`);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">{draftCoverLabel}</p>
                  {draftCoverError && (
                    <p className="text-xs font-medium text-status-danger">{draftCoverError}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!draftTitle.trim() || !draftBody.trim() || Boolean(draftCoverError)}
                    onClick={() => handleSaveInternalDraft(false)}
                  >
                    Lưu Bản nháp
                  </Button>
                  <Button
                    type="button"
                    disabled={!draftTitle.trim() || !draftBody.trim() || Boolean(draftCoverError)}
                    onClick={() => handleSaveInternalDraft(true)}
                  >
                    <Send className="h-4 w-4" />
                    <span>Gửi sang bước Biên tập</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle>Xem trước Bố cục Đọc (68ch)</CardTitle>
                <CardDescription>Kiểm tra nhịp dòng tiếng Việt trước khi gửi duyệt.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="default">{categoryNameById.get(draftCategoryId) ?? "Chuyên mục"}</Badge>
                <h2 className="font-display text-xl font-medium leading-snug text-foreground">
                  {draftTitle.trim() || "Tiêu đề bài viết sẽ hiển thị tại đây"}
                </h2>
                <div className="max-w-[68ch] whitespace-pre-wrap text-sm leading-[1.65] text-muted-foreground">
                  {draftBody.trim() ||
                    "Nội dung xem trước tuân thủ độ rộng đọc 65–72 ký tự trên mỗi dòng và chiều cao dòng ≥ 1.55 cho chữ tiếng Việt có dấu."}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live" className="mt-4">
          <DataTable
            columns={liveColumns}
            data={liveItems}
            emptyTitle="Chưa có bài xuất bản"
            emptyDescription="Các bài đã hẹn giờ và đã xuất bản sẽ xuất hiện tại đây."
          />
        </TabsContent>

        {/* TAB 4: UC-CMS-03 — Category CRUD */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Quản trị danh mục chuyên mục. Chặn xóa vĩnh viễn chuyên mục đang có bài
                viết — yêu cầu chuyển bài sang chuyên mục đích hoặc chuyển trạng thái Tạm ẩn.
              </span>
            </div>
            <Button type="button" size="sm" onClick={openCreateCategory} className="shrink-0">
              <Plus className="h-4 w-4" />
              <span>Thêm Chuyên mục</span>
            </Button>
          </div>

          <DataTable
            columns={categoryColumns}
            data={categories}
            emptyTitle="Chưa có chuyên mục nào"
            emptyDescription="Tạo chuyên mục đầu tiên để phân loại bản tin truyền thông."
          />
        </TabsContent>
      </Tabs>

      {/* Editorial Review & Scheduling Dialog */}
      <Dialog open={Boolean(reviewingArticle)} onOpenChange={(o) => !o && setReviewingArticle(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Biên tập, Phê duyệt &amp; Hẹn giờ Xuất bản</DialogTitle>
            <DialogDescription>
              {reviewingArticle?.title} · Tác giả: {reviewingArticle?.authorName}
            </DialogDescription>
          </DialogHeader>

          {reviewingArticle && (
            <div className="space-y-4 py-1">
              <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-sm leading-relaxed text-foreground">
                {reviewingArticle.excerpt}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editorial-note">Nhận xét biên tập / Yêu cầu chỉnh sửa</Label>
                <Textarea
                  id="editorial-note"
                  rows={3}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Nhập góp ý cho tác giả nếu cần chỉnh sửa nội dung, ảnh bìa hoặc thuật ngữ..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="schedule-time">Hẹn giờ tự động đăng (sai số ≤ 60 giây)</Label>
                <Input
                  id="schedule-time"
                  type="datetime-local"
                  value={scheduleDatetime}
                  onChange={(e) => setScheduleDatetime(e.target.value)}
                  className="tabular-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {reviewingArticle && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!feedbackNote.trim()}
                  onClick={() => handleRequestRevision(reviewingArticle)}
                >
                  Yêu cầu chỉnh sửa
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!scheduleDatetime}
                  onClick={() => handleSchedulePublish(reviewingArticle)}
                >
                  <CalendarClock className="h-4 w-4" />
                  <span>Hẹn giờ đăng</span>
                </Button>
                <Button type="button" onClick={() => handlePublishNow(reviewingArticle)}>
                  <Globe className="h-4 w-4" />
                  <span>Xuất bản ngay</span>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Category Dialog (UC-CMS-03) */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Chỉnh sửa Chuyên mục Bản tin": "Tạo Chuyên mục Bản tin mới"}
            </DialogTitle>
            <DialogDescription>
              Thay đổi sẽ cập nhật đồng bộ thanh lọc chuyên mục trên trang /news và biểu mẫu gửi bài cộng tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Tên chuyên mục</Label>
              <Input
                id="cat-name"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (!editingCategory) {
                    setCatSlug(slugifyVietnamese(e.target.value));
                  }
                  if (catFormError) setCatFormError(null);
                }}
                placeholder="VD: Cuộc thi Học thuật & ICPC"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cat-slug">Slug SEO (duy nhất)</Label>
                <Input
                  id="cat-slug"
                  value={catSlug}
                  onChange={(e) => {
                    setCatSlug(e.target.value);
                    if (catFormError) setCatFormError(null);
                  }}
                  placeholder="cuoc-thi-hoc-thuat-icpc"
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-order">Thứ tự hiển thị</Label>
                <Input
                  id="cat-order"
                  type="number"
                  min={1}
                  value={catOrder}
                  onChange={(e) => setCatOrder(e.target.value)}
                  className="tabular-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Mô tả ngắn chuyên mục</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Mô tả ngắn phạm vi nội dung của chuyên mục..."
              />
            </div>

            {catFormError && (
              <p className="text-xs font-medium text-status-danger">{catFormError}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCatDialogOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={handleSaveCategory}>
              {editingCategory ? "Lưu thay đổi": "Tạo Chuyên mục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referential Lock Modal when deleting category with existing articles (FR-CMS-04) */}
      <Dialog
        open={Boolean(deleteCategoryTarget) && deleteLinkedCount > 0 && !deleteConfirmAuditOpen}
        onOpenChange={(o) => !o && setDeleteCategoryTarget(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-brand-crimson" />
              <span>Chặn xóa Chuyên mục đang có bài viết</span>
            </DialogTitle>
            <DialogDescription>
              Chuyên mục <strong>{deleteCategoryTarget?.name}</strong> hiện đang có{" "}
              <strong className="tabular-mono text-foreground">{deleteLinkedCount} bài viết</strong> tham chiếu
.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-3.5 text-xs text-foreground">
              Bạn có thể chuyển chuyên mục sang trạng thái <strong>Tạm ẩn</strong> để giữ nguyên dữ liệu lịch sử,
              hoặc chọn một chuyên mục đích bên dưới để chuyển toàn bộ {deleteLinkedCount} bài viết trước khi xóa.
            </div>

            <div className="space-y-1.5">
              <Label>Chuyển toàn bộ {deleteLinkedCount} bài viết sang chuyên mục đích</Label>
              <Select value={reassignTargetId} onValueChange={setReassignTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chuyên mục thay thế" />
                </SelectTrigger>
                <SelectContent>
                  {categories
.filter((c) => c.id !== deleteCategoryTarget?.id)
.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteCategoryTarget(null)}>
              Đóng
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!deleteCategoryTarget) return;
                const target = deleteCategoryTarget;
                setDeleteCategoryTarget(null);
                setHideCategoryTarget(target);
              }}
            >
              <EyeOff className="h-4 w-4" />
              <span>Chuyển sang Tạm ẩn</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!reassignTargetId}
              onClick={() => setDeleteConfirmAuditOpen(true)}
            >
              Chuyển bài &amp; Tiếp tục Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Dialog for Hiding a Category */}
      <AuditActionDialog
        open={Boolean(hideCategoryTarget)}
        onOpenChange={(o) => !o && setHideCategoryTarget(null)}
        title="Tạm ẩn Chuyên mục Bản tin"
        description="Chuyên mục và các bài viết thuộc chuyên mục này sẽ tạm ẩn khỏi trang công khai /news (vẫn giữ nguyên dữ liệu trong hệ thống)."
        targetSummary={hideCategoryTarget ? `${hideCategoryTarget.name} (/${hideCategoryTarget.slug})`: ""}
        actionCode="CMS_CATEGORY_HIDE"
        destructive={false}
        confirmLabel="Xác nhận Tạm ẩn & Ghi Audit Log"
        onConfirm={() => {
          if (!hideCategoryTarget) return;
          updateCategory(hideCategoryTarget.id, { isActive: false });
          setStatusMessage(`Đã tạm ẩn chuyên mục "${hideCategoryTarget.name}" và ghi Audit Log.`);
          setHideCategoryTarget(null);
        }}
      />

      {/* Audit Dialog for Deleting a Category */}
      <AuditActionDialog
        open={deleteConfirmAuditOpen && Boolean(deleteCategoryTarget)}
        onOpenChange={(o) => {
          setDeleteConfirmAuditOpen(o);
          if (!o) setDeleteCategoryTarget(null);
        }}
        title="Xóa Chuyên mục Bản tin"
        description={
          deleteLinkedCount > 0
            ? `Toàn bộ ${deleteLinkedCount} bài viết sẽ được chuyển sang "${categoryNameById.get(reassignTargetId) ?? ""}" trước khi xóa chuyên mục này.`
: "Chuyên mục chưa có bài viết nào sẽ bị xóa khỏi danh sách."
        }
        targetSummary={deleteCategoryTarget ? `${deleteCategoryTarget.name} (/${deleteCategoryTarget.slug})`: ""}
        actionCode="CMS_CATEGORY_DELETE"
        confirmLabel="Xác nhận Xóa & Ghi Audit Log"
        onConfirm={() => {
          if (!deleteCategoryTarget) return;
          deleteCategory(deleteCategoryTarget.id, deleteLinkedCount > 0 ? reassignTargetId: undefined);
          setStatusMessage(
            deleteLinkedCount > 0
              ? `Đã chuyển ${deleteLinkedCount} bài sang "${categoryNameById.get(reassignTargetId)}" và xóa chuyên mục "${deleteCategoryTarget.name}" (đã ghi Audit Log).`
: `Đã xóa chuyên mục "${deleteCategoryTarget.name}" và ghi Audit Log.`
          );
          setDeleteConfirmAuditOpen(false);
          setDeleteCategoryTarget(null);
        }}
      />

      {/* Audit Dialog for Unpublishing Article */}
      <AuditActionDialog
        open={Boolean(unpublishTarget)}
        onOpenChange={(o) => !o && setUnpublishTarget(null)}
        title="Gỡ bài viết khỏi trang công khai"
        description="Bài viết sẽ chuyển về trạng thái Bản nháp và bị ẩn khỏi trang /news."
        targetSummary={unpublishTarget ? `${unpublishTarget.title} (${unpublishTarget.slug})`: ""}
        actionCode="CMS_ARTICLE_UNPUBLISH"
        confirmLabel="Xác nhận gỡ bài & Ghi Audit Log"
        onConfirm={() => {
          if (!unpublishTarget) return;
          updateArticle(unpublishTarget.id, { status: "DRAFT", scheduledAt: undefined });
          setStatusMessage(`Đã gỡ bài "${unpublishTarget.title}" về Bản nháp và ghi Audit Log.`);
          setUnpublishTarget(null);
        }}
      />
    </div>
  );
}
