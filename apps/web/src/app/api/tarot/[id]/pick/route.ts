import { z } from "zod";
import { getSpread, pickCards, soulmateClues, yesNoLean } from "@moxing/engine";
import { requireUser } from "@/lib/auth";
import { asJson, prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { getOwnReading } from "@/lib/readings";

const Body = z.object({ picks: z.array(z.number().int().min(0).max(77)).min(1).max(10) });
type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const r = await getOwnReading(u, id);
  if (r.kind !== "tarot") throw new ApiError(400, "不是塔罗记录");
  if (r.status !== "drawing") throw new ApiError(409, "这次已经抽过牌了", "already_drawn");
  const { picks } = await body(req, Body);
  const spread = getSpread(r.subtype);
  const deck = ((r.secret as { deck: [string, boolean][] }).deck).map(([cid, reversed]) => ({ id: cid, reversed }));
  const drawn = pickCards(deck, picks, spread);
  const result = {
    spreadId: spread.id, spreadName: spread.name,
    cards: drawn.map((d) => ({ id: d.card.id, zh: d.card.zh, en: d.card.en, reversed: d.reversed, position: d.position, keywords: d.reversed ? d.card.keywords.rev : d.card.keywords.up, image: d.card.image })),
    yesNo: spread.id === "yesno" ? yesNoLean(drawn[0]) : undefined,
    clues: spread.id === "soulmate" ? soulmateClues(drawn) : undefined,
  };
  const updated = await prisma.reading.update({ where: { id }, data: { result: asJson(result), status: "ready", secret: { picks } } });
  return json({ id: updated.id, result });
});
