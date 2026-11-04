import { z } from "zod";
import { getSpread, shuffleDeck } from "@moxing/engine";
import { requireUser } from "@/lib/auth";
import { cnDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { Action, consume } from "@/lib/quota";
import { findRecentSame, questionHash, screenOrThrow } from "@/lib/readings";
import { Question } from "@/lib/schemas";

const Body = z.object({
  spreadId: z.enum(["daily", "yesno", "three", "love-cross", "choice", "celtic", "soulmate"]),
  question: Question,
  topic: z.enum(["love", "work", "money", "self"]).default("self"),
  force: z.boolean().default(false),
});

const ACTION: Record<string, Action | null> = { daily: "tarot:daily", yesno: "tarot:yesno", three: "tarot:three", "love-cross": "tarot:deep", choice: "tarot:deep", celtic: "tarot:deep", soulmate: null };

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req, Body);
  const spread = getSpread(b.spreadId);
  screenOrThrow(b.question);

  if (b.spreadId === "daily") {
    const today = await prisma.reading.findFirst({ where: { userId: u.id, kind: "tarot", subtype: "daily", createdAt: { gte: new Date(cnDay() + "T00:00:00+08:00") } } });
    if (today) return json({ id: today.id, existing: true, status: today.status, count: 1, deckSize: 78 });
  }
  const hash = b.spreadId === "daily" ? null : questionHash("tarot", b.question);
  if (!b.force) {
    const same = await findRecentSame(u.id, "tarot", hash);
    if (same) throw new ApiError(409, "同一件事 24 小时内不宜反复问，牌已经给过答案了", "same_question", { readingId: same.id });
  }
  const action = ACTION[b.spreadId];
  if (action) await consume(u, action);

  const deck = shuffleDeck(spread.deck);
  const r = await prisma.reading.create({
    data: {
      userId: u.id, kind: "tarot", subtype: spread.id, question: b.question || null, topic: b.topic, questionHash: hash,
      secret: { deck: deck.map((d) => [d.id, d.reversed]) }, status: "drawing", followupsLeft: spread.followups, unlocked: spread.id !== "soulmate",
      result: { spreadId: spread.id, spreadName: spread.name },
    },
  });
  return json({ id: r.id, deckSize: deck.length, count: spread.count });
});
