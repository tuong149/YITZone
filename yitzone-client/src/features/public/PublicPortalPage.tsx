import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Award, BookOpen, QrCode, Search, ShieldCheck, ShoppingBag } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HomeHeroBanner } from "@/components/ui/home-hero-banner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PUBLIC_PILLARS = [
  {
    id: "honor",
    badge: "Bảng vàng SV5T",
    title: "Vinh danh Sinh viên 5 tốt Khoa CNTT",
    description:
      "Tra cứu danh sách gương mặt tiêu biểu cấp Liên chi hội Khoa, Trường, Thành phố và Trung ương theo từng năm học.",
    image: "/images/card-sv5t.jpg",
    to: "/public/honor-roll",
    icon: Award,
    verified: true
  },
  {
    id: "news",
    badge: "Bản tin & Truyền thông",
    title: "Tin tức Hoạt động & Góc Học thuật FIT",
    description:
      "Cập nhật thông báo chính thức, bài viết kỹ thuật, cơ hội thực tập và gương sáng sinh viên từ Tổ Truyền thông.",
    image: "/images/card-hackathon.jpg",
    to: "/news",
    icon: BookOpen
  },
  {
    id: "store",
    badge: "Cửa hàng",
    title: "Áo Khoa, Hoodie FIT & Vật phẩm Gây quỹ",
    description:
      "Đặt mua vật phẩm nhận diện Khoa CNTT hỗ trợ hoạt động tình nguyện, thanh toán VietQR hoặc nhận trực tiếp tại Văn phòng.",
    image: "/images/card-hoodie.jpg",
    to: "/store",
    icon: ShoppingBag
  }
];

export function PublicPortalPage() {
  const navigate = useNavigate();
  const [verifyKind, setVerifyKind] = useState<"CERT" | "PORTFOLIO">("CERT");
  const [lookupCode, setLookupCode] = useState("YIT-2026-CLD-0184");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupCode.trim();
    if (!cleaned) return;
    if (verifyKind === "CERT") {
      void navigate(`/verify/${encodeURIComponent(cleaned)}`);
    } else {
      void navigate(`/p/${encodeURIComponent(cleaned)}?mode=cv-verify`);
    }
  };

  return (
    <div className="space-y-10">
      {/* Shared Unified Full-Bleed Hero Banner across all roles */}
      <HomeHeroBanner />

      {/* Independent E-Certificate & E-Portfolio Verification Bar */}
      <section className="liquid-glass mx-auto max-w-4xl rounded-[26px] p-6 sm:p-7">
        <div className="grid gap-5 md:grid-cols-12 md:items-center">
          <div className="space-y-1.5 md:col-span-5">
            <div className="flex items-center gap-2 font-display text-lg font-medium text-foreground">
              <ShieldCheck className="h-5 w-5 text-brand-navy dark:text-brand-cyan" />
              <span>Kiểm chứng Độc lập</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Nhập mã E-Certificate hoặc MSSV in trên CV để đối soát trực tiếp với sổ cái Đoàn – Hội Khoa CNTT — không cần đăng nhập.
            </p>
          </div>

          <div className="space-y-3 md:col-span-7">
            <div className="flex gap-1.5 rounded-full bg-muted/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setVerifyKind("CERT");
                  setLookupCode("YIT-2026-CLD-0184");
                }}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors",
                  verifyKind === "CERT"
                    ? "bg-card text-foreground shadow-sm dark:bg-white/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Mã E-Certificate
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyKind("PORTFOLIO");
                  setLookupCode("22110418");
                }}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors",
                  verifyKind === "PORTFOLIO"
                    ? "bg-card text-foreground shadow-sm dark:bg-white/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Hồ sơ E-Portfolio
              </button>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  placeholder={verifyKind === "CERT" ? "VD: YIT-2026-CLD-0184" : "VD: 22110418"}
                  className="h-11 rounded-xl pl-9 tabular-mono"
                />
              </div>
              <Button type="submit" className="liquid-glass-btn-cobalt h-11 shrink-0 rounded-full px-5">
                <QrCode className="h-4 w-4" />
                <span>Kiểm chứng</span>
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* 3 Public Editorial Pillars */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-medium text-foreground">
            Khám phá không gian công khai
          </h2>
          <Link to="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <span>Tất cả Bản tin</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {PUBLIC_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="liquid-glass-card group overflow-hidden rounded-[22px] transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="liquid-glass-pill absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span>{item.badge}</span>
                  </span>
                </div>

                <div className="space-y-2.5 p-5">
                  <h3 className="font-display text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  {item.verified && (
                    <div className="pt-1">
                      <VerifiedBadge label="Công bố bởi BTV Khoa CNTT" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
