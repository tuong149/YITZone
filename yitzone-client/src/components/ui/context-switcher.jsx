import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  ChevronsUpDown,
  GraduationCap,
  MonitorPlay,
  ScanLine,
  Shield
} from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useUnsavedGuardStore } from "@/hooks/use-unsaved-changes-guard";
import {
  canAccessAdminWorkspace,
  canAccessStageWorkspace,
  hasAnyPermission,
  PERMISSIONS
} from "@/lib/permissions";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { pushAppToast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const SURFACE_META = {
  student: {
    label: "Cổng Sinh viên (PWA)",
    shortLabel: "Sinh viên",
    dotClass: "bg-brand-cobalt",
    icon: GraduationCap,
    defaultRoute: "/"
  },
  admin: {
    label: "Không gian Quản trị",
    shortLabel: "Quản trị",
    dotClass: "bg-cal-office",
    icon: Shield,
    defaultRoute: "/admin"
  },
  stage: {
    label: "Sân khấu LED Hội trường",
    shortLabel: "LED 16:9",
    dotClass: "bg-brand-cyan",
    icon: MonitorPlay,
    defaultRoute: "/stage"
  }
};

export function ContextSwitcher({
  compact = false,
  iconOnly = false,
  className
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authorities = useAuthStore((s) => s.authorities);
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const setActiveScopeId = useAuthStore((s) => s.setActiveScopeId);
  const roleScopes = useAuthStore((s) => s.roleScopes);

  const surface = useThemeStore((s) => s.surface);
  const setSurface = useThemeStore((s) => s.setSurface);

  const isAuthenticated = Boolean(accessToken);
  const allowAdmin = canAccessAdminWorkspace(isAuthenticated, authorities);
  const allowStage = canAccessStageWorkspace(isAuthenticated, authorities);
  const allowFieldScanner =
    isAuthenticated && hasAnyPermission(authorities, PERMISSIONS.ADMIN_ATTENDANCE);

  const visibleSurfaces = useMemo(() => {
    const list = ["student"];
    if (allowAdmin) list.push("admin");
    if (allowStage) list.push("stage");
    return list;
  }, [allowAdmin, allowStage]);

  // Only include FACULTY scope if user actually holds BTV/Faculty role or has no restricted unit scopes (A3)
  const availableScopes = useMemo(() => {
    const map = new Map();
    const hasFacultyAuthority =
      authorities.includes("ROLE_STANDING_COMMITTEE") ||
      roleScopes.some((s) => s.scopeId === "FACULTY" || s.scopeType === "FACULTY");

    if (hasFacultyAuthority || roleScopes.length === 0) {
      map.set("FACULTY", "Toàn Khoa CNTT");
    }
    for (const scope of roleScopes) {
      const cleanLabel = scope.label.replace(/\s*\(FACULTY\)/gi, "");
      if (!map.has(scope.scopeId)) {
        map.set(scope.scopeId, cleanLabel);
      }
    }
    return Array.from(map.entries()).map(([scopeId, label]) => ({ scopeId, label }));
  }, [authorities, roleScopes]);

  const activeScopeLabel =
    availableScopes.find((s) => s.scopeId === activeScopeId)?.label ??
    availableScopes[0]?.label ??
    "Toàn Khoa CNTT";
  const meta = SURFACE_META[surface];
  const SurfaceIcon = meta.icon;
  const [pendingScopeId, setPendingScopeId] = useState(null);

  const applyScopeSwitch = (nextScopeId) => {
    setActiveScopeId(nextScopeId);
    void queryClient.invalidateQueries();
    const nextLabel =
      availableScopes.find((s) => s.scopeId === nextScopeId)?.label ?? nextScopeId;
    pushAppToast({
      variant: "info",
      title: "Đã chuyển phạm vi làm việc",
      description: `Đang thao tác dưới ngữ cảnh: ${nextLabel}.`,
      durationMs: 3500
    });
  };

  const handleSelectScope = (nextScopeId) => {
    if (nextScopeId === activeScopeId) return;
    if (useUnsavedGuardStore.getState().hasUnsavedChanges()) {
      setPendingScopeId(nextScopeId);
      return;
    }
    applyScopeSwitch(nextScopeId);
  };

  const pendingScopeLabel =
    availableScopes.find((s) => s.scopeId === pendingScopeId)?.label ?? pendingScopeId ?? "";

  const hasMultipleContexts =
    visibleSurfaces.length > 1 ||
    allowFieldScanner ||
    (isAuthenticated && availableScopes.length > 1);

  if (!hasMultipleContexts) {
    return null;
  }

  return (
    <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <button
            type="button"
            title={`${activeScopeLabel} · ${meta.label}`}
            aria-label="Chuyển ngữ cảnh làm việc và đơn vị"
            className={cn(
              "relative mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
          >
            <SurfaceIcon className="h-4 w-4" />
            <span
              className={cn(
                "absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-card",
                meta.dotClass
              )}
            />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Chuyển ngữ cảnh làm việc và đơn vị"
            className={cn(
              "flex items-center justify-between gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compact ? "h-11 max-w-[190px]" : "w-full rounded-xl py-2",
              className
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", meta.dotClass)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {compact ? meta.shortLabel : activeScopeLabel}
                </span>
                {!compact && (
                  <span className="block truncate text-[11px] text-muted-foreground">{meta.label}</span>
                )}
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Không gian làm việc</DropdownMenuLabel>
        {visibleSurfaces.map((key) => {
          const item = SURFACE_META[key];
          const Icon = item.icon;
          return (
            <DropdownMenuCheckboxItem
              key={key}
              checked={surface === key && !pathname.startsWith("/staff/")}
              onCheckedChange={() => {
                setSurface(key);
                navigate(item.defaultRoute);
              }}
            >
              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{item.label}</span>
            </DropdownMenuCheckboxItem>
          );
        })}

        {allowFieldScanner && (
          <DropdownMenuCheckboxItem
            checked={pathname.startsWith("/staff/scanner")}
            onCheckedChange={() => {
              navigate("/staff/scanner");
            }}
          >
            <ScanLine className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="truncate">Máy Soát vé Hiện trường</span>
          </DropdownMenuCheckboxItem>
        )}

        {isAuthenticated && availableScopes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Đơn vị đang thao tác
            </DropdownMenuLabel>
            {availableScopes.map((scope) => (
              <DropdownMenuCheckboxItem
                key={scope.scopeId}
                checked={activeScopeId === scope.scopeId}
                onCheckedChange={() => handleSelectScope(scope.scopeId)}
              >
                <span className="truncate">{scope.label}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog
      open={Boolean(pendingScopeId)}
      onOpenChange={(open) => {
        if (!open) setPendingScopeId(null);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            <span>Chuyển đơn vị thao tác?</span>
          </DialogTitle>
          <DialogDescription>
            Bạn đang có thay đổi chưa lưu. Chuyển sang đơn vị <strong className="text-foreground">{pendingScopeLabel}</strong> sẽ làm mới dữ liệu trang hiện tại theo phạm vi đơn vị mới.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setPendingScopeId(null)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => {
              if (pendingScopeId) applyScopeSwitch(pendingScopeId);
              setPendingScopeId(null);
            }}
          >
            Xác nhận chuyển đơn vị
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
