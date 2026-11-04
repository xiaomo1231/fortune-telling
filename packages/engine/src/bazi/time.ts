// 出生时间校正：夏令时、经度时差、均时差 → 真太阳时

/** 中国 1986–1991 年夏令时起止日期（当地时间 2:00 切换） */
export const CHINA_DST: Record<number, [string, string]> = {
  1986: ["05-04", "09-14"], 1987: ["04-12", "09-13"], 1988: ["04-10", "09-11"],
  1989: ["04-16", "09-17"], 1990: ["04-15", "09-16"], 1991: ["04-14", "09-15"],
};

export function inChinaDST(y: number, m: number, d: number, h: number): boolean {
  const r = CHINA_DST[y];
  if (!r) return false;
  const md = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (md < r[0] || md > r[1]) return false;
  if (md === r[0]) return h >= 2;
  if (md === r[1]) return h < 2;
  return true;
}

/** 均时差（分钟），NOAA 近似公式，误差在半分钟内 */
export function equationOfTime(y: number, m: number, d: number, h = 12): number {
  const doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const g = (2 * Math.PI / 365) * (doy - 1 + (h - 12) / 24);
  return 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
}

export interface WallTime { year: number; month: number; day: number; hour: number; minute: number; }

export interface TimeCorrection {
  input: WallTime;
  /** 用于排盘的时间 */
  corrected: WallTime;
  dstApplied: boolean;
  longitudeMinutes: number;
  equationMinutes: number;
  totalMinutes: number;
  useTrueSolar: boolean;
}

export function correctBirthTime(t: WallTime, lng: number | null, useTrueSolar: boolean): TimeCorrection {
  const dst = inChinaDST(t.year, t.month, t.day, t.hour);
  const lonMin = useTrueSolar && lng != null ? (lng - 120) * 4 : 0;
  const eq = useTrueSolar && lng != null ? equationOfTime(t.year, t.month, t.day, t.hour) : 0;
  const total = (dst ? -60 : 0) + lonMin + eq;
  const ms = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute) + Math.round(total) * 60000;
  const c = new Date(ms);
  return {
    input: t,
    corrected: { year: c.getUTCFullYear(), month: c.getUTCMonth() + 1, day: c.getUTCDate(), hour: c.getUTCHours(), minute: c.getUTCMinutes() },
    dstApplied: dst,
    longitudeMinutes: lonMin,
    equationMinutes: eq,
    totalMinutes: total,
    useTrueSolar: useTrueSolar && lng != null,
  };
}
