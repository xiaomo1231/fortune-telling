/// <reference path="../lunar.d.ts" />
// 六爻纳甲装卦：京房八宫、世应、纳甲、六亲、六神、旬空、伏神、月建日辰旺衰
import { Solar } from "lunar-javascript";
import {
  Branch, BRANCH_ELEMENT, controls, Element, generates, isClash, isCombine, Stem, xunKong,
} from "../ganzhi";
import { secureInt } from "../random";

export type Trigram = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
export const TRIGRAMS: Trigram[] = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
/** 自下而上三爻，1 阳 0 阴 */
const TRI_LINES: Record<Trigram, [number, number, number]> = {
  乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0], 巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};
const TRI_ELEMENT: Record<Trigram, Element> = { 乾: "金", 兑: "金", 离: "火", 震: "木", 巽: "木", 坎: "水", 艮: "土", 坤: "土" };
const TRI_IMAGE: Record<Trigram, string> = { 乾: "天", 兑: "泽", 离: "火", 震: "雷", 巽: "风", 坎: "水", 艮: "山", 坤: "地" };
const NAJIA_STEM: Record<Trigram, [Stem, Stem]> = {
  乾: ["甲", "壬"], 坤: ["乙", "癸"], 震: ["庚", "庚"], 巽: ["辛", "辛"], 坎: ["戊", "戊"], 离: ["己", "己"], 艮: ["丙", "丙"], 兑: ["丁", "丁"],
};
const NAJIA_BRANCH: Record<Trigram, [Branch[], Branch[]]> = {
  乾: [["子", "寅", "辰"], ["午", "申", "戌"]], 坎: [["寅", "辰", "午"], ["申", "戌", "子"]],
  艮: [["辰", "午", "申"], ["戌", "子", "寅"]], 震: [["子", "寅", "辰"], ["午", "申", "戌"]],
  巽: [["丑", "亥", "酉"], ["未", "巳", "卯"]], 离: [["卯", "丑", "亥"], ["酉", "未", "巳"]],
  坤: [["未", "巳", "卯"], ["丑", "亥", "酉"]], 兑: [["巳", "卯", "丑"], ["亥", "酉", "未"]],
};

const NAMES: Record<Trigram, string[]> = {
  乾: ["乾为天", "天泽履", "天火同人", "天雷无妄", "天风姤", "天水讼", "天山遁", "天地否"],
  兑: ["泽天夬", "兑为泽", "泽火革", "泽雷随", "泽风大过", "泽水困", "泽山咸", "泽地萃"],
  离: ["火天大有", "火泽睽", "离为火", "火雷噬嗑", "火风鼎", "火水未济", "火山旅", "火地晋"],
  震: ["雷天大壮", "雷泽归妹", "雷火丰", "震为雷", "雷风恒", "雷水解", "雷山小过", "雷地豫"],
  巽: ["风天小畜", "风泽中孚", "风火家人", "风雷益", "巽为风", "风水涣", "风山渐", "风地观"],
  坎: ["水天需", "水泽节", "水火既济", "水雷屯", "水风井", "坎为水", "水山蹇", "水地比"],
  艮: ["山天大畜", "山泽损", "山火贲", "山雷颐", "山风蛊", "山水蒙", "艮为山", "山地剥"],
  坤: ["地天泰", "地泽临", "地火明夷", "地雷复", "地风升", "地水师", "地山谦", "坤为地"],
};

