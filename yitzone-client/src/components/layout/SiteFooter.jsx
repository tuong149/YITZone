import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, ShieldCheck } from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const EXPLORE_LINKS = [
  { to: "/events", label: "Sự kiện Khoa" },
  { to: "/calendar", label: "Lịch Hoạt động" },
  { to: "/news", label: "Bản tin FIT" },
  { to: "/public/honor-roll", label: "Bảng vàng SV5T" },
  { to: "/store", label: "Cửa hàng" }
];

const UTILITY_LINKS = [
  { to: "/oj", label: "Online Judge" },
  { to: "/yitbot", label: "Trợ lý YITBot AI" },
  { to: "/minigame", label: "Minigame" },
  { to: "/voting", label: "Bình chọn & Bầu cử" },
  {
    to: "/arts",
    label: "Văn nghệ ARTIT",
    requireAuth: true,
    requiredAuthorities: PERMISSIONS.ARTS_LEAD_PORTAL
  }
];

const SUPPORT_LINKS = [
  { to: "/messenger", label: "Hộp thư BCH" },
  { to: "/verify", label: "Tra cứu & Xác thực" },
  { to: "/privacy", label: "Quyền riêng tư" },
  { to: "/pwa-settings", label: "Cài đặt PWA & Ngoại tuyến" }
];

export function SiteFooter({ className }) {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);

  const visibleUtilityLinks = UTILITY_LINKS.filter(
    (item) =>
      (!item.requireAuth || isAuthenticated) &&
      hasAnyPermission(authorities, item.requiredAuthorities)
  );

  return (
    <footer
      className={cn(
        "mt-12 border-t border-border/75 bg-card/75 backdrop-blur-md dark:bg-card/55",
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Column 1: Institutional Identity */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-5">
            <Link to="/" className="inline-flex items-center">
              <BrandLockup logoClassName="h-8 w-8" wordmarkClassName="h-[20px]" />
            </Link>

            <div className="space-y-1">
              <p className="font-display text-base font-medium leading-snug text-foreground">
                Đoàn Thanh Niên – Hội Sinh Viên Khoa Công Nghệ Thông Tin
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Trường ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE) · &ldquo;Just you think, I can do better&rdquo;
              </p>
            </div>

            <div className="space-y-2 pt-1 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  Tầng hầm Beehive, Trường ĐH Công nghệ Kỹ thuật TP.HCM (01 Võ Văn Ngân, P. Thủ Đức, TP.HCM)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>Thời gian hoạt động: Thứ 2 – Thứ 7 · 08:00 – 17:00</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                <a href="mailto:yit@hcmute.edu.vn" className="transition-colors hover:text-primary">
                  yit@hcmute.edu.vn
                </a>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Navigation Links (2 columns side-by-side even on small mobile) */}
          <div className="grid grid-cols-2 gap-6 sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:gap-8">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Phong trào
              </h2>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {EXPLORE_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="inline-block py-1 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Tiện ích
              </h2>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {visibleUtilityLinks.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="inline-block py-1 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Support & Verification */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Hỗ trợ &amp; Minh bạch
            </h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-block py-1 transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                to="/verify"
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-muted/45 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-navy dark:text-brand-cyan" />
                <span>Xác thực công khai E-Certificate &amp; E-Portfolio độc lập</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 YITZone · Đoàn TN – Hội SV Khoa CNTT (FIT HCM-UTE).</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Tuân thủ Luật BVDLCN 91/2025/QH15</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="tabular-mono">PWA v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
