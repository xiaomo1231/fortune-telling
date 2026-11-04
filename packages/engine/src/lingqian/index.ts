import data from "./data.json";
import { secureInt } from "../random";

export interface LingQian {
  no: number; title: string; level: string;
  poem: string[]; gloss: string; xiang: string;
  items: Record<string, string>;
}

export const LINGQIAN: LingQian[] = data as LingQian[];

export type QianTopic = "love" | "career" | "money" | "health" | "family" | "travel" | "lost" | "lawsuit" | "birth" | "other";

/** 问题类别对应签文里的分项断语 */
export const QIAN_ITEMS: Record<QianTopic, string[]> = {
  love: ["婚姻"], career: ["自身", "交易"], money: ["求财", "交易"], health: ["疾病", "自身"],
  family: ["家宅", "六畜"], travel: ["行人", "移徙"], lost: ["失物", "寻人"], lawsuit: ["讼词"], birth: ["六甲"], other: ["自身"],
};

/** 求签：等概率抽一支，再用掷筊确认（圣筊才算数，最多三次） */
export function drawQian(): { qian: LingQian; tosses: ("圣筊" | "笑筊" | "阴筊")[] } {
  const qian = LINGQIAN[secureInt(LINGQIAN.length)];
  const tosses: ("圣筊" | "笑筊" | "阴筊")[] = [];
  for (let i = 0; i < 3; i++) {
    const a = secureInt(2), b = secureInt(2);
    const t = a !== b ? "圣筊" : a ? "笑筊" : "阴筊";
    tosses.push(t);
    if (t === "圣筊") break;
  }
  // 三次都不是圣筊时，按习俗视为“此签暂不宜解”，仍然返回签文，由界面提示可以重新静心再求
  return { qian, tosses };
}

export function qianItems(q: LingQian, topic: QianTopic): { key: string; value: string }[] {
  return QIAN_ITEMS[topic].filter((k) => q.items[k]).map((k) => ({ key: k, value: q.items[k] }));
}

export function getQian(no: number): LingQian { const q = LINGQIAN.find((x) => x.no === no); if (!q) throw new Error("no such qian"); return q; }