/** 卦义白话（取《周易》卦辞大意） */
export const GIST: Record<string, string> = {
  乾为天: "刚健向上，自强不息，时机在握但忌过满", 坤为地: "柔顺承载，厚积薄发，跟随比领头更有利",
  水雷屯: "万事起头难，先稳住根基再求发展", 山水蒙: "迷茫待启，虚心求教就能开窍",
  水天需: "时机未到，耐心等待并做好准备", 天水讼: "有争执口舌，宜和解不宜硬争",
  地水师: "需要组织与纪律，众人合力方能成事", 水地比: "亲近结盟，找到对的人互相扶持",
  风天小畜: "小有积累，力量还不够，先蓄势", 天泽履: "如履虎尾，谨慎守礼可保无虞",
  地天泰: "上下通泰，诸事顺遂的好时候", 天地否: "上下不通，闭塞不顺，宜守不宜进",
  天火同人: "志同道合，与人合作有利", 火天大有: "收获丰盛，但要守住谦和",
  地山谦: "谦虚退让反而得益", 雷地豫: "心情愉悦，顺势而动，但别懈怠",
  泽雷随: "顺应形势、随机应变", 山风蛊: "积弊已久，需要整顿革新",
  地泽临: "好运临近，主动接近目标", 风地观: "先观察再行动，看清局势",
  火雷噬嗑: "有阻碍需要咬断，果断处理纠纷", 山火贲: "注重修饰与形象，实质更重要",
  山地剥: "根基被侵蚀，宜守住不宜冒进", 地雷复: "一阳来复，否极泰来，重新开始",
  天雷无妄: "顺其自然，不妄求就无灾", 山天大畜: "大有积蓄，厚积之后可以大展",
  山雷颐: "颐养自身，注意言语和饮食", 泽风大过: "负担过重，需要非常手段化解",
  坎为水: "重重险阻，守住诚信方能脱困", 离为火: "光明依附，借助外力与贵人",
  泽山咸: "两情相感，感情与沟通顺畅", 雷风恒: "持之以恒，守住长久之道",
  天山遁: "宜退避保全，不与小人争", 雷天大壮: "声势正盛，但要防止冲过头",
  火地晋: "日出地上，步步晋升", 地火明夷: "光明受损，韬光养晦等待时机",
  风火家人: "家庭与内部关系是重点", 火泽睽: "意见相左，求同存异",
  水山蹇: "前路艰难，回头找帮手", 雷水解: "困难解除，宜趁势放下包袱",
  山泽损: "有所舍才有所得", 风雷益: "受益增长，宜积极进取",
  泽天夬: "果断决裂，清除障碍", 天风姤: "不期而遇，留意突然出现的人与事",
  泽地萃: "人事汇聚，适合聚会与集资", 地风升: "稳步上升，循序渐进",
  泽水困: "处境受困，言多无用，宜坚守", 水风井: "守住本源，修身养德",
  泽火革: "变革时机已到，旧的该换了", 火风鼎: "推陈出新，稳定中求新局",
  震为雷: "突发惊动，镇定应对可转危为安", 艮为山: "适可而止，安守本分",
  风山渐: "循序渐进，感情与事业慢慢成", 雷泽归妹: "名分不正，感情宜慎重",
  雷火丰: "盛极之时，要防盛极而衰", 火山旅: "漂泊在外，凡事谨慎低调",
  巽为风: "顺势而入，柔和渗透", 兑为泽: "喜悦和乐，口才与人缘佳",
  风水涣: "人心涣散，需要凝聚", 水泽节: "有所节制，量力而行",
  风泽中孚: "诚信感人，以诚待人能成事", 雷山小过: "小事可成大事不宜，行事宜低调",
  水火既济: "事已成，但要防后续生变", 火水未济: "事尚未成，仍需努力，前景可期",
};

export type Relative = "父母" | "兄弟" | "子孙" | "妻财" | "官鬼";
export type Spirit = "青龙" | "朱雀" | "勾陈" | "螣蛇" | "白虎" | "玄武";
const SPIRITS: Spirit[] = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"];
const SPIRIT_START: Record<Stem, number> = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };

function relativeOf(palace: Element, e: Element): Relative {
  if (e === palace) return "兄弟";
  if (generates(palace) === e) return "子孙";
  if (controls(palace) === e) return "妻财";
  if (controls(e) === palace) return "官鬼";
  return "父母";
}

function triOf(lines: number[]): Trigram { return TRIGRAMS.find((t) => TRI_LINES[t].every((v, i) => v === lines[i]))!; }

