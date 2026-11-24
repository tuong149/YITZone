import { Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Sáng (Light)", icon: Sun },
  { value: "dark", label: "Tối (Dark)", icon: Moon },
  { value: "system", label: "Theo hệ thống", icon: Monitor }
];

export function ThemeToggle({ className }) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Đổi chế độ giao diện sáng/tối"
          className={cn(
            "liquid-glass inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
        >
          {isDark ? <Moon className="h-4 w-4" />: <Sun className="h-4 w-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Chế độ hiển thị</DropdownMenuLabel>
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={theme === opt.value}
              onCheckedChange={() => setTheme(opt.value)}
            >
              <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>{opt.label}</span>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
