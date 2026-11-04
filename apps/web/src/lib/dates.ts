// 统一按北京时间计算“今天”
export function cnNow(d = new Date()): Date {
  return new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000);
}
export function cnDay(d = new Date()): string {
  const c = cnNow(d);
  return `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}-${String(c.getDate()).padStart(2, "0")}`;
}
export function cnMonth(d = new Date()): string { return cnDay(d).slice(0, 7); }
