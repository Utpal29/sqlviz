function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(columns: string[], rows: unknown[][]): string {
  const header = columns.map(escapeCsvCell).join(",");
  const body = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  return body ? `${header}\n${body}\n` : `${header}\n`;
}

export function toJson(columns: string[], rows: unknown[][]): string {
  const objects = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i] ?? null;
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

export function downloadText(filename: string, mimeType: string, text: string): void {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, columns: string[], rows: unknown[][]): void {
  downloadText(filename, "text/csv", toCsv(columns, rows));
}

export function downloadJson(filename: string, columns: string[], rows: unknown[][]): void {
  downloadText(filename, "application/json", toJson(columns, rows));
}
