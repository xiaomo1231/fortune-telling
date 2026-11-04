// 56 张小牌：四花色的符号、点数牌的几何排布与传统场景的抽象母题、宫廷牌的碎晶“人形”团块。
// 与大牌共用 gen.js 的线条系统：主线 R 固定，副线 O / 浅底 P / 点缀 A 由 index.js 按花色元素切换。
import { f, srnd, ln, ci, pg, pl, path, hpg, dotsL, dotsP, dash, dot, lerp, T, bead, drop, fringe, chain, spark, cross, reticle, onC, arc, sliver, sector, halfDisk, halo, frame, ladder, crystal, knock, cup, el, star5, stalk, wreath, crescent, BG, R, O, P, A } from "./gen.js";

export const SUITS = {
  wands: { zh: "权杖", en: "WANDS", element: "fire" },
  cups: { zh: "圣杯", en: "CUPS", element: "water" },
  swords: { zh: "宝剑", en: "SWORDS", element: "air" },
  pentacles: { zh: "星币", en: "PENTACLES", element: "earth" }
};
export const SUIT_ORDER = ["wands", "cups", "swords", "pentacles"];
export const RANK_ZH = ["", "王牌", "二", "三", "四", "五", "六", "七", "八", "九", "十", "侍从", "骑士", "王后", "国王"];
export const RANK_EN = ["", "ACE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "PAGE", "KNIGHT", "QUEEN", "KING"];
// 左上角标：A、2–10、侍 / 骑 / 后 / 王
export const RANK_LABEL = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "侍", "骑", "后", "王"];
export const RANK_KEY = ["", "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king"];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV"];
export function romanOf(n) { return ROMAN[n] || ""; }

function g(x, y, ang, inner) { return '<g transform="translate(' + f(x) + ' ' + f(y) + ')' + (ang ? ' rotate(' + f(ang) + ')' : '') + '">' + inner + '</g>'; }
function rot(cx, cy, ang, inner) { return ang ? '<g transform="rotate(' + f(ang) + ' ' + f(cx) + ' ' + f(cy) + ')">' + inner + '</g>' : inner; }

// ---- 花色符号（都以 (x, y) 为中心，ang 为顺时针倾角，s 为缩放） ----
// 权杖：直杆、内侧细副线、顶端圆珠、近顶两侧交错叶片、底端小珠
export function wand(x, y, len, ang, s) {
  s = s || 1; var h = len / 2, b = ln(0, h, 0, -h, 1.9 * s) + ln(1.7 * s, h - 6, 1.7 * s, -h + 12, 0.5, O) + ci(0, -h, 2.2 * s, 0.9, R, P) + dot(0, -h, 0.9) + dot(0, h, 1.3 * s);
  for (var i = 0; i < 3; i++) { var yy = -h + 8 * s + i * 8 * s, side = i % 2 ? 1 : -1; b += sliver(side * 10 * s, yy - 7 * s, 0, yy, 2.2 * s, i === 1 ? R : O); }
  return g(x, y, ang, b);
}
// 圣杯：半圆杯身加杯脚（gen.cup），这里改成以中心定位
export function cupG(x, y, r, ang) { return rot(x, y, ang, cup(x, y - r, r) + dot(x, y - r * 0.45, 0.9, O)); }
// 宝剑：纸色垫底切出的长刃、刃中脊线、横档、柄与圆首；ang 0 时剑尖朝上
export function sword(x, y, len, ang, s) {
  s = s || 1; var h = len / 2, hw = 2.8 * s, bl = -h + len * 0.68, blade = [[0, -h], [hw, -h + 9 * s], [hw, bl], [-hw, bl], [-hw, -h + 9 * s]];
  var b = pg(blade, 3.6, BG, BG) + pg(blade, 1.3, R, BG) + ln(0, -h + 7 * s, 0, bl - 1, 0.5, O) +
    ln(-7.5 * s, bl, 7.5 * s, bl, 1.7) + dot(-7.5 * s, bl, 1.2) + dot(7.5 * s, bl, 1.2) + ln(0, bl, 0, h - 3 * s, 1.6) + ci(0, h - 1.5 * s, 2.6 * s, 1, R, P);
  return g(x, y, ang, b);
}
// 星币：浅底圆环、内细环、纸色五角星、中心一点
export function pent(x, y, r) { return ci(x, y, r, 1.6, R, P) + ci(x, y, r * 0.8, 0.5, O) + star5(x, y, r * 0.68, -90, 0.9, R, BG) + dot(x, y, 1); }

