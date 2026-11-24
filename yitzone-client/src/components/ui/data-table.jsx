import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataTable({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "Chưa có dữ liệu phù hợp",
  emptyDescription = "Hãy thay đổi bộ lọc hoặc tạo bản ghi mới để bắt đầu.",
  emptyAction,
  selectable = false,
  isRowBulkDisabled,
  bulkDisabledReason = "Không được phép duyệt hàng loạt theo quy chế hệ thống",
  selectedIds = [],
  onSelectionChange,
  bulkActions
}) {
  const selectableRows = selectable
    ? data.filter((row) => !(isRowBulkDisabled && isRowBulkDisabled(row)))
: [];

  const allSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selectedIds.includes(row.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableRows.map((r) => r.id));
    }
  };

  const toggleOne = (id) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-status-danger/30 bg-status-danger/5 px-6 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-status-danger" />
        <h3 className="mt-3 font-display text-base font-medium text-foreground">
          Không thể tải dữ liệu
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {selectable && selectedIds.length > 0 && (
        <div className="flex flex-col items-start justify-between gap-2 border-b border-border bg-accent px-3.5 py-2.5 text-xs sm:flex-row sm:items-center sm:px-4">
          <span className="font-semibold text-accent-foreground">
            Đã chọn <span className="tabular-mono">{selectedIds.length}</span> bản ghi đủ điều kiện xử lý hàng loạt
          </span>
          <div className="flex flex-wrap items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {!loading && data.length > 0 && columns.length > 3 && (
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/35 px-3 py-1.5 text-[11px] font-medium text-muted-foreground sm:hidden">
          <span>Bảng có {columns.length} cột</span>
          <span>Vuốt ngang để xem thêm →</span>
        </div>
      )}

      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/80 text-xs font-semibold text-muted-foreground">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2.5 sm:px-4 sm:py-3">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả bản ghi hợp lệ"
                    checked={allSelected}
                    disabled={selectableRows.length === 0}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 tracking-wide sm:px-4 sm:py-3",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx}>
                  {selectable && (
                    <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                      <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3 sm:px-4 sm:py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ): data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1: 0)} className="px-4 py-10 text-center sm:px-6 sm:py-12">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <Inbox className="h-8 w-8 text-muted-foreground/70" />
                    <h4 className="mt-3 font-display text-base font-medium text-foreground">
                      {emptyTitle}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
                    {emptyAction && <div className="mt-4">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ): (
              data.map((row) => {
                const disabledBulk = Boolean(isRowBulkDisabled && isRowBulkDisabled(row));
                const checked = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-muted/45",
                      checked && "bg-primary/5"
                    )}
                  >
                    {selectable && (
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn bản ghi ${row.id}`}
                          checked={checked}
                          disabled={disabledBulk}
                          title={disabledBulk ? bulkDisabledReason: undefined}
                          onChange={() => toggleOne(row.id)}
                          className="h-4 w-4 rounded border-border accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2.5 align-middle sm:px-4 sm:py-3",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
