import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  ClipboardList,
  Compass,
  Home,
  MessageSquareMore,
  QrCode,
  Search,
  Vote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK_ROUTES = [
  { label: "Lịch hoạt động 6 màu", to: "/calendar", keywords: "lich calendar su kien ca truc", icon: CalendarDays },
  { label: "Điểm danh & Vé QR cá nhân", to: "/scanner", keywords: "diem danh qr scanner ticket ve", icon: QrCode },
  { label: "Khảo sát sau sự kiện (Mở khóa E-Cert)", to: "/surveys", keywords: "khao sat survey ecert", icon: ClipboardList },
  { label: "Hỏi đáp hội trường Live Q&A", to: "/live-qa", keywords: "hoi dap live qa pin", icon: MessageSquareMore },
  { label: "Bình chọn & Biểu quyết", to: "/voting", keywords: "binh chon bau cu voting", icon: Vote },
  { label: "Ví Chứng nhận E-Certificate", to: "/me/certificates", keywords: "chung nhan ecert certificate drl ctxh cddn", icon: Award }
];

export function NotFoundPage() {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_ROUTES;
    return QUICK_ROUTES.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.includes(q) ||
        item.to.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="mx-auto flex min-h-[68vh] max-w-2xl items-center justify-center py-10">
      <div className="liquid-glass-card w-full space-y-6 rounded-panel p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Compass className="h-7 w-7" />
          </div>
          <p className="tabular-mono text-sm font-semibold tracking-wider text-primary">404</p>
          <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
            Không tìm thấy trang yêu cầu
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            Đường dẫn có thể đã thay đổi hoặc bạn nhập chưa đầy đủ mã sự kiện. Tìm nhanh chức năng bên dưới:
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nhanh: khảo sát, điểm danh QR, hỏi đáp Live Q&A, E-Cert..."
              className="h-11 rounded-full pl-10"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {matches.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/75 px-3.5 py-2.5 text-left text-xs font-medium text-foreground transition-colors hover:border-primary/45 hover:bg-primary/5"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <Button asChild className="rounded-full">
            <Link to="/">
              <Home className="h-4 w-4" />
              <span>Về Trang chủ YITZone</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4" />
              <span>Danh sách Sự kiện</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