export function glyph(suit, x, y, s, ang) {
  s = s || 1;
  if (suit === "wands") return wand(x, y, 54 * s, ang, s);
  if (suit === "cups") return cupG(x, y, 11 * s, ang);
  if (suit === "swords") return sword(x, y, 58 * s, ang, s);
  return rot(x, y, ang, pent(x, y, 13 * s));
}
function pips(suit, pos, s, ang) { return pos.map(function (p, i) { return glyph(suit, p[0], p[1], s, typeof ang === "function" ? ang(i, p) : ang); }).join(""); }

// 传统点数排布
const LAY = {
  1: [[105, 172]],
  2: [[105, 112], [105, 236]],
  3: [[105, 100], [64, 236], [146, 236]],
  4: [[64, 108], [146, 108], [64, 240], [146, 240]],
  5: [[64, 100], [146, 100], [105, 174], [64, 248], [146, 248]],
  6: [[64, 96], [146, 96], [64, 174], [146, 174], [64, 252], [146, 252]],
  7: [[58, 92], [152, 92], [58, 174], [152, 174], [58, 256], [152, 256], [105, 174]],
  8: [[62, 84], [148, 84], [62, 142], [148, 142], [62, 200], [148, 200], [62, 258], [148, 258]],
  9: [[56, 92], [105, 92], [154, 92], [56, 174], [105, 174], [154, 174], [56, 256], [105, 256], [154, 256]],
  10: [[52, 84], [158, 84], [52, 142], [158, 142], [52, 200], [158, 200], [52, 258], [158, 258], [105, 113], [105, 229]]
};

// ---- 公用母题 ----
// 水波：一排连续小弧
function wave(x1, x2, y, r, c, w) { var s = "", d = "M" + f(x1) + " " + f(y); for (var x = x1; x < x2 - 0.1; x += r * 2) d += " a" + f(r) + " " + f(r) + " 0 0 1 " + f(r * 2) + " 0"; return s + path(d, w || 0.8, c || O); }
function waves(x1, x2, y, n, seed) { var s = "", rng = srnd(seed || 7); for (var i = 0; i < n; i++) s += wave(x1 + rng() * 12, x2 - rng() * 12, y + i * 7, 5 + i, i % 2 ? R : O, i % 2 ? 1 : 0.6); return s; }
// 心形：两段贝塞尔，浅底加红排线
function heart(cx, cy, s) {
  var d = "M" + f(cx) + " " + f(cy + s * 0.9) + " C" + f(cx - s * 1.4) + " " + f(cy - s * 0.2) + " " + f(cx - s * 0.9) + " " + f(cy - s * 1.1) + " " + f(cx) + " " + f(cy - s * 0.35) +
    " C" + f(cx + s * 0.9) + " " + f(cy - s * 1.1) + " " + f(cx + s * 1.4) + " " + f(cy - s * 0.2) + " " + f(cx) + " " + f(cy + s * 0.9) + " Z";
  return path(d, 0, "none", P) + path(d, 0, "none", "HATCHR") + path(d, 1.9, R);
}
// 帆：横线上的三角帆
function sail(x, y, h, k) { return pg([[x, y], [x, y - h], [x + h * 0.7, y]], 1.1, R, k ? "HATCH" : P) + ln(x - 4, y, x + h * 0.7 + 6, y, 1.2); }
// 王冠：弧 + 三尖
function crown(cx, cy, w, c) { return pg([[cx - w, cy], [cx - w, cy - 7], [cx - w / 2, cy - 2], [cx, cy - 10], [cx + w / 2, cy - 2], [cx + w, cy - 7], [cx + w, cy]], 1.4, c || R, P) + dot(cx, cy - 10, 1.4) + dot(cx - w, cy - 7, 1.1) + dot(cx + w, cy - 7, 1.1); }
// 尖顶小山 / 帐篷
function peak(x, y, w, h, k) { return T([x - w, y], [x + w, y], [x, y - h], { wedge: 2, hk: k == null ? 0 : k, inset: true, w: 1.2 }); }
// 每张小牌共用的散落装饰：一个错位方框、星点、十字、一段珠链、一组梯级线，位置由种子决定
function deco(seed, o) {
  o = o || {}; var rng = srnd(seed), s = "";
  var fx = 24 + rng() * 60, fy = 48 + rng() * 110, fw = 70 + rng() * 70, fh = 80 + rng() * 110;
  if (!o.noFrame) s += frame(fx, fy, fw, fh, rng() < 0.5 ? O : R, 0.6, seed + 1);
  s += spark(16 + rng() * 178, 50 + rng() * 250, 2.6 + rng() * 2) + spark(16 + rng() * 178, 50 + rng() * 250, 2 + rng() * 2);
  s += cross(16 + rng() * 178, 50 + rng() * 250, 2.6, rng() < 0.5 ? O : R);
  var cy = 60 + rng() * 230, cx = 14 + rng() * 120; s += chain(cx, cy, cx + 24 + rng() * 40, cy);
  var lx = rng() < 0.5 ? 12 : 176; s += ladder(lx, 70 + rng() * 180, 22, 3, 5);
  if (rng() < 0.5) s += dotsL(14, 300, 196, 300);
  return s;
}

