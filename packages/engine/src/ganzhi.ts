// 干支、五行与常用关系表。所有命理模块共用。

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Stem = (typeof STEMS)[number];
export type Branch = (typeof BRANCHES)[number];

export const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
export type Element = (typeof ELEMENTS)[number];

export const STEM_ELEMENT: Record<Stem, Element> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
export const BRANCH_ELEMENT: Record<Branch, Element> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};
export const STEM_YANG: Record<Stem, boolean> = {
  甲: true, 乙: false, 丙: true, 丁: false, 戊: true, 己: false, 庚: true, 辛: false, 壬: true, 癸: false,
};
export const BRANCH_YANG: Record<Branch, boolean> = {
  子: true, 丑: false, 寅: true, 卯: false, 辰: true, 巳: false, 午: true, 未: false, 申: true, 酉: false, 戌: true, 亥: false,
};

/** 地支藏干，第一个为本气 */
export const HIDDEN_STEMS: Record<Branch, Stem[]> = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"], 辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"],
  午: ["丁", "己"], 未: ["己", "丁", "乙"], 申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"],
};

export function generates(e: Element): Element { return ELEMENTS[(ELEMENTS.indexOf(e) + 1) % 5]; }
export function controls(e: Element): Element { return ELEMENTS[(ELEMENTS.indexOf(e) + 2) % 5]; }
export function generatedBy(e: Element): Element { return ELEMENTS[(ELEMENTS.indexOf(e) + 4) % 5]; }
export function controlledBy(e: Element): Element { return ELEMENTS[(ELEMENTS.indexOf(e) + 3) % 5]; }

export type TenGod = "比肩" | "劫财" | "食神" | "伤官" | "偏财" | "正财" | "七杀" | "正官" | "偏印" | "正印";

/** 以日干 dm 看另一天干 g 的十神 */
export function tenGod(dm: Stem, g: Stem): TenGod {
  const a = STEM_ELEMENT[dm], b = STEM_ELEMENT[g], same = STEM_YANG[dm] === STEM_YANG[g];
  if (a === b) return same ? "比肩" : "劫财";
  if (generates(a) === b) return same ? "食神" : "伤官";
  if (controls(a) === b) return same ? "偏财" : "正财";
  if (controls(b) === a) return same ? "七杀" : "正官";
  return same ? "偏印" : "正印";
}

/** 十神对应的五行关系分组 */
export const TEN_GOD_GROUP: Record<TenGod, "比劫" | "食伤" | "财星" | "官杀" | "印星"> = {
  比肩: "比劫", 劫财: "比劫", 食神: "食伤", 伤官: "食伤", 偏财: "财星", 正财: "财星", 七杀: "官杀", 正官: "官杀", 偏印: "印星", 正印: "印星",
};

export const SIX_COMBINE: [Branch, Branch, Element][] = [
  ["子", "丑", "土"], ["寅", "亥", "木"], ["卯", "戌", "火"], ["辰", "酉", "金"], ["巳", "申", "水"], ["午", "未", "土"],
];
export const SIX_CLASH: [Branch, Branch][] = [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]];
export const SIX_HARM: [Branch, Branch][] = [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]];
export const THREE_COMBINE: [Branch, Branch, Branch, Element][] = [
  ["申", "子", "辰", "水"], ["亥", "卯", "未", "木"], ["寅", "午", "戌", "火"], ["巳", "酉", "丑", "金"],
];
export const STEM_COMBINE: [Stem, Stem, Element][] = [
  ["甲", "己", "土"], ["乙", "庚", "金"], ["丙", "辛", "水"], ["丁", "壬", "木"], ["戊", "癸", "火"],
];

function pairIn(list: [string, string, ...unknown[]][], a: string, b: string) {
  return list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
}
export function isClash(a: Branch, b: Branch) { return pairIn(SIX_CLASH, a, b); }
export function isCombine(a: Branch, b: Branch) { return pairIn(SIX_COMBINE, a, b); }
export function isHarm(a: Branch, b: Branch) { return pairIn(SIX_HARM, a, b); }

/** 六十甲子序号 0–59 */
export function ganzhiIndex(gz: string): number {
  const s = STEMS.indexOf(gz[0] as Stem), b = BRANCHES.indexOf(gz[1] as Branch);
  for (let i = 0; i < 60; i++) if (i % 10 === s && i % 12 === b) return i;
  return -1;
}

/** 旬空：日柱所在旬缺的两个地支 */
export function xunKong(gz: string): [Branch, Branch] {
  const i = ganzhiIndex(gz), head = i - (i % 10); // 旬首序号
  const b = head % 12; // 旬首地支
  return [BRANCHES[(b + 10) % 12], BRANCHES[(b + 11) % 12]];
}

/** 五行对应的颜色、方位，用于运势里的幸运色与方位 */
export const ELEMENT_INFO: Record<Element, { colors: string[]; direction: string; season: string; organ: string }> = {
  木: { colors: ["青绿", "墨绿"], direction: "东方", season: "春", organ: "肝胆" },
  火: { colors: ["朱红", "橘色"], direction: "南方", season: "夏", organ: "心与小肠" },
  土: { colors: ["米黄", "咖啡"], direction: "中央与本地", season: "四季末", organ: "脾胃" },
  金: { colors: ["白色", "银灰"], direction: "西方", season: "秋", organ: "肺与大肠" },
  水: { colors: ["黑色", "深蓝"], direction: "北方", season: "冬", organ: "肾与膀胱" },
};
