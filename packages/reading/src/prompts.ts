// 各模块的提示词构造：把引擎算出的“结论 + 资料”整理成模型输入
import type { BaziChart, DailyFortune, DrawnCard, LingQian, LiuyaoResult, Spread, Topic } from "@moxing/engine";
import { TAROT } from "@moxing/engine";
import { COMMON_RULES, seasonLine, StylePlan } from "./style";

export type ReadingRequest =
  | { kind: "tarot"; spread: Spread; cards: DrawnCard[]; question: string; topic: Topic; clues?: { label: string; value: string; source: string }[]; yesNo?: string; freePositions?: number }
  | { kind: "bazi"; chart: BaziChart; depth: "brief" | "full"; name?: string }
  | { kind: "daily"; fortune: DailyFortune; dayMaster: string; strength: string; name?: string }
  | { kind: "liuyao"; result: LiuyaoResult; question: string }
  | { kind: "qian"; qian: LingQian; question: string; topicLabel: string; items: { key: string; value: string }[] }
  | { kind: "followup"; context: string; previous: string; question: string };

export interface BuiltPrompt {
  system: string; user: string; tier: "fast" | "pro"; maxTokens: number; minLength: number;
  forbiddenNames: string[];
}

const TOPIC_LABEL: Record<Topic, string> = { love: "感情", work: "事业学业", money: "财运", self: "自我成长" };

function systemFor(plan: StylePlan, task: string): string {
  return `${plan.persona.voice}
你的口头习惯：${plan.habit}。避免：${plan.persona.avoid.join("、")}。

任务：${task}

本篇结构：${plan.skeleton}${plan.ending}全文写 ${plan.paragraphs} 段左右，段落长短不一。

${COMMON_RULES}`;
}

function cardLine(d: DrawnCard, i: number): string {
  const c = d.card, r = d.reversed;
  const t = c.topics;
  return `${i + 1}. 位置「${d.position.name}」（${d.position.meaning}）：${c.zh}${r ? "（逆位）" : "（正位）"}
   画面：${c.image}
   关键词：${r ? c.keywords.rev : c.keywords.up}
   感情：${r ? t.love.rev : t.love.up}；事业：${r ? t.work.rev : t.work.up}；财运：${r ? t.money.rev : t.money.up}；自我：${r ? t.self.rev : t.self.up}
   建议方向：${r ? c.advice.rev : c.advice.up}
   元素/星象：${c.element} · ${c.astro}`;
}

