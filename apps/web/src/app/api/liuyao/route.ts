import { z } from "zod";
import { castLiuyao, timeValues, tossCoins } from "@moxing/engine";
import { requireUser } from "@/lib/auth";
import { cnNow } from "@/lib/dates";
import { asJson, prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { consume } from "@/lib/quota";
import { findRecentSame, questionHash, screenOrThrow, selfProfile } from "@/lib/readings";

const Body = z.object({
  question: z.string().trim().min(2, "请写下想问的事").max(200),
  topic: z.enum(["money", "career", "exam", "love", "health", "travel", "lost", "other"]),
  method: z.enum(["coins", "time"]).default("coins"),
  force: z.boolean().default(false),
});

/** 起卦：铜钱由服务端摇出，前端只负责动画，避免刷新重摇 */
export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req, Body);
  screenOrThrow(b.question);
  const hash = questionHash("liuyao", b.question);
  if (!b.force) {
    const same = await findRecentSame(u.id, "liuyao", hash);
    if (same) throw new ApiError(409, "一事不二占，这件事 24 小时内已经起过卦了", "same_question", { readingId: same.id });
  }
  await consume(u, "liuyao");
  const now = cnNow();
  const tosses = b.method === "coins" ? Array.from({ length: 6 }, () => tossCoins()) : null;
  const values = tosses ? tosses.map((t) => t.value) : timeValues(now);
  const self = await selfProfile(u.id);
  const result = castLiuyao(values, { date: now, topic: b.topic, gender: self ? (self.gender as "male" | "female") : null, method: b.method });
  const r = await prisma.reading.create({ data: { userId: u.id, kind: "liuyao", subtype: b.method, question: b.question, topic: b.topic, questionHash: hash, result: asJson({ ...result, tosses }), status: "ready", followupsLeft: 1 } });
  return json({ id: r.id, result, tosses });
});