interface PalaceInfo { palace: Trigram; shi: number; generation: string; }
const PALACE_MAP = new Map<string, PalaceInfo>();
(function buildPalaces() {
  const gens = ["本宫", "一世", "二世", "三世", "四世", "五世", "游魂", "归魂"];
  const shis = [6, 1, 2, 3, 4, 5, 4, 3];
  for (const t of TRIGRAMS) {
    const base = [...TRI_LINES[t], ...TRI_LINES[t]];
    const seq: number[][] = [base.slice()];
    let cur = base.slice();
    for (let k = 0; k < 5; k++) { cur = cur.slice(); cur[k] ^= 1; seq.push(cur); }
    const you = cur.slice(); you[3] ^= 1; seq.push(you);
    const gui = you.slice(); gui[0] = base[0]; gui[1] = base[1]; gui[2] = base[2]; seq.push(gui);
    seq.forEach((l, i) => PALACE_MAP.set(l.join(""), { palace: t, shi: shis[i], generation: gens[i] }));
  }
})();

export interface Line {
  position: number; // 1–6 自下而上
  yang: boolean; moving: boolean; value: 6 | 7 | 8 | 9;
  stem: Stem; branch: Branch; element: Element; relative: Relative; spirit: Spirit;
  isShi: boolean; isYing: boolean; empty: boolean;
  monthState: "旺" | "相" | "休" | "囚" | "死"; monthBreak: boolean; dayClash: boolean; dayCombine: boolean;
  hidden?: { relative: Relative; stem: Stem; branch: Branch; element: Element };
  changed?: { yang: boolean; stem: Stem; branch: Branch; element: Element; relative: Relative };
}

export interface Hexagram { name: string; upper: Trigram; lower: Trigram; palace: Trigram; palaceElement: Element; generation: string; gist: string; }

export type LiuyaoTopic = "money" | "career" | "exam" | "love" | "health" | "travel" | "lost" | "other";

export interface LiuyaoResult {
  method: "coins" | "time";
  date: string; monthBranch: Branch; dayGanzhi: string; emptyBranches: [Branch, Branch];
  main: Hexagram; changed: Hexagram | null;
  lines: Line[];
  useGod: { relative: Relative; reason: string; lines: number[]; state: string; summary: string };
  verdict: "吉" | "小吉" | "平" | "小凶";
}

function hexOf(lines: number[]): Hexagram {
  const lower = triOf(lines.slice(0, 3)), upper = triOf(lines.slice(3));
  const name = NAMES[upper][TRIGRAMS.indexOf(lower)];
  const p = PALACE_MAP.get(lines.join(""))!;
  return { name, upper, lower, palace: p.palace, palaceElement: TRI_ELEMENT[p.palace], generation: p.generation, gist: GIST[name] };
}

function najia(lines: number[]): { stem: Stem; branch: Branch }[] {
  const lower = triOf(lines.slice(0, 3)), upper = triOf(lines.slice(3));
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const t = i < 3 ? lower : upper, outer = i < 3 ? 0 : 1;
    return { stem: NAJIA_STEM[t][outer], branch: NAJIA_BRANCH[t][outer][i % 3] };
  });
}

function monthState(month: Element, e: Element): Line["monthState"] {
  if (e === month) return "旺";
  if (generates(month) === e) return "相";
  if (generates(e) === month) return "休";
  if (controls(e) === month) return "囚";
  return "死";
}

/** 摇一次三枚铜钱：背 3、字 2 */
export function tossCoins(): { coins: [number, number, number]; value: 6 | 7 | 8 | 9 } {
  const coins = [secureInt(2), secureInt(2), secureInt(2)].map((x) => (x ? 3 : 2)) as [number, number, number];
  return { coins, value: (coins[0] + coins[1] + coins[2]) as 6 | 7 | 8 | 9 };
}

