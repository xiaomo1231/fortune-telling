import type { Reading } from "@prisma/client";

type CardR = { zh: string; reversed: boolean; position: { name: string } };

/** 把一次占卜的结果压成几行文字，给追问用 */
export function summarize(r: Reading): string {
  const res = (r.result ?? {}) as Record<string, unknown>;
  if (r.kind === "tarot") {
    const cards = (res.cards as CardR[] | undefined) ?? [];
    return `塔罗「${res.spreadName}」，问题：${r.question || "无"}\n` + cards.map((c) => `${c.position.name}：${c.zh}${c.reversed ? "逆位" : "正位"}`).join("\n");
  }
  if (r.kind === "liuyao") {
    const l = res as { main?: { name: string }; changed?: { name: string } | null; useGod?: { summary: string }; verdict?: string };
    return `六爻，问题：${r.question}\n${l.useGod?.summary ?? ""}，倾向${l.verdict ?? ""}`;
  }
  if (r.kind === "qian") {
    const q = res as { qian?: { no: number; title: string; level: string; poem: string[] } };
    return `观音灵签第${q.qian?.no}签 ${q.qian?.title}（${q.qian?.level}），签诗：${q.qian?.poem.join("，")}；问题：${r.question || "无"}`;
  }
  if (r.kind === "bazi") return `八字命盘：${(res as { pillarsText?: string }).pillarsText ?? ""}`;
  return "";
}
