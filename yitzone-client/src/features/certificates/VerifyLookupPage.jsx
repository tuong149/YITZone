import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  FileCheck2,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserCheck
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SAMPLE_CODES = {
  CERT: { code: "YIT-2026-CLD-0184", label: "Mã mẫu E-Certificate" },
  PORTFOLIO: { code: "22110418", label: "MSSV mẫu E-Portfolio" }
};

const PUBLIC_RESOURCES = [
  {
    to: "/public/honor-roll",
    label: "Bảng vàng SV5T",
    description: "Danh sách vinh danh Sinh viên 5 tốt qua các năm học.",
    icon: Award
  },
  {
    to: "/news",
    label: "Bản tin FIT",
    description: "Thông báo chính thức và hoạt động của Khoa CNTT.",
    icon: BookOpen
  },
  {
    to: "/store",
    label: "Cửa hàng Gây quỹ",
    description: "Áo Khoa, Hoodie FIT và vật phẩm nhận diện.",
    icon: ShoppingBag
  }
];

export function VerifyLookupPage() {
  const navigate = useNavigate();
  const [verifyKind, setVerifyKind] = useState("CERT");
  const [lookupCode, setLookupCode] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSwitchKind = (kind) => {
    setVerifyKind(kind);
    setErrorMessage(null);
  };

  const navigateToResult = (kind, rawCode) => {
    const cleaned = rawCode.trim();
    if (!cleaned) {
      setErrorMessage(
        kind === "CERT"
          ? "Vui lòng nhập mã E-Certificate (ví dụ: YIT-2026-CLD-0184)."
          : "Vui lòng nhập MSSV hoặc tên hồ sơ E-Portfolio (ví dụ: 22110418)."
      );
      return;
    }
    setErrorMessage(null);
    if (kind === "CERT") {
      void navigate(`/verify/${encodeURIComponent(cleaned)}`);
    } else {
      void navigate(`/p/${encodeURIComponent(cleaned)}?mode=cv-verify`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigateToResult(verifyKind, lookupCode);
  };

  const sample = SAMPLE_CODES[verifyKind];

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4 sm:py-8">
      {/* Header */}
      <header className="space-y-3">
        <VerifiedBadge label="Đối soát trực tiếp sổ cái Đoàn – Hội Khoa CNTT · Không cần đăng nhập" />
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Tra cứu &amp; Xác thực Độc lập
        </h1>
        <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
          Nhà tuyển dụng, giảng viên và sinh viên có thể nhập mã chứng nhận điện tử hoặc MSSV in trên CV để kiểm chứng tính hợp lệ trọn đời.
        </p>
      </header>

      {/* Focused Verification Workbench */}
      <section
        aria-label="Biểu mẫu tra cứu xác thực"
        className="liquid-glass rounded-[24px] p-5 sm:p-7"
      >
        <div
          role="tablist"
          aria-label="Loại tài liệu cần xác thực"
          className="inline-flex w-full gap-1.5 rounded-full bg-muted/80 p-1 sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={verifyKind === "CERT"}
            onClick={() => handleSwitchKind("CERT")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:flex-initial sm:text-sm",
              verifyKind === "CERT"
                ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileCheck2 className="h-4 w-4 shrink-0" />
            <span>Mã E-Certificate</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={verifyKind === "PORTFOLIO"}
            onClick={() => handleSwitchKind("PORTFOLIO")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:flex-initial sm:text-sm",
              verifyKind === "PORTFOLIO"
                ? "bg-card text-foreground shadow-floating dark:bg-white/15 dark:text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Hồ sơ E-Portfolio</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
          <label
            htmlFor="verify-lookup-input"
            className="block text-xs font-semibold text-foreground"
          >
            {verifyKind === "CERT"
              ? "Mã chứng nhận điện tử (in dưới mã QR trên PDF)"
              : "Mã số sinh viên (MSSV) hoặc đường dẫn hồ sơ công khai"}
          </label>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="verify-lookup-input"
                value={lookupCode}
                onChange={(e) => {
                  setLookupCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={
                  verifyKind === "CERT" ? "VD: YIT-2026-CLD-0184" : "VD: 22110418"
                }
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "verify-lookup-error" : "verify-lookup-hint"}
                className="h-11 rounded-xl pl-10 tabular-mono"
              />
            </div>

            <Button
              type="submit"
              className="liquid-glass-btn-cobalt h-11 shrink-0 rounded-full px-6"
            >
              <QrCode className="h-4 w-4" />
              <span>Kiểm chứng</span>
            </Button>
          </div>

          {errorMessage ? (
            <p
              id="verify-lookup-error"
              role="alert"
              className="text-xs font-medium text-status-danger"
            >
              {errorMessage}
            </p>
          ) : (
            <div
              id="verify-lookup-hint"
              className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground"
            >
              <span>Thử nhanh với dữ liệu minh họa:</span>
              <button
                type="button"
                onClick={() => {
                  setLookupCode(sample.code);
                  navigateToResult(verifyKind, sample.code);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-2.5 py-1 tabular-mono text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <span>{sample.code}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 flex items-start gap-2.5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy dark:text-brand-cyan" />
          <p>
            Mọi chứng nhận được phát hành từ sổ cái có kiểm toán của Đoàn – Hội Khoa CNTT (FIT HCM-UTE), hỗ trợ đối chiếu trạng thái <strong className="font-medium text-foreground">Hợp lệ</strong>, <strong className="font-medium text-foreground">Đã thay thế</strong> hoặc <strong className="font-medium text-foreground">Đã thu hồi</strong> ngay cả sau khi sinh viên tốt nghiệp.
          </p>
        </div>
      </section>

      {/* Secondary Public Directory Strip */}
      <section aria-label="Thông tin công khai liên quan" className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tài nguyên công khai khác
        </h2>
        <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card/75">
          {PUBLIC_RESOURCES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.label}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
