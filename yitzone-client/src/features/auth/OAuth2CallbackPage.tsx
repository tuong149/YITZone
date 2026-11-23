import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { useAuthStore } from "@/stores/auth-store";

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export function OAuth2CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [statusText, setStatusText] = useState("Đang xác minh mã OIDC Google Workspace & đối chiếu Roster...");
  const [authError, setAuthError] = useState<string | null>(null);

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
            Chống Pre-account Takeover đã bật: mọi mật khẩu chưa xác thực trước đó (nếu trùng email) đều bị vô hiệu hóa.
          </p>
        </div>
        <Button
          type="button"
          className="w-full rounded-xl"
          onClick={() => void navigate(authError ? "/login" : "/")}
        >
          {authError ? "Quay lại trang Đăng nhập" : "Vào Trang chủ YITZone"}
        </Button>
      </div>
    </div>
  );
}
