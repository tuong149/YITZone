import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Link2, LogIn, Pencil, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { DEFAULT_HERO_BANNER, HERO_BANNER_PRESETS, useCmsStore } from "@/stores/cms-store";

const OBJECT_POSITION_CLASS = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom"
};

export function HomeHeroBanner() {
  const fileInputRef = useRef(null);

  const heroBanner = useCmsStore((s) => s.heroBanner);
  const updateHeroBanner = useCmsStore((s) => s.updateHeroBanner);
  const resetHeroBanner = useCmsStore((s) => s.resetHeroBanner);

  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const authorities = useAuthStore((s) => s.authorities);
  const canEditBanner = isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.ADMIN_CMS);

  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(heroBanner.imageUrl);
  const [draftHeadline, setDraftHeadline] = useState(heroBanner.headline);
  const [draftSubtitle, setDraftSubtitle] = useState(heroBanner.subtitle);
  const [draftFocal, setDraftFocal] = useState(heroBanner.focalPosition);
  const [uploadError, setUploadError] = useState(null);

  const openEditor = () => {
    setDraftUrl(heroBanner.imageUrl);
    setDraftHeadline(heroBanner.headline);
    setDraftSubtitle(heroBanner.subtitle);
    setDraftFocal(heroBanner.focalPosition);
    setUploadError(null);
    setOpen(true);
  };

  const handleFileChange = (e) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn để tải trang nhanh.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const cleanedUrl = draftUrl.trim();
    const cleanedHeadline = draftHeadline.trim();
    const cleanedSubtitle = draftSubtitle.trim();
    if (!cleanedUrl) {
      setUploadError("Vui lòng chọn một ảnh có sẵn, tải ảnh lên hoặc nhập đường dẫn ảnh.");
      return;
    }
    if (!cleanedHeadline) {
      setUploadError("Tiêu đề chính không được để trống.");
      return;
    }
    if (!cleanedSubtitle) {
      setUploadError("Đoạn mô tả bên dưới tiêu đề không được để trống.");
      return;
    }
    updateHeroBanner({
      imageUrl: cleanedUrl,
      headline: cleanedHeadline,
      subtitle: cleanedSubtitle,
      focalPosition: draftFocal
    });
    setOpen(false);
  };

  const handleReset = () => {
    resetHeroBanner();
    setDraftUrl(DEFAULT_HERO_BANNER.imageUrl);
    setDraftHeadline(DEFAULT_HERO_BANNER.headline);
    setDraftSubtitle(DEFAULT_HERO_BANNER.subtitle);
    setDraftFocal(DEFAULT_HERO_BANNER.focalPosition);
    setUploadError(null);
  };

  return (
    <section className="relative left-1/2 -mt-20 w-[100vw] -translate-x-1/2 overflow-hidden">
      <div className="relative h-[360px] w-full overflow-hidden sm:h-[450px] lg:h-[520px]">
        <div
          className="h-full w-full"
          style={{
            maskImage:
              "linear-gradient(to bottom, #000 0%, #000 50%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.22) 86%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 0%, #000 50%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.22) 86%, transparent 100%)"
          }}
        >
          <img
            src={heroBanner.imageUrl}
            alt="Banner chào mừng YITZone — Khoa Công Nghệ Thông Tin HCM-UTE"
            className={cn(
              "yit-hero-media h-full w-full object-cover transition-[object-position,filter] duration-500 dark:brightness-[0.72] dark:contrast-[1.06]",
              OBJECT_POSITION_CLASS[heroBanner.focalPosition]
            )}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0b1636]/24 via-[#0b1636]/8 to-transparent dark:from-[#060a14]/55"
          />
        </div>

        {canEditBanner && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 mx-auto flex max-w-7xl justify-end px-4 sm:bottom-16 sm:px-6">
            <button
              type="button"
              onClick={openEditor}
              className="liquid-glass-pill yit-pressable pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-foreground hover:border-primary/45"
            >
              <Pencil className="h-3.5 w-3.5 text-primary" />
              <span>Chỉnh sửa banner</span>
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 mx-auto -mt-8 max-w-4xl px-4 pb-6 text-center sm:-mt-12 sm:px-6 sm:pb-10">
        <h1 className="yit-hero-stagger-1 whitespace-pre-line font-display text-3xl font-medium leading-[1.15] tracking-[-0.025em] text-brand-navy dark:text-white sm:text-5xl lg:text-[3.35rem]">
          {heroBanner.headline}
        </h1>
        <p className="yit-hero-stagger-2 mx-auto mt-3.5 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
          {heroBanner.subtitle}
        </p>

        <div className="yit-hero-stagger-3 mt-6 flex flex-col items-stretch justify-center gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5">
          <Link
            to="/login"
            className="liquid-glass-btn-cobalt yit-pressable inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold sm:w-auto sm:min-w-[200px]"
          >
            <LogIn className="h-4 w-4" />
            <span>Đăng nhập ngay</span>
          </Link>

          <Link
            to="/events"
            className="liquid-glass-pill yit-pressable group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-foreground hover:border-primary/45 sm:w-auto sm:min-w-[200px]"
          >
            <span>Khám phá sự kiện</span>
            <ArrowRight className="h-4 w-4 text-primary transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Hero Banner & Copy Editor Dialog (Permission-gated to CMS Editors / Standing Committee) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium">
              Chỉnh sửa Hero Banner Trang chủ
            </DialogTitle>
            <DialogDescription>
              Cập nhật nội dung tiêu đề, mô tả và hình ảnh hiển thị đồng bộ trên trang chủ ở tất cả vai trò.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Live Preview */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                <img
                  src={draftUrl || DEFAULT_HERO_BANNER.imageUrl}
                  alt="Xem trước ảnh Hero Banner"
                  className={cn(
                    "h-full w-full object-cover transition-all duration-300",
                    OBJECT_POSITION_CLASS[draftFocal]
                  )}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/70 to-transparent" />
              </div>
              <div className="-mt-4 relative z-10 px-5 pb-4 text-center">
                <p className="whitespace-pre-line font-display text-xl font-medium leading-tight tracking-tight text-brand-navy dark:text-white">
                  {draftHeadline.trim() || DEFAULT_HERO_BANNER.headline}
                </p>
                <p className="mx-auto mt-1.5 max-w-lg whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {draftSubtitle.trim() || DEFAULT_HERO_BANNER.subtitle}
                </p>
              </div>
            </div>

            {/* Editable Hero Copy */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="hero-banner-headline">Tiêu đề chính</Label>
                <Textarea
                  id="hero-banner-headline"
                  rows={2}
                  value={draftHeadline}
                  onChange={(e) => {
                    setDraftHeadline(e.target.value);
                    setUploadError(null);
                  }}
                  placeholder="Kết nối sinh viên FIT. Kiến tạo hành trình số."
                  className="min-h-[64px] rounded-xl font-display text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Có thể nhấn Enter để xuống dòng chủ động cho tiêu đề.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-banner-subtitle">Mô tả giới thiệu</Label>
                <Textarea
                  id="hero-banner-subtitle"
                  rows={3}
                  value={draftSubtitle}
                  onChange={(e) => {
                    setDraftSubtitle(e.target.value);
                    setUploadError(null);
                  }}
                  placeholder="Nền tảng hợp nhất của Đoàn – Hội Khoa Công Nghệ Thông Tin (HCM-UTE)..."
                  className="min-h-[84px] rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Curated Presets */}
            <div className="space-y-2">
              <Label>Ảnh có sẵn của YITZone</Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {HERO_BANNER_PRESETS.map((preset) => {
                  const selected = draftUrl === preset.imageUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setDraftUrl(preset.imageUrl);
                        setUploadError(null);
                      }}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border text-left transition-all",
                        selected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/45"
                      )}
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                        <img
                          src={preset.imageUrl}
                          alt={preset.label}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 bg-card px-2 py-1.5 text-[11px] font-medium text-foreground">
                        <span className="truncate">{preset.label}</span>
                        {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload from computer or paste URL */}
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="space-y-2 sm:col-span-5">
                <Label>Tải ảnh từ máy tính</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  <span>Chọn tệp ảnh (≤ 5MB)</span>
                </Button>
              </div>

              <div className="space-y-2 sm:col-span-7">
                <Label htmlFor="hero-banner-url">Hoặc dán đường dẫn ảnh (URL)</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="hero-banner-url"
                    value={draftUrl.startsWith("data:") ? "" : draftUrl}
                    onChange={(e) => {
                      setDraftUrl(e.target.value);
                      setUploadError(null);
                    }}
                    placeholder="https://... hoặc /images/hero-campus.jpg"
                    className="h-10 rounded-xl pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Focal position */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/35 px-3.5 py-2.5">
              <span className="text-xs font-medium text-foreground">Canh vùng hiển thị ảnh</span>
              <div className="flex gap-1.5 rounded-full bg-background/80 p-1">
                {(
                  [
                    { id: "top", label: "Phần trên" },
                    { id: "center", label: "Chính giữa" },
                    { id: "bottom", label: "Phần dưới" }
                  ]
                ).map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setDraftFocal(pos.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      draftFocal === pos.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {uploadError && (
              <p className="rounded-xl border border-status-danger/35 bg-status-danger/10 px-3.5 py-2.5 text-xs text-status-danger">
                {uploadError}
              </p>
            )}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" className="rounded-full" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              <span>Khôi phục mặc định</span>
            </Button>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="button" className="liquid-glass-btn-cobalt rounded-full px-5" onClick={handleSave}>
                Lưu thay đổi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
