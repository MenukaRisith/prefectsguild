import { format, isSameDay, parseISO, startOfDay } from "date-fns";

export function toDayKey(input: Date | string) {
  const date = typeof input === "string" ? parseISO(input) : input;
  return format(startOfDay(date), "yyyy-MM-dd");
}

export function startOfSchoolDay(input: Date | string) {
  const date = typeof input === "string" ? parseISO(input) : input;
  return startOfDay(date);
}

export function formatDisplayDate(input: Date | string) {
  const date = typeof input === "string" ? parseISO(input) : input;
  return format(date, "dd MMM yyyy");
}

export function formatDisplayDateTime(input: Date | string) {
  const date = typeof input === "string" ? parseISO(input) : input;
  return format(date, "dd MMM yyyy 'at' hh:mm a");
}

export function isToday(input: Date | string) {
  const date = typeof input === "string" ? parseISO(input) : input;
  return isSameDay(date, new Date());
}
