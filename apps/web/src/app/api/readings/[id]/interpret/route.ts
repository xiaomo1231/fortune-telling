import { requireUser } from "@/lib/auth";
import { asJson, prisma } from "@/lib/db";
import { ApiError, json, route } from "@/lib/http";
import { getOwnReading, interpret } from "@/lib/readings";
import { requestFor } from "@/lib/requests";

type Ctx = { params: Promise<{ id: string }> };

/** 生成（或取回）一次占卜的解读。结果整篇返回，前端用打字机效果呈现。 */
export const POST = route<Ctx>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const r = await getOwnReading(u, id);
  if (r.status === "drawing") throw new ApiError(409, "还没抽完牌");
  if (r.text) return json({ text: r.text, personaId: r.personaId, cached: true });
  const g = await interpret(u, requestFor(r));
  await prisma.reading.update({ where: { id }, data: { text: g.text, personaId: g.personaId, source: g.source, status: "done", result: asJson({ ...(r.result as object), _skeleton: g.skeleton }) } });
  return json({ text: g.text, personaId: g.personaId, cached: false });
});
