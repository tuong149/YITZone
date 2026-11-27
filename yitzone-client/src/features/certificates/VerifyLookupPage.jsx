import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  ShoppingBag,
  UserCheck,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
          ? "Vui lòng nhập mã E-Certificate in dưới mã QR trên tệp PDF."
          : "Vui lòng nhập MSSV 8 chữ số hoặc tên định danh hồ sơ E-Portfolio."
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

  return (
    <div className="space-y-8">
      <header className="liquid-glass relative overflow-hidden rounded-hero p-7 sm:p-9 lg:p-10">
        <div className="yit-node-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Tra cứu &amp; Xác thực Độc lập
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Nhà tuyển dụng, giảng viên và sinh viên có thể nhập mã chứng nhận điện tử hoặc MSSV in trên CV để kiểm chứng tính hợp lệ trọn đời.
          </p>
        </div>
      </header>

      <section
        aria-label="Biểu mẫu tra cứu xác thực"
        className="rounded-card border border-border bg-card p-5 sm:p-7"
      >
        <Tabs value={verifyKind} onValueChange={handleSwitchKind}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList aria-label="Loại tài liệu cần xác thực" className="w-full sm:w-auto">
              <TabsTrigger value="CERT" className="flex-1 gap-2 sm:flex-initial">
                <FileCheck2 className="h-4 w-4 shrink-0" />
                <span>Mã E-Certificate</span>
              </TabsTrigger>
              <TabsTrigger value="PORTFOLIO" className="flex-1 gap-2 sm:flex-initial">
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Hồ sơ E-Portfolio</span>
              </TabsTrigger>
            </TabsList>

            <span className="text-xs font-medium text-muted-foreground">
              Công khai · Không cần đăng nhập
            </span>
          </div>
        </Tabs>

        <form onSubmit={handleSubmit} className="mt-6 space-y-2.5" noValidate>
          <label
            htmlFor="verify-lookup-input"
            className="block text-xs font-semibold tracking-[0.02em] text-foreground"
          >
            {verifyKind === "CERT"
              ? "Mã chứng nhận điện tử (in dưới mã QR trên PDF)"
              : "Mã số sinh viên (MSSV) hoặc tên định danh hồ sơ công khai"}
          </label>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="verify-lookup-input"
                value={lookupCode}
                onChange={(e) => {
                  setLookupCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  verifyKind === "CERT"
                    ? "VD: YIT-2026-000123"
                    : "VD: 22110345 hoặc tên định danh"
                }
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "verify-lookup-error" : "verify-lookup-hint"}
                className={cn(
                  "h-11 rounded-xl pl-10 tabular-mono",
                  lookupCode && "pr-10",
                  errorMessage &&
                    "border-status-danger focus-visible:border-status-danger focus-visible:ring-status-danger/20"
                )}
              />
              {lookupCode && (
                <button
                  type="button"
                  onClick={() => {
                    setLookupCode("");
                    setErrorMessage(null);
                  }}
                  aria-label="Xóa mã đã nhập"
                  className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button type="submit" className="h-11 shrink-0 rounded-xl px-6">
              <QrCode className="h-4 w-4" />
              <span>Kiểm chứng</span>
            </Button>
          </div>

          {errorMessage ? (
            <p
              id="verify-lookup-error"
              role="alert"
              className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-status-danger"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </p>
          ) : (
            <p
              id="verify-lookup-hint"
              className="pt-0.5 text-xs leading-relaxed text-muted-foreground"
            >
              {verifyKind === "CERT"
                ? "Nhập chính xác chuỗi ký tự in bên dưới mã QR trên tệp chứng nhận PDF để đối chiếu trực tiếp."
                : "Nhập MSSV 8 chữ số hoặc tên định danh công khai in trên CV để kiểm chứng hoạt động và chứng nhận."}
            </p>
          )}
        </form>

        <div className="mt-6 space-y-3 border-t border-border pt-5">
          <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy dark:text-brand-cyan"
              aria-hidden="true"
            />
            <p>
              Mọi chứng nhận được phát hành từ sổ cái có kiểm toán của Đoàn – Hội Khoa CNTT (FIT HCM-UTE), hỗ trợ đối chiếu độc lập ngay cả sau khi sinh viên tốt nghiệp.
            </p>
          </div>

          <div
            aria-label="Các trạng thái đối soát hợp lệ"
            className="flex flex-wrap items-center gap-2 sm:pl-6"
          >
            <Badge variant="success">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Hợp lệ</span>
            </Badge>
            <Badge variant="warning">
              <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Đã thay thế</span>
            </Badge>
            <Badge variant="danger">
              <ShieldX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Đã thu hồi</span>
            </Badge>
          </div>
        </div>
      </section>

      <section aria-label="Thông tin công khai liên quan" className="space-y-3 pt-2">
        <h2 className="font-display text-lg font-medium leading-snug tracking-tight text-foreground">
          Tài nguyên công khai khác
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card">
          {PUBLIC_RESOURCES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {item.label}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
