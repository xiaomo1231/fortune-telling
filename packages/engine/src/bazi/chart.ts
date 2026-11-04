/// <reference path="../lunar.d.ts" />
import { Lunar, Solar } from "lunar-javascript";
import {
  BRANCH_ELEMENT, Branch, controls, controlledBy, Element, ELEMENTS, generatedBy, generates, HIDDEN_STEMS,
  isClash, isCombine, isHarm, Stem, STEM_COMBINE, STEM_ELEMENT, STEM_YANG, TEN_GOD_GROUP, tenGod, TenGod, THREE_COMBINE,
} from "../ganzhi";
import { correctBirthTime, TimeCorrection, WallTime } from "./time";

export type Gender = "male" | "female";

export interface BaziInput {
  calendar: "solar" | "lunar";
  year: number; month: number; day: number;
  /** 农历闰月 */
  leapMonth?: boolean;
  /** 不知道时辰时为 null，只排三柱 */
  hour: number | null; minute: number | null;
  gender: Gender;
  /** 出生地经度，null 表示不做经度校正 */
  longitude: number | null;
  placeName?: string;
  useTrueSolar?: boolean;
  /** 子时换日：1 = 23:00 换日（默认），2 = 0:00 换日 */
  ziSect?: 1 | 2;
  /** 用于算当前大运、流年的“今天” */
  now?: Date;
}

export interface Pillar {
  label: "年柱" | "月柱" | "日柱" | "时柱";
  stem: Stem; branch: Branch;
  stemGod: TenGod | "日主";
  hidden: { stem: Stem; god: TenGod }[];
  nayin: string;
  dishi: string;
}

export interface LuckPillar {
  ganzhi: string; startYear: number; endYear: number; startAge: number; endAge: number;
  stemGod: TenGod; branchGod: TenGod; favorable: "吉" | "平" | "忌";
}

export interface YearLuck { year: number; age: number; ganzhi: string; stemGod: TenGod; branchGod: TenGod; notes: string[]; favorable: "吉" | "平" | "忌"; }

export interface BaziChart {
  input: BaziInput;
  time: TimeCorrection | null;
  solarText: string; lunarText: string; zodiac: string;
  hasHour: boolean;
  pillars: Pillar[];
  dayMaster: Stem; dayElement: Element;
  elementScores: Record<Element, number>;
  elementPercent: Record<Element, number>;
  strength: { level: "身强" | "偏强" | "中和" | "偏弱" | "身弱"; supportRatio: number; deLing: boolean; deDi: boolean; reasons: string[] };
  pattern: { name: string; from: string };
  useful: { favorable: Element[]; unfavorable: Element[]; method: string; climate?: string };
  relations: string[];
  shensha: { name: string; where: string; meaning: string }[];
  yun: { startText: string; forward: boolean; pillars: LuckPillar[]; current: LuckPillar | null };
  years: YearLuck[];
  /** 稳定哈希，用来缓存命书 */
  key: string;
}

const LABELS = ["年柱", "月柱", "日柱", "时柱"] as const;

function toSolarWall(i: BaziInput): WallTime {
  const h = i.hour ?? 12, mi = i.minute ?? 0;
  if (i.calendar === "lunar") {
    const s = Lunar.fromYmdHms(i.year, i.leapMonth ? -i.month : i.month, i.day, h, mi, 0).getSolar();
    return { year: s.getYear(), month: s.getMonth(), day: s.getDay(), hour: h, minute: mi };
  }
  return { year: i.year, month: i.month, day: i.day, hour: h, minute: mi };
}

const SEASON: Record<Branch, "春" | "夏" | "秋" | "冬"> = {
  寅: "春", 卯: "春", 辰: "春", 巳: "夏", 午: "夏", 未: "夏", 申: "秋", 酉: "秋", 戌: "秋", 亥: "冬", 子: "冬", 丑: "冬",
};

