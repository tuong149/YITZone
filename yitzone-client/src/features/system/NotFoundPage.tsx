import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[68vh] max-w-xl items-center justify-center py-12">
      <div className="liquid-glass-card w-full space-y-5 rounded-panel p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <p className="tabular-mono text-sm font-semibold tracking-wider text-primary">404</p>
          <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
            Không tìm thấy trang yêu cầu
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Đường dẫn có thể đã thay đổi, sự kiện đã kết thúc hoặc bạn nhập nhầm địa chỉ.
          </p>
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
              <span>Xem Sự kiện</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
