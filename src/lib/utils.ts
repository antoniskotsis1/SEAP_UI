import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("el-GR");
}

export function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("el-GR");
}

export function formatCurrency(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("el-GR", {
    style: "currency",
    currency: "EUR",
  });
}