// ---- 宫廷牌：碎晶“人形” ----
function court(suit, rank, seed) {
  var s = "", gx, gy, ga, gs = 1;
  if (rank === 11) {
    // 侍从：单个小形体立在地面，符号举在一侧，一道梯级地线
    s += ladder(30, 262, 150, 3, 6) + frame(50, 110, 110, 150, O, 0.6, seed + 3);
    s += crystal(seed, [78, 262], [132, 262], [105, 196], 9, 270, { bounds: [56, 130, 156, 264], cap: 38, w0: 1.6, split: 300 });
    s += knock([[105, 150], [105, 128]], 1.2) + dot(105, 126, 1.6) + halo(105, 134, 8, seed + 4, { n: 10, max: 10, min: 4, aw: 0.01, a0: 180, a1: 360 });
    gx = 148; gy = 196; ga = 12; gs = 1.05;
    s += dotsL(60, 283, 150, 283) + spark(40, 90, 3.5) + spark(170, 100, 2.6);
  } else if (rank === 12) {
    // 骑士：沿对角线冲锋的团块，身后拖出速度线
    s += crystal(seed, [34, 270], [96, 262], [74, 196], 16, 330, { bounds: [20, 90, 182, 286], cap: 54, hang: 0.18, w0: 1.8, split: 450, hmax: 1.6 });
    for (var i = 0; i < 6; i++) s += dash(14, 150 + i * 22, 44 + i * 8, 150 + i * 22 - 20, O);
    s += ln(20, 288, 180, 288, 1.2) + dotsL(30, 294, 170, 294) + halo(160, 96, 8, seed + 4, { n: 14, max: 12, min: 4, aw: 0.01 });
    gx = 156; gy = 140; ga = -32; gs = 1.1;
  } else if (rank === 13) {
    // 王后：宽底的坐姿团块，上方一道王冠弧与垂珠，符号在侧
    s += frame(40, 120, 130, 170, R, 1, seed + 3);
    s += crystal(seed, [48, 290], [162, 290], [105, 176], 16, 270, { bounds: [36, 120, 176, 292], cap: 48, w0: 1.7, split: 260, depth: 3, hang: 0.1 });
    s += arc(105, 132, 24, 200, 340, 1.8) + arc(105, 132, 30, 215, 325, 0.5, O) + fringe(84, 126, 110, seed + 5, 5, 6, 16);
    s += dot(105, 108, 2) + spark(105, 94, 4) + knock([[81, 130], [129, 130]], 1.6);
    gx = 162; gy = 218; ga = 0; gs = 1.05;
  } else {
    // 国王：正面的宝座方框与团块，上方王冠，两侧立柱
    s += frame(52, 96, 106, 192, R, 1.3, seed + 3) + ladder(60, 104, 90, 3, 5, O);
    s += ln(58, 96, 58, 292, 1.4) + ln(152, 96, 152, 292, 1.4) + bead(58, 92, 0) + bead(152, 92, 0);
    s += crystal(seed, [60, 290], [150, 290], [105, 160], 18, 270, { bounds: [54, 112, 156, 292], cap: 44, tone: "dark", w0: 1.8, split: 380 });
    s += crown(105, 118, 18) + halo(105, 112, 20, seed + 4, { a0: 190, a1: 350, n: 12, max: 10, min: 4, aw: 0.01 });
    gx = 172; gy = 196; ga = 0; gs = 1;
  }
  return s + glyph(suit, gx, gy, gs, ga);
}