/** 时间起卦（梅花易数法）：年支数 + 农历月 + 农历日 定上卦，再加时支数定下卦，总数除 6 取动爻 */
export function timeValues(d: Date): (6 | 7 | 8 | 9)[] {
  const s = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0);
  const l = s.getLunar();
  const BR = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const yn = BR.indexOf(l.getYearInGanZhi()[1]) + 1, hn = BR.indexOf(l.getTimeZhi()) + 1;
  const sum = yn + Math.abs(l.getMonth()) + l.getDay();
  const XT: Trigram[] = ["坤", "乾", "兑", "离", "震", "巽", "坎", "艮"]; // 余数 0 为 8（坤）
  const up = XT[sum % 8], low = XT[(sum + hn) % 8];
  const mv = ((sum + hn) % 6) || 6;
  const lines = [...TRI_LINES[low], ...TRI_LINES[up]];
  return lines.map((v, i) => (i + 1 === mv ? (v ? 9 : 6) : v ? 7 : 8)) as (6 | 7 | 8 | 9)[];
}

const USE_GOD: Record<LiuyaoTopic, (g: "male" | "female" | null) => [Relative, string]> = {
  money: () => ["妻财", "问财以妻财为用神"],
  career: () => ["官鬼", "问工作、职位以官鬼为用神"],
  exam: () => ["父母", "问考试、文书以父母为用神"],
  love: (g) => (g === "female" ? ["官鬼", "女问感情以官鬼为用神"] : ["妻财", "男问感情以妻财为用神"]),
  health: () => ["子孙", "问健康以子孙为福神，官鬼为病"],
  travel: () => ["子孙", "问出行平安以子孙为用神"],
  lost: () => ["妻财", "寻物以妻财为用神"],
  other: () => ["兄弟", "未分类问题以世爻为主、兄弟为参"],
};

