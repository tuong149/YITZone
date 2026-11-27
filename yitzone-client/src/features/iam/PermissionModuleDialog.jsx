import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Lock, Search, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { extractApiErrorMessage } from "@/lib/api-client";
import { createRbacModule, updateRbacModule, useAtomicPermissions } from "./api";
import { FALLBACK_ATOMIC_PERMISSIONS } from "./atomic-permissions-fallback";

const MODULE_CODE_REGEX = /^MOD_[A-Z0-9_]{3,40}$/;

export function PermissionModuleDialog({ open, onOpenChange, moduleItem = null, onSaved }) {
  const isEdit = Boolean(moduleItem);
  const isSystemDefault = Boolean(moduleItem?.systemDefault);

  const [moduleCode, setModuleCode] = useState("MOD_");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [nonDelegable, setNonDelegable] = useState(false);
  const [reason, setReason] = useState("");
  const [permQuery, setPermQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: apiCatalog } = useAtomicPermissions(open);
  const catalog = useMemo(
    () => (Array.isArray(apiCatalog) && apiCatalog.length > 0 ? apiCatalog : FALLBACK_ATOMIC_PERMISSIONS),
    [apiCatalog]
  );

  useEffect(() => {
    if (!open) return;
    setErrorMsg("");
    setPermQuery("");
    setReason("");
    if (moduleItem) {
      setModuleCode(moduleItem.code || "");
      setName(moduleItem.label || "");
      setDescription(moduleItem.note || "");
      setSelectedPerms(Array.isArray(moduleItem.includedPermissions) ? [...moduleItem.includedPermissions] : []);
      setNonDelegable(Boolean(moduleItem.nonDelegable));
    } else {
      setModuleCode("MOD_");
      setName("");
      setDescription("");
      setSelectedPerms([]);
      setNonDelegable(false);
    }
  }, [open, moduleItem]);

  const catalogByCode = useMemo(
    () => new Map(catalog.map((item) => [item.code, item])),
    [catalog]
  );

  const hasSensitiveNonDelegable = useMemo(
    () => selectedPerms.some((code) => catalogByCode.get(code)?.sensitiveNonDelegable),
    [selectedPerms, catalogByCode]
  );

  const effectiveNonDelegable = hasSensitiveNonDelegable ? true : nonDelegable;

  const invariantViolation = useMemo(() => {
    const normalizedCode = moduleCode.trim().toUpperCase();
    if (normalizedCode.startsWith("MOD_DEPT_") && selectedPerms.some((p) => p.startsWith("hr:"))) {
      return "Không được gộp quyền nhân sự (hr:*) vào gói chuyên môn MOD_DEPT_*.";
    }
    if (selectedPerms.includes("liveqa:moderate") && selectedPerms.includes("liveqa:unmask")) {
      return "Không được gộp chung liveqa:moderate và liveqa:unmask trong cùng 1 gói.";
    }
    return "";
  }, [moduleCode, selectedPerms]);

  const groupedCatalog = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    const groups = new Map();
    for (const perm of catalog) {
      if (q) {
        const hay = `${perm.code} ${perm.label} ${perm.description ?? ""} ${perm.groupLabel}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      if (!groups.has(perm.groupCode)) {
        groups.set(perm.groupCode, {
          groupCode: perm.groupCode,
          groupLabel: perm.groupLabel,
          items: []
        });
      }
      groups.get(perm.groupCode).items.push(perm);
    }
    return Array.from(groups.values());
  }, [catalog, permQuery]);

  const togglePermission = (code) => {
    if (isSystemDefault) return;
    setSelectedPerms((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanCode = moduleCode.trim().toUpperCase();
    const cleanName = name.trim();

    if (!isEdit && !MODULE_CODE_REGEX.test(cleanCode)) {
      setErrorMsg("Mã gói quyền phải bắt đầu bằng MOD_ và chỉ gồm chữ in hoa, số hoặc dấu gạch dưới (VD: MOD_CLUB_MEDIA).");
      return;
    }
    if (!cleanName) {
      setErrorMsg("Vui lòng nhập tên hiển thị cho gói quyền.");
      return;
    }
    if (!isSystemDefault && selectedPerms.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 01 quyền cho gói này.");
      return;
    }
    if (invariantViolation) {
      setErrorMsg(invariantViolation);
      return;
    }

    setSubmitting(true);
    try {
      let saved;
      if (isEdit) {
        const payload = isSystemDefault
          ? {
              name: cleanName,
              description: description.trim(),
              reason: reason.trim() || `Cập nhật mô tả gói mặc định ${cleanCode}`
            }
          : {
              name: cleanName,
              description: description.trim(),
              includedPermissions: selectedPerms,
              nonDelegable: effectiveNonDelegable,
              reason: reason.trim() || `Cập nhật gói quyền ${cleanCode}`
            };
        saved = await updateRbacModule(cleanCode, payload);
      } else {
        saved = await createRbacModule({
          moduleCode: cleanCode,
          name: cleanName,
          description: description.trim(),
          includedPermissions: selectedPerms,
          nonDelegable: effectiveNonDelegable,
          reason: reason.trim() || `Tạo gói quyền ${cleanCode}`
        });
      }
      onSaved?.(saved, isEdit ? "update" : "create");
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err, "Không thể lưu gói quyền. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isEdit
              ? isSystemDefault
                ? `Chi tiết Gói Quyền · ${moduleCode}`
                : `Chỉnh sửa Gói Quyền · ${moduleCode}`
              : "Tạo Gói Quyền Mới"}
          </DialogTitle>
          <DialogDescription>
            {isSystemDefault
              ? "Gói mặc định được bảo vệ cấu trúc quyền lõi. Bạn có thể xem chi tiết quyền hoặc cập nhật tên, mô tả."
              : "Chọn các quyền cần thiết để tạo gói quyền riêng theo đơn vị, CLB hoặc sự kiện."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-12">
            <div className="space-y-1.5 sm:col-span-5">
              <Label htmlFor="mod-code">Mã gói quyền</Label>
              <Input
                id="mod-code"
                value={moduleCode}
                disabled={isEdit}
                onChange={(e) => setModuleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="VD: MOD_CLUB_MEDIA"
                className="h-10 rounded-xl tabular-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-7">
              <Label htmlFor="mod-name">Tên gói quyền</Label>
              <Input
                id="mod-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Truyền thông CLB Học thuật"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mod-desc">Mô tả</Label>
            <Textarea
              id="mod-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn phạm vi áp dụng của gói quyền..."
              className="rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-3.5 w-3.5 text-status-danger" />
                <span>Chỉ Ban Thường vụ cấp phát</span>
              </div>
              {hasSensitiveNonDelegable && (
                <p className="text-xs text-muted-foreground">
                  Tự động bật vì gói có chứa quyền nhạy cảm.
                </p>
              )}
            </div>
            <Switch
              checked={effectiveNonDelegable}
              disabled={isSystemDefault || hasSensitiveNonDelegable}
              onCheckedChange={setNonDelegable}
              aria-label="Chỉ Ban Thường vụ cấp phát"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>
                Quyền bao gồm{" "}
                <span className="tabular-mono text-xs font-medium text-primary">
                  ({selectedPerms.length})
                </span>
              </Label>
              {!isSystemDefault && selectedPerms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPerms([])}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-status-danger"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>

            {!isSystemDefault && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 text-sm text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={selectedPerms.length === 0 ? "text-muted-foreground" : "font-medium"}>
                      {selectedPerms.length === 0
                        ? "Chọn quyền từ danh mục..."
                        : `Đã chọn ${selectedPerms.length} quyền — bấm để thêm hoặc bớt`}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-[min(92vw,38rem)] p-0"
                >
                  <div className="sticky top-0 z-10 border-b border-border/70 bg-popover/95 p-2 backdrop-blur-md">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={permQuery}
                        onChange={(e) => setPermQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Tìm theo tên hoặc mã quyền..."
                        className="h-8 rounded-full pl-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1.5">
                    {groupedCatalog.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Không có quyền phù hợp với &ldquo;{permQuery}&rdquo;.
                      </div>
                    ) : (
                      groupedCatalog.map((group, idx) => (
                        <div key={group.groupCode}>
                          {idx > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="flex items-center justify-between">
                              <span>{group.groupLabel}</span>
                              <span className="tabular-mono text-[11px] font-normal">
                                {group.items.filter((i) => selectedPerms.includes(i.code)).length}/{group.items.length}
                              </span>
                            </DropdownMenuLabel>
                            {group.items.map((perm) => (
                              <DropdownMenuCheckboxItem
                                key={perm.code}
                                checked={selectedPerms.includes(perm.code)}
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={() => togglePermission(perm.code)}
                                className="items-start py-2"
                              >
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-medium">{perm.label}</span>
                                  <span className="tabular-mono rounded bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {perm.code}
                                  </span>
                                  {perm.sensitiveNonDelegable && (
                                    <Badge variant="danger" className="px-1.5 py-0 text-[10px]">
                                      Chỉ BTV
                                    </Badge>
                                  )}
                                </div>
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuGroup>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {selectedPerms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-muted/25 p-2.5">
                {selectedPerms.map((code) => {
                  const info = catalogByCode.get(code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs"
                    >
                      <span className="font-medium text-foreground">{info?.label ?? code}</span>
                      <span className="tabular-mono text-[10px] text-muted-foreground">{code}</span>
                      {!isSystemDefault && (
                        <button
                          type="button"
                          onClick={() => togglePermission(code)}
                          aria-label={`Bỏ quyền ${code}`}
                          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Chưa chọn quyền nào. Mở danh sách phía trên để chọn.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mod-reason">Ghi chú thay đổi (tùy chọn)</Label>
            <Input
              id="mod-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isEdit
                  ? "VD: Bổ sung quyền chỉnh sửa cho gói CLB"
                  : "VD: Tạo gói riêng cho CLB Học thuật"
              }
              className="h-10 rounded-xl"
            />
          </div>

          {(invariantViolation || errorMsg) && (
            <div className="flex items-start gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-3.5 py-2.5 text-xs font-medium text-status-danger">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg || invariantViolation}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={submitting || Boolean(invariantViolation)}
              className="rounded-full"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {submitting
                  ? "Đang lưu..."
                  : isEdit
                    ? isSystemDefault
                      ? "Lưu mô tả"
                      : "Lưu thay đổi"
                    : "Tạo gói quyền"}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
