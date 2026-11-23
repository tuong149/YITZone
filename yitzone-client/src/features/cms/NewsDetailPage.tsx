import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Eye,
  Share2,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCmsStore } from "@/stores/cms-store";

export function NewsDetailPage(){
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const articles = useCmsStore((s) => s.articles);
  const categories = useCmsStore((s) => s.categories);

  const article =
    articles.find((a) => a.slug === slug) ??
    articles.find((a) => a.status === "PUBLISHED") ??
    articles[0];

  if (!article) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Không tìm thấy bài viết yêu cầu.
        </CardContent>
      </Card>
    );
  }

  const categoryName =
    categories.find((c) => c.id === article.categoryId)?.name ?? "Bản tin";

  const related = articles
.filter((a) => a.status === "PUBLISHED" && a.id !== article.id)
.slice(0, 3);

  const handleShare = () => {
    void navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-full pl-2">
          <Link to="/news">
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Bản tin Blog</span>
          </Link>
        </Button>
      </div>

      <article className="mx-auto max-w-[72ch] space-y-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{categoryName}</Badge>
            {article.source === "STUDENT_CONTRIBUTION" && (
              <Badge variant="info">
                <UserCheck className="h-3 w-3" />
                <span>Bài cộng tác sinh viên</span>
              </Badge>
            )}
          </div>

          <h1 className="font-display text-3xl font-medium leading-[1.2] tracking-tight text-foreground sm:text-4xl">
            {article.title}
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground">{article.excerpt}</p>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-3.5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{article.authorName}</span>
              <span>·</span>
              <span>{article.authorRole}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 tabular-mono">
                <Clock className="h-3.5 w-3.5" />
                {article.publishedAt}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 tabular-mono">
                <Eye className="h-3.5 w-3.5" />
                {article.views.toLocaleString("vi-VN")} lượt xem
              </span>
            </div>

            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleShare}>
              {copied ? <Check className="h-3.5 w-3.5 text-status-success" />: <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Đã sao chép liên kết": "Chia sẻ"}</span>
            </Button>
          </div>
        </header>

        <figure className="overflow-hidden rounded-[20px] border border-border bg-muted">
          <img
            src={article.coverImage}
            alt={article.title}
            className="aspect-[16/9] w-full object-cover"
          />
          <figcaption className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
            Ảnh minh họa hoạt động Khoa Công Nghệ Thông Tin — HCM-UTE (Tư liệu truyền thông YITZone).
          </figcaption>
        </figure>

        <div className="space-y-5 text-[15px] leading-[1.7] text-foreground/90">
          {article.sections.map((block, idx) => {
            if (block.type === "heading") {
              return (
                <h2
                  key={idx}
                  className="pt-4 font-display text-2xl font-medium leading-snug text-foreground"
                >
                  {block.text}
                </h2>
              );
            }

            if (block.type === "quote") {
              return (
                <blockquote
                  key={idx}
                  className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-4"
                >
                  <p className="text-[15px] font-medium leading-relaxed text-foreground">
                    &ldquo;{block.text}&rdquo;
                  </p>
                  <footer className="mt-2 text-xs font-semibold text-primary">
                    — {block.attribution}
                  </footer>
                </blockquote>
              );
            }

            if (block.type === "code") {
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl border border-border bg-[#0E1529] text-slate-100"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-slate-300">
                    <span className="tabular-mono font-medium">{block.filename}</span>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard?.writeText(block.code)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] hover:bg-white/10"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
                    <code>{block.code}</code>
                  </pre>
                </div>
              );
            }

            if (block.type === "table") {
              return (
                <div key={idx} className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-muted/70 text-xs font-semibold text-muted-foreground">
                      <tr>
                        {block.headers.map((h) => (
                          <th key={h} className="border-b border-border px-4 py-2.5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-border/60 last:border-b-0">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2.5 text-foreground">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            if (block.type === "image") {
              return (
                <figure key={idx} className="my-5 space-y-2">
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                    <img
                      src={block.src}
                      alt={block.caption || article.title}
                      className="max-h-[460px] w-full object-cover"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="text-center text-xs italic text-muted-foreground">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            return <p key={idx}>{block.text}</p>;
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>
      </article>

      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium text-foreground">Bài viết cùng chuyên trang</h2>
          <Link to="/news" className="text-xs font-semibold text-primary hover:underline">
            Xem tất cả
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Card key={item.id} className="transition-colors hover:border-primary/45">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit">
                  {categories.find((c) => c.id === item.categoryId)?.name ?? "Bản tin"}
                </Badge>
                <CardTitle className="mt-2 line-clamp-2 text-base leading-snug">
                  <Link to={`/news/${item.slug}`} className="hover:text-primary">
                    {item.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-mono">{item.publishedAt}</span>
                <Link to={`/news/${item.slug}`} className="inline-flex items-center gap-1 font-semibold text-primary">
                  <span>Đọc</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
