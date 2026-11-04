import { describe, expect, it } from "vitest";
import { castLiuyao, computeBazi, dailyFortune, drawQian, getSpread, pickCards, qianItems, shuffleDeck } from "@moxing/engine";
import { buildPrompt, checkReading, filterOutput, generateReading, LlmProvider, planStyle, screenInput, templateReading } from "../src";

function seq(...xs: number[]) { let i = 0; return () => xs[i++ % xs.length]; }

const chart = computeBazi({ calendar: "solar", year: 1995, month: 8, day: 20, hour: 15, minute: 30, gender: "female", longitude: 116.4, now: new Date(2026, 10, 4) });

describe("安全", () => {
  it("识别自伤倾向", () => {
    const r = screenInput("最近真的不想活了，他会回来吗");
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.kind).toBe("crisis"); expect(r.message).toContain("12356"); }
  });
  it("拒绝彩票与寿命问题", () => {
    expect(screenInput("下期双色球买什么").ok).toBe(false);
    expect(screenInput("我爸还能活多久").ok).toBe(false);
    expect(screenInput("这次面试能过吗").ok).toBe(true);
  });
  it("过滤绝对化说法", () => { expect(filterOutput("你们注定在一起，可以去开光")).not.toMatch(/注定|开光/); });
});

describe("去 AI 感检查", () => {
  it("命中套话和格式", () => {
    const issues = checkReading("总的来说，**这张牌**很好。希望对你有所帮助。");
    expect(issues.some((i) => i.kind === "banned")).toBe(true);
    expect(issues.some((i) => i.kind === "format")).toBe(true);
  });
  it("句式单调", () => {
    const t = Array.from({ length: 8 }, () => "你最近的状态还不错。").join("");
    expect(checkReading(t).some((i) => i.kind === "monotone")).toBe(true);
  });
  it("和历史开头重复", () => {
    const issues = checkReading("你问的这件事，我先说结论：整体偏暖。后面再说。", { history: ["你问的这件事，我先说结论：整体偏好。"] });
    expect(issues.some((i) => i.kind === "repeat")).toBe(true);
  });
  it("提到没抽到的牌", () => {
    expect(checkReading("这张高塔说明……", { forbiddenNames: ["高塔"] }).some((i) => i.kind === "consistency")).toBe(true);
  });
});

describe("提示词与生成", () => {
  const deck = shuffleDeck("full");
  const spread = getSpread("three");
  const cards = pickCards(deck, [3, 30, 60], spread);
  const tarotReq = { kind: "tarot" as const, spread, cards, question: "最近和他有点冷淡，接下来会怎样？", topic: "love" as const };

  it("塔罗提示词含牌面与禁用名单", () => {
    const p = buildPrompt(tarotReq, planStyle("alan", seq(0.1, 0.5, 0.9, 0.3)));
    expect(p.user).toContain(cards[0].card.zh);
    expect(p.system).toContain("阿岚");
    expect(p.forbiddenNames).not.toContain(cards[0].card.zh);
    expect(p.forbiddenNames.length).toBeGreaterThan(50);
  });

  it("模型输出不合格时带意见重写", async () => {
    const calls: number[] = [];
    const llm: LlmProvider = {
      name: "mock",
      async complete(messages) {
        calls.push(messages.length);
        if (calls.length === 1) return "总的来说，" + "这件事会好。".repeat(60);
        return "先看现在这张牌。它说的是一种慢慢回暖的状态，不急，也急不来。\n\n你说“有点冷淡”。说白了，冷淡不是没感情，是两个人都在等对方先低头，等着等着就成了僵局，谁也不想当那个先认输的人。过去那张牌也说明了，这种拉扯不是第一次，上一回也是靠一件小事才缓和下来的。\n\n未来那张牌偏暖。只要有人愿意先递一个台阶，局面会松动得比你想的快。对方其实一直在留意你的动静，只是嘴上不说。\n\n这周找个轻松的话题吧，比如一起看过的那部电影出了续集，问一句“要不要一起去”。不用解释之前的冷淡，也不用复盘谁对谁错。\n\n真诚就够了。";
      },
    };
    const r = await generateReading(tarotReq, { llm, personaId: "alan", rnd: seq(0.2, 0.6) });
    expect(r.source).toBe("llm");
    expect(calls.length).toBe(2);
    expect(calls[1]).toBe(4); // system + user + assistant + 修改意见
    expect(r.text).not.toContain("总的来说");
  });

  it("没有模型时用规则模板，各模块都能出文", async () => {
    const reqs = [
      tarotReq,
      { kind: "bazi" as const, chart, depth: "brief" as const },
      { kind: "daily" as const, fortune: dailyFortune({ dayMaster: chart.dayMaster, dayBranch: chart.pillars[2].branch, yearBranch: chart.pillars[0].branch, favorable: chart.useful.favorable, unfavorable: chart.useful.unfavorable, date: { year: 2026, month: 11, day: 4 } }), dayMaster: chart.dayMaster, strength: chart.strength.level },
      { kind: "liuyao" as const, result: castLiuyao([7, 8, 9, 7, 6, 8], { date: new Date(2026, 10, 4, 9), topic: "career" }), question: "年底能升职吗" },
      (() => { const d = drawQian(); return { kind: "qian" as const, qian: d.qian, question: "工作", topicLabel: "事业", items: qianItems(d.qian, "career") }; })(),
    ];
    for (const req of reqs) {
      const r = await generateReading(req, { llm: null });
      expect(r.source).toBe("template");
      expect(r.text.length).toBeGreaterThan(40);
      expect(r.text).not.toMatch(/undefined|NaN/);
    }
  });

  it("同一组牌多次模板解读不完全相同", () => {
    const outs = new Set([0.05, 0.35, 0.65, 0.95].map((x) => templateReading(tarotReq, planStyle("qinghe", () => x), () => x)));
    expect(outs.size).toBeGreaterThan(1);
  });
});
