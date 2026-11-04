/// <reference path="./lunar.d.ts" />
// 每日运势：用户日主 × 当日干支（不是按星座的大众运势）
import { Solar } from "lunar-javascript";
import {
  Branch, BRANCH_ELEMENT, ELEMENT_INFO, Element, HIDDEN_STEMS, isClash, isCombine, isHarm, Stem, STEM_ELEMENT, TEN_GOD_GROUP, tenGod, TenGod,
} from "./ganzhi";

export interface DailyInput {
  dayMaster: Stem;
  dayBranch: Branch;
  yearBranch: Branch;
  favorable: Element[];
  unfavorable: Element[];
  date: { year: number; month: number; day: number };
}

export interface DailyFortune {
  date: string; lunar: string; dayGanzhi: string; jieqi: string;
  stemGod: TenGod; branchGod: TenGod;
  score: number; // 0–100
  level: "大吉" | "吉" | "平" | "小心";
  aspects: { love: number; work: number; money: number; health: number };
  theme: string;
  notes: string[];
  luckyColors: string[]; luckyDirection: string; luckyNumber: number;
  yi: string[]; ji: string[];
}

const THEME: Record<TenGod, string> = {
  比肩: "适合和同伴并肩做事，也容易遇到意见不合的人",
  劫财: "人情往来多，花钱和借钱都要多留一个心眼",
  食神: "心情松弛，适合吃好、玩好、做点有创造力的事",
  伤官: "表达欲强，灵感多，说话注意分寸",
  偏财: "有意外的机会和小财，适合社交和尝试",
  正财: "踏实做事有回报，适合理财、算账、处理家务",
  七杀: "压力和挑战来得快，迎难而上反而能出成绩",
  正官: "规矩和责任感强，适合办正事、见领导、谈合作",
  偏印: "想法偏门，适合独处、学习冷门知识",
  正印: "容易得到照顾和支持，适合学习、休息、向长辈请教",
};

const ASPECT_BIAS: Record<string, { love: number; work: number; money: number; health: number }> = {
  比劫: { love: -4, work: 4, money: -8, health: 4 },
  食伤: { love: 6, work: 2, money: 2, health: 4 },
  财星: { love: 4, work: 2, money: 10, health: -2 },
  官杀: { love: 2, work: 8, money: 0, health: -6 },
  印星: { love: 0, work: 4, money: -2, health: 8 },
};

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export function dailyFortune(i: DailyInput): DailyFortune {
  const solar = Solar.fromYmd(i.date.year, i.date.month, i.date.day);
  const lunar = solar.getLunar();
  const gz = lunar.getDayInGanZhi();
  const ds = gz[0] as Stem, db = gz[1] as Branch;
  const stemGod = tenGod(i.dayMaster, ds), branchGod = tenGod(i.dayMaster, HIDDEN_STEMS[db][0]);
  const e1 = STEM_ELEMENT[ds], e2 = BRANCH_ELEMENT[db];
  let score = 60;
  score += i.favorable.includes(e1) ? 10 : i.unfavorable.includes(e1) ? -8 : 0;
  score += i.favorable.includes(e2) ? 12 : i.unfavorable.includes(e2) ? -10 : 0;
  const notes: string[] = [];
  if (isClash(db, i.dayBranch)) { score -= 10; notes.push("今天的日支冲你的日支，情绪和计划容易被打乱"); }
  if (isCombine(db, i.dayBranch)) { score += 8; notes.push("今天的日支与你的日支相合，人际顺、好说话"); }
  if (isHarm(db, i.dayBranch)) { score -= 5; notes.push("今天与你的日支相害，小摩擦多，别较真"); }
  if (isClash(db, i.yearBranch)) { score -= 4; notes.push("今天冲你的生肖，出门办事多预留时间"); }
  // 同一个人同一天固定，不同日子有小幅波动
  const jitter = (hash(gz + i.dayMaster + i.date.year + i.date.month + i.date.day) % 9) - 4;
  score = Math.max(28, Math.min(96, score + jitter));
  const bias = ASPECT_BIAS[TEN_GOD_GROUP[stemGod]];
  const clamp = (n: number) => Math.max(20, Math.min(98, Math.round(n)));
  const aspects = { love: clamp(score + bias.love), work: clamp(score + bias.work), money: clamp(score + bias.money), health: clamp(score + bias.health) };
  const fav = i.favorable[0];
  const info = ELEMENT_INFO[fav];
  const luckyNumber = ({ 水: [1, 6], 火: [2, 7], 木: [3, 8], 金: [4, 9], 土: [5, 0] } as Record<Element, number[]>)[fav][hash(gz) % 2];
  const level = score >= 82 ? "大吉" : score >= 66 ? "吉" : score >= 50 ? "平" : "小心";
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${i.date.year}-${pad(i.date.month)}-${pad(i.date.day)}`,
    lunar: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    dayGanzhi: gz, jieqi: lunar.getJieQi() || lunar.getPrevJieQi(true).getName(),
    stemGod, branchGod, score, level, aspects, theme: THEME[stemGod], notes,
    luckyColors: info.colors, luckyDirection: info.direction, luckyNumber,
    yi: lunar.getDayYi().slice(0, 6), ji: lunar.getDayJi().slice(0, 6),
  };
}
