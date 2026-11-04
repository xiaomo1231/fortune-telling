// @moxing/card-art：墨星牌 78 张牌面的 SVG 字符串生成器。
// 纯字符串拼接，不碰 DOM，Node SSR 与浏览器通用；pattern / clipPath 的 id 由牌 id 与 uid 推出，无全局计数，SSR 与客户端输出一致。
import { usePal, PAL, ELEMENT, card, back as backSvg } from "./gen.js";
import { ARCANA } from "./major.js";
import { SUITS, SUIT_ORDER, RANK_ZH, RANK_EN, RANK_LABEL, RANK_KEY, romanOf, minorArt } from "./minor.js";

const MAJOR_ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const majorByRoman = {};
ARCANA.forEach(function (c) { majorByRoman[c.num] = c; });

function pad2(n) { return n < 10 ? "0" + n : "" + n; }

/** 78 张牌的 id：major-0 … major-21，然后 wands / cups / swords / pentacles 各 01–14 */
export const CARD_IDS = [];
for (let i = 0; i < 22; i++) CARD_IDS.push("major-" + i);
SUIT_ORDER.forEach(function (s) { for (let r = 1; r <= 14; r++) CARD_IDS.push(s + "-" + pad2(r)); });

const META = {};
CARD_IDS.forEach(function (id) {
  const m = /^major-(\d+)$/.exec(id);
  if (m) {
    const n = +m[1], c = majorByRoman[MAJOR_ROMAN[n]];
    META[id] = { id, arcana: "major", num: n, roman: MAJOR_ROMAN[n], zh: c.zh, en: c.en, element: ELEMENT[c.num], note: c.note, label: MAJOR_ROMAN[n] };
    return;
  }
  const p = /^(wands|cups|swords|pentacles)-(\d\d)$/.exec(id), suit = p[1], r = +p[2], S = SUITS[suit];
  META[id] = { id, arcana: "minor", num: r, roman: romanOf(r), zh: S.zh + RANK_ZH[r], en: RANK_EN[r] + " OF " + S.en, suit, rank: RANK_KEY[r], element: S.element, label: RANK_LABEL[r] };
});

/** 一张牌的元数据；未知 id 返回 undefined */
export function cardMeta(id) { const m = META[id]; return m ? Object.assign({}, m) : undefined; }

function domId(base, uid) { return ("mx-" + base + (uid == null || uid === "" ? "" : "-" + uid)).replace(/[^A-Za-z0-9_-]/g, "_"); }
function pick(mode, el) { return mode === "mono" ? PAL.mono : PAL[el]; }

/**
 * 渲染一张牌面，返回 SVG 字符串（viewBox 0 0 210 360，无固定宽高，由 CSS 定尺寸）。
 * opts.mode: "element"（默认，按元素配色）或 "mono"；opts.uid: 同一页同一张牌出现多次时用来区分内部 id。
 */
export function renderCard(id, opts) {
  opts = opts || {};
  const m = META[id];
  if (!m) throw new Error("@moxing/card-art: unknown card id " + JSON.stringify(id));
  const svgId = domId(id, opts.uid);
  usePal(pick(opts.mode, m.element));
  try {
    const art = m.arcana === "major" ? majorByRoman[m.roman].art() : minorArt(m.suit, m.num);
    return card(m.label, m.en, m.zh, art, svgId);
  } finally { usePal(PAL.mono); }
}

/** 牌背（严格中心对称，不暴露正逆位）。opts 同 renderCard。 */
export function renderBack(opts) {
  opts = opts || {};
  try { return backSvg(opts.mode === "mono" ? "mono" : "element", domId("back", opts.uid)); }
  finally { usePal(PAL.mono); }
}

export const PALETTES = PAL;
export { SUITS };