export function buildPrompt(req: ReadingRequest, plan: StylePlan): BuiltPrompt {
  const now = seasonLine();
  switch (req.kind) {
    case "tarot": {
      const drawn = new Set(req.cards.map((c) => c.card.zh));
      const forbidden = TAROT.filter((c) => !drawn.has(c.zh) && c.zh.length >= 3).map((c) => c.zh);
      const free = req.freePositions != null && req.freePositions < req.cards.length;
      const visible = free ? req.cards.slice(0, req.freePositions) : req.cards;
      const task = `为用户解读一次塔罗占卜「${req.spread.name}」。先逐张讲，再讲牌与牌之间的关系，最后回到用户的问题。${req.yesNo ? `这是“是否”问题，牌面倾向为「${req.yesNo}」，要在开头附近说清楚倾向和前提条件。` : ""}${req.clues?.length ? "正缘画像中，“线索”部分要逐条写出，并说明来自哪张牌，用“更可能”“倾向”这类说法。" : ""}${free ? `用户目前只解锁了前 ${req.freePositions} 个位置，只解读这几张，结尾自然地提一句后面几张牌还藏着关于 TA 的线索，不要夸大或制造焦虑。` : ""}`;
      return {
        system: systemFor(plan, task),
        user: `${now}
用户的问题：「${req.question || "（没有写具体问题，想看看整体状态）"}」
问题类型：${TOPIC_LABEL[req.topic]}

抽到的牌：
${visible.map(cardLine).join("\n")}
${req.clues?.length ? "\n由牌面推出的线索：\n" + req.clues.map((c) => `- ${c.label}：${c.value}（来自${c.source}）`).join("\n") : ""}`,
        tier: req.spread.model, maxTokens: req.spread.count >= 10 ? 3200 : req.spread.count >= 5 ? 2200 : 1400,
        minLength: req.spread.count >= 5 ? 500 : 220, forbiddenNames: forbidden,
      };
    }
    case "bazi": {
      const c = req.chart;
      const pil = c.pillars.map((p) => `${p.label} ${p.stem}${p.branch}（天干十神：${p.stemGod}；藏干：${p.hidden.map((h) => h.stem + h.god).join("、")}；纳音：${p.nayin}）`).join("\n");
      const el = Object.entries(c.elementPercent).map(([k, v]) => `${k}${v}%`).join("、");
      const luck = c.yun.pillars.slice(0, 8).map((l) => `${l.ganzhi}（${l.startYear}–${l.endYear}，${l.startAge}–${l.endAge}岁，${l.stemGod}/${l.branchGod}，${l.favorable}）`).join("；");
      const years = c.years.map((y) => `${y.year}${y.ganzhi}（${y.stemGod}，${y.favorable}${y.notes.length ? "，" + y.notes.join("、") : ""}）`).join("；");
      const full = req.depth === "full";
      const task = full
        ? "为用户写一份完整的八字命书，分成性格、事业、感情、财运、健康、未来十年大运六个部分，每部分用一句加粗以外的自然短句开头点题（例如“先说事业。”），不要用标题符号。每部分都要落到具体干支或十神上，再翻译成生活语言。"
        : `为用户写一段八字简批，聚焦性格底色和当前这步大运，${c.hasHour ? "" : "用户不知道出生时辰，只排了三柱，开头说明一句精度会低一些，"}结尾自然提一句完整命书里会细讲的一个具体年份或方向（不要制造恐慌）。`;
      return {
        system: systemFor(plan, task),
        user: `${now}
${req.name ? `命主称呼：${req.name}\n` : ""}性别：${c.input.gender === "male" ? "男（乾造）" : "女（坤造）"}，生肖${c.zodiac}
排盘时间：${c.solarText}（${c.lunarText}）

四柱：
${pil}

结论（由规则引擎得出，不可改动）：
- 日主：${c.dayMaster}${c.dayElement}，${c.strength.level}。依据：${c.strength.reasons.join("；")}
- 格局：${c.pattern.name}（${c.pattern.from}）
- 喜用：${c.useful.favorable.join("、")}；忌：${c.useful.unfavorable.join("、") || "无明显忌神"}。取法：${c.useful.method}${c.useful.climate ? "；" + c.useful.climate : ""}
- 五行占比：${el}
- 刑冲合会：${c.relations.join("；") || "无明显刑冲"}
- 神煞：${c.shensha.map((s) => `${s.name}（${s.where}，${s.meaning}）`).join("；") || "无"}
- ${c.yun.startText}，${c.yun.forward ? "顺排" : "逆排"}。大运：${luck}
- 当前大运：${c.yun.current ? c.yun.current.ganzhi + "（" + c.yun.current.favorable + "）" : "尚未起运"}
- 近几年流年：${years}`,
        tier: full ? "pro" : "fast", maxTokens: full ? 5000 : 1400, minLength: full ? 1500 : 260, forbiddenNames: [],
      };
    }
    case "daily": {
      const f = req.fortune;
      return {
        system: systemFor({ ...plan, paragraphs: 2 }, "为用户写今天的个人运势，两段以内，150 到 260 字，轻松好读。必须提到今天的干支和它对用户日主是什么十神，再翻译成生活语言。"),
        user: `${now}
今天：${f.date}，${f.lunar}，${f.dayGanzhi}日，节气：${f.jieqi}
用户日主：${req.dayMaster}，${req.strength}
今天对用户：天干${f.stemGod}，地支${f.branchGod}。综合 ${f.score} 分（${f.level}）
主题：${f.theme}
${f.notes.length ? "提醒：" + f.notes.join("；") : ""}
感情 ${f.aspects.love}、事业 ${f.aspects.work}、财运 ${f.aspects.money}、健康 ${f.aspects.health}
幸运色：${f.luckyColors.join("、")}；方位：${f.luckyDirection}；黄历宜：${f.yi.join("、")}；忌：${f.ji.join("、")}`,
        tier: "fast", maxTokens: 700, minLength: 120, forbiddenNames: [],
      };
    }
    case "liuyao": {
      const r = req.result;
      const lines = r.lines.slice().reverse().map((l) => `第${l.position}爻 ${l.spirit} ${l.relative}${l.stem}${l.branch}${l.element} ${l.yang ? "阳" : "阴"}${l.moving ? "（动，化" + l.changed!.relative + l.changed!.branch + l.changed!.element + "）" : ""}${l.isShi ? " 世" : ""}${l.isYing ? " 应" : ""}${l.empty ? " 旬空" : ""}${l.monthBreak ? " 月破" : ""} 月令${l.monthState}${l.hidden ? `（伏${l.hidden.relative}${l.hidden.branch}${l.hidden.element}）` : ""}`).join("\n");
      return {
        system: systemFor(plan, "为用户解读一次六爻占卜。先给倾向，再讲用神的状态说明了什么，再讲世应关系和动爻带来的变化，最后给建议。术语必须马上解释成白话。"),
        user: `${now}
用户的问题：「${req.question}」
起卦时间：${r.date}，月建${r.monthBranch}，日辰${r.dayGanzhi}，旬空${r.emptyBranches.join("")}
本卦：${r.main.name}（${r.main.palace}宫${r.main.generation}，${r.main.gist}）${r.changed ? `\n变卦：${r.changed.name}（${r.changed.gist}）` : "\n静卦，无动爻"}
装卦（自上而下）：
${lines}

结论（由规则得出，不可改动）：
- ${r.useGod.reason}
- ${r.useGod.state}
- 综合倾向：${r.verdict}`,
        tier: "fast", maxTokens: 1600, minLength: 300, forbiddenNames: [],
      };
    }
    case "qian": {
      const q = req.qian;
      return {
        system: systemFor({ ...plan, paragraphs: 3 }, "为用户解一支观音灵签。先用白话讲签诗在说什么、典故讲了什么故事，再结合用户的问题和这支签对应的断语讲怎么理解，最后给一条建议。签诗原文要引用一两句。"),
        user: `${now}
用户的问题：「${req.question || "（没有写具体问题）"}」，类别：${req.topicLabel}
第${q.no}签 ${q.title}，${q.level || "未标等级"}
签诗：${q.poem.join("，")}
浅释：${q.gloss}
签意：${q.xiang}
对应断语：${req.items.length ? req.items.map((i) => `${i.key}：${i.value}`).join("；") : "原签没有列这一项"}`,
        tier: "fast", maxTokens: 1200, minLength: 220, forbiddenNames: [],
      };
    }
    case "followup":
      return {
        system: systemFor({ ...plan, paragraphs: 2, ending: "直接回答，不需要固定收尾。" }, "用户看完上一次解读后追问了一个问题。只基于这次占卜的结果回答，不重新抽牌或起卦，150 到 350 字。"),
        user: `${now}
这次占卜的结果：
${req.context}

上一次的解读：
${req.previous.slice(0, 2400)}

用户追问：「${req.question}」`,
        tier: "fast", maxTokens: 900, minLength: 100, forbiddenNames: [],
      };
  }
}
