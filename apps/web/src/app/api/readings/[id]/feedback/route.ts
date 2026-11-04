import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { body, json, route } from "@/lib/http";
import { getOwnReading } from "@/lib/readings";

const Body = z.object({ feedback: z.enum(["accurate", "inaccurate"]).optional(), humanLike: z.enum(["human", "machine"]).optional() });
type Ctx = { params: Promise<{ id: string }> };

/** “准 / 不准”“像真人 / 像机器”反馈，用于改进提示词和禁用表 */
export const POST = route<Ctx>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  await getOwnReading(u, id);
  const data = await body(req, Body);
  await prisma.reading.update({ where: { id }, data });
  return json({ ok: true });
});
