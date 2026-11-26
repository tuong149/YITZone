import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isOnboardingCompleted } from "@/features/iam/data/onboarding-storage";
import { apiClient, extractApiErrorMessage } from "@/lib/api-client";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { AUTH_REDIRECT_STORAGE_KEY, useAuthStore } from "@/stores/auth-store";

export function OAuth2CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [verifying, setVerifying] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [statusText, setStatusText] = useState(
    "Đang xác minh phiên Google Workspace và đồng bộ hồ sơ sinh viên từ máy chủ..."
  );
  const [authError, setAuthError] = useState(null);

  const savedRedirect =
    typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) : null;
  const successTarget = savedRedirect && savedRedirect !== "/login" ? savedRedirect : "/";
  const needsOnboarding =
    !verifying && !authError && Boolean(resolvedUserId) && !isOnboardingCompleted(resolvedUserId);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const oauthError = params.get("error");
      if (oauthError) {
        if (!active) return;
        setAuthError(params.get("error_description") ?? "Đăng nhập Google Workspace bị từ chối hoặc bị hủy.");
        setVerifying(false);
        return;
      }

      try {
        const tokenFromQuery = params.get("token") ?? params.get("accessToken");
        let accessToken = tokenFromQuery;
        let authPayload = null;

        if (!accessToken) {
          const refreshRes = await apiClient.post("/iam/auth/refresh");
          if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
            accessToken = refreshRes.data.data.accessToken;
            authPayload = refreshRes.data.data;
          }
        }

        if (!accessToken) {
          throw new Error("MISSING_TOKEN");
        }

        const meRes = await apiClient.get("/iam/me", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const meData = meRes.data?.data ?? authPayload ?? {};
        const userId = meData.userId ?? authPayload?.userId;
        if (!userId) {
          throw new Error("INVALID_ME");
        }

        if (!active) return;

        setSession({
          userId,
          email: meData.email ?? authPayload?.email ?? null,
          fullName: meData.fullName ?? authPayload?.fullName ?? null,
          accessToken,
          authProvider: "google",
          authorities: Array.isArray(meData.authorities) ? meData.authorities : [],
          roleScopes: Array.isArray(meData.roleScopes) ? meData.roleScopes : []
        });

        try {
          const { publicKeyJwk } = await getOrCreateDeviceKeyPair();
          await apiClient.post("/iam/device-tokens", { publicKeyJwk });
        } catch {
          // Non-blocking
        }

        if (!active) return;
        setResolvedUserId(userId);
        setStatusText("Đã xác thực tài khoản Google Workspace và thiết lập phiên bảo mật thành công.");
      } catch (err) {
        if (!active) return;
        setAuthError(
          extractApiErrorMessage(
            err,
            "Không thể hoàn tất đăng nhập Google Workspace. Vui lòng kiểm tra cấu hình OIDC trên máy chủ và thử lại."
          )
        );
      } finally {
        if (active) setVerifying(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [params, setSession]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="liquid-glass-card space-y-5 rounded-[22px] p-7 text-center">
        <div
          className={
            authError
              ? "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-danger/15 text-status-danger"
              : verifying
                ? "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary"
                : "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success/15 text-status-success"
          }
        >
          {authError ? (
            <AlertCircle className="h-6 w-6" />
          ) : verifying ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <CheckCircle2 className="h-6 w-6" />
          )}
        </div>
        <h1 className="font-display text-2xl font-medium text-foreground">
          {authError
            ? "Không thể hoàn tất đăng nhập Google"
            : verifying
              ? "Đang xác thực Google Workspace..."
              : "Liên kết Google Workspace hoàn tất"}
        </h1>
        <p role={authError ? "alert" : "status"} className="text-sm text-muted-foreground">
          {authError ?? statusText}
        </p>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Domain lọc ưu tiên: {params.get("hd") ?? "hcmute.edu.vn"}</span>
          </div>
          <p className="mt-1">
            Bảo vệ tài khoản: mọi mật khẩu chưa xác thực trước đó (nếu trùng email) đều tự động bị vô hiệu hóa.
          </p>
        </div>
        <Button
          type="button"
          disabled={verifying}
          className="w-full rounded-xl"
          onClick={() => {
            if (authError) {
              void navigate("/login", { replace: true });
              return;
            }
            if (needsOnboarding) {
              void navigate("/onboarding", {
                replace: true,
                state: { source: "google", redirectTarget: successTarget }
              });
              return;
            }
            if (typeof window !== "undefined") {
              try {
                window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
              } catch {
                // Ignore storage errors
              }
            }
            void navigate(successTarget, { replace: true });
          }}
        >
          {authError
            ? "Quay lại trang Đăng nhập"
            : verifying
              ? "Đang đồng bộ phiên..."
              : needsOnboarding
                ? "Hoàn tất thiết lập tài khoản (1 phút)"
                : successTarget === "/"
                  ? "Vào Trang chủ YITZone"
                  : "Tiếp tục trang trước đó"}
        </Button>
      </div>
    </div>
  );
}
