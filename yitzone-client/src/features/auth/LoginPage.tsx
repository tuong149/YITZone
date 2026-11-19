import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { useAuthStore, type RoleScopeItem } from "@/stores/auth-store";

interface DevTokenPayload {
  accessToken: string;
  tokenType: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [userId, setUserId] = useState("22110123");
  const [email, setEmail] = useState("22110123@student.fit.edu.vn");
  const [fullName, setFullName] = useState("Sinh viên Khoa CNTT");
  const [rolePreset, setRolePreset] = useState<"STUDENT" | "CADRE_EMFIT">("STUDENT");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const authorities = ["event:view", "attendance:check_in", "store:view", "voting:cast"];
    const roleScopes: RoleScopeItem[] =
      rolePreset === "CADRE_EMFIT"
        ? [
            {
              roleCode: "CTV",
              unitId: "EMFIT",
              scopeType: "COMMITTEE",
              scopeId: "EMFIT",
              label: "Ban Sự kiện - Truyền thông (EMFIT)"
            }
          ]
        : [];

    try {
      const res = await apiClient.post<ApiResponse<DevTokenPayload>>("/iam/auth/dev-token", {
        userId: userId.trim(),
        email: email.trim(),
        authorities
      });
      if (!res.data.success) {
        setErrorMsg(res.data.detail);
        setLoading(false);
        return;
      }

      setSession({
        userId: userId.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        accessToken: res.data.data.accessToken,
        authorities,
        roleScopes
      });

      // Automatically register WebCrypto ECDSA P-256 non-extractable device keypair upon login
      try {
        const { publicKeyJwk } = await getOrCreateDeviceKeyPair();
        await apiClient.post("/iam/device-tokens", { publicKeyJwk });
      } catch {
        // Non-blocking in case WebCrypto/server is offline
      }

      void navigate("/");
    } catch {
      // Offline demo fallback when backend is not running locally
      setSession({
        userId: userId.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        accessToken: "demo-local-offline-token",
        authorities,
        roleScopes
      });
      void navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Đăng nhập Hệ thống YITZone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="login-userid">
                Mã số Sinh viên / Cán bộ
              </label>
              <input
                id="login-userid"
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="login-email">
                Email Trường (@student.fit.edu.vn)
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="login-fullname">
                Họ và tên
              </label>
              <input
                id="login-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="login-preset">
                Ngữ cảnh Vai trò (Dev / Demo)
              </label>
              <select
                id="login-preset"
                value={rolePreset}
                onChange={(e) => setRolePreset(e.target.value as "STUDENT" | "CADRE_EMFIT")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="STUDENT">Sinh viên Toàn Khoa (FACULTY)</option>
                <option value="CADRE_EMFIT">Cán bộ / CTV Ban EMFIT (FACULTY + EMFIT)</option>
              </select>
            </div>

            {errorMsg && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              <KeyRound className="h-4 w-4" />
              {loading ? "Đang xác thực & khởi tạo khóa ECDSA P-256..." : "Đăng nhập (SSO / Dev Token)"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
