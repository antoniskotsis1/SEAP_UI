/**
 * Εκκαθάριση (Settlement) is modeled on top of the generic Files API: one or
 * more files per year. Since `FileDto` has no year field, we store the year in
 * the file's `comments` as a `"YYYY"` or `"YYYY — <note>"` prefix and group the
 * files by that year on the client.
 */
import type { FileDto } from "@/types/api";

export interface SettlementGroup {
  year: number;
  files: FileDto[];
}

/** The per-file comment (year prefix stripped). */
export function settlementFileComment(f: FileDto): string {
  return parseSettlementNote(f.comments);
}

export function encodeSettlementComments(year: number, note?: string): string {
  const n = note?.trim();
  return n ? `${year} — ${n}` : `${year}`;
}

export function parseSettlementYear(comments?: string | null): number | null {
  const m = comments?.match(/^\s*(\d{4})/);
  return m ? Number(m[1]) : null;
}

export function parseSettlementNote(comments?: string | null): string {
  return (comments ?? "").replace(/^\s*\d{4}\s*(?:—\s*)?/, "").trim();
}

export type SettlementFileKind = "PDF" | "EXCEL" | "OTHER";

export function settlementFileKind(f: FileDto): SettlementFileKind {
  const ct = f.contentType?.toLowerCase() ?? "";
  const name = f.originalFilename?.toLowerCase() ?? "";
  if (ct.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (
    ct.includes("spreadsheet") ||
    ct.includes("excel") ||
    ct.includes("csv") ||
    /\.(xlsx?|csv)$/.test(name)
  ) {
    return "EXCEL";
  }
  return "OTHER";
}

/** Group settlement files by their encoded year, newest year first. */
export function groupSettlements(files: FileDto[]): SettlementGroup[] {
  const map = new Map<number, FileDto[]>();
  for (const f of files) {
    const year = parseSettlementYear(f.comments);
    if (year == null) continue;
    const arr = map.get(year);
    if (arr) arr.push(f);
    else map.set(year, [f]);
  }
  return Array.from(map.entries())
    .map(([year, groupFiles]) => ({ year, files: groupFiles }))
    .sort((a, b) => b.year - a.year);
}
