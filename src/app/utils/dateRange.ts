function toYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMondayOfWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getThisWeek(): { from: string; to: string } {
  const now = new Date();
  return { from: toYYYYMMDD(getMondayOfWeek(now)), to: toYYYYMMDD(now) };
}

export function getLastWeek(): { from: string; to: string } {
  const mondayThisWeek = getMondayOfWeek(new Date());
  const lastMonday = new Date(mondayThisWeek);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastSunday.getDate() + 6);
  return { from: toYYYYMMDD(lastMonday), to: toYYYYMMDD(lastSunday) };
}

export function getThisMonth(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toYYYYMMDD(first), to: toYYYYMMDD(now) };
}

export function getLastMonth(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toYYYYMMDD(first), to: toYYYYMMDD(last) };
}

export function getThisYear(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), 0, 1);
  return { from: toYYYYMMDD(first), to: toYYYYMMDD(now) };
}

export type RangePreset =
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "date";

export function getRangeByPreset(
  preset: RangePreset,
  singleDate?: string,
): { date?: string; from?: string; to?: string } {
  if (preset === "date" && singleDate) {
    return { date: singleDate };
  }

  switch (preset) {
    case "thisWeek":
      return getThisWeek();
    case "lastWeek":
      return getLastWeek();
    case "thisMonth":
      return getThisMonth();
    case "lastMonth":
      return getLastMonth();
    case "thisYear":
      return getThisYear();
    default:
      return singleDate ? { date: singleDate } : getThisWeek();
  }
}
