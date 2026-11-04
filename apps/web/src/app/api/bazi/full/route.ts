import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { asJson, prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { consume } from "@/lib/quota";
import { chartOf, interpret } from "@/lib/readings";

const Body = z.object({ profileId: z.string() });

/** 完整命书：同一命盘买过一次就永久保存，不重复扣费 */
export const POST = route(async (req) => {
  const u = await requireUser();
  const { profileId } = await body(req, Body);
  const p = await prisma.profile.findFirst({ where: { id: profileId, userId: u.id } });
  if (!p) throw new ApiError(404, "找不到这份档案，完整命书需要先保存档案");
  const chart = chartOf(p);
  const have = await prisma.reading.findFirst({ where: { userId: u.id, kind: "bazi", subtype: "full", questionHash: chart.key } });
  if (have) return json({ id: have.id, text: have.text, existing: true });
  await consume(u, "bazi:full");
  const g = await interpret(u, { kind: "bazi", chart, depth: "full", name: p.name });
  const r = await prisma.reading.create({ data: { userId: u.id, profileId: p.id, kind: "bazi", subtype: "full", questionHash: chart.key, result: asJson({ chart, name: p.name, pillarsText: chart.pillars.map((x) => x.stem + x.branch).join(" ") }), text: g.text, personaId: g.personaId, source: g.source, status: "done" } });
  return json({ id: r.id, text: g.text, existing: false });
});