// ---- 点数牌：每张一个传统场景的抽象母题 ----
const PIP = {
  wands: {
    1: function () { return halo(105, 120, 8, 401, { n: 20, max: 18, min: 6, aw: 0.01 }) + crystal(402, [60, 296], [150, 296], [105, 232], 10, 270, { bounds: [36, 206, 174, 298], cap: 40, split: 300 }) + ladder(24, 150, 36, 4, 7) + wand(105, 182, 92, 0, 1.6) + dotsL(70, 270, 140, 270, O) + frame(34, 84, 142, 150, O, 0.6, 403); },
    2: function () { return crystal(412, [24, 298], [186, 298], [105, 250], 12, 90, { bounds: [12, 236, 198, 300], cap: 44, tone: "dark", split: 260 }) + ci(105, 150, 17, 1.7, R, P) + sector(105, 150, 0, 17, 180, 270, 0) + arc(105, 150, 11, 0, 150, 0.6, O) + reticle(105, 150, 2.5) + pips("wands", [[60, 172], [150, 172]], 1) + ladder(90, 90, 30, 3, 5) + spark(105, 108, 3.5); },
    3: function () { return halo(164, 80, 10, 413, { n: 18, max: 14, min: 4 }) + ln(14, 226, 196, 226, 1.3) + waves(20, 190, 238, 3, 414) + sail(36, 224, 18) + sail(74, 224, 12, 1) + sail(150, 224, 15) + crystal(415, [24, 300], [120, 300], [60, 266], 8, 0, { bounds: [12, 258, 150, 302], cap: 30, split: 200 }) + pips("wands", [[64, 178], [105, 158], [146, 178]], 1); },
    4: function () { return crystal(414, [16, 64], [82, 64], [48, 112], 8, 90, { bounds: [10, 50, 112, 140], cap: 36, split: 220 }) + path("M54 160 Q105 120 156 160", 1.4) + path("M54 164 Q105 128 156 164", 0.5, O) + fringe(60, 150, 150, 416, 7, 6, 18) + pips("wands", [[54, 196], [88, 196], [122, 196], [156, 196]], 1) + ladder(40, 232, 130, 3, 6) + dotsL(30, 260, 180, 260); },
    5: function () { var a = [-38, 26, -8, 44, -62]; return pips("wands", [[76, 168], [128, 162], [104, 184], [88, 200], [136, 204]], 1.25, function (i) { return a[i]; }) + spark(104, 176, 4) + spark(126, 150, 3) + T([20, 270], [60, 300], [10, 300], { fill: "H", hk: 1 }) + T([150, 300], [200, 300], [190, 262], { fill: "H", hk: 0 }) + chain(40, 90, 110, 90) + dotsL(100, 110, 180, 110); },
    6: function () { return wreath(105, 116, 17, 13, 12) + wand(105, 166, 64, 0, 1.15) + pips("wands", [[44, 202], [68, 206], [142, 206], [166, 202], [105, 264]], 0.8, function (i) { return [-8, 6, -6, 8, 0][i]; }) + halfDisk(105, 300, 46, 180, 360, 2) + chain(40, 92, 70, 92) + chain(140, 92, 170, 92); },
    7: function () { return crystal(417, [26, 142], [184, 142], [105, 176], 10, 90, { bounds: [14, 136, 196, 206], cap: 40, tone: "dark", split: 280 }) + wand(105, 110, 56, 0, 1.05) + pips("wands", [[42, 262], [68, 258], [94, 262], [120, 258], [146, 262], [172, 258]], 0.72, function (i) { return i % 2 ? 14 : -14; }) + dotsL(30, 300, 180, 300) + spark(40, 92, 3); },
    8: function () { var p = []; for (var i = 0; i < 8; i++) p.push([38 + i * 19, 228 - i * 19]); var s = ""; for (var j = 0; j < 5; j++) s += dash(20 + j * 14, 270 - j * 10, 120 + j * 14, 170 - j * 10); return s + pips("wands", p, 0.78, 52) + waves(20, 190, 272, 3, 418) + crystal(419, [150, 300], [200, 300], [180, 262], 5, 90, { bounds: [140, 250, 204, 302], cap: 24 }); },
    9: function () { var p = []; for (var i = 0; i < 8; i++) p.push([40 + i * 19, 150]); return pips("wands", p, 0.72) + ln(20, 184, 190, 184, 1.1) + dotsL(30, 190, 180, 190, O) + crystal(420, [30, 298], [110, 298], [70, 226], 10, 270, { bounds: [18, 206, 120, 300], cap: 40, split: 260 }) + wand(146, 246, 66, 0, 1.15) + knock([[70, 236], [70, 250]], 1.4) + spark(170, 110, 3); },
    10: function () { var s = crystal(421, [50, 300], [150, 300], [100, 250], 10, 270, { bounds: [30, 234, 170, 302], cap: 40, tone: "dark", split: 260 }); for (var i = 0; i < 10; i++) { var a = -40 + i * 8.9, L = 60, bx = 96 + i * 2, by = 262; s += wand(bx + Math.sin(a * Math.PI / 180) * L / 2, by - Math.cos(a * Math.PI / 180) * L / 2, L, a, 0.9); } return s + ladder(150, 100, 30, 4, 6) + peak(44, 150, 26, 34, 1) + dotsL(20, 288, 190, 288); }
  },
  cups: {
    1: function () { return spark(105, 112, 5) + sliver(80, 96, 105, 118, 3) + sliver(130, 96, 105, 118, 3) + cupG(105, 164, 20) + path("M105 140 C 90 150 80 170 76 204", 0.8) + path("M105 140 C 120 150 130 170 134 204", 0.8) + path("M105 140 C 98 158 96 180 95 204", 0.5, O) + path("M105 140 C 112 158 114 180 115 204", 0.5, O) + ln(105, 140, 105, 206, 0.8) + waves(24, 186, 232, 3, 431) + dot(76, 204, 1.2) + dot(134, 204, 1.2) + ladder(24, 250, 162, 4, 7) + halo(105, 124, 24, 432, { n: 18, max: 12, min: 4, aw: 0.01, a0: 190, a1: 350 }); },
    2: function () { return ln(105, 96, 105, 212, 1.4) + sliver(76, 104, 105, 120, 3.2) + sliver(134, 104, 105, 120, 3.2) + ci(105, 96, 5, 1.3, R, P) + halo(105, 96, 5, 433, { n: 12, max: 8, min: 3, aw: 0.01, a0: 190, a1: 350 }) + path("M92 130 C 120 150 90 180 118 212", 0.8) + path("M118 130 C 90 150 120 180 92 212", 0.8) + pips("cups", [[62, 206], [148, 206]], 1.05) + ln(50, 232, 160, 232, 1.1) + dotsL(60, 240, 150, 240, O); },
    3: function () { return ci(105, 168, 58, 0.6, O, "none", ' stroke-dasharray="2 2.5"') + pips("cups", [[105, 118], [64, 196], [146, 196]], 1.05, function (i) { return [0, -18, 18][i]; }) + spark(105, 70, 4) + spark(50, 130, 3) + spark(160, 130, 3) + chain(66, 248, 144, 248) + sliver(40, 272, 64, 282, 2) + sliver(88, 272, 64, 282, 2) + sliver(126, 272, 150, 282, 2) + sliver(174, 272, 150, 282, 2) + ladder(70, 290, 70, 2, 6); },
    4: function () { return crystal(424, [16, 72], [96, 72], [56, 138], 10, 90, { bounds: [10, 56, 110, 160], cap: 38, tone: "light", split: 220 }) + knock([[56, 140], [56, 262]], 1.6) + ladder(20, 262, 170, 3, 7) + pips("cups", [[62, 254], [105, 254], [148, 254]], 0.9) + ci(164, 110, 14, 0.9, O, "none", ' stroke-dasharray="2 2"') + ci(164, 110, 9, 0.5, O) + cupG(164, 154, 10) + dotsL(164, 124, 164, 142, O) + spark(140, 180, 3); },
    5: function () { return arc(150, 300, 110, 212, 300, 1.4) + arc(150, 300, 102, 220, 292, 0.5, O) + ladder(20, 268, 170, 3, 7) + rot(50, 244, 150, cupG(50, 244, 10)) + rot(84, 250, 162, cupG(84, 250, 10)) + rot(118, 244, 148, cupG(118, 244, 10)) + dotsP("M44 254 C 40 262 30 266 24 270") + dotsP("M112 254 C 108 262 100 266 96 268") + pips("cups", [[150, 212], [176, 212]], 0.85) + crystal(425, [60, 160], [130, 160], [95, 100], 8, 270, { bounds: [40, 80, 150, 162], cap: 34, tone: "dark", split: 220 }); },
    6: function () { return frame(36, 70, 138, 210, O, 0.6, 426) + pips("cups", LAY[6], 0.82) + LAY[6].map(function (p) { return spark(p[0], p[1] - 4, 3.2); }).join("") + ladder(14, 290, 60, 3, 5) + crystal(427, [150, 300], [202, 300], [176, 250], 6, 90, { bounds: [140, 236, 204, 302], cap: 26 }) + stalk(26, 280, 30) + stalk(184, 230, 26); },
    7: function () { var p = [[40, 104], [105, 90], [170, 104], [54, 174], [156, 174], [78, 244], [132, 244]], m = [spark(40, 86, 4), crescent(105, 72, 6, 2, -2, 5), cross(170, 86, 3), reticle(54, 156, 3), star5(156, 156, 5, -90, 1, R, P), bead(78, 226, 2), dot(132, 226, 2.2)]; return arc(105, 150, 86, 200, 340, 0.6, O, ' stroke-dasharray="2 2.5"') + arc(105, 160, 70, 190, 350, 0.5, O, ' stroke-dasharray="1 3"') + pips("cups", p, 0.78) + m.join("") + crystal(428, [20, 300], [72, 300], [46, 230], 8, 270, { bounds: [12, 214, 84, 302], cap: 36, tone: "dark", split: 200 }); },
    8: function () { var p = [[45, 262], [75, 262], [105, 262], [135, 262], [165, 262], [60, 206], [90, 206], [150, 206]]; return crescent(44, 88, 15, 6, -6, 13) + peak(150, 120, 34, 46, 1) + peak(190, 120, 24, 30, 0) + ln(20, 282, 190, 282, 1.2) + pips("cups", p, 0.72) + dotsP("M120 196 C 128 170 150 150 176 134") + ladder(20, 290, 170, 2, 6); },
    9: function () { var p = []; for (var i = 0; i < 9; i++) p.push(onC(105, 268, 82, 200 + i * 17.5)); return arc(105, 268, 100, 196, 344, 1.2) + arc(105, 268, 64, 202, 338, 0.5, O) + pips("cups", p, 0.7) + crystal(429, [50, 300], [160, 300], [105, 236], 12, 270, { bounds: [36, 222, 174, 302], cap: 40, tone: "light", split: 260 }) + chain(70, 296, 140, 296) + spark(105, 84, 4); },
    10: function () { var p = []; for (var i = 0; i < 10; i++) p.push(onC(105, 232, 92, 192 + i * 17.3)); return arc(105, 232, 110, 188, 352, 1.5) + arc(105, 232, 76, 196, 344, 0.5, O) + pips("cups", p, 0.62) + crystal(430, [56, 298], [154, 298], [105, 236], 10, 270, { bounds: [40, 222, 170, 300], cap: 40, split: 260 }) + ln(20, 300, 190, 300, 1.2) + drop(40, 258, 16, 3) + drop(170, 262, 14, 0) + spark(105, 72, 4); }
  },
  swords: {
    1: function () { return halo(105, 118, 22, 441, { n: 22, max: 16, min: 5, aw: 0.01 }) + crown(105, 128, 16) + sliver(82, 150, 92, 132, 2.4) + sliver(128, 150, 118, 132, 2.4) + sword(105, 184, 92, 0, 1.4) + crystal(442, [20, 300], [96, 300], [58, 256], 8, 270, { bounds: [12, 240, 110, 302], cap: 32, split: 220 }) + crystal(443, [120, 300], [196, 300], [160, 262], 7, 270, { bounds: [112, 244, 200, 302], cap: 28, split: 220 }) + dotsL(30, 236, 180, 236, O); },
    2: function () { return crescent(166, 66, 12, 4, -4, 11) + waves(20, 190, 270, 3, 444) + crystal(445, [70, 262], [140, 262], [105, 216], 8, 270, { bounds: [60, 150, 150, 264], cap: 30, tone: "dark", split: 200 }) + knock([[52, 112], [158, 112]], 2.4) + sword(84, 178, 62, -24, 1.05) + sword(126, 178, 62, 24, 1.05) + ladder(24, 236, 160, 2, 7); },
    3: function () { var s = ""; for (var i = 0; i < 7; i++) s += dash(30 + i * 24, 60, 18 + i * 24, 100) + dot(18 + i * 24, 104, 0.8); return sector(105, 40, 40, 70, 20, 160, 1) + s + heart(105, 176, 44) + sword(90, 160, 74, -18, 1.05) + sword(105, 170, 76, 0, 1.05) + sword(120, 160, 74, 18, 1.05) + dotsL(30, 280, 180, 280); },
    4: function () { return sword(126, 74, 56, 90, 0.8) + sword(126, 98, 56, 90, 0.8) + sword(126, 122, 56, 90, 0.8) + halfDisk(176, 118, 18, 180, 360, 0) + frame(40, 202, 130, 62, R, 1.3, 446) + crystal(447, [48, 258], [162, 258], [105, 232], 8, 0, { bounds: [44, 208, 166, 260], cap: 24, tone: "light", split: 160 }) + sword(105, 186, 72, 90, 1) + ladder(40, 276, 130, 3, 6); },
    5: function () { var s = ""; for (var i = 0; i < 6; i++) s += dash(120 + i * 12, 60, 180 + i * 12, 90); return s + T([130, 70], [190, 60], [170, 110], { fill: "H", hk: 1, inset: true }) + T([170, 110], [190, 60], [200, 120], { wedge: 0, hk: 0 }) + sword(60, 200, 60, -12, 0.95) + sword(82, 190, 60, 4, 0.95) + sword(104, 204, 60, -22, 0.95) + sword(152, 256, 52, 72, 0.85) + sword(166, 234, 52, 104, 0.85) + waves(20, 190, 290, 2, 448) + crystal(449, [30, 282], [90, 282], [60, 236], 7, 270, { bounds: [20, 220, 100, 284], cap: 28, split: 180 }); },
    6: function () { var p = []; for (var i = 0; i < 6; i++) p.push([58 + i * 18.4, 216]); return path("M28 248 Q105 292 182 248", 1.8) + ln(28, 248, 182, 248, 1.2) + path("M34 252 Q105 282 176 252", 0.5, O) + pips("swords", p, 0.7) + T([62, 246], [92, 246], [77, 212], { fill: "H", hk: 1 }) + T([112, 246], [136, 246], [124, 220], { fill: "P", inset: true }) + ln(176, 180, 192, 288, 1.1) + waves(14, 196, 276, 3, 450) + spark(40, 110, 3); },
    7: function () { var s = ""; for (var i = 0; i < 5; i++) s += sword(66 + i * 15, 204 - i * 7, 56, 28, 0.82); return peak(44, 130, 30, 48, 1) + peak(92, 130, 26, 38, 0) + peak(150, 130, 34, 52, 2) + ln(14, 130, 196, 130, 1.1) + s + sword(162, 236, 56, 0, 0.82) + sword(180, 236, 56, 0, 0.82) + dotsP("M30 290 C 60 270 80 262 100 250") + ladder(20, 282, 50, 3, 6); },
    8: function () { var p = []; for (var i = 0; i < 8; i++) { var q = onC(105, 180, 70, i * 45 + 22.5); p.push([q[0], q[1] * 0.88 + 180 * 0.12]); } return pips("swords", p, 0.72) + crystal(451, [84, 214], [126, 214], [105, 150], 8, 270, { bounds: [70, 124, 140, 216], cap: 28, tone: "dark", split: 160 }) + knock([[78, 168], [132, 168]], 1.6) + knock([[80, 186], [130, 186]], 1.6) + waves(20, 190, 272, 3, 452) + crystal(453, [120, 70], [180, 70], [150, 110], 6, 90, { bounds: [112, 56, 190, 120], cap: 24 }); },
    9: function () { var s = ""; for (var i = 0; i < 9; i++) s += sword(124, 64 + i * 20, 60, 90, 0.72); return s + frame(22, 236, 166, 52, R, 1.3, 454) + crystal(455, [28, 286], [96, 286], [62, 248], 8, 0, { bounds: [24, 238, 110, 288], cap: 22, tone: "dark", split: 140 }) + hpg([[100, 250], [186, 250], [186, 286], [100, 286]], 1) + ladder(100, 258, 80, 3, 7, O) + cross(176, 44, 3); },
    10: function () { var s = ""; for (var i = 0; i < 10; i++) s += sword(32 + i * 16.2, 196, 56, 180, 0.72); return halo(105, 90, 18, 456, { a0: 180, a1: 360, n: 16, max: 14, min: 5 }) + ln(14, 110, 196, 110, 1.2) + s + crystal(457, [20, 300], [190, 300], [105, 236], 14, 90, { bounds: [12, 226, 198, 302], cap: 40, tone: "dark", split: 260 }) + dotsL(30, 150, 180, 150, O); }
  },
  pentacles: {
    1: function () { return halo(105, 150, 32, 461, { n: 24, max: 16, min: 5, aw: 0.01 }) + pent(105, 150, 30) + arc(105, 300, 84, 200, 340, 1.4) + arc(105, 300, 76, 206, 334, 0.5, O) + crystal(462, [10, 300], [70, 300], [40, 236], 8, 270, { bounds: [8, 224, 80, 302], cap: 30, tone: "light", split: 200 }) + crystal(463, [140, 300], [200, 300], [170, 236], 8, 270, { bounds: [130, 224, 202, 302], cap: 30, tone: "light", split: 200 }) + dotsP("M105 300 C 105 280 100 262 105 236") + peak(105, 226, 10, 14, 0); },
    2: function () { return path("M105 176 C 55 110 55 240 105 176 C 155 110 155 240 105 176", 1.4) + path("M105 176 C 62 120 62 232 105 176 C 148 120 148 232 105 176", 0.5, O) + pent(68, 150, 13) + pent(142, 202, 13) + waves(14, 196, 262, 3, 464) + sail(30, 258, 16) + sail(160, 258, 12, 1) + spark(105, 92, 4); },
    3: function () { return path("M36 214 L36 134 Q105 48 174 134 L174 214", 1.6) + path("M44 214 L44 138 Q105 62 166 138 L166 214", 0.5, O) + ladder(36, 220, 138, 3, 6) + pent(105, 104, 12) + pent(70, 164, 12) + pent(140, 164, 12) + ln(105, 116, 70, 152, 0.5, O) + ln(105, 116, 140, 152, 0.5, O) + ln(82, 164, 128, 164, 0.5, O) + frame(60, 250, 50, 36, O, 0.6, 465) + ladder(66, 256, 36, 3, 5, O) + crystal(466, [120, 288], [180, 288], [150, 240], 7, 270, { bounds: [112, 228, 186, 290], cap: 26, split: 180 }); },
    4: function () { return peak(34, 90, 16, 24, 0) + peak(176, 90, 18, 28, 1) + frame(56, 132, 98, 150, R, 1.2, 467) + crystal(468, [66, 280], [144, 280], [105, 200], 10, 270, { bounds: [58, 136, 152, 282], cap: 36, tone: "dark", split: 220 }) + pent(105, 86, 11) + pent(105, 176, 14) + pent(66, 264, 11) + pent(144, 264, 11) + dotsL(40, 296, 170, 296); },
    5: function () { var d = "M58 190 L58 128 A47 47 0 0 1 152 128 L152 190 Z", s = "", rng = srnd(469); for (var i = 0; i < 26; i++) s += dot(14 + rng() * 182, 50 + rng() * 150, 0.9, O); return path(d, 0, "none", P) + path(d, 0, "none", "HATCH") + path(d, 1.8, R) + pent(105, 108, 9) + pent(82, 136, 9) + pent(128, 136, 9) + pent(92, 166, 9) + pent(118, 166, 9) + s + crystal(470, [16, 300], [80, 300], [48, 230], 8, 270, { bounds: [10, 214, 100, 302], cap: 32, tone: "dark", split: 200 }) + ln(96, 232, 84, 298, 1.3) + ln(92, 240, 104, 240, 1.3) + ladder(110, 262, 80, 3, 7); },
    6: function () { return ln(105, 72, 105, 108, 1.4) + dot(105, 70, 1.6) + ln(62, 108, 148, 108, 1.8) + ln(62, 108, 62, 134, 0.6, O) + ln(148, 108, 148, 128, 0.6, O) + arc(62, 134, 13, 0, 180, 1.3) + arc(148, 128, 13, 0, 180, 1.3) + pent(40, 200, 10) + pent(70, 200, 10) + pent(140, 200, 10) + pent(170, 200, 10) + pent(55, 250, 10) + pent(155, 250, 10) + halfDisk(105, 300, 40, 180, 360, 0) + spark(105, 160, 4); },
    7: function () { return crystal(471, [30, 252], [122, 252], [76, 134], 14, 270, { bounds: [18, 110, 134, 256], cap: 40, tone: "light", split: 280 }) + path("M60 292 C 70 240 60 180 82 126", 1.2) + pent(50, 170, 8) + pent(86, 150, 8) + pent(70, 212, 8) + pent(102, 190, 8) + pent(44, 236, 8) + pent(96, 236, 8) + pent(162, 274, 9) + ln(152, 148, 176, 284, 1.5) + ln(144, 154, 160, 144, 1.5) + ladder(20, 292, 170, 2, 6) + spark(160, 90, 3.5); },
    8: function () { var s = ""; for (var i = 0; i < 7; i++) s += pent(150, 76 + i * 28, 8); return s + ln(150, 68, 150, 252, 0.5, O) + frame(30, 210, 86, 46, R, 1.2, 472) + pent(72, 232, 12) + ln(94, 226, 108, 220, 1.2) + dot(108, 220, 1.2) + crystal(473, [44, 208], [100, 208], [72, 150], 8, 270, { bounds: [36, 120, 110, 210], cap: 28, tone: "dark", split: 160 }) + ladder(30, 266, 86, 3, 6) + spark(40, 100, 3); },
    9: function () { var p = [[56, 102], [105, 102], [154, 102], [56, 174], [154, 174], [56, 246], [105, 246], [154, 246], [105, 174]]; return wreath(105, 174, 72, 94, 18) + pips("pentacles", p, 0.68) + sliver(150, 64, 130, 72, 3) + spark(128, 72, 3.5) + stalk(30, 290, 24) + stalk(180, 290, 24) + ladder(70, 294, 70, 2, 5); },
    10: function () { var p = [[105, 76], [60, 108], [150, 108], [60, 166], [150, 166], [105, 138], [60, 226], [150, 226], [105, 196], [105, 258]], s = ""; [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [3, 6], [4, 7], [5, 8], [6, 7], [6, 8], [7, 8], [8, 9], [6, 9], [7, 9]].forEach(function (e) { s += ln(p[e[0]][0], p[e[0]][1], p[e[1]][0], p[e[1]][1], 0.5, O); }); return arc(105, 176, 100, 196, 344, 0.6, O, ' stroke-dasharray="2 2.5"') + s + pips("pentacles", p, 0.62) + crystal(474, [14, 300], [64, 300], [38, 244], 7, 270, { bounds: [10, 230, 70, 302], cap: 26, tone: "dark", split: 160 }) + peak(176, 300, 10, 12, 0) + peak(192, 300, 8, 10, 1) + ln(70, 300, 200, 300, 1.1); }
  }
};

// 点数牌种子：花色序号 * 100 + 点数，保证每张牌的散落装饰不同
export function minorArt(suit, rank) {
  var si = SUIT_ORDER.indexOf(suit), seed = 1000 + si * 100 + rank * 7;
  if (rank >= 11) return deco(seed, { noFrame: true }) + court(suit, rank, seed + 50);
  return deco(seed) + PIP[suit][rank]();
}
