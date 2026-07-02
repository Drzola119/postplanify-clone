import { cn } from "@/lib/utils";
import * as React from "react";

interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
  rowClassName?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage, rowClassName, onRowClick }: DataTableProps<T>) {
  const gridCols = columns.map((c) => c.width ?? "1fr").join(" ");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div
        className="grid gap-3 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
        style={{ gridTemplateColumns: gridCols }}
      >
        {columns.map((c) => (
          <div key={c.key} className={cn(c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
            {c.header}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-zinc-500">{emptyMessage ?? "No data yet."}</div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {rows.map((row, i) => (
            <div
              key={rowKey(row, i)}
              className={cn(
                "grid gap-3 px-5 py-3 items-center text-sm transition-colors",
                onRowClick && "cursor-pointer hover:bg-zinc-50",
                rowClassName
              )}
              style={{ gridTemplateColumns: gridCols }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((c) => (
                <div key={c.key} className={cn(c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
                  {c.cell(row, i)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}