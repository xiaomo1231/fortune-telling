import { describe, expect, it } from "vitest";
import { Solar } from "lunar-javascript";
import {
  castLiuyao, computeBazi, correctBirthTime, dailyFortune, drawQian, equationOfTime, getSpread, inChinaDST, LINGQIAN,
  pickCards, shuffleDeck, SPREADS, TAROT, tenGod, xunKong, soulmateClues,
} from "../src";

describe("ganzhi", () => {
  it("十神", () => {
    expect(tenGod("甲", "甲")).toBe("比肩");
    expect(tenGod("甲", "乙")).toBe("劫财");
    expect(tenGod("甲", "丙")).toBe("食神");
    expect(tenGod("甲", "丁")).toBe("伤官");
    expect(tenGod("甲", "戊")).toBe("偏财");
    expect(tenGod("甲", "己")).toBe("正财");
    expect(tenGod("甲", "庚")).toBe("七杀");
    expect(tenGod("甲", "辛")).toBe("正官");
    expect(tenGod("甲", "壬")).toBe("偏印");
    expect(tenGod("甲", "癸")).toBe("正印");
  });
  it("旬空", () => {
    expect(xunKong("甲子")).toEqual(["戌", "亥"]);
    expect(xunKong("乙丑")).toEqual(["戌", "亥"]);
    expect(xunKong("甲戌")).toEqual(["申", "酉"]);
    expect(xunKong("癸亥")).toEqual(["子", "丑"]);
  });
});

describe("出生时间校正", () => {
  it("夏令时 1986–1991", () => {
    expect(inChinaDST(1988, 7, 1, 10)).toBe(true);
    expect(inChinaDST(1988, 4, 10, 1)).toBe(false);
    expect(inChinaDST(1988, 4, 10, 3)).toBe(true);
    expect(inChinaDST(1992, 7, 1, 10)).toBe(false);
    const c = correctBirthTime({ year: 1988, month: 7, day: 1, hour: 10, minute: 0 }, 120, false);
    expect(c.corrected.hour).toBe(9);
  });
  it("均时差范围", () => {
    expect(equationOfTime(2024, 2, 11)).toBeLessThan(-13);
    expect(equationOfTime(2024, 11, 3)).toBeGreaterThan(15);
  });
  it("乌鲁木齐真太阳时约晚两小时", () => {
    const c = correctBirthTime({ year: 2000, month: 6, day: 15, hour: 12, minute: 0 }, 87.62, true);
    expect(c.longitudeMinutes).toBeCloseTo(-129.5, 0);
    expect(c.corrected.hour).toBe(9);
  });
});

describe("八字", () => {
  it("年柱以立春为界", () => {
    const before = computeBazi({ calendar: "solar", year: 1984, month: 2, day: 4, hour: 12, minute: 0, gender: "male", longitude: 120, useTrueSolar: false });
    const after = computeBazi({ calendar: "solar", year: 1984, month: 2, day: 5, hour: 12, minute: 0, gender: "male", longitude: 120, useTrueSolar: false });
    expect(before.pillars[0].stem + before.pillars[0].branch).toBe("癸亥");
    expect(after.pillars[0].stem + after.pillars[0].branch).toBe("甲子");
  });
  it("与 lunar-javascript 原始结果一致", () => {
    const b = computeBazi({ calendar: "solar", year: 1995, month: 8, day: 20, hour: 15, minute: 30, gender: "female", longitude: 120, useTrueSolar: false });
    const ec = Solar.fromYmdHms(1995, 8, 20, 15, 30, 0).getLunar().getEightChar();
    expect(b.pillars.map((p) => p.stem + p.branch)).toEqual([ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()]);
    expect(b.pillars[2].stemGod).toBe("日主");
    expect(b.yun.pillars.length).toBeGreaterThan(5);
    expect(Object.values(b.elementPercent).reduce((a, x) => a + x, 0)).toBeGreaterThan(95);
    expect(b.useful.favorable.length).toBeGreaterThan(0);
  });
  it("农历输入", () => {
    const b = computeBazi({ calendar: "lunar", year: 2000, month: 1, day: 1, hour: 8, minute: 0, gender: "male", longitude: 120, useTrueSolar: false });
    expect(b.solarText.startsWith("2000-02-05")).toBe(true);
  });
  it("时辰不详只排三柱", () => {
    const b = computeBazi({ calendar: "solar", year: 1990, month: 3, day: 3, hour: null, minute: null, gender: "male", longitude: null });
    expect(b.pillars.length).toBe(3);
    expect(b.hasHour).toBe(false);
  });
  it("子时换日流派", () => {
    const s1 = computeBazi({ calendar: "solar", year: 2001, month: 3, day: 3, hour: 23, minute: 30, gender: "male", longitude: 120, useTrueSolar: false, ziSect: 1 });
    const s2 = computeBazi({ calendar: "solar", year: 2001, month: 3, day: 3, hour: 23, minute: 30, gender: "male", longitude: 120, useTrueSolar: false, ziSect: 2 });
    expect(s1.pillars[2].stem + s1.pillars[2].branch).not.toBe(s2.pillars[2].stem + s2.pillars[2].branch);
  });
});

