export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, CsvCell>>(
  rows: T[],
  columns?: (keyof T)[]
): string {
  if (rows.length === 0 && !columns?.length) return "";
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as (keyof T)[];
  const header = cols.map((c) => escapeCell(String(c))).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCell(row[c])).join(","))
    .join("\n");
  return body ? `${header}\n${body}` : header;
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}