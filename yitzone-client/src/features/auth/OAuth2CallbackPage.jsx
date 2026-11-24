import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isOnboardingCompleted } from "@/features/iam/data/onboarding-storage";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { AUTH_REDIRECT_STORAGE_KEY, useAuthStore } from "@/stores/auth-store";

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export function OAuth2CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [statusText, setStatusText] = useState("Đang xác minh tài khoản Google Workspace và thông tin sinh viên...");
  const [authError, setAuthError] = useState(null);

  const savedRedirect =
    typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) : null;
  const successTarget = savedRedirect && savedRedirect !== "/login" ? savedRedirect : "/";
  const demoUserId = "22110345";
  const needsOnboarding = !authError && !isOnboardingCompleted(demoUserId);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        await getOrCreateDeviceKeyPair();
      } catch {
        // Non-blocking in unsupported environments
      }
      if (!active) return;

      if (!IS_DEMO_MODE) {
        setAuthError(
          "Đăng nhập Google Workspace cần kết nối máy chủ OIDC đang hoạt động. Vui lòng đăng nhập lại khi backend sẵn sàng."
        );
        return;
      }

      setStatusText("Đã xác thực tài khoản Google Workspace, liên kết tài khoản và thiết lập phiên bảo mật.");
      setSession({
        userId: "22110345",
        email: "22110345@student.hcmute.edu.vn",
        fullName: "Nguyễn Minh Khoa (Google Workspace)",
        accessToken: "demo-local-offline-token",
        authProvider: "google",
        authorities: ["event:view", "attendance:check_in", "store:view", "voting:cast"],
        roleScopes: []
      });
    };

    const timer = window.setTimeout(() => {
      void run();
    }, 450);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [setSession]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="liquid-glass-card space-y-5 rounded-[22px] p-7 text-center">
        <div
          className={
            authError
              ? "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-danger/15 text-status-danger"
              : "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success/15 text-status-success"
          }
        >
          {authError ? <AlertCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
        </div>
        <h1 className="font-display text-2xl font-medium text-foreground">
          {authError ? "Không thể hoàn tất đăng nhập Google" : "Liên kết Google Workspace hoàn tất"}
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
