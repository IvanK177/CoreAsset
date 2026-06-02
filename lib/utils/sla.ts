import { addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Europe/Moscow";

const SLA_DAYS: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 4,
  low: 7,
};

/**
 * Calculates the deadline date based on creation date and priority,
 * adjusted to Europe/Moscow timezone.
 */
export function calculateDeadline(createdAt: string | Date, priority: string): Date {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  
  // Convert UTC or local date to Moscow timezone zoned time
  const zonedDate = toZonedTime(date, TIMEZONE);
  
  const daysToAdd = SLA_DAYS[priority.toLowerCase()] ?? 4;
  
  return addDays(zonedDate, daysToAdd);
}
