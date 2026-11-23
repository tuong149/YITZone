import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowLeft, Radio } from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { useThemeStore } from "@/stores/theme-store";

export function StageLayout(){
  const setSurface = useThemeStore((s) => s.setSurface);

  useEffect(() => {
    setSurface("stage");
  }, [setSurface]);

  return (
    <div
      className="stage-dark flex min-h-screen flex-col text-slate-50"
      style={{
        backgroundImage:
          "radial-gradient(55% 42% at 62% -12%, rgba(56, 189, 248, 0.24) 0%, rgba(59, 91, 255, 0.16) 40%, transparent 75%), radial-gradient(40% 35% at 15% 85%, rgba(91, 26, 230, 0.18) 0%, transparent 70%)"
      }}
    >
      <div className="px-6 pt-4">
        <header className="liquid-glass-on-dark mx-auto flex h-14 max-w-[1600px] items-center justify-between rounded-full px-5">
          <div className="flex items-center gap-3">
            <BrandLockup forceDarkSurface />
            <span className="hidden sm:inline text-xs font-medium text-slate-300">
              Hội trường FIT · HCM-UTE · LED 16:9
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-3.5 py-1 text-xs font-semibold text-sky-200">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>LIVE STAGE</span>
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Thoát LED</span>
            </Link>
          </div>
        </header>
      </div>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-center p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
