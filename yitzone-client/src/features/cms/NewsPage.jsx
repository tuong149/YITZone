import { useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  PenSquare,
  Search,
  Sparkles,
  Tag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { slugifyVietnamese } from "./cms-data";

export function NewsPage() {
  const location = useLocation();
  const categories = useCmsStore((s) => s.categories);
  const articles = useCmsStore((s) => s.articles);
  const addArticle = useCmsStore((s) => s.addArticle);

  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const fullName = useAuthStore((s) => s.fullName) ?? "Sinh viên Khoa CNTT";
  const authorities = useAuthStore((s) => s.authorities);

  const canContributeArticle =
    isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.CMS_CONTRIBUTE);
  const canOpenEditorial =
    isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.ADMIN_CMS);

  const [contribOpen, setContribOpen] = useState(false);
  const [contribTitle, setContribTitle] = useState("");
  const [contribCategoryId, setContribCategoryId] = useState(
    () => categories[0]?.id ?? "cat-doan-hoi"
  );
  const [contribBody, setContribBody] = useState("");

  const handleQuickContributeSubmit = (e) => {
    e.preventDefault();
    if (!contribTitle.trim() || !contribBody.trim()) return;
    const slug = slugifyVietnamese(contribTitle) || `bai-cong-tac-${Date.now()}`;
    addArticle({
      id: `art-contrib-${Date.now()}`,
      slug,
      title: contribTitle.trim(),
      excerpt: contribBody.trim().slice(0, 150),
      categoryId: contribCategoryId,
      tags: ["Cộng tác Sinh viên", "FIT HCM-UTE"],
      coverImage: "/images/card-hackathon.jpg",
      authorName: fullName,
      authorRole: "Cộng tác viên Sinh viên Khoa CNTT",
      source: "STUDENT_CONTRIBUTION",
      status: "PENDING_REVIEW",
      publishedAt: "Chờ biên tập EMFIT",
      readingMinutes: Math.max(2, Math.ceil(contribBody.split(/\s+/).length / 180)),
      views: 0,
      sections: [{ type: "paragraph", text: contribBody.trim() }]
    });
    setContribFeedback(
      `Đã gửi bài cộng tác "${contribTitle.trim()}" vào hàng chờ biên tập của Tổ Truyền thông EMFIT.`
    );
    setContribTitle("");
    setContribBody("");
    setContribOpen(false);
  };

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryId = searchParams.get("cat") ?? "ALL";
  const searchQuery = searchParams.get("q") ?? "";
  const selectedTag = searchParams.get("tag");

  const setSelectedCategoryId = (nextCat) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextCat === "ALL") next.delete("cat");
        else next.set("cat", nextCat);
        return next;
      },
      { replace: true }
    );
  };

  const setSearchQuery = (nextQ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextQ.trim()) next.set("q", nextQ);
        else next.delete("q");
        return next;
      },
      { replace: true }
    );
  };

  const setSelectedTag = (nextTag) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextTag) next.set("tag", nextTag);
        else next.delete("tag");
        return next;
      },
      { replace: true }
    );
  };

  const submittedTitle = (location.state)?.submittedTitle;
  const [contribFeedback, setContribFeedback] = useState(
    submittedTitle
      ? `Đã gửi bài viết "${submittedTitle}" vào hàng chờ biên tập của Tổ Truyền thông.`
      : null
  );

  const publishedArticles = useMemo(() =>
      articles.filter((a) => {
        if (a.status !== "PUBLISHED") return false;
        const cat = categories.find((c) => c.id === a.categoryId);
        return !cat || cat.isActive;
      }),
    [articles, categories]
  );

  const allTags = useMemo(() => {
    const set = new Set();
    publishedArticles.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [publishedArticles]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedArticles.filter((a) => {
      const matchCat = selectedCategoryId === "ALL" || a.categoryId === selectedCategoryId;
      const matchTag = !selectedTag || a.tags.includes(selectedTag);
      const matchQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchTag && matchQ;
    });
  }, [publishedArticles, selectedCategoryId, selectedTag, searchQuery]);

  const featuredArticle = filtered.find((a) => a.featured) ?? filtered[0];
  const secondaryArticles = filtered.filter((a) => a.id !== featuredArticle?.id);

  return (
    <div className="space-y-8">
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Bản tin Blog &amp; Truyền thông Khoa CNTT
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Cập nhật hoạt động Đoàn – Hội, chia sẻ kỹ thuật từ phòng lab CNTT, cơ hội thực tập doanh nghiệp và
            gương sáng Sinh viên 5 tốt.
          </p>
        </div>

        {(canContributeArticle || canOpenEditorial) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {canContributeArticle && (
              <Button
                type="button"
                className="liquid-glass-btn-cobalt rounded-full"
                onClick={() => setContribOpen(true)}
              >
                <PenSquare className="h-4 w-4" />
                <span>Gửi bài Cộng tác</span>
              </Button>
            )}
            {canOpenEditorial && (
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/admin/cms">
                  <BookOpen className="h-4 w-4" />
                  <span>Tòa soạn EMFIT</span>
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Streamlined Student Contribution Modal (B9) */}
      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Đóng góp Bài viết Cộng tác Sinh viên</DialogTitle>
            <DialogDescription>
              Chia sẻ góc nhìn học thuật, kinh nghiệm thực tập hoặc hoạt động phong trào. Bài viết sẽ chuyển vào Hàng chờ Biên tập của Tổ Truyền thông EMFIT.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickContributeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contrib-title">Tiêu đề bài viết</Label>
              <Input
                id="contrib-title"
                required
                value={contribTitle}
                onChange={(e) => setContribTitle(e.target.value)}
                placeholder="VD: Kinh nghiệm chinh phục học bổng doanh nghiệp năm 3..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Chuyên mục đề xuất</Label>
              <Select value={contribCategoryId} onValueChange={setContribCategoryId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contrib-body">Nội dung bài viết</Label>
              <Textarea
                id="contrib-body"
                required
                rows={5}
                value={contribBody}
                onChange={(e) => setContribBody(e.target.value)}
                placeholder="Nhập nội dung bài viết cộng tác của bạn..."
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setContribOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!contribTitle.trim() || !contribBody.trim()}>
                Gửi tới Ban Biên tập
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {contribFeedback && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{contribFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setContribFeedback(null)}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Dynamic Category Filter & Search Bar */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc chuyên mục bản tin">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("ALL")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategoryId === "ALL"
                ? "bg-primary text-primary-foreground shadow-floating"
: "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Tất cả ({publishedArticles.length})
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-primary text-primary-foreground shadow-floating"
: "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tiêu đề, tác giả, thẻ..."
            aria-label="Tìm kiếm bài viết"
            className="rounded-full pl-9"
          />
        </div>
      </section>

      {/* Featured Lead Story */}
      {featuredArticle ? (
        <article className="group overflow-hidden rounded-[20px] border border-border bg-card transition-all duration-200 hover:border-primary/45">
          <div className="grid lg:grid-cols-12">
            <div className="relative min-h-[240px] overflow-hidden bg-muted lg:col-span-7 lg:min-h-[360px]">
              <img
                src={featuredArticle.coverImage}
                alt={featuredArticle.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Tiêu điểm tuần này</span>
                </span>
                <span className="liquid-glass inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-foreground">
                  {categoryNameById.get(featuredArticle.categoryId) ?? "Chuyên mục"}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 tabular-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredArticle.publishedAt}
                  </span>
                  <span>·</span>
                  <span className="tabular-mono">{featuredArticle.readingMinutes} phút đọc</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 tabular-mono">
                    <Eye className="h-3.5 w-3.5" />
                    {featuredArticle.views.toLocaleString("vi-VN")}
                  </span>
                </div>

                <h2 className="font-display text-2xl font-medium leading-snug text-foreground sm:text-[1.75rem]">
                  <Link
                    to={`/news/${featuredArticle.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {featuredArticle.title}
                  </Link>
                </h2>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {featuredArticle.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">{featuredArticle.authorName}</div>
                  <div className="text-xs text-muted-foreground">{featuredArticle.authorRole}</div>
                </div>
                <Button asChild size="sm" className="rounded-full">
                  <Link to={`/news/${featuredArticle.slug}`}>
                    <span>Đọc bài viết</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </article>
      ): (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-medium text-foreground">
              Không tìm thấy bài viết phù hợp
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thử đổi chuyên mục hoặc xóa từ khóa tìm kiếm để xem toàn bộ bản tin đã xuất bản.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => {
                setSelectedCategoryId("ALL");
                setSelectedTag(null);
                setSearchQuery("");
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </CardContent>
        </Card>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            Chủ đề nổi bật:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-primary/15 text-primary ring-1 ring-primary/35"
: "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {secondaryArticles.length > 0 && (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {secondaryArticles.map((item) => (
            <Card
              key={item.id}
              className="group flex flex-col overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/45"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="liquid-glass absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-foreground">
                  {categoryNameById.get(item.categoryId) ?? "Chuyên mục"}
                </span>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-mono">
                  <span>{item.publishedAt}</span>
                  <span>·</span>
                  <span>{item.readingMinutes} phút đọc</span>
                </div>
                <CardTitle className="line-clamp-2 text-lg leading-snug">
                  <Link to={`/news/${item.slug}`} className="transition-colors hover:text-primary">
                    {item.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3 leading-relaxed">
                  {item.excerpt}
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-auto flex items-center justify-between border-t border-border/70 pt-3.5">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-foreground">{item.authorName}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{item.authorRole}</div>
                </div>
                <Link
                  to={`/news/${item.slug}`}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Đọc tiếp</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Dữ liệu bài viết và chuyên mục đang hiển thị là nội dung mẫu minh họa.
      </p>
    </div>
  );
}
