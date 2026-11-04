// 没有配置大模型时的规则模板解读。也用作模型故障时的兜底。
import type { ReadingRequest } from "./prompts";
import { pick, StylePlan } from "./style";

const TOPIC_WORD = { love: "这段关系", work: "这件事", money: "财务这块", self: "你现在的状态" } as const;

function first(s: string) { return s.split("、")[0]; }

export function templateReading(req: ReadingRequest, plan: StylePlan, rnd: () => number): string {
  const name = plan.persona.name;
  switch (req.kind) {
    case "tarot": {
      const cards = req.freePositions != null ? req.cards.slice(0, req.freePositions) : req.cards;
      const tone = cards.reduce((s, c) => s + (c.reversed ? c.card.tone.rev : c.card.tone.up), 0) / cards.length;
      const word = TOPIC_WORD[req.topic];
      const verdict = tone > 0.3 ? pick(["整体是往好的方向走的", "牌面整体偏暖", "这组牌给的信号是积极的"], rnd) : tone < -0.3 ? pick(["眼下有一些需要先面对的东西", "牌面提醒你先别急", "这组牌在提醒你调整"], rnd) : pick(["牌面不偏不倚，关键在你怎么做", "结果还没定，取决于接下来的选择"], rnd);
      const last = cards[cards.length - 1];
      const open = pick([
        `${req.question ? `你问「${req.question}」。` : ""}我先说结论：${word}${verdict}。`,
        `先看${last.position.name}这张${last.card.zh}——${last.card.image}。${word}${verdict}。`,
        `${req.question ? `「${req.question}」，这个问题我看了三遍牌。` : ""}${verdict}，下面一张张说。`,
      ], rnd);
      const body = cards.map((d, i) => {
        const c = d.card, t = d.reversed ? c.topics[req.topic].rev : c.topics[req.topic].up;
        const kw = d.reversed ? c.keywords.rev : c.keywords.up;
        const lead = i === 0 ? "" : pick(["再看", "接着是", "到了", ""], rnd);
        return `${lead}${d.position.name}是${c.zh}${d.reversed ? "逆位" : ""}。${pick([`牌面上${c.image}。`, ""], rnd)}它说的是「${first(kw)}」，放到你的问题里，就是${t}。`;
      });
      const adv = pick([`如果只记一句话：${last.reversed ? last.card.advice.rev : last.card.advice.up}。`, `这周可以先做一件事：${last.reversed ? last.card.advice.rev : last.card.advice.up}。`, `我更倾向于这样做：${last.reversed ? last.card.advice.rev : last.card.advice.up}。`], rnd);
      const clue = req.clues?.length ? "\n\n" + req.clues.map((c) => `${c.label}：${c.value}（来自${c.source}）。`).join("") : "";
      const lock = req.freePositions != null && req.freePositions < req.cards.length ? `\n\n后面还有 ${req.cards.length - req.freePositions} 张牌，藏着关于 TA 的样子和你们相遇的线索。` : "";
      return [open, body.join(rnd() < 0.5 ? "" : "\n\n"), adv].join("\n\n") + clue + lock;
    }
    case "bazi": {
      const c = req.chart;
      const strongText = c.strength.level.includes("强") ? "自我意识强、能扛事，但也容易固执" : c.strength.level.includes("弱") ? "心思细、懂得借力，但容易内耗" : "性格比较平衡，能屈能伸";
      const cur = c.yun.current;
      const paras = [
        `${req.name ? req.name + "，" : ""}你的日主是${c.dayMaster}${c.dayElement}，${c.strength.level}（${c.strength.reasons[0]}）。简单说，${strongText}。`,
        `命局是${c.pattern.name}，喜用${c.useful.favorable.join("、")}。${c.useful.method}。平时多接触${c.useful.favorable[0]}属性的东西，比如相应的颜色、方位、行业，会更顺手。`,
        cur ? `你现在走的是${cur.ganzhi}大运（${cur.startYear}–${cur.endYear}），天干是${cur.stemGod}。这步运${cur.favorable === "吉" ? "正好落在你喜欢的五行上，适合主动争取" : cur.favorable === "忌" ? "不在你的喜用里，更适合稳扎稳打、积累实力" : "不好不坏，关键看流年"}。` : "你还没正式进入第一步大运，这几年主要看原局和流年。",
      ];
      const hot = c.years.find((y) => y.notes.length);
      if (hot) paras.push(`${hot.year}年（${hot.ganzhi}）值得留意：${hot.notes.join("，")}。${req.depth === "brief" ? "完整命书里会把这一年拆开细讲。" : ""}`);
      if (!c.hasHour) paras.unshift("你没有填出生时辰，这次只排了年、月、日三柱，结论的精度会低一些。");
      return paras.join("\n\n");
    }
    case "daily": {
      const f = req.fortune;
      return `今天是${f.dayGanzhi}日，对${req.dayMaster}日主来说是${f.stemGod}。${f.theme}。${f.notes[0] ? f.notes[0] + "。" : ""}\n\n幸运色选${f.luckyColors[0]}，${f.luckyDirection}方向更顺。黄历说宜${f.yi.slice(0, 2).join("、") || "静心"}${f.ji.length ? "，忌" + f.ji.slice(0, 2).join("、") : ""}。`;
    }
    case "liuyao": {
      const r = req.result;
      return `你问「${req.question}」，起得${r.main.name}${r.changed ? "，变" + r.changed.name : "，静卦"}。${r.main.gist}。\n\n${r.useGod.reason}。${r.useGod.state}。综合来看倾向「${r.verdict}」。\n\n${r.verdict === "吉" || r.verdict === "小吉" ? "可以按计划推进，留意动爻提示的变化。" : "先别急着推进，等条件更成熟一些再动。"}`;
    }
    case "qian": {
      const q = req.qian;
      return `第${q.no}签，${q.title}，${q.level || "未标等级"}。签诗说“${q.poem[0]}，${q.poem[1]}”。\n\n${q.gloss}\n\n${req.items.length ? `问${req.topicLabel}，签上写的是「${req.items.map((i) => i.value).join("；")}」。` : ""}${q.xiang}`;
    }
    case "followup":
      return `${name}只能根据这次的结果来回答。你追问「${req.question}」——回到牌面，答案还是落在上面那几张牌给的方向上：先做好眼前能做的一步，再看后续变化。`;
  }
}