export function castLiuyao(values: (6 | 7 | 8 | 9)[], opts: { date: Date; topic: LiuyaoTopic; gender?: "male" | "female" | null; method?: "coins" | "time" }): LiuyaoResult {
  if (values.length !== 6) throw new Error("需要六个爻值");
  const d = opts.date;
  const lunar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0).getLunar();
  const monthBranch = lunar.getMonthInGanZhiExact()[1] as Branch;
  const dayGz = lunar.getDayInGanZhiExact();
  const dayStem = dayGz[0] as Stem, dayBranch = dayGz[1] as Branch;
  const empty = xunKong(dayGz);
  const yy = values.map((v) => (v === 7 || v === 9 ? 1 : 0));
  const main = hexOf(yy);
  const hasMove = values.some((v) => v === 6 || v === 9);
  const cy = values.map((v, i) => (v === 6 ? 1 : v === 9 ? 0 : yy[i]));
  const changed = hasMove ? hexOf(cy) : null;
  const nj = najia(yy), cnj = najia(cy);
  const pInfo = PALACE_MAP.get(yy.join(""))!;
  const ying = pInfo.shi > 3 ? pInfo.shi - 3 : pInfo.shi + 3;
  const mEl = BRANCH_ELEMENT[monthBranch];
  const start = SPIRIT_START[dayStem];
  const lines: Line[] = values.map((v, i) => {
    const el = BRANCH_ELEMENT[nj[i].branch];
    const l: Line = {
      position: i + 1, yang: !!yy[i], moving: v === 6 || v === 9, value: v,
      stem: nj[i].stem, branch: nj[i].branch, element: el, relative: relativeOf(main.palaceElement, el),
      spirit: SPIRITS[(start + i) % 6], isShi: pInfo.shi === i + 1, isYing: ying === i + 1,
      empty: empty.includes(nj[i].branch), monthState: monthState(mEl, el),
      monthBreak: isClash(monthBranch, nj[i].branch), dayClash: isClash(dayBranch, nj[i].branch), dayCombine: isCombine(dayBranch, nj[i].branch),
    };
    if (l.moving) { const ce = BRANCH_ELEMENT[cnj[i].branch]; l.changed = { yang: !!cy[i], stem: cnj[i].stem, branch: cnj[i].branch, element: ce, relative: relativeOf(main.palaceElement, ce) }; }
    return l;
  });
  // 伏神：本卦缺的六亲，从本宫纯卦同位取出
  const present = new Set(lines.map((l) => l.relative));
  const pureLines = [...TRI_LINES[main.palace], ...TRI_LINES[main.palace]];
  const pnj = najia(pureLines);
  (["父母", "兄弟", "子孙", "妻财", "官鬼"] as Relative[]).filter((r) => !present.has(r)).forEach((r) => {
    pnj.forEach((x, i) => {
      const e = BRANCH_ELEMENT[x.branch];
      if (relativeOf(main.palaceElement, e) === r && !lines[i].hidden) lines[i].hidden = { relative: r, stem: x.stem, branch: x.branch, element: e };
    });
  });

  // 用神分析
  const [rel, reason] = USE_GOD[opts.topic](opts.gender ?? null);
  let cands = lines.filter((l) => l.relative === rel);
  let state: string;
  let score = 0;
  if (!cands.length) {
    const h = lines.filter((l) => l.hidden?.relative === rel);
    state = h.length ? `用神${rel}不上卦，伏于第${h.map((x) => x.position).join("、")}爻之下` : `用神${rel}不现`;
    score -= 1;
  } else {
    // 多个用神时，优先取动爻、持世、旺相者
    cands = cands.sort((a, b) => (Number(b.moving) - Number(a.moving)) || (Number(b.isShi) - Number(a.isShi)) || (["旺", "相", "休", "囚", "死"].indexOf(a.monthState) - ["旺", "相", "休", "囚", "死"].indexOf(b.monthState)));
    const u = cands[0];
    const parts: string[] = [`用神${rel}${u.branch}${u.element}在第${u.position}爻`, `月令${u.monthState}`];
    score += u.monthState === "旺" || u.monthState === "相" ? 1 : u.monthState === "死" || u.monthState === "囚" ? -1 : 0;
    if (u.monthBreak) { parts.push("逢月破"); score -= 1.5; }
    if (u.empty) { parts.push("旬空"); score -= 0.8; }
    if (u.dayClash) { parts.push(u.moving ? "日冲" : "日冲暗动"); score += u.moving ? -0.5 : 0.3; }
    if (u.dayCombine) { parts.push("日合"); score += 0.5; }
    if (BRANCH_ELEMENT[dayBranch] === u.element || generates(BRANCH_ELEMENT[dayBranch]) === u.element) { parts.push("得日辰生扶"); score += 0.8; }
    if (u.moving && u.changed) {
      const ce = u.changed.element;
      if (generates(ce) === u.element) { parts.push("动而化回头生"); score += 1; }
      else if (controls(ce) === u.element) { parts.push("动而化回头克"); score -= 1.2; }
      else parts.push(`动化${u.changed.relative}`);
    }
    if (u.isShi) { parts.push("持世"); score += 0.5; }
    // 原神（生用神者）发动为助，忌神（克用神者）发动为害
    lines.filter((l) => l.moving && l !== u).forEach((l) => {
      if (generates(l.element) === u.element) { parts.push(`${l.relative}发动生用神`); score += 0.8; }
      if (controls(l.element) === u.element) { parts.push(`${l.relative}发动克用神`); score -= 0.8; }
    });
    state = parts.join("，");
  }
  const verdict: LiuyaoResult["verdict"] = score >= 1.5 ? "吉" : score >= 0.3 ? "小吉" : score > -1 ? "平" : "小凶";
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    method: opts.method ?? "coins",
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    monthBranch, dayGanzhi: dayGz, emptyBranches: empty, main, changed, lines,
    useGod: { relative: rel, reason, lines: cands.map((c) => c.position), state, summary: `${main.name}${changed ? `之${changed.name}` : "（静卦）"}，${state}` },
    verdict,
  };
}

export const TRIGRAM_IMAGE = TRI_IMAGE;
