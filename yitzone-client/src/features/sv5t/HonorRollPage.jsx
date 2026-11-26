import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Search, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INITIAL_HONOR_ROLL } from "./sv5t-data";

const TIER_ORDER = [
  "Cấp Trung ương",
  "Cấp Thành",
  "Cấp Trường",
  "Cấp Liên chi hội Khoa"
];

const HONOREE_PHOTOS = [
  "/images/card-sv5t.jpg",
  "/images/card-hackathon.jpg",
  "/images/card-hoodie.jpg"
];

export function HonorRollPage(){
  const [year, setYear] = useState("ALL");
  const [tier, setTier] = useState("ALL");
  const [query, setQuery] = useState("");

  const availableYears = useMemo(
    () => Array.from(new Set(INITIAL_HONOR_ROLL.map((item) => item.academicYear).filter(Boolean))),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INITIAL_HONOR_ROLL.filter((item) => {
      const matchYear = year === "ALL" || item.academicYear === year;
      const matchTier = tier === "ALL" || item.tier === tier;
      const matchQ =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.mssv.includes(q) ||
        item.major.toLowerCase().includes(q);
      return matchYear && matchTier && matchQ;
    });
  }, [year, tier, query]);

  const groupedByTier = useMemo(() => {
    return TIER_ORDER.map((tierName) => ({
      tier: tierName,
      items: filtered.filter((item) => item.tier === tierName)
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* TOP LIQUID GLASS CONTAINER — Bảng vàng Vinh danh Sinh viên 5 tốt */}
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-7 sm:p-9 lg:p-10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Bảng vàng Vinh danh Sinh viên 5 tốt
            </h1>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Tôn vinh những gương mặt tiêu biểu chinh phục trọn vẹn 5 tiêu chí Đạo đức, Học tập, Thể lực, Tình
              nguyện và Hội nhập, được Ban Thường vụ Đoàn – Hội Khoa CNTT công bố chính thức.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild className="rounded-full">
              <Link to="/sv5t">
                <Award className="h-4 w-4" />
                <span>Theo dõi Tiến độ SV5T</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SYNCHRONIZED FILTER BAR — Matching h-10 & rounded-xl */}
      <section className="grid gap-3 md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo họ tên, MSSV hoặc ngành học..."
            aria-label="Tìm gương mặt trên Bảng vàng"
            className="h-10 rounded-xl pl-9"
          />
        </div>

        <div className="md:col-span-3">
          <Select value={year} onValueChange={(v) => setYear(v)}>
            <SelectTrigger aria-label="Chọn năm học" className="h-10 rounded-xl">
              <SelectValue placeholder="Năm học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả năm học</SelectItem>
              {availableYears.map((yr) => (
                <SelectItem key={yr} value={yr}>
                  Năm học {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select value={tier} onValueChange={(v) => setTier(v)}>
            <SelectTrigger aria-label="Chọn cấp danh hiệu" className="h-10 rounded-xl">
              <SelectValue placeholder="Cấp danh hiệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả các cấp</SelectItem>
              <SelectItem value="Cấp Trung ương">Cấp Trung ương</SelectItem>
              <SelectItem value="Cấp Thành">Cấp Thành</SelectItem>
              <SelectItem value="Cấp Trường">Cấp Trường</SelectItem>
              <SelectItem value="Cấp Liên chi hội Khoa">Cấp Liên chi hội Khoa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {groupedByTier.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-border bg-card px-6 py-16 text-center">
          <Trophy className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 font-display text-xl font-medium text-foreground">
            {INITIAL_HONOR_ROLL.length === 0
              ? "Chưa có danh sách Bảng vàng Vinh danh"
              : "Chưa có gương mặt khớp bộ lọc"}
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {INITIAL_HONOR_ROLL.length === 0
              ? "Danh sách gương mặt Sinh viên 5 tốt các cấp sẽ được hiển thị tại đây sau khi Ban Thường vụ công bố kết quả xét duyệt chính thức."
              : "Thử chọn lại năm học hoặc cấp danh hiệu để xem toàn bộ Bảng vàng."}
          </p>
          {INITIAL_HONOR_ROLL.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-5 rounded-full"
              onClick={() => {
                setYear("ALL");
                setTier("ALL");
                setQuery("");
              }}
            >
              Xem tất cả gương mặt
            </Button>
          )}
        </div>
      ): (
        /* GROUPED SECTIONS BY AWARD TIER */
        <div className="space-y-10">
          {groupedByTier.map((group) => (
            <section key={group.tier} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-brand-navy dark:text-amber-200" />
                  <h2 className="font-display text-2xl font-medium text-foreground">
                    Sinh viên 5 tốt {group.tier}
                  </h2>
                </div>
                <span className="tabular-mono text-xs font-semibold text-muted-foreground">
                  {group.items.length} sinh viên
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((entry, idx) => {
                  const photoSrc = entry.avatarUrl || entry.photoUrl || HONOREE_PHOTOS[idx % HONOREE_PHOTOS.length];
                  return (
                    <article
                      key={entry.id}
                      className="group relative aspect-[4/5] overflow-hidden rounded-[26px] border border-white/20 bg-[#0B1636] shadow-floating transition-transform duration-300 hover:-translate-y-1"
                    >
                      {/* Full-bleed Student Photo */}
                      <img
                        src={photoSrc}
                        alt={`Chân dung ${entry.fullName} — Sinh viên 5 tốt ${entry.tier}`}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                      />

                      {/* Subtle bottom vignette */}
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(8, 16, 40, 0.14) 0%, rgba(8, 16, 40, 0.02) 48%, rgba(8, 16, 40, 0.65) 100%)"
                        }}
                      />

                      {/* Floating Minimal Glass Info Card Inside Photo: Name, MSSV & Major only */}
                      <div className="liquid-glass-on-dark absolute inset-x-3.5 bottom-3.5 rounded-[20px] px-4 py-3.5 text-white">
                        <h3 className="font-display text-xl font-medium leading-snug text-white">
                          {entry.fullName}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sky-100/95">
                          <span className="tabular-mono font-semibold text-white">{entry.mssv}</span>
                          <span className="opacity-55">·</span>
                          <span>{entry.major}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
