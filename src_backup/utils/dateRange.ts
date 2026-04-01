/**
 * 日期范围预设：本周、上一周、本月、上一月、本年
 * 使用本地时区，返回 YYYY-MM-DD
 */

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 本周一 00:00 的 Date */
function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** 本周：本周一 ~ 今天 */
export function getThisWeek(): { from: string; to: string } {
  const now = new Date();
  const monday = getMondayOfWeek(now);
  return { from: toYYYYMMDD(monday), to: toYYYYMMDD(now) };
}

/** 上一周：上周一 ~ 上周日 */
export function getLastWeek(): { from: string; to: string } {
  const mondayThis = getMondayOfWeek(new Date());
  const lastMonday = new Date(mondayThis);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastSunday.getDate() + 6);
  return { from: toYYYYMMDD(lastMonday), to: toYYYYMMDD(lastSunday) };
}

/** 本月：本月1日 ~ 今天 */
export function getThisMonth(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toYYYYMMDD(first), to: toYYYYMMDD(now) };
}

/** 上一月：上月1日 ~ 上月最后一天 */
export function getLastMonth(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toYYYYMMDD(first), to: toYYYYMMDD(last) };
}

/** 本年：今年1月1日 ~ 今天 */
export function getThisYear(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), 0, 1);
  return { from: toYYYYMMDD(first), to: toYYYYMMDD(now) };
}

export type RangePreset = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'date';

export function getRangeByPreset(preset: RangePreset, singleDate?: string): { date?: string; from?: string; to?: string } {
  if (preset === 'date' && singleDate) {
    return { date: singleDate };
  }
  switch (preset) {
    case 'thisWeek':
      return getThisWeek();
    case 'lastWeek':
      return getLastWeek();
    case 'thisMonth':
      return getThisMonth();
    case 'lastMonth':
      return getLastMonth();
    case 'thisYear':
      return getThisYear();
    default:
      return singleDate ? { date: singleDate } : getThisWeek();
  }
}

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  thisWeek: '本周',
  lastWeek: '上一周',
  thisMonth: '本月',
  lastMonth: '上一月',
  thisYear: '本年',
  date: '指定日期',
};