// 神煞查表
const PEACH: Record<string, Branch> = { 申: "酉", 子: "酉", 辰: "酉", 寅: "卯", 午: "卯", 戌: "卯", 巳: "午", 酉: "午", 丑: "午", 亥: "子", 卯: "子", 未: "子" };
const HORSE: Record<string, Branch> = { 申: "寅", 子: "寅", 辰: "寅", 寅: "申", 午: "申", 戌: "申", 巳: "亥", 酉: "亥", 丑: "亥", 亥: "巳", 卯: "巳", 未: "巳" };
const CANOPY: Record<string, Branch> = { 申: "辰", 子: "辰", 辰: "辰", 寅: "戌", 午: "戌", 戌: "戌", 巳: "丑", 酉: "丑", 丑: "丑", 亥: "未", 卯: "未", 未: "未" };
const NOBLE: Record<Stem, Branch[]> = { 甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"], 乙: ["子", "申"], 己: ["子", "申"], 丙: ["亥", "酉"], 丁: ["亥", "酉"], 壬: ["巳", "卯"], 癸: ["巳", "卯"], 辛: ["午", "寅"] };
const WENCHANG: Record<Stem, Branch> = { 甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯" };
const YANGREN: Partial<Record<Stem, Branch>> = { 甲: "卯", 丙: "午", 戊: "午", 庚: "酉", 壬: "子" };
const HONGLUAN: Record<Branch, Branch> = { 子: "卯", 丑: "寅", 寅: "丑", 卯: "子", 辰: "亥", 巳: "戌", 午: "酉", 未: "申", 申: "未", 酉: "午", 戌: "巳", 亥: "辰" };
const CLASH_OF: Record<Branch, Branch> = { 子: "午", 丑: "未", 寅: "申", 卯: "酉", 辰: "戌", 巳: "亥", 午: "子", 未: "丑", 申: "寅", 酉: "卯", 戌: "辰", 亥: "巳" };

/** 桃花：按年支或日支所在三合局 */
export function peachBlossomOf(b: Branch): Branch { return PEACH[b]; }
export function hongluanOf(yearBranch: Branch): Branch { return HONGLUAN[yearBranch]; }
export function tianxiOf(yearBranch: Branch): Branch { return CLASH_OF[HONGLUAN[yearBranch]]; }

function groupElement(dm: Element, g: "比劫" | "食伤" | "财星" | "官杀" | "印星"): Element {
  return g === "比劫" ? dm : g === "食伤" ? generates(dm) : g === "财星" ? controls(dm) : g === "官杀" ? controlledBy(dm) : generatedBy(dm);
}

export function computeBazi(input: BaziInput): BaziChart {
  const hasHour = input.hour != null;
  const wall = toSolarWall(input);
  const time = hasHour ? correctBirthTime(wall, input.longitude, input.useTrueSolar !== false) : null;
  const t = time ? time.corrected : wall;
  const solar = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(input.ziSect ?? 1);

  const raw: [Stem, Branch, string[], string, string][] = [
    [ec.getYearGan() as Stem, ec.getYearZhi() as Branch, ec.getYearHideGan(), ec.getYearNaYin(), ec.getYearDiShi()],
    [ec.getMonthGan() as Stem, ec.getMonthZhi() as Branch, ec.getMonthHideGan(), ec.getMonthNaYin(), ec.getMonthDiShi()],
    [ec.getDayGan() as Stem, ec.getDayZhi() as Branch, ec.getDayHideGan(), ec.getDayNaYin(), ec.getDayDiShi()],
    [ec.getTimeGan() as Stem, ec.getTimeZhi() as Branch, ec.getTimeHideGan(), ec.getTimeNaYin(), ec.getTimeDiShi()],
  ];
  const dm = raw[2][0];
  const dmEl = STEM_ELEMENT[dm];
  const used = hasHour ? raw : raw.slice(0, 3);
  const pillars: Pillar[] = used.map((p, i) => ({
    label: LABELS[i], stem: p[0], branch: p[1],
    stemGod: i === 2 ? "日主" : tenGod(dm, p[0]),
    hidden: (p[2] as Stem[]).map((s) => ({ stem: s, god: tenGod(dm, s) })),
    nayin: p[3], dishi: p[4],
  }));

  // —— 五行力量：天干 1；地支藏干本气 1、中气 0.5、余气 0.3；月令整体 ×2；日支 ×1.2
  const scores: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  pillars.forEach((p, i) => {
    scores[STEM_ELEMENT[p.stem]] += 1;
    const mult = i === 1 ? 2 : i === 2 ? 1.2 : 1;
    p.hidden.forEach((h, k) => { scores[STEM_ELEMENT[h.stem]] += (k === 0 ? 1 : k === 1 ? 0.5 : 0.3) * mult; });
  });
  const total = ELEMENTS.reduce((s, e) => s + scores[e], 0);
  const percent = Object.fromEntries(ELEMENTS.map((e) => [e, Math.round((scores[e] / total) * 100)])) as Record<Element, number>;

  // —— 旺衰
  const seal = generatedBy(dmEl);
  const support = scores[dmEl] + scores[seal] - 1; // 去掉日主自身
  const ratio = support / (total - 1);
  const monthB = pillars[1].branch;
  const monthEl = BRANCH_ELEMENT[monthB];
  const deLing = monthEl === dmEl || monthEl === seal;
  const deDi = pillars.some((p, i) => i !== 1 && p.hidden.some((h) => STEM_ELEMENT[h.stem] === dmEl));
  let s = ratio + (deLing ? 0.06 : -0.06) + (deDi ? 0.03 : -0.03);
  const level = s >= 0.6 ? "身强" : s >= 0.5 ? "偏强" : s > 0.42 ? "中和" : s > 0.32 ? "偏弱" : "身弱";
  const reasons = [
    deLing ? `生于${monthB}月，月令${monthEl}${monthEl === dmEl ? "与日主同气" : "生扶日主"}，得令` : `生于${monthB}月，月令${monthEl}不帮日主，失令`,
    deDi ? "地支有日主的根，得地" : "地支没有日主的根，根气偏浅",
    `比劫与印星约占全局 ${Math.round(ratio * 100)}%`,
  ];

  // —— 格局（子平真诠：月令透干取格，不透取本气）
  const monthHidden = pillars[1].hidden;
  const otherStems = pillars.filter((_, i) => i !== 2).map((p) => p.stem);
  const tou = monthHidden.find((h) => otherStems.includes(h.stem));
  const pick = tou ?? monthHidden[0];
  let patternName: string;
  if (pick.god === "比肩") patternName = "建禄格";
  else if (pick.god === "劫财") patternName = STEM_YANG[dm] ? "月刃格" : "建禄格";
  else patternName = pick.god + "格";
  const pattern = { name: patternName, from: tou ? `月令${monthB}中${pick.stem}透出天干` : `月令${monthB}本气${pick.stem}` };

  // —— 喜用神（扶抑为主，调候为辅）
  const groupScore = (g: "比劫" | "食伤" | "财星" | "官杀" | "印星") => scores[groupElement(dmEl, g)];
  let favorable: Element[], method: string;
  const strongSide = level === "身强" || level === "偏强";
  if (strongSide) {
    if (groupScore("印星") > groupScore("比劫")) { favorable = [controls(dmEl), generates(dmEl)]; method = "身强印多，取财星制印、食伤泄秀"; }
    else if (groupScore("比劫") >= groupScore("印星") * 1.2) { favorable = [controlledBy(dmEl), generates(dmEl)]; method = "身强比劫多，取官杀约束、食伤泄秀"; }
    else { favorable = [generates(dmEl), controls(dmEl)]; method = "身强，取食伤泄秀、财星耗身"; }
  } else if (level === "中和") {
    const weakest = ELEMENTS.slice().sort((a, b) => scores[a] - scores[b])[0];
    favorable = [weakest, generatedBy(weakest)].filter((e, i, a) => a.indexOf(e) === i);
    method = "日主中和，取全局最弱的一行补其不足";
  } else {
    if (groupScore("官杀") >= groupScore("财星") && groupScore("官杀") >= groupScore("食伤")) { favorable = [seal, dmEl]; method = "身弱官杀重，取印星化杀生身"; }
    else if (groupScore("财星") >= groupScore("食伤")) { favorable = [dmEl, seal]; method = "身弱财多，取比劫帮身担财"; }
    else { favorable = [seal, dmEl]; method = "身弱食伤重，取印星制食伤、生日主"; }
  }
  let climate: string | undefined;
  const season = SEASON[monthB];
  if (season === "冬" && percent["火"] < 12) { climate = "生于冬月，局中火弱，需火调候暖局"; if (!favorable.includes("火")) favorable.push("火"); }
  if (season === "夏" && percent["水"] < 12) { climate = "生于夏月，局中水弱，需水调候润局"; if (!favorable.includes("水")) favorable.push("水"); }
  const unfavorable = ELEMENTS.filter((e) => !favorable.includes(e) && (strongSide ? e === dmEl || e === seal : e === controls(dmEl) || e === controlledBy(dmEl) || e === generates(dmEl)));

  // —— 刑冲合会
  const relations: string[] = [];
  for (let i = 0; i < pillars.length; i++) for (let j = i + 1; j < pillars.length; j++) {
    const a = pillars[i], b = pillars[j];
    if (isClash(a.branch, b.branch)) relations.push(`${a.label}${a.branch}与${b.label}${b.branch}相冲`);
    if (isCombine(a.branch, b.branch)) relations.push(`${a.label}${a.branch}与${b.label}${b.branch}六合`);
    if (isHarm(a.branch, b.branch)) relations.push(`${a.label}${a.branch}与${b.label}${b.branch}相害`);
    const sc = STEM_COMBINE.find((c) => (c[0] === a.stem && c[1] === b.stem) || (c[1] === a.stem && c[0] === b.stem));
    if (sc) relations.push(`${a.label}${a.stem}与${b.label}${b.stem}天干五合（合${sc[2]}）`);
  }
  const brs = pillars.map((p) => p.branch);
  THREE_COMBINE.forEach((c) => { if (c.slice(0, 3).every((x) => brs.includes(x as Branch))) relations.push(`地支${c[0]}${c[1]}${c[2]}三合${c[3]}局`); });

  // —— 神煞
  const shensha: BaziChart["shensha"] = [];
  const yb = pillars[0].branch, db = pillars[2].branch;
  const where = (b: Branch) => pillars.filter((p) => p.branch === b).map((p) => p.label).join("、");
  const add = (name: string, b: Branch, meaning: string) => { const w = where(b); if (w && !shensha.some((x) => x.name === name && x.where === w)) shensha.push({ name, where: w, meaning }); };
  add("桃花", PEACH[yb], "人缘好，异性缘旺"); add("桃花", PEACH[db], "人缘好，异性缘旺");
  add("驿马", HORSE[yb], "多走动、出差、迁移"); add("驿马", HORSE[db], "多走动、出差、迁移");
  add("华盖", CANOPY[yb], "有艺术与玄学天分，喜独处"); add("华盖", CANOPY[db], "有艺术与玄学天分，喜独处");
  NOBLE[dm].forEach((b) => add("天乙贵人", b, "遇事容易得人相助"));
  add("文昌", WENCHANG[dm], "利学业、考试与文字工作");
  const yr = YANGREN[dm]; if (yr) add("羊刃", yr, "性子刚，行动力强，也容易冲动");
  add("红鸾", HONGLUAN[yb], "婚恋喜事的信号"); add("天喜", CLASH_OF[HONGLUAN[yb]], "喜庆、好消息");

  // —— 大运流年
  const now = input.now ?? new Date();
  const nowY = now.getFullYear();
  const yun = ec.getYun(input.gender === "male" ? 1 : 0);
  const fav = (gz: string): "吉" | "平" | "忌" => {
    const e1 = STEM_ELEMENT[gz[0] as Stem], e2 = BRANCH_ELEMENT[gz[1] as Branch];
    const sc = (favorable.includes(e1) ? 1 : unfavorable.includes(e1) ? -1 : 0) + (favorable.includes(e2) ? 1.2 : unfavorable.includes(e2) ? -1.2 : 0);
    return sc > 0.5 ? "吉" : sc < -0.5 ? "忌" : "平";
  };
  const luck: LuckPillar[] = yun.getDaYun(10).slice(1, 10).map((d) => {
    const gz = d.getGanZhi();
    return { ganzhi: gz, startYear: d.getStartYear(), endYear: d.getEndYear(), startAge: d.getStartAge(), endAge: d.getEndAge(), stemGod: tenGod(dm, gz[0] as Stem), branchGod: tenGod(dm, HIDDEN_STEMS[gz[1] as Branch][0]), favorable: fav(gz) };
  });
  const current = luck.find((l) => nowY >= l.startYear && nowY <= l.endYear) ?? null;
  const birthYear = pillars.length ? (time ? time.corrected.year : wall.year) : wall.year;
  const years: YearLuck[] = [];
  for (let y = nowY; y < nowY + 6; y++) {
    const gz = Solar.fromYmd(y, 6, 1).getLunar().getYearInGanZhi();
    const b = gz[1] as Branch;
    const notes: string[] = [];
    if (isClash(b, db)) notes.push("冲日支（夫妻宫），感情与居所易有变动");
    if (isCombine(b, db)) notes.push("合日支，利感情与合作");
    if (b === PEACH[yb] || b === PEACH[db]) notes.push("流年逢桃花");
    if (b === HONGLUAN[yb]) notes.push("流年红鸾星动");
    if (b === CLASH_OF[HONGLUAN[yb]]) notes.push("流年天喜");
    if (isClash(b, yb)) notes.push("冲太岁（年支）");
    if (b === yb) notes.push("本命年");
    years.push({ year: y, age: y - birthYear + 1, ganzhi: gz, stemGod: tenGod(dm, gz[0] as Stem), branchGod: tenGod(dm, HIDDEN_STEMS[b][0]), notes, favorable: fav(gz) });
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const solarText = `${t.year}-${pad(t.month)}-${pad(t.day)}${hasHour ? ` ${pad(t.hour)}:${pad(t.minute)}` : ""}`;
  const lunarText = `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}${hasHour ? ` ${lunar.getTimeZhi()}时` : ""}`;
  const key = pillars.map((p) => p.stem + p.branch).join("") + "|" + input.gender + "|" + (input.ziSect ?? 1);

  return {
    input, time, solarText, lunarText, zodiac: lunar.getYearShengXiao(), hasHour, pillars,
    dayMaster: dm, dayElement: dmEl, elementScores: scores, elementPercent: percent,
    strength: { level, supportRatio: ratio, deLing, deDi, reasons },
    pattern, useful: { favorable, unfavorable, method, climate }, relations, shensha,
    yun: { startText: `出生后 ${yun.getStartYear()} 年 ${yun.getStartMonth()} 个月 ${yun.getStartDay()} 天起运`, forward: yun.isForward(), pillars: luck, current },
    years, key,
  };
}

export { TEN_GOD_GROUP };
