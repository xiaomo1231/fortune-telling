import type { Reading } from "@prisma/client";
import { BaziChart, DailyFortune, getCard, getSpread, LingQian, LiuyaoResult, SpreadPosition, Topic } from "@moxing/engine";
import type { ReadingRequest } from "@moxing/reading";

/** 从数据库里存的结果重建解读请求 */
export function requestFor(r: Reading): ReadingRequest {
  const res = (r.result ?? {}) as Record<string, unknown>;
  switch (r.kind) {
    case "tarot": {
      const spread = getSpread(r.subtype);
      const cards = (res.cards as { id: string; reversed: boolean; position: SpreadPosition }[]).map((c) => ({ card: getCard(c.id), reversed: c.reversed, position: c.position }));
      return {
        kind: "tarot", spread, cards, question: r.question ?? "", topic: (r.topic as Topic) ?? "self",
        yesNo: res.yesNo as string | undefined, clues: res.clues as { label: string; value: string; source: string }[] | undefined,
        freePositions: spread.id === "soulmate" && !r.unlocked ? 2 : undefined,
      };
    }
    case "bazi":
      return { kind: "bazi", chart: res.chart as BaziChart, depth: r.subtype === "full" ? "full" : "brief", name: res.name as string | undefined };
    case "daily":
      return { kind: "daily", fortune: res.fortune as DailyFortune, dayMaster: res.dayMaster as string, strength: res.strength as string, name: res.name as string | undefined };
    case "liuyao":
      return { kind: "liuyao", result: res as unknown as LiuyaoResult, question: r.question ?? "" };
    case "qian":
      return { kind: "qian", qian: res.qian as LingQian, question: r.question ?? "", topicLabel: res.topicLabel as string, items: res.items as { key: string; value: string }[] };
    default:
      throw new Error("unknown kind " + r.kind);
  }
}
