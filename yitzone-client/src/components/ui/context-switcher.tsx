import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronsUpDown,
  Globe,
  GraduationCap,
  MonitorPlay,
  ScanLine,
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  canAccessAdminWorkspace,
  canAccessStageWorkspace,
  hasAnyPermission,
  PERMISSIONS
} from "@/lib/permissions";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore, type WorkspaceSurface } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

const SURFACE_META: Record<
  WorkspaceSurface,
  { label: string; shortLabel: string; dotClass: string; icon: typeof GraduationCap; defaultRoute: string }
> = {
  public: {
    label: "Cổng Công khai & Xác thực",
    shortLabel: "Công khai",
    dotClass: "bg-cal-faculty",
    icon: Globe,
    defaultRoute: "/public"
  },
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
}: {
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
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

  const visibleSurfaces = useMemo<WorkspaceSurface[]>(() => {
    const list: WorkspaceSurface[] = ["student", "public"];
    if (allowAdmin) list.push("admin");
    if (allowStage) list.push("stage");
    return list;
  }, [allowAdmin, allowStage]);

  // Only include FACULTY scope if user actually holds BTV/Faculty role or has no restricted unit scopes (A3)
  const availableScopes = useMemo(() => {
    const map = new Map<string, string>();
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

  const handleSelectScope = (nextScopeId: string) => {
    setActiveScopeId(nextScopeId);
    void queryClient.invalidateQueries();
    if (pathname.startsWith("/admin")) {
      void navigate("/admin");
    }
  };

  return (
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
  );
}
