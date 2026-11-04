import { secureChance, secureShuffle } from "../random";
import { MAJORS } from "./majors";
import { CUPS, PENTACLES, SWORDS, WANDS } from "./minors";
import type { RawCard, Suit, TarotCard, Topic } from "./types";

export type { Suit, TarotCard, Topic } from "./types";

const SUIT_ELEMENT: Record<Suit, TarotCard["element"]> = { wands: "火", cups: "水", swords: "风", pentacles: "土" };
const MAJOR_ELEMENT = ["风", "风", "水", "土", "火", "土", "风", "水", "火", "土", "火", "风", "水", "水", "火", "土", "火", "风", "水", "火", "火", "土"] as const;

function build(r: RawCard): TarotCard {
  const [id, zh, en, image, kwUp, kwRev, love, work, money, self, advice, tone, astro] = r;
  const isMajor = id.startsWith("major-");
  const suit = isMajor ? undefined : (id.split("-")[0] as Suit);
  const rank = isMajor ? undefined : Number(id.split("-")[1]);
  return {
    id, arcana: isMajor ? "major" : "minor", suit, rank, zh, en, image,
    keywords: { up: kwUp, rev: kwRev },
    topics: { love: { up: love[0], rev: love[1] }, work: { up: work[0], rev: work[1] }, money: { up: money[0], rev: money[1] }, self: { up: self[0], rev: self[1] } },
    advice: { up: advice[0], rev: advice[1] }, tone: { up: tone[0], rev: tone[1] }, astro,
    element: isMajor ? MAJOR_ELEMENT[Number(id.split("-")[1])] : SUIT_ELEMENT[suit!],
  };
}

export const TAROT: TarotCard[] = [...MAJORS, ...WANDS, ...CUPS, ...SWORDS, ...PENTACLES].map(build);
const BY_ID = new Map(TAROT.map((c) => [c.id, c]));
export function getCard(id: string): TarotCard { const c = BY_ID.get(id); if (!c) throw new Error(`unknown card ${id}`); return c; }

export interface SpreadPosition { name: string; meaning: string; x: number; y: number; rotate?: number; }
export interface Spread {
  id: string; name: string; desc: string; count: number; deck: "major" | "full";
  tier: "free" | "paid"; model: "fast" | "pro"; followups: number;
  positions: SpreadPosition[];
}

export const SPREADS: Spread[] = [
  { id: "daily", name: "每日一牌", desc: "抽一张，看看今天的主题", count: 1, deck: "full", tier: "free", model: "fast", followups: 0,
    positions: [{ name: "今日", meaning: "今天最值得留意的主题", x: 0, y: 0 }] },
  { id: "yesno", name: "是否牌阵", desc: "一件事做还是不做，先看倾向", count: 1, deck: "major", tier: "free", model: "fast", followups: 0,
    positions: [{ name: "答案", meaning: "这件事的倾向与关键", x: 0, y: 0 }] },
  { id: "three", name: "过去 · 现在 · 未来", desc: "把一件事放在时间线上看", count: 3, deck: "full", tier: "free", model: "fast", followups: 1,
    positions: [
      { name: "过去", meaning: "这件事的来由，已经发生的影响", x: -1, y: 0 },
      { name: "现在", meaning: "眼下的状态和关键", x: 0, y: 0 },
      { name: "未来", meaning: "照现在走下去的趋势", x: 1, y: 0 }] },
  { id: "love-cross", name: "爱情十字", desc: "你、TA、关系、阻碍、走向", count: 5, deck: "full", tier: "paid", model: "fast", followups: 3,
    positions: [
      { name: "你的状态", meaning: "你在这段关系里的心态", x: -1, y: 0 },
      { name: "TA 的状态", meaning: "对方的心态", x: 1, y: 0 },
      { name: "关系现状", meaning: "两人之间现在的样子", x: 0, y: 0 },
      { name: "阻碍", meaning: "卡住你们的东西", x: 0, y: 1 },
      { name: "走向", meaning: "接下来的发展趋势", x: 0, y: -1 }] },
  { id: "choice", name: "二选一", desc: "两个选项各自会走向哪里", count: 5, deck: "full", tier: "paid", model: "fast", followups: 3,
    positions: [
      { name: "现状", meaning: "你现在面对选择的状态", x: 0, y: 1 },
      { name: "选项 A 的过程", meaning: "选 A 之后会经历什么", x: -1, y: 0 },
      { name: "选项 A 的结果", meaning: "选 A 最后的样子", x: -1, y: -1 },
      { name: "选项 B 的过程", meaning: "选 B 之后会经历什么", x: 1, y: 0 },
      { name: "选项 B 的结果", meaning: "选 B 最后的样子", x: 1, y: -1 }] },
  { id: "celtic", name: "凯尔特十字", desc: "最完整的十张牌阵，适合重要的事", count: 10, deck: "full", tier: "paid", model: "pro", followups: 3,
    positions: [
      { name: "现状", meaning: "问题的核心", x: -1, y: 0 },
      { name: "阻碍", meaning: "横在面前的挑战", x: -1, y: 0, rotate: 90 },
      { name: "根基", meaning: "潜意识里的原因", x: -1, y: 1 },
      { name: "过去", meaning: "刚刚过去的影响", x: -2, y: 0 },
      { name: "目标", meaning: "你意识里想要的", x: -1, y: -1 },
      { name: "近未来", meaning: "接下来一段时间", x: 0, y: 0 },
      { name: "自我", meaning: "你如何看待自己", x: 1.4, y: 1.5 },
      { name: "环境", meaning: "身边的人和外部因素", x: 1.4, y: 0.5 },
      { name: "希望与恐惧", meaning: "你期待又害怕的东西", x: 1.4, y: -0.5 },
      { name: "结果", meaning: "照现在走下去的结果", x: 1.4, y: -1.5 }] },
  { id: "soulmate", name: "正缘画像", desc: "你的样子、TA 的样子、你们怎么相遇", count: 10, deck: "full", tier: "paid", model: "pro", followups: 3,
    positions: [
      { name: "你的外在", meaning: "别人眼中的你", x: -2, y: -0.5 },
      { name: "你的内心", meaning: "真实的你，和外在对比", x: -2, y: 0.5 },
      { name: "你的生活与金钱观", meaning: "你怎么过日子", x: -1, y: -0.5 },
      { name: "你的感情模式", meaning: "你怎么爱人", x: -1, y: 0.5 },
      { name: "TA 的性格", meaning: "TA 是什么样的人", x: 1, y: -0.5 },
      { name: "TA 的事业与金钱", meaning: "TA 做什么、怎么赚钱", x: 1, y: 0.5 },
      { name: "TA 的感情观", meaning: "TA 怎么爱人", x: 2, y: -0.5 },
      { name: "你们的相处", meaning: "合不合，哪里要磨合", x: 2, y: 0.5 },
      { name: "相遇场景", meaning: "在哪里、怎么遇见", x: 0, y: -0.5 },
      { name: "走向", meaning: "倾向和一条建议", x: 0, y: 0.5 }] },
];
export function getSpread(id: string): Spread { const s = SPREADS.find((x) => x.id === id); if (!s) throw new Error(`unknown spread ${id}`); return s; }