describe("每日运势", () => {
  it("同一天同一人结果固定", () => {
    const i = { dayMaster: "甲" as const, dayBranch: "子" as const, yearBranch: "午" as const, favorable: ["水", "木"] as ("水" | "木")[], unfavorable: ["金"] as "金"[], date: { year: 2026, month: 11, day: 4 } };
    const a = dailyFortune(i), b = dailyFortune(i);
    expect(a).toEqual(b);
    expect(a.score).toBeGreaterThanOrEqual(28);
    expect(a.yi.length + a.ji.length).toBeGreaterThan(0);
  });
});

describe("六爻", () => {
  const date = new Date(2026, 10, 4, 10, 0); // 2026-11-04
  it("乾为天装卦", () => {
    const r = castLiuyao([7, 7, 7, 7, 7, 7], { date, topic: "money" });
    expect(r.main.name).toBe("乾为天");
    expect(r.main.palace).toBe("乾");
    expect(r.changed).toBeNull();
    expect(r.lines.map((l) => l.stem + l.branch)).toEqual(["甲子", "甲寅", "甲辰", "壬午", "壬申", "壬戌"]);
    expect(r.lines.map((l) => l.relative)).toEqual(["子孙", "妻财", "父母", "官鬼", "兄弟", "父母"]);
    expect(r.lines[5].isShi).toBe(true);
    expect(r.lines[2].isYing).toBe(true);
  });
  it("天风姤：一世卦与伏神", () => {
    const r = castLiuyao([8, 7, 7, 7, 7, 7], { date, topic: "money" });
    expect(r.main.name).toBe("天风姤");
    expect(r.main.generation).toBe("一世");
    expect(r.lines[0].isShi).toBe(true);
    expect(r.lines[3].isYing).toBe(true);
    expect(r.lines[1].hidden?.relative).toBe("妻财");
    expect(r.lines[1].hidden?.branch).toBe("寅");
  });
  it("游魂、归魂", () => {
    // 火地晋：乾宫游魂；火天大有：乾宫归魂
    expect(castLiuyao([8, 8, 8, 7, 8, 7], { date, topic: "other" }).main.generation).toBe("游魂");
    expect(castLiuyao([7, 7, 7, 7, 8, 7], { date, topic: "other" }).main.generation).toBe("归魂");
  });
  it("动爻与变卦", () => {
    const r = castLiuyao([9, 7, 7, 7, 7, 7], { date, topic: "career" });
    expect(r.changed?.name).toBe("天风姤");
    expect(r.lines[0].moving).toBe(true);
    expect(r.lines[0].changed?.branch).toBe("丑");
  });
  it("64 卦都能装", () => {
    for (let n = 0; n < 64; n++) {
      const v = [0, 1, 2, 3, 4, 5].map((i) => ((n >> i) & 1 ? 7 : 8)) as (7 | 8)[];
      const r = castLiuyao(v, { date, topic: "love", gender: "female" });
      expect(r.main.gist).toBeTruthy();
      expect(r.lines.filter((l) => l.isShi).length).toBe(1);
    }
  });
});

describe("塔罗", () => {
  it("78 张牌，id 唯一", () => {
    expect(TAROT.length).toBe(78);
    expect(new Set(TAROT.map((c) => c.id)).size).toBe(78);
    TAROT.forEach((c) => { expect(c.topics.love.up).toBeTruthy(); expect(c.advice.rev).toBeTruthy(); });
  });
  it("洗牌与选牌", () => {
    const deck = shuffleDeck("full");
    expect(deck.length).toBe(78);
    expect(new Set(deck.map((d) => d.id)).size).toBe(78);
    const s = getSpread("three");
    const drawn = pickCards(deck, [0, 10, 40], s);
    expect(drawn.map((d) => d.card.id)).toEqual([deck[0].id, deck[10].id, deck[40].id]);
    expect(() => pickCards(deck, [1, 1, 2], s)).toThrow();
    expect(shuffleDeck("major").length).toBe(22);
  });
  it("牌阵位置数量正确", () => { SPREADS.forEach((s) => expect(s.positions.length).toBe(s.count)); });
  it("正缘线索", () => {
    const deck = shuffleDeck("full");
    const clues = soulmateClues(pickCards(deck, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], getSpread("soulmate")));
    expect(clues.find((c) => c.label === "相遇场景")).toBeTruthy();
  });
});

describe("灵签", () => {
  it("100 支签", () => {
    expect(LINGQIAN.length).toBe(100);
    const d = drawQian();
    expect(d.qian.poem.length).toBe(4);
    expect(d.tosses.length).toBeGreaterThan(0);
  });
});
