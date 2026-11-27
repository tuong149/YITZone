import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isOnboardingCompleted } from "@/features/iam/data/onboarding-storage";
import { apiClient, extractApiErrorMessage } from "@/lib/api-client";
import { canAccessAdminWorkspace } from "@/lib/permissions";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { AUTH_REDIRECT_STORAGE_KEY, useAuthStore } from "@/stores/auth-store";
import { pushAppToast } from "@/stores/toast-store";

let inFlightOAuthExchange = null;
let lastOAuthExchange = null;
const OAUTH_EXCHANGE_DEDUP_MS = 10_000;

async function exchangeOAuthCookieOnce(callbackKey) {
  const now = Date.now();
  if (
    lastOAuthExchange &&
    lastOAuthExchange.key === callbackKey &&
    now - lastOAuthExchange.at < OAUTH_EXCHANGE_DEDUP_MS
  ) {
    return lastOAuthExchange.result;
  }
  if (!inFlightOAuthExchange || inFlightOAuthExchange.key !== callbackKey) {
    const promise = apiClient
      .post("/iam/auth/refresh")
      .then((refreshRes) => {
        if (!refreshRes.data?.success || !refreshRes.data?.data?.accessToken) {
          throw new Error("MISSING_TOKEN");
        }
        const result = {
          accessToken: refreshRes.data.data.accessToken,
          authPayload: refreshRes.data.data
        };
        lastOAuthExchange = { key: callbackKey, at: Date.now(), result };
        return result;
      })
      .finally(() => {
        if (inFlightOAuthExchange?.key === callbackKey) {
          inFlightOAuthExchange = null;
        }
      });
    inFlightOAuthExchange = { key: callbackKey, promise };
  }
  return inFlightOAuthExchange.promise;
}

export function OAuth2CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const oauthError = params.get("error");
      if (oauthError) {
        if (!active) return;
        setAuthError(params.get("error_description") ?? "Đăng nhập Google Workspace bị từ chối hoặc bị hủy.");
        return;
      }

      try {
        const tokenFromQuery = params.get("token") ?? params.get("accessToken");
        let accessToken = tokenFromQuery;
        let authPayload = null;

        if (!accessToken) {
          const callbackKey =
            typeof window !== "undefined" ? window.location.href : params.toString();
          const exchanged = await exchangeOAuthCookieOnce(callbackKey);
          accessToken = exchanged.accessToken;
          authPayload = exchanged.authPayload;
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

        const meAuthorities = Array.isArray(meData.authorities) ? meData.authorities : [];
        const fullName = meData.fullName ?? authPayload?.fullName ?? null;
        const email = meData.email ?? authPayload?.email ?? null;

        setSession({
          userId,
          email,
          fullName,
          accessToken,
          authProvider: "google",
          authorities: meAuthorities,
          roleScopes: Array.isArray(meData.roleScopes) ? meData.roleScopes : []
        });

        try {
          const { publicKeyJwk } = await getOrCreateDeviceKeyPair();
          await apiClient.post("/iam/device-tokens", { publicKeyJwk });
        } catch {
          // Non-blocking
        }

        if (!active) return;

        const canAccessAdmin = canAccessAdminWorkspace(true, meAuthorities);
        const savedRedirect =
          typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) : null;
        const defaultLanding = canAccessAdmin ? "/admin" : "/";
        const successTarget =
          savedRedirect &&
          savedRedirect !== "/login" &&
          savedRedirect !== "/403" &&
          (canAccessAdmin || (!savedRedirect.startsWith("/admin") && !savedRedirect.startsWith("/staff")))
            ? savedRedirect
            : defaultLanding;

        const displayName = fullName ?? email;
        pushAppToast({
          variant: "success",
          title: "Đăng nhập thành công",
          description: displayName
            ? `Chào mừng ${displayName} quay trở lại YITZone.`
            : "Đăng nhập Google Workspace thành công.",
          durationMs: 4000
        });

        if (!isOnboardingCompleted(userId)) {
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
      } catch (err) {
        if (!active) return;
        setAuthError(
          extractApiErrorMessage(
            err,
            "Không thể hoàn tất đăng nhập Google Workspace. Vui lòng kiểm tra cấu hình OIDC trên máy chủ và thử lại."
          )
        );
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [navigate, params, setSession]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="liquid-glass-card space-y-5 rounded-[22px] p-7 text-center">
        <div
          className={
            authError
              ? "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-danger/15 text-status-danger"
              : "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary"
          }
        >
          {authError ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
        </div>
        <h1 className="font-display text-2xl font-medium text-foreground">
          {authError ? "Không thể đăng nhập bằng Google" : "Đang hoàn tất đăng nhập..."}
        </h1>
        <p role={authError ? "alert" : "status"} className="text-sm text-muted-foreground">
          {authError ?? "Đang đồng bộ phiên tài khoản Google Workspace và chuyển hướng..."}
        </p>
        {authError ? (
          <>
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
              className="w-full rounded-xl"
              onClick={() => {
                void navigate("/login", { replace: true });
              }}
            >
              Quay lại trang đăng nhập
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
