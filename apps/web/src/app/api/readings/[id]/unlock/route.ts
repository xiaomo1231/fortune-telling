import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, json, route } from "@/lib/http";
import { consume } from "@/lib/quota";
import { getOwnReading, interpret } from "@/lib/readings";
import { requestFor } from "@/lib/requests";

type Ctx = { params: Promise<{ id: string }> };

/** 解锁正缘画像的全部 10 个位置 */
export const POST = route<Ctx>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const r = await getOwnReading(u, id);
  if (r.kind !== "tarot" || r.subtype !== "soulmate") throw new ApiError(400, "这次记录不需要解锁");
  if (r.unlocked) return json({ text: r.text, unlocked: true });
  if (r.status === "drawing") throw new ApiError(409, "还没抽完牌");
  await consume(u, "tarot:soulmate");
  const unlocked = { ...r, unlocked: true };
  const g = await interpret(u, requestFor(unlocked));
  await prisma.reading.update({ where: { id }, data: { unlocked: true, text: g.text, personaId: g.personaId, source: g.source, status: "done" } });
  return json({ text: g.text, unlocked: true });
});
