import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || "Lỗi hiển thị không xác định."
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[AppErrorBoundary]", error, info.componentStack);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="yit-ambient-canvas flex min-h-screen items-center justify-center p-6 text-foreground">
          <div
            role="alert"
            className="liquid-glass-card w-full max-w-lg space-y-5 rounded-panel p-7 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-danger/15 text-status-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-medium text-foreground">
                Đã xảy ra sự cố hiển thị
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Trang hiện tại gặp lỗi ngoài dự kiến. Dữ liệu phiên làm việc của bạn vẫn an toàn — hãy thử tải lại trang hoặc quay về trang chủ.
              </p>
              {import.meta.env.DEV && this.state.errorMessage && (
                <p className="tabular-mono rounded-xl border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-left text-xs text-status-danger">
                  {this.state.errorMessage}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button type="button" onClick={this.handleReload} className="rounded-full">
                <RotateCcw className="h-4 w-4" />
                <span>Tải lại trang</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: null });
                  window.location.assign("/");
                }}
              >
                <Home className="h-4 w-4" />
                <span>Về Trang chủ</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
