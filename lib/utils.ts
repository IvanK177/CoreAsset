import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", { 
    dateStyle: "medium",
    timeZone: "Europe/Moscow"
  }).format(new Date(date));
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow"
  }).format(new Date(date));
};

export function formatDateTimeRu(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(d);
}

/**
 * Parses a date string, treating it as Moscow time (+03:00) if no timezone is specified.
 */
export function parseMoscowDateTime(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // If it already has a timezone indicator (ends with Z, or contains +/-XX:XX), parse normally.
  const hasTimezone = dateStr.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(dateStr);
  const formattedStr = hasTimezone ? dateStr : `${dateStr}+03:00`;
  return new Date(formattedStr);
}

export const daysUntilExpiry = (expiresAt: string | null | undefined): number | null => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Supabase may return FK join results as either a single object or an array,
 * depending on the relationship direction and isOneToOne flag in the generated types.
 * At runtime, PostgREST returns a single object when the FK is on the queried table,
 * but the TypeScript types may say array (isOneToOne: false).
 * This utility normalizes the result to always return a single object or null.
 */
export function extractJoinObject<T>(value: T | T[] | null | undefined): T | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/**
 * Safely extract known hardware fields from a JSON column.
 * Validates that the raw value is a plain object, then extracts
 * cpu/ram/storage with type checking. Unknown fields (e.g. gpu) are ignored.
 * Returns an empty object for null, non-object, or array values.
 */
export function safeHardware(raw: unknown): { cpu?: string; ram?: string; storage?: string; gpu?: string; mac_address?: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  return {
    cpu: typeof obj.cpu === "string" ? obj.cpu : undefined,
    ram: typeof obj.ram === "string" ? obj.ram : undefined,
    storage: typeof obj.storage === "string" ? obj.storage : undefined,
    gpu: typeof obj.gpu === "string" ? obj.gpu : undefined,
    mac_address: typeof obj.mac_address === "string" ? obj.mac_address : undefined,
  };
}

export const BUILDING_ADDRESSES = {
  "Центр программирования и кибербезопасности": "г.Москва, ул. Академика Миллионщикова, дом 20",
  "Центр Вернадский": "г.Москва, проспект Вернадского, дом 29А",
  "IT.Бирюлево": "г.Москва, проезд Харьковский, дом 5А",
  "Центр городских технологий": "г.Москва, ул. Судостроительная, дом 48",
  "Дизайн колледж": "г.Москва, ул. Коломенская, дом 5, корпус 3",
} as const;

export type BuildingName = keyof typeof BUILDING_ADDRESSES;
