// 生成后的自动检查：模板词、和历史重复、句式单调、与命盘一致

export const BANNED_PHRASES = [
  "总的来说", "综上所述", "总而言之", "值得注意的是", "需要注意的是", "首先", "其次", "最后，", "在…的道路上", "的道路上",
  "希望对你有所帮助", "希望能帮到你", "让我们一起", "相信自己", "一切都会好起来", "宇宙", "能量场", "正能量",
  "作为一个AI", "作为AI", "作为人工智能", "我是一个AI", "以上内容仅供参考", "仅供参考", "但这并不绝对", "需要具体情况具体分析",
];

export interface CheckIssue { kind: "banned" | "repeat" | "monotone" | "consistency" | "format" | "length"; detail: string; }

export function splitSentences(text: string): string[] {
  return text.split(/(?<=[。！？!?])|\n+/).map((s) => s.trim()).filter((s) => s.length > 1);
}

export function charNgrams(s: string, n = 4): Set<string> {
  const t = s.replace(/[\s，。、！？；：“”‘’（）,.!?;:'"()]/g, "");
  const out = new Set<string>();
  for (let i = 0; i + n <= t.length; i++) out.add(t.slice(i, i + n));
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((x) => { if (b.has(x)) inter++; });
  return inter / (a.size + b.size - inter);
}

export interface CheckOptions {
  /** 最近解读的开头句，用来避免重复 */
  history?: string[];
  /** 允许出现的专有名词（牌名、卦名、干支等），用于一致性检查 */
  allowedNames?: string[];
  /** 不允许出现的专有名词，例如没抽到的牌名 */
  forbiddenNames?: string[];
  minLength?: number;
}

export function checkReading(text: string, o: CheckOptions = {}): CheckIssue[] {
  const issues: CheckIssue[] = [];
  for (const p of BANNED_PHRASES) if (text.includes(p.replace("…", ""))) issues.push({ kind: "banned", detail: p });
  if (/^#{1,6}\s|\*\*|^\s*[-*]\s/m.test(text)) issues.push({ kind: "format", detail: "出现了 Markdown 格式" });
  const sents = splitSentences(text);
  if (o.minLength && text.replace(/\s/g, "").length < o.minLength) issues.push({ kind: "length", detail: "篇幅太短" });
  if (sents.length >= 6) {
    const lens = sents.map((s) => s.length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    if (sd / mean < 0.28) issues.push({ kind: "monotone", detail: `句长过于整齐（变异系数 ${(sd / mean).toFixed(2)}）` });
    const youStart = sents.filter((s) => s.startsWith("你")).length / sents.length;
    if (youStart > 0.4) issues.push({ kind: "monotone", detail: `以“你”开头的句子占 ${Math.round(youStart * 100)}%` });
  }
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const ends = paras.map((p) => p.slice(-6));
  if (paras.length >= 3 && new Set(ends).size < paras.length - 1) issues.push({ kind: "monotone", detail: "多个段落结尾雷同" });
  if (o.history?.length && sents[0]) {
    const first = charNgrams(sents[0]);
    const worst = Math.max(...o.history.map((h) => jaccard(first, charNgrams(h))));
    if (worst > 0.35) issues.push({ kind: "repeat", detail: `开头与历史解读相似度 ${worst.toFixed(2)}` });
  }
  for (const n of o.forbiddenNames ?? []) if (n && text.includes(n)) issues.push({ kind: "consistency", detail: `提到了不在本次结果里的「${n}」` });
  return issues;
}

/** 把检查结果变成给模型的修改意见 */
export function revisionNote(issues: CheckIssue[]): string {
  return "请按下面的意见重写全文，保持原意：\n" + issues.map((i) => "- " + (i.kind === "banned" ? `删掉套话「${i.detail}」，换成具体的说法` : i.kind === "repeat" ? "换一个完全不同的开头方式" : i.kind === "monotone" ? `${i.detail}，请让句子长短交错、换几种句式` : i.kind === "consistency" ? `${i.detail}，只能谈本次结果里的内容` : i.kind === "format" ? "不要用 Markdown，只写自然段" : "写得更充分一些")).join("\n");
}

/** 去掉模型偶尔带上的 Markdown 标记，作为最后一道兜底 */
export function cleanText(t: string): string {
  return t.replace(/^#{1,6}\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*[-*]\s+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}
