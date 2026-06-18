import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(date));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

/** Up to two uppercase initials from a name or email. */
export function getInitials(value?: string | null): string {
  if (!value) return "?";
  const name = (value.includes("@") ? value.split("@")[0] : value) ?? value;
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? first;
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

/** Deterministic, pleasant avatar gradient derived from a seed string. */
export function avatarGradient(seed?: string | null): string {
  const s = seed ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 38) % 360;
  return `linear-gradient(135deg, oklch(0.7 0.14 ${hue}), oklch(0.58 0.16 ${hue2}))`;
}