export interface DeckSlot { id: string; reversed: boolean; }

/** 洗牌：服务端生成整副牌的顺序和正逆位，用户之后只是在扇形里选位置 */
export function shuffleDeck(deck: "major" | "full", reversedRate = 0.3): DeckSlot[] {
  const ids = TAROT.filter((c) => deck === "full" || c.arcana === "major").map((c) => c.id);
  return secureShuffle(ids).map((id) => ({ id, reversed: secureChance(reversedRate) }));
}

export interface DrawnCard { position: SpreadPosition; card: TarotCard; reversed: boolean; }

export function pickCards(deck: DeckSlot[], picks: number[], spread: Spread): DrawnCard[] {
  if (picks.length !== spread.count) throw new Error(`需要选 ${spread.count} 张牌`);
  if (new Set(picks).size !== picks.length) throw new Error("不能重复选同一张");
  return picks.map((p, i) => {
    const slot = deck[p];
    if (!slot) throw new Error("位置超出范围");
    return { position: spread.positions[i], card: getCard(slot.id), reversed: slot.reversed };
  });
}

/** 是否牌阵的倾向 */
export function yesNoLean(c: DrawnCard): "倾向是" | "倾向否" | "看你怎么做" {
  const t = c.reversed ? c.card.tone.rev : c.card.tone.up;
  return t > 0 ? "倾向是" : t < 0 ? "倾向否" : "看你怎么做";
}

const SUIT_CAREER: Record<Suit, string> = {
  wands: "创业、销售、运动、市场推广这类需要冲劲的工作",
  cups: "艺术、心理、教育、医护、服务这类和人情感打交道的工作",
  swords: "技术、研究、法律、写作、咨询这类靠脑力的工作",
  pentacles: "金融、实业、工程、财会、手艺这类务实的工作",
};
const COURT_TRAIT: Record<number, string> = { 11: "年轻、好奇、还在成长", 12: "行动派、有冲劲、可能比较忙碌", 13: "成熟、细腻、会照顾人", 14: "成熟稳重、有主见、有一定地位" };

/** 正缘画像的“线索”，全部由牌面推出，并标注来源 */
export function soulmateClues(cards: DrawnCard[]): { label: string; value: string; source: string }[] {
  const out: { label: string; value: string; source: string }[] = [];
  const ta = cards.slice(4, 7);
  const signs = ta.map((c) => c.card.astro).filter((a) => /座|·/.test(a)).flatMap((a) => a.split(" · ")).filter((a) => /座|^(白羊|狮子|射手|巨蟹|天蝎|双鱼|双子|天秤|水瓶|金牛|处女|摩羯)$/.test(a));
  if (signs.length) out.push({ label: "星座倾向", value: Array.from(new Set(signs.map((s) => s.replace(/座$/, "") + "座"))).slice(0, 2).join("或"), source: ta.filter((c) => /座|·/.test(c.card.astro)).map((c) => c.card.zh).join("、") });
  const work = cards[5];
  if (work.card.suit) out.push({ label: "职业线索", value: "更可能从事" + SUIT_CAREER[work.card.suit], source: work.card.zh });
  else out.push({ label: "职业线索", value: `和「${work.card.keywords.up.split("、")[0]}」有关的方向`, source: work.card.zh });
  const court = ta.find((c) => c.card.rank && c.card.rank >= 11);
  if (court) out.push({ label: "TA 的状态", value: COURT_TRAIT[court.card.rank!], source: court.card.zh });
  const scene = cards[8];
  out.push({ label: "相遇场景", value: scene.card.image, source: scene.card.zh });
  return out;
}
