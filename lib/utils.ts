import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(date));
};

export const daysUntilExpiry = (expiresAt: string | null | undefined): number | null => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
<<<<<<< HEAD

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
export function safeHardware(raw: unknown): { cpu?: string; ram?: string; storage?: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  return {
    cpu: typeof obj.cpu === "string" ? obj.cpu : undefined,
    ram: typeof obj.ram === "string" ? obj.ram : undefined,
    storage: typeof obj.storage === "string" ? obj.storage : undefined,
  };
}
=======
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
