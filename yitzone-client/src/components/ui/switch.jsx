import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * iOS 26/27 Liquid Glass Toggle Switch
 * - Recessed translucent glass track + luminous YIT Cobalt liquid fill when checked
 * - Elongated optical glass droplet thumb with subtle press stretch & springy ease-out
 */
export const Switch = forwardRef(function Switch(
  {
    checked = false,
    onCheckedChange,
    disabled = false,
    size = "default",
    className,
    onClick,
    ...props
  },
  ref
) {
  const isSm = size === "sm";

  const handleClick = (e) => {
    if (disabled) return;
    onCheckedChange?.(!checked);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "group liquid-switch-track relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45",
        isSm ? "h-[26px] w-[46px]" : "h-[30px] w-[52px]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "liquid-switch-thumb pointer-events-none block rounded-full",
          isSm ? "h-[20px] w-[24px]" : "h-[24px] w-[28px]",
          checked
            ? isSm
              ? "translate-x-[16px] group-active:w-[27px] group-active:translate-x-[13px]"
              : "translate-x-[18px] group-active:w-[32px] group-active:translate-x-[14px]"
            : isSm
              ? "translate-x-0 group-active:w-[27px]"
              : "translate-x-0 group-active:w-[32px]"
        )}
      />
    </button>
  );
});
