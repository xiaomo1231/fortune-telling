import { dailyFortune } from "@moxing/engine";
import { requireUser } from "@/lib/auth";
import { cnDay, cnNow } from "@/lib/dates";
import { asJson, prisma } from "@/lib/db";
import { ApiError, json, route } from "@/lib/http";
import { chartOf, interpret, selfProfile } from "@/lib/readings";

/** 今日个人运势：用户日主 × 当日干支，每人每天生成一次 */
export const GET = route(async () => {
  const u = await requireUser();
  const day = cnDay();
  const since = new Date(day + "T00:00:00+08:00");
  const today = await prisma.reading.findFirst({ where: { userId: u.id, kind: "daily", createdAt: { gte: since } } });
  if (today) return json({ id: today.id, ...(today.result as object), text: today.text });
  const p = await selfProfile(u.id);
  if (!p) throw new ApiError(404, "先填写自己的生辰，才能看个人运势", "no_profile");
  const chart = chartOf(p);
  const now = cnNow();
  const fortune = dailyFortune({ dayMaster: chart.dayMaster, dayBranch: chart.pillars[2].branch, yearBranch: chart.pillars[0].branch, favorable: chart.useful.favorable, unfavorable: chart.useful.unfavorable, date: { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() } });
  const result = { fortune, dayMaster: chart.dayMaster + chart.dayElement, strength: chart.strength.level, name: p.name };
  const g = await interpret(u, { kind: "daily", ...result });
  const r = await prisma.reading.create({ data: { userId: u.id, profileId: p.id, kind: "daily", subtype: day, result: asJson(result), text: g.text, personaId: g.personaId, source: g.source, status: "done" } });
  return json({ id: r.id, ...result, text: g.text });
});
