import { z } from "zod";
import { generateReading } from "@moxing/reading";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { llm } from "@/lib/llm";
import { getOwnReading, screenOrThrow } from "@/lib/readings";
import { summarize } from "@/lib/summary";

const Body = z.object({ question: z.string().trim().min(2).max(200) });
type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const r = await getOwnReading(u, id);
  const { question } = await body(req, Body);
  screenOrThrow(question);
  if (!r.text) throw new ApiError(409, "先看完解读再追问");
  const dec = await prisma.reading.updateMany({ where: { id, followupsLeft: { gt: 0 } }, data: { followupsLeft: { decrement: 1 } } });
  if (dec.count !== 1) throw new ApiError(402, "这次占卜的追问次数用完了", "followup_exhausted", { product: "tarot-deep" });
  const g = await generateReading({ kind: "followup", context: summarize(r), previous: r.text, question }, { llm: llm(), personaId: r.personaId ?? u.personaId });
  const f = await prisma.followup.create({ data: { readingId: id, question, answer: g.text } });
  return json({ followup: f, followupsLeft: r.followupsLeft - 1 });
});
