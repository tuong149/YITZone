import { Award, Building2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const INITIAL_TERM_HISTORY = [];

export function ProfileRolesSection({
  roleScopes = [],
  authorities = [],
  termHistory = INITIAL_TERM_HISTORY
}) {
  const permissionCodes = authorities.filter((a) => a.startsWith("MOD_") || a.startsWith("ROLE_"));

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[26px] p-6 sm:px-7">
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Cống hiến &amp; Vai trò Đoàn – Hội
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi chức vụ đang kiêm nhiệm theo cơ cấu 4 Ban – 9 Tổ, các Gói quyền nghiệp vụ hiện hành và lịch sử nhiệm kỳ bất biến.
        </p>
      </section>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            <span>Phạm vi công tác &amp; Gói quyền hiệu lực (Union RBAC)</span>
          </CardTitle>
          <CardDescription>
            Tập quyền của bạn là phép hợp từ tất cả chức vụ đang giữ và các Gói quyền nghiệp vụ được BTV/BCH cấp theo thời hạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 border-t border-border pt-4">
          {roleScopes.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Đơn vị đang kiêm nhiệm</div>
              <div className="flex flex-wrap gap-2">
                {roleScopes.map((scope) => (
                  <Badge key={`${scope.scopeId}-${scope.roleCode}`} variant="default" className="py-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{scope.label}</span>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tài khoản đang ở vai trò <strong>Sinh viên cơ bản</strong> (chưa có chức vụ quản trị Ban/Tổ trong phiên hiện tại).
            </p>
          )}

          {permissionCodes.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-xs font-semibold text-muted-foreground">
                Mã quyền / Gói nghiệp vụ đang áp dụng ({permissionCodes.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {permissionCodes.map((code) => (
                  <span
                    key={code}
                    className="tabular-mono rounded-sm border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            <span>Lịch sử cống hiến &amp; Nhiệm kỳ (termHistory)</span>
          </CardTitle>
          <CardDescription>
            Dữ liệu bất biến được ghi nhận tự động khi bổ nhiệm hoặc thôi giữ chức, dùng để đồng bộ sang E-Portfolio và xét duyệt Sinh viên 5 tốt.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {termHistory.length === 0 ? (
            <div className="border-t border-border p-6 text-center text-xs text-muted-foreground">
              Chưa có lịch sử nhiệm kỳ nào được ghi nhận cho tài khoản này.
            </div>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {termHistory.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-foreground">{item.role}</div>
                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-mono text-xs text-muted-foreground">{item.period}</span>
                    <Badge variant={item.status === "Đang tại nhiệm" ? "success" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
