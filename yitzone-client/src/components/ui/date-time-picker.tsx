import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
const MONTHS_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12"
] as const;

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_STEPS = ["00", "15", "30", "45", "59"] as const;

const QUICK_TIMES = [
  { label: "08:00", hour: "08", minute: "00" },
  { label: "17:00", hour: "17", minute: "00" },
  { label: "21:00", hour: "21", minute: "00" },
  { label: "23:59", hour: "23", minute: "59" }
] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseIsoValue(value: string): { year: number; month: number; day: number; hour: string; minute: string } {
  const [datePart = "", timePart = "23:59"] = value.split("T");
  const [yStr, mStr, dStr] = datePart.split("-");
  const [hStr = "23", minStr = "59"] = timePart.split(":");
  const now = new Date();
  const year = Number(yStr) || now.getFullYear();
  const month = Number(mStr) ? Number(mStr) - 1 : now.getMonth();
  const day = Number(dStr) || now.getDate();
  return {
    year,
    month: Math.max(0, Math.min(11, month)),
    day: Math.max(1, Math.min(31, day)),
    hour: pad2(Math.max(0, Math.min(23, Number(hStr) || 0))),
    minute: pad2(Math.max(0, Math.min(59, Number(minStr) || 0)))
  };
}

export function formatVietnameseDateTime(value: string, includeTime = true): string {
  if (!value) return includeTime ? "Chọn ngày & giờ" : "Chọn ngày";
  const parsed = parseIsoValue(value);
  const dateStr = `${pad2(parsed.day)}/${pad2(parsed.month + 1)}/${parsed.year}`;
  return includeTime ? `${dateStr} · ${parsed.hour}:${parsed.minute}` : dateStr;
}

interface DateTimePickerProps {
  id?: string;
  value: string;
  onChange: (nextIso: string) => void;
  mode?: "datetime" | "date";
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  mode = "datetime",
  className,
  disabled = false
}: DateTimePickerProps) {
  const parsed = useMemo(() => parseIsoValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
  }, [parsed.year, parsed.month]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // Monday-first index (0 = Mon ... 6 = Sun)
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{ year: number; month: number; day: number; inCurrentMonth: boolean }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ year: prevYear, month: prevMonth, day: d, inCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ year: viewYear, month: viewMonth, day: d, inCurrentMonth: true });
    }

    const trailing = 42 - cells.length;
    for (let d = 1; d <= trailing; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ year: nextYear, month: nextMonth, day: d, inCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const emitValue = (y: number, m: number, d: number, h: string, min: string) => {
    const datePart = `${y}-${pad2(m + 1)}-${pad2(d)}`;
    onChange(mode === "datetime" ? `${datePart}T${h}:${min}` : datePart);
  };

  const handleSelectDay = (y: number, m: number, d: number) => {
    emitValue(y, m, d, parsed.hour, parsed.minute);
    setViewYear(y);
    setViewMonth(m);
    if (mode === "date") {
      setOpen(false);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePickToday = () => {
    emitValue(todayY, todayM, todayD, parsed.hour, parsed.minute);
    setViewYear(todayY);
    setViewMonth(todayM);
    if (mode === "date") setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary ring-2 ring-primary/20",
          className
        )}
      >
        <span className="tabular-mono truncate font-medium">
          {formatVietnameseDateTime(value, mode === "datetime")}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={mode === "datetime" ? "Chọn ngày và giờ" : "Chọn ngày"}
          className={cn(
            "absolute left-0 z-50 mt-2 rounded-2xl border border-border bg-card p-3.5 text-card-foreground shadow-popover",
            mode === "datetime" ? "w-[320px] sm:w-[440px]" : "w-[296px]"
          )}
        >
          <div className={cn("grid gap-4", mode === "datetime" && "sm:grid-cols-12")}>
            {/* Calendar Panel */}
            <div className={cn(mode === "datetime" ? "sm:col-span-7" : "w-full")}>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-sm font-medium text-foreground">
                  {MONTHS_VI[viewMonth]}, {viewYear}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Tháng trước"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Tháng sau"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS_VI.map((wd) => (
                  <div
                    key={wd}
                    className="py-1 text-[11px] font-semibold text-muted-foreground"
                  >
                    {wd}
                  </div>
                ))}
                {calendarCells.map((cell, idx) => {
                  const isSelected =
                    cell.year === parsed.year &&
                    cell.month === parsed.month &&
                    cell.day === parsed.day;
                  const isToday =
                    cell.year === todayY && cell.month === todayM && cell.day === todayD;

                  return (
                    <button
                      key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                      type="button"
                      onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                      className={cn(
                        "flex h-8 w-full items-center justify-center rounded-lg tabular-mono text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-primary font-semibold text-primary-foreground"
                          : cell.inCurrentMonth
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground/45 hover:bg-muted/60",
                        isToday && !isSelected && "ring-1 ring-primary/50 text-primary font-semibold"
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 24-Hour Time Panel */}
            {mode === "datetime" && (
              <div className="flex flex-col justify-between border-t border-border pt-3 sm:col-span-5 sm:border-l sm:border-t-0 sm:pl-3.5 sm:pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Giờ (24h)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="mb-1 text-[11px] font-medium text-muted-foreground">Giờ</div>
                      <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-xl border border-border bg-muted/30 p-1">
                        {HOURS_24.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => emitValue(parsed.year, parsed.month, parsed.day, h, parsed.minute)}
                            className={cn(
                              "w-full rounded-md py-1 tabular-mono text-xs font-medium transition-colors",
                              parsed.hour === h
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-card"
                            )}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-[11px] font-medium text-muted-foreground">Phút</div>
                      <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-xl border border-border bg-muted/30 p-1">
                        {MINUTE_STEPS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => emitValue(parsed.year, parsed.month, parsed.day, parsed.hour, m)}
                            className={cn(
                              "w-full rounded-md py-1 tabular-mono text-xs font-medium transition-colors",
                              parsed.minute === m
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-card"
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">Mốc nhanh</div>
                    <div className="grid grid-cols-2 gap-1">
                      {QUICK_TIMES.map((qt) => (
                        <button
                          key={qt.label}
                          type="button"
                          onClick={() => emitValue(parsed.year, parsed.month, parsed.day, qt.hour, qt.minute)}
                          className={cn(
                            "rounded-lg border px-2 py-1 tabular-mono text-[11px] font-medium transition-colors",
                            parsed.hour === qt.hour && parsed.minute === qt.minute
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {qt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Popover Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
            <button
              type="button"
              onClick={handlePickToday}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
