import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

/**
 * Official YITZone Logo + Wordmark lockup.
 * Deterministically switches via theme store between standard color assets (Light Mode)
 * and dedicated white-on-dark assets (Dark Mode & Auditorium LED Stage).
 */
export function BrandLockup({
  showWordmark = true,
  forceDarkSurface = false,
  logoClassName = "h-8 w-8",
  wordmarkClassName = "h-5 sm:h-[22px]",
  className
}) {
  const isDark = useThemeStore((s) => s.isDark);
  const useWhiteAssets = forceDarkSurface || isDark;

  const logoSrc = useWhiteAssets ? "/brand/YITZoneLogoWhite.png": "/brand/YITZoneLogo.png";
  const wordmarkSrc = useWhiteAssets
    ? "/brand/YITZoneTextlogoWhite.png"
: "/brand/YITZoneTextlogo.png";

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
      <img src={logoSrc} alt="YITZone" className={cn("shrink-0 object-contain", logoClassName)} />
      {showWordmark && (
        <img
          src={wordmarkSrc}
          alt="YITZone — FIT HCM-UTE"
          className={cn("w-auto object-contain", wordmarkClassName)}
        />
      )}
    </span>
  );
}
