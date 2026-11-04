import { z } from "zod";
import { computeBazi } from "@moxing/engine";
import { requireUser } from "@/lib/auth";
import { asJson, prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { interpret, profileToInput } from "@/lib/readings";
import { ProfileInput } from "@/lib/schemas";

const Body = z.object({ profileId: z.string().optional(), input: ProfileInput.optional() });

/** 排盘 + 免费简批。简批按命盘缓存，同一命盘不重复生成。 */
export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req, Body);
  let input, name: string | undefined, profileId: string | null = null;
  if (b.profileId) {
    const p = await prisma.profile.findFirst({ where: { id: b.profileId, userId: u.id } });
    if (!p) throw new ApiError(404, "找不到这份档案");
    input = profileToInput(p); name = p.name; profileId = p.id;
  } else if (b.input) {
    const p = b.input;
    input = { calendar: p.calendar, year: p.year, month: p.month, day: p.day, leapMonth: p.leapMonth, hour: p.hour, minute: p.minute, gender: p.gender, longitude: p.longitude ?? null, placeName: p.placeName ?? undefined, useTrueSolar: p.longitude != null, ziSect: p.ziSect } as const;
    name = p.name;
  } else throw new ApiError(400, "请选择档案或填写生辰");

  const chart = computeBazi(input);
  const cacheKey = `brief:${chart.key}:${u.personaId}`;
  let cached = await prisma.reportCache.findUnique({ where: { key: cacheKey } });
  if (!cached) {
    const g = await interpret(u, { kind: "bazi", chart, depth: "brief", name });
    cached = await prisma.reportCache.create({ data: { key: cacheKey, text: g.text, personaId: g.personaId, source: g.source } });
  }
  const existing = await prisma.reading.findFirst({ where: { userId: u.id, kind: "bazi", subtype: "brief", questionHash: chart.key } });
  const pillarsText = chart.pillars.map((p) => p.stem + p.branch).join(" ");
  const reading = existing ?? await prisma.reading.create({ data: { userId: u.id, profileId, kind: "bazi", subtype: "brief", questionHash: chart.key, result: asJson({ chart, name, pillarsText }), text: cached.text, personaId: cached.personaId, source: cached.source, status: "done" } });
  const full = await prisma.reading.findFirst({ where: { userId: u.id, kind: "bazi", subtype: "full", questionHash: chart.key }, select: { id: true } });
  return json({ id: reading.id, chart, text: cached.text, personaId: cached.personaId, fullReportId: full?.id ?? null, profileId });
});
