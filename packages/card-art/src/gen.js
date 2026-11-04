// 墨星牌牌面生成器：从 demo/cards.html 的 ART 块移植，纯字符串拼接，不碰 DOM。
// 纸色 BG 与主线 R 固定；O / P / A / TXT 由 usePal 按元素切换（ES 模块实时绑定，调用时取当前值）。
// 纸色与深朱红主线全套固定；副线 O、浅底 P、点缀色 A、英文小字 TXT 按牌的元素换色（见 PAL / ELEMENT）
export let BG = "#f7f1ea", R = "#c8321f", O = "#e9762f", P = "#f8d6bb", A = "#c8321f", TXT = "#e9762f";
export const GOLD = "#c99a2e";
export const PAL = {
  mono: { O: "#e9762f", P: "#f8d6bb", A: "#c8321f", T: "#e9762f" },
  fire: { O: "#e9762f", P: "#f8d6bb", A: GOLD, T: GOLD },
  water: { O: "#2f6f86", P: "#cfe3e6", A: GOLD, T: "#2f6f86" },
  air: { O: "#5a4e9c", P: "#dcd8ee", A: GOLD, T: "#5a4e9c" },
  earth: { O: "#6b7a3a", P: "#e2e4c8", A: GOLD, T: "#6b7a3a" },
  back: { O: GOLD, P: "#f1e3c2", A: "#c8321f", T: GOLD }
};
export const ELEMENT = {
  "IV": "fire", "VIII": "fire", "X": "fire", "XIV": "fire", "XVI": "fire", "XIX": "fire", "XX": "fire",
  "II": "water", "VII": "water", "XII": "water", "XIII": "water", "XVIII": "water",
  "0": "air", "I": "air", "VI": "air", "XI": "air", "XVII": "air",
  "III": "earth", "V": "earth", "IX": "earth", "XV": "earth", "XXI": "earth"
};
export const ELEMENT_ZH = { fire: "火", water: "水", air: "风", earth: "土" };
export function usePal(p) { p = p || PAL.mono; O = p.O; P = p.P; A = p.A; TXT = p.T; }
export const D2R = Math.PI / 180;
export function f(n) { return (+n).toFixed(1); }
// 固定种子随机数，保证每次渲染一致
export function srnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function pts(a) { return a.map(function (p) { return f(p[0]) + "," + f(p[1]); }).join(" "); }
export function ln(x1, y1, x2, y2, w, c, ex) { return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + (c || R) + '" stroke-width="' + (w || 0.8) + '"' + (ex || "") + '/>'; }
export function ci(cx, cy, r, w, c, fill, ex) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" stroke="' + (c || R) + '" stroke-width="' + (w == null ? 0.8 : w) + '" fill="' + (fill || "none") + '"' + (ex || "") + '/>'; }
export function pg(a, w, c, fill, ex) { return '<polygon points="' + pts(a) + '" stroke="' + (c || R) + '" stroke-width="' + (w == null ? 0.8 : w) + '" fill="' + (fill || "none") + '"' + (ex || "") + '/>'; }
export function pl(a, w, c, ex) { return '<polyline points="' + pts(a) + '" stroke="' + (c || R) + '" stroke-width="' + (w || 0.8) + '"' + (ex || "") + '/>'; }
export function path(d, w, c, fill, ex) { return '<path d="' + d + '" stroke="' + (c || R) + '" stroke-width="' + (w || 0.8) + '" fill="' + (fill || "none") + '"' + (ex || "") + '/>'; }
// 浅橙底加排线：k 为 0 橙 45°、1 红 -40°、2 橙水平
export function hpg(a, k) { return pg(a, 0, "none", P) + pg(a, 0, "none", k === 1 ? "HATCHR" : k === 2 ? "HATCHH" : "HATCH"); }
export function dotsL(x1, y1, x2, y2, c) { return ln(x1, y1, x2, y2, 1.3, c || R, ' stroke-dasharray="0.1 3.2"'); }
export function dotsP(d, c) { return path(d, 1.3, c || R, "none", ' stroke-dasharray="0.1 3.2"'); }
export function dash(x1, y1, x2, y2, c) { return ln(x1, y1, x2, y2, 0.5, c || O, ' stroke-dasharray="2 2.5"'); }
export function dot(x, y, r, c) { return ci(x, y, r || 1, 0, c || R, c || R); }
// 端点带圆点的线
export function tl(x1, y1, x2, y2, w, c) { return ln(x1, y1, x2, y2, w, c) + dot(x2, y2, 1, c); }
export function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
export function area2(a) { var s = 0; for (var i = 0; i < a.length; i++) { var p = a[i], q = a[(i + 1) % a.length]; s += p[0] * q[1] - q[0] * p[1]; } return s; }
// 凸多边形向内平移 d 得到的内缩多边形，失败时返回 null
export function inset(poly, d) {
  var n = poly.length, A = area2(poly), i; if (Math.abs(A) < 2) return null;
  var sg = A > 0 ? 1 : -1, L = [];
  for (i = 0; i < n; i++) { var p = poly[i], q = poly[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1; L.push([p[0] - dy / len * sg * d, p[1] + dx / len * sg * d, dx, dy]); }
  var out = [];
  for (i = 0; i < n; i++) { var a = L[(i - 1 + n) % n], b = L[i], cr = a[2] * b[3] - a[3] * b[2]; if (Math.abs(cr) < 1e-6) return null; var t = ((b[0] - a[0]) * b[3] - (b[1] - a[1]) * b[2]) / cr; out.push([a[0] + a[2] * t, a[1] + a[3] * t]); }
  return area2(out) * sg > 0 ? out : null;
}
// 三角碎面：外线、内缩副线、角楔排线、浅橙/橙/排线底、某条边的点线、某个顶点的圆点；返回 {f: 填色层, s: 线条层}
export function tri(A, B, C, o) {
  o = o || {}; var T = [A, B, C], fl = "", st = "", A2 = Math.abs(area2(T)), per = Math.hypot(B[0] - A[0], B[1] - A[1]) + Math.hypot(C[0] - B[0], C[1] - B[1]) + Math.hypot(A[0] - C[0], A[1] - C[1]);
  if (o.fill === "P") fl += pg(T, 0, "none", P); else if (o.fill === "O") fl += pg(T, 0, "none", O); else if (o.fill === "H") fl += hpg(T, o.hk);
  if (o.wedge != null) { var V = T[o.wedge], U = lerp(V, T[(o.wedge + 1) % 3], o.k || 0.42), W = lerp(V, T[(o.wedge + 2) % 3], o.k || 0.42); fl += hpg([V, U, W], o.hk); st += ln(U[0], U[1], W[0], W[1], 0.5, O); }
  st += pg(T, o.w || 1.2, o.c || R);
  if (o.inset) { var d = o.inset === true ? 2.8 : o.inset; if (d < A2 / per * 0.9) { var q = inset(T, d); if (q) st += pg(q, 0.5, o.c === O ? R : O); } }
  if (o.dots != null) { var p1 = T[o.dots], p2 = T[(o.dots + 1) % 3]; st += dotsL(p1[0], p1[1], p2[0], p2[1]); }
  if (o.vdot != null) st += dot(T[o.vdot][0], T[o.vdot][1], 1.2);
  return { f: fl, s: st };
}
export function T(A, B, C, o) { var t = tri(A, B, C, o); return t.f + t.s; }
// 悬垂圆珠：0 空心带芯、1 实心、2 橙空心带横杠、3 小水滴
export function bead(x, y, k, c) { c = c || R; k = (k || 0) % 4; return k === 0 ? ci(x, y, 2.6, 0.9, c, BG) + dot(x, y, 0.9, c) : k === 1 ? dot(x, y, 1.8, c) : k === 2 ? ci(x, y, 2.8, 0.8, A, P) + ln(x - 2.6, y + 5, x + 2.6, y + 5, 0.6, c) : pg([[x - 2.4, y - 1.5], [x + 2.4, y - 1.5], [x, y + 3.6]], 0.8, c, P); }
export function drop(x, y, len, k, c) { var r = (k || 0) % 4 === 1 ? 1.8 : 2.6; return ln(x, y, x, y + len - r, 0.7, c || R) + bead(x, y + len, k, c); }
// 一排长短不一的垂线，挂在 y 这条边下面
export function fringe(x1, x2, y, seed, n, lmin, lmax) {
  var rng = srnd(seed), s = "";
  for (var i = 0; i < n; i++) { var x = x1 + (x2 - x1) * ((i + 0.5) / n + (rng() - 0.5) * 0.6 / n), len = lmin + rng() * (lmax - lmin), k = Math.floor(rng() * 4), c = rng() < 0.3 ? O : R; s += drop(x, y, len, k, c); if (rng() < 0.4) s += dot(x, y, 1.1, c); }
  return s;
}
// 珠链：直线上等距圆点，每隔几颗换成小空心圆
export function chain(x1, y1, x2, y2, c) { var n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 4.6)), s = ""; for (var i = 0; i <= n; i++) { var p = lerp([x1, y1], [x2, y2], i / n); s += i % 4 === 2 ? ci(p[0], p[1], 1.7, 0.7, c || R, BG) : dot(p[0], p[1], 0.8, c); } return s; }
export function spark(cx, cy, s, c) { var k = 0.24; return pg([[cx, cy - s], [cx + s * k, cy - s * k], [cx + s, cy], [cx + s * k, cy + s * k], [cx, cy + s], [cx - s * k, cy + s * k], [cx - s, cy], [cx - s * k, cy - s * k]], 0.5, c || A, c || A); }
export function cross(x, y, s, c) { return ln(x, y - s, x, y + s * 1.6, 0.8, c || R) + ln(x - s * 0.7, y, x + s * 0.7, y, 0.8, c || R); }
export function reticle(x, y, r, c) { return ci(x, y, r, 0.9, c || R, BG) + ln(x - r * 1.7, y, x + r * 1.7, y, 0.6, c || R) + ln(x, y - r * 1.7, x, y + r * 1.7, 0.6, c || R); }
export function onC(cx, cy, r, deg) { var a = deg * D2R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
export function arc(cx, cy, r, d0, d1, w, c, ex) { var p = onC(cx, cy, r, d0), q = onC(cx, cy, r, d1); return path("M" + f(p[0]) + " " + f(p[1]) + " A" + f(r) + " " + f(r) + " 0 " + ((d1 - d0) % 360 > 180 ? 1 : 0) + " 1 " + f(q[0]) + " " + f(q[1]), w, c, "none", ex); }
// 细长浅橙薄片
export function sliver(ax, ay, bx, by, hw, c) { var dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l * hw, ny = dx / l * hw; return pg([[ax, ay], [bx + nx, by + ny], [bx - nx, by - ny]], 0.6, c || O, P); }
// 排线扇面：圆环的一段
export function sector(cx, cy, r1, r2, d0, d1, k) { var a = onC(cx, cy, r2, d0), b = onC(cx, cy, r2, d1), c = onC(cx, cy, r1, d1), d = onC(cx, cy, r1, d0), lg = d1 - d0 > 180 ? 1 : 0; var dd = "M" + f(a[0]) + " " + f(a[1]) + " A" + f(r2) + " " + f(r2) + " 0 " + lg + " 1 " + f(b[0]) + " " + f(b[1]) + " L" + f(c[0]) + " " + f(c[1]) + " A" + f(r1) + " " + f(r1) + " 0 " + lg + " 0 " + f(d[0]) + " " + f(d[1]) + " Z"; return path(dd, 0, "none", P) + path(dd, 0, "none", k === 1 ? "HATCHR" : k === 2 ? "HATCHH" : "HATCH") + path(dd, 0.6, O); }
// 半圆排线盘：浅橙底、排线、粗外弧、细内弧、几根径向线、越过端点的弦
export function halfDisk(cx, cy, r, d0, d1, k) {
  var s = sector(cx, cy, 0, r, d0, d1, k == null ? 2 : k) + arc(cx, cy, r, d0, d1, 1.4, R) + arc(cx, cy, r - 6, d0 + 6, d1 - 6, 0.5, O);
  for (var d = d0 + 30; d < d1; d += 30) { var p = onC(cx, cy, r + 4, d); s += ln(cx, cy, p[0], p[1], 0.45, O); }
  var a = onC(cx, cy, r + 8, d0), b = onC(cx, cy, r + 8, d1);
  return s + ln(a[0], a[1], b[0], b[1], 1, R) + dot(a[0], a[1], 1.2) + dot(b[0], b[1], 1.2);
}
// 放射日轮：断开的粗弧与细弧，长短不齐的射线，偶尔换成薄片或点尾
export function halo(cx, cy, r, seed, o) {
  o = o || {}; var rng = srnd(seed), s = "", a0 = o.a0 == null ? 0 : o.a0, a1 = o.a1 == null ? 360 : o.a1, n = o.n || 28, mn = o.min || 5, mx = o.max || 22, sp = a1 - a0;
  s += arc(cx, cy, r, a0 + sp * 0.08, a0 + sp * 0.52, o.aw || 1.7, R) + arc(cx, cy, r + 4, a0 + sp * 0.56, a1 - sp * 0.05, 0.55, O) + arc(cx, cy, r + 1.5, a0 + sp * 0.6, a0 + sp * 0.8, 1, R);
  for (var i = 0; i < n; i++) {
    var a = (a0 + sp * (i + 0.5) / n + (rng() - 0.5) * 5) * D2R, c = Math.cos(a), sn = Math.sin(a), r0 = r + 7 + rng() * 4, l = mn + rng() * (mx - mn); if (i % 5 === 2) l *= 1.7;
    if (i % 7 === 3) s += sliver(cx + c * (r0 + l * 1.25), cy + sn * (r0 + l * 1.25), cx + c * r0, cy + sn * r0, 1.8);
    else { s += ln(cx + c * r0, cy + sn * r0, cx + c * (r0 + l), cy + sn * (r0 + l), i % 2 ? 0.55 : 1.1, i % 3 ? R : O); if (rng() < 0.3) s += dot(cx + c * (r0 + l), cy + sn * (r0 + l), 1); }
  }
  return s;
}
// 错位方框：四边越过角点、长短不一，一角有准星，内侧两边有错开的副线
export function frame(x, y, w, h, c, wd, seed) {
  var rng = srnd(seed || 1), e = function () { return 4 + rng() * 10; }, c2 = c === O ? R : O, s = ""; c = c || R; wd = wd || 1;
  s += ln(x - e(), y, x + w + e(), y, wd, c) + ln(x - e(), y + h, x + w + e(), y + h, wd, c) + ln(x, y - e(), x, y + h + e(), wd, c) + ln(x + w, y - e(), x + w, y + h + e(), wd, c);
  s += ln(x + 3.5, y + 3.5, x + w * (0.4 + rng() * 0.4), y + 3.5, 0.5, c2) + ln(x + w - 3.5, y + h - 3.5, x + w - 3.5, y + h * (0.2 + rng() * 0.4), 0.5, c2);
  var k = Math.floor(rng() * 4), cx = k % 2 ? x + w : x, cy = k < 2 ? y : y + h;
  return s + reticle(cx, cy, 2.8, c) + dot(x + w + 6, y + h, 1.2, c) + dot(x - 6, y, 1.2, c);
}
// 梯级横线：n 根平行线，长度和粗细交替
export function ladder(x, y, w, n, gap, c) { var s = ""; for (var i = 0; i < n; i++) { var e = i % 2 ? 3 : 0; s += ln(x - e, y + i * gap, x + w + (i % 3 === 1 ? 5 : 0), y + i * gap, i % 2 ? 0.5 : 1, i % 2 ? O : (c || R)); if (i % 3 === 1) s += dot(x + w + 5, y + i * gap, 1); } return s; }
// 碎晶生长：从起始三角开始，每次在一条已有边上向外长出新三角，方向朝 dir 偏置；先铺填色层，再画线条层
export function crystal(seed, A, B, C, n, dir, o) {
  o = o || {}; var rng = srnd(seed), tris = [[A, B, C]], open = [], dv = [Math.cos(dir * D2R), Math.sin(dir * D2R)], bd = o.bounds || [6, 6, 204, 312], g = 0, i;
  for (i = 0; i < 3; i++) open.push([tris[0][i], tris[0][(i + 1) % 3], tris[0][(i + 2) % 3]]);
  while (tris.length <= n && open.length && g++ < n * 8) {
    var e = open.splice(open.length - 1 - Math.floor(rng() * Math.min(open.length, o.k || 4)), 1)[0], p = e[0], q = e[1], r = e[2], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    if (L < (o.minEdge || 9)) continue;
    var nx = -dy / L, ny = dx / L, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if ((r[0] - mx) * nx + (r[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
    if (nx * dv[0] + ny * dv[1] < (o.minDot == null ? -0.15 : o.minDot) && rng() < 0.85) continue;
    var hmin = o.hmin || 0.45, h = L * (hmin + rng() * ((o.hmax || 1.4) - hmin)); if (rng() < 0.15) h *= 1.8; h = Math.min(h, o.cap || 90);
    var t = 0.15 + 0.7 * rng(), ax, ay, ok = false;
    for (var k = 0; k < 5; k++) { ax = p[0] + dx * t + nx * h; ay = p[1] + dy * t + ny * h; if (ax > bd[0] && ax < bd[2] && ay > bd[1] && ay < bd[3]) { ok = true; break; } h *= 0.6; }
    if (!ok) continue;
    var nt = [p, q, [ax, ay]]; tris.push(nt); open.push([q, nt[2], p]); open.push([nt[2], p, q]);
  }
  // 大三角沿最长边再切成两片，切到两层，切出来的面各有各的样式；大三角本身的外轮廓最后加粗画一遍
  var pieces = [], big = [], sp = o.split || 650, depth = o.depth == null ? 2 : o.depth;
  function split(t, d) {
    var ar = Math.abs(area2(t)) / 2;
    if (d < depth && ar > sp && rng() < 0.85) {
      if (d === 0) big.push(t);
      var L = [0, 1, 2].map(function (i) { var a = t[i], b = t[(i + 1) % 3]; return Math.hypot(b[0] - a[0], b[1] - a[1]); }), i = L.indexOf(Math.max.apply(null, L));
      var a = t[i], b = t[(i + 1) % 3], c = t[(i + 2) % 3], m = lerp(a, b, 0.3 + rng() * 0.4);
      split([a, m, c], d + 1); split([m, b, c], d + 1);
    } else pieces.push(t);
  }
  tris.forEach(function (t) { split(t, 0); });
  var fl = "", st = "";
  pieces.forEach(function (t, j) {
    var r1 = rng(), r2 = rng(), ar = Math.abs(area2(t)) / 2, s2 = { w: j === 0 ? (o.w0 || 1.7) : 0.9 + rng() * 0.8, c: r2 < 0.22 ? O : R };
    // tone: dark 多用红排线，light 多留白和浅橙
    if (o.tone === "dark" && r1 < 0.42) { s2.fill = "H"; s2.hk = r2 < 0.7 ? 1 : 0; s2.inset = r2 < 0.3; }
    else if (o.tone === "light" && r1 < 0.42) { s2.inset = true; if (r2 < 0.35) s2.fill = "P"; }
    else if (r1 < 0.3) { s2.wedge = Math.floor(rng() * 3); s2.hk = r2 < 0.4 ? 1 : r2 < 0.7 ? 0 : 2; s2.inset = true; }
    else if (r1 < 0.44) { s2.fill = "P"; s2.inset = true; }
    else if (r1 < 0.52 && ar < 220) s2.fill = "O";
    else if (r1 < 0.62) { s2.fill = "H"; s2.hk = r2 < 0.5 ? 1 : 0; }
    else s2.inset = r2 < 0.75;
    if (rng() < 0.22) s2.dots = Math.floor(rng() * 3);
    if (rng() < 0.3) s2.vdot = 2;
    var tt = tri(t[0], t[1], t[2], s2); fl += tt.f; st += tt.s;
    if (o.hang && rng() < o.hang) { var v = t[0][1] > t[1][1] ? t[0] : t[1]; if (t[2][1] > v[1]) v = t[2]; st += drop(v[0], v[1], 8 + rng() * 26, Math.floor(rng() * 4), rng() < 0.3 ? O : R); }
  });
  big.forEach(function (t) { st += pg(t, o.w0 || 1.7, R); });
  return fl + st;
}
// 垫一道纸色粗线再画主线，让关键线条从碎晶里切出来
export function knock(a, w, c) { return pl(a, (w || 2) + 3, BG) + pl(a, w || 2, c || R); }
// 左右镜像：把 x<105 的一半复制到右边，用于严格对称的牌
export function mirror(s) { return s + '<g transform="matrix(-1 0 0 1 210 0)">' + s + '</g>'; }
// 杯：开口向上的半圆加杯脚
export function cup(cx, cy, r) { return path("M" + f(cx - r) + " " + f(cy) + " a" + f(r) + " " + f(r) + " 0 0 0 " + f(2 * r) + " 0 Z", 1.6, R, P) + path("M" + f(cx - r * 0.64) + " " + f(cy) + " a" + f(r * 0.64) + " " + f(r * 0.64) + " 0 0 0 " + f(r * 1.28) + " 0", 0.5, O) + ln(cx, cy + r, cx, cy + r * 2, 1) + ln(cx - r * 0.64, cy + r * 2, cx + r * 0.64, cy + r * 2, 1.2) + ln(cx - r - 4, cy, cx + r + 4, cy, 0.6, O); }
export function el(cx, cy, rx, ry, w, c, fl) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" stroke="' + (c || R) + '" stroke-width="' + (w || 1) + '" fill="' + (fl || "none") + '"/>'; }
// 五角星：rot 为第一个角的方向，90 则尖朝下
export function star5(cx, cy, r, rot, w, c, fl) { var p = []; for (var i = 0; i < 5; i++) p.push(onC(cx, cy, r, rot + i * 72)); return pg([p[0], p[2], p[4], p[1], p[3]], w || 1.8, c, fl); }
// 麦穗：向上的茎，顶端两侧交错的小薄片
export function stalk(x, y, len, c) { var s = ln(x, y, x, y - len, 0.8, c || R), top = y - len; for (var i = 0; i < 3; i++) { var yy = top + 2 + i * 4; s += sliver(x - 4.5, yy - 3, x, yy, 1.3) + sliver(x + 4.5, yy - 1, x, yy + 2, 1.3); } return s + dot(x, top, 1); }
// 四角四生物：0 天使（星与双翼）、1 鹰（V 形双翼）、2 狮（光鬃）、3 牛（环与双角），各带一个小方框
export function creature(k, x, y, seed) {
  var s = frame(x - 13, y - 13, 26, 26, O, 0.5, seed || 300 + k);
  if (k === 0) s += sliver(x - 13, y - 7, x - 3, y + 1, 2.2) + sliver(x + 13, y - 7, x + 3, y + 1, 2.2) + spark(x, y + 1, 4.5) + ci(x, y - 8, 2.2, 0.9, R, BG);
  else if (k === 1) s += sliver(x - 13, y - 9, x, y + 3, 2.4) + sliver(x + 13, y - 9, x, y + 3, 2.4) + dot(x, y - 5, 1.8) + ln(x, y + 3, x, y + 10, 0.9) + ln(x - 3, y + 10, x + 3, y + 10, 0.9);
  else if (k === 2) s += halo(x, y, 3, 310, { n: 14, max: 7, min: 3, aw: 0.01 }) + ci(x, y, 4.5, 1.3, R, P) + dot(x, y, 1.3);
  else s += ci(x, y + 2, 5, 1.3, R, P) + arc(x - 6, y - 2, 5, 170, 300, 1.3) + arc(x + 6, y - 2, 5, 240, 370, 1.3) + dot(x, y + 2, 1.3);
  return s;
}
// 椭圆花环：沿椭圆排一圈切向薄片，交替偏向内外
export function wreath(cx, cy, rx, ry, n) { var s = ""; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, px = cx + rx * Math.cos(t), py = cy + ry * Math.sin(t), tx = -rx * Math.sin(t), ty = ry * Math.cos(t), L = Math.hypot(tx, ty) || 1, o = i % 2 ? 3 : -3; tx /= L; ty /= L; var nx = Math.cos(t) * o, ny = Math.sin(t) * o; s += sliver(px + tx * 10 + nx, py + ty * 10 + ny, px + nx, py + ny, 2.4, i % 3 ? O : R); } return s; }
// 两个圆叠出的月牙：浅橙月牙面，叠加的圆只留细线
export function crescent(cx, cy, r, dx, dy, r2) { return '<defs><clipPath id="MOONCLIP"><circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '"/></clipPath></defs>' + ci(cx, cy, r, 0, R, P) + ci(cx + dx, cy + dy, r2, 0, R, BG, ' clip-path="url(#MOONCLIP)"') + ci(cx, cy, r, 1.8) + ci(cx + dx, cy + dy, r2, 0.6, O); }

export function defs(id) {
  return '<pattern id="' + id + '" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2.6" stroke="' + O + '" stroke-width="0.55"/></pattern>' +
    '<pattern id="' + id + 'r" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><line x1="0" y1="0" x2="0" y2="2.4" stroke="' + R + '" stroke-width="0.5"/></pattern>' +
    '<pattern id="' + id + 'h" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(5)"><line x1="0" y1="0" x2="2.4" y2="0" stroke="' + O + '" stroke-width="0.5"/></pattern>' +
    '<clipPath id="' + id + 'c"><rect x="6" y="6" width="198" height="306"/></clipPath>';
}
export function fill(art, id) { return art.replace(/HATCHR/g, "url(#" + id + "r)").replace(/HATCHH/g, "url(#" + id + "h)").replace(/HATCH/g, "url(#" + id + ")").replace(/MOONCLIP/g, id + "m"); }

export function card(num, en, zh, art, id) {
  return '<svg viewBox="0 0 210 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + zh + '">' +
    '<defs>' + defs(id) + '</defs>' +
    '<rect width="210" height="360" fill="' + BG + '"/>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="8" y="8" width="194" height="344" stroke="' + R + '" stroke-width="0.7"/>' +
    ln(4, 14, 22, 14, 0.5, O) + ln(14, 4, 14, 22, 0.5, O) + ln(188, 346, 206, 346, 0.5, O) + ln(196, 338, 196, 356, 0.5, O) +
    '<g clip-path="url(#' + id + 'c)">' + fill(art, id) + '</g>' +
    ln(24, 316, 186, 316, 0.6, R) + ln(40, 319, 170, 319, 0.4, O) + spark(105, 316, 4.5) +
    '</g>' +
    '<text x="24" y="34" font-family="' + (/[^\x00-\x7f]/.test(num) ? 'Noto Serif SC, Songti SC, serif' : 'Cormorant Garamond, Georgia, serif') + '" font-weight="' + (/[^\x00-\x7f]/.test(num) ? '700' : '600') + '" font-size="' + (/[^\x00-\x7f]/.test(num) ? '13' : '15') + '" fill="' + R + '">' + num + '</text>' +
    '<text x="105" y="338" text-anchor="middle" font-family="Noto Serif SC, Songti SC, serif" font-weight="700" font-size="16" letter-spacing="6" fill="' + R + '">' + zh + '</text>' +
    '<text x="105" y="348" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" font-size="6.5" letter-spacing="3" fill="' + TXT + '">' + en + '</text>' +
    '</svg>';
}

export function back(mode, id) {
  usePal(mode === "mono" ? PAL.mono : PAL.back);
  var s = '<svg viewBox="0 0 210 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="牌背"><defs>' + defs(id) + '</defs><rect width="210" height="360" fill="' + BG + '"/><g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="8" y="8" width="194" height="344" stroke="' + R + '" stroke-width="0.7"/>';
  // 只画上半，再旋转 180° 复制一份，保证严格中心对称
  var half = frame(40, 40, 100, 100, O, 0.6, 181) + frame(52, 52, 104, 104, R, 0.9, 182) +
    halo(105, 180, 52, 183, { a0: 180, a1: 360, n: 20, max: 34 }) +
    crystal(184, [20, 30], [96, 30], [60, 110], 12, 90, { bounds: [10, 10, 112, 176], cap: 60, hang: 0.3 }) +
    fringe(60, 150, 140, 185, 6, 8, 30) + ladder(148, 60, 40, 4, 7) +
    spark(30, 150, 4) + spark(176, 60, 3) + cross(188, 112, 3, O) + chain(24, 170, 54, 170) + dot(180, 40, 1.4);
  s += fill(half + '<g transform="rotate(180 105 180)">' + half + '</g>' +
    ci(105, 180, 52, 1.8) + ci(105, 180, 44, 0.6, O) +
    hpg([[93.3, 160], [116.7, 160], [128.3, 180], [116.7, 200], [93.3, 200], [81.7, 180]], 0) + pg([[105, 140], [140, 200], [70, 200]], 1.3) + pg([[105, 220], [70, 160], [140, 160]], 1.3) +
    ci(105, 180, 12, 1.1, R, BG) + reticle(105, 180, 4), id) + '</g></svg>';
  usePal(PAL.mono);
  return s;
}
