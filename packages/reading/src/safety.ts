// 内容安全：输入侧识别危机与违规问题，输出侧过滤不合规说法

export const CRISIS_HOTLINES = [
  { name: "全国心理援助热线", number: "12356" },
  { name: "希望 24 热线", number: "400-161-9995" },
  { name: "北京心理危机研究与干预中心", number: "010-82951332" },
];

const SELF_HARM = [
  "想死", "不想活", "活不下去", "自杀", "轻生", "结束生命", "了结自己", "跳楼", "割腕", "吃安眠药", "安眠药", "离开这个世界", "活着没意思", "活着没有意义", "撑不下去了", "自残", "去死",
];
const REFUSE: { words: string[]; reason: string }[] = [
  { words: ["彩票", "双色球", "大乐透", "中奖号码", "赌球", "赌博", "博彩", "六合彩", "下注"], reason: "不提供赌博、彩票相关的预测" },
  { words: ["什么时候死", "能活多久", "寿命", "阳寿", "哪天死", "死期"], reason: "不预测寿命和生死" },
  { words: ["报复", "杀了", "弄死", "下毒", "诅咒", "害他", "让他倒霉", "下降头"], reason: "不回应伤害他人的诉求" },
  { words: ["逃税", "洗钱", "贩毒", "偷渡"], reason: "不回应违法犯罪相关的问题" },
];

export type ScreenResult =
  | { ok: true }
  | { ok: false; kind: "crisis"; message: string }
  | { ok: false; kind: "refuse"; message: string };

export function screenInput(text: string): ScreenResult {
  const t = (text || "").replace(/\s/g, "");
  if (SELF_HARM.some((w) => t.includes(w))) {
    return {
      ok: false, kind: "crisis",
      message: "看到你写下的话，我有点担心你。这一刻，比起占卜，你更需要一个能陪你说话的人。如果你正在想伤害自己，请马上联系身边信任的人，或者拨打全国心理援助热线 12356、希望 24 热线 400-161-9995；如果有紧急危险，请直接拨打 120 或 110。你愿意说出来，已经很不容易了。",
    };
  }
  for (const r of REFUSE) if (r.words.some((w) => t.includes(w))) return { ok: false, kind: "refuse", message: `这个问题我们${r.reason}。换个角度，比如“我现在该怎么调整自己”，我可以陪你看一看。` };
  return { ok: true };
}

const OUTPUT_FIXES: [RegExp, string][] = [
  [/注定/g, "很可能"], [/一定会/g, "大概率会"], [/必然会/g, "很可能会"], [/必死|血光之灾/g, "不太顺"],
  [/(开光|请符|化解费|转运符|法事|做法事|供奉灯)/g, "调整心态"],
];

export function filterOutput(text: string): string {
  let t = text;
  for (const [re, rep] of OUTPUT_FIXES) t = t.replace(re, rep);
  return t;
}

/** 18 岁以下用户的限制 */
export function isMinor(birthYear: number | null | undefined, now = new Date()): boolean {
  if (!birthYear) return false;
  return now.getFullYear() - birthYear < 18;
}
