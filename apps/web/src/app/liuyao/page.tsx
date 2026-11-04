"use client";
import { motion } from "motion/react";
import { useState } from "react";
import type { LiuyaoResult } from "@moxing/engine";
import { useApp } from "@/components/AppShell";
import { InterpretSection } from "@/components/InterpretSection";
import { LiuyaoView } from "@/components/LiuyaoView";
import { api } from "@/lib/client";

type Toss = { coins: [number, number, number]; value: 6 | 7 | 8 | 9 };
const TOPICS = [["career", "工作"], ["money", "求财"], ["love", "感情"], ["exam", "考试"], ["health", "健康"], ["travel", "出行"], ["lost", "失物"], ["other", "其他"]] as const;
const YAO_NAME: Record<number, string> = { 6: "老阴 ×", 7: "少阳", 8: "少阴", 9: "老阳 ○" };

function Coin({ face, spinning, i }: { face: number; spinning: boolean; i: number }) {
  return (
    <motion.div className="grid h-16 w-16 place-items-center rounded-full border-4 border-[#a37428] bg-[#e9c77b] font-serif text-xl font-bold text-[#6b4a14] shadow-md"
      animate={spinning ? { rotateY: [0, 900 + i * 180], y: [0, -60, 0] } : { rotateY: 0, y: 0 }} transition={{ duration: spinning ? 0.9 : 0.2, ease: "easeOut" }}>
      {spinning ? "" : face === 3 ? "背" : "字"}
    </motion.div>
  );
}

export default function LiuyaoPage() {
  const { handleError, refreshMe } = useApp();
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number][0]>("career");
  const [method, setMethod] = useState<"coins" | "time">("coins");
  const [busy, setBusy] = useState(false);
  const [cast, setCast] = useState<{ id: string; result: LiuyaoResult; tosses: Toss[] | null } | null>(null);
  const [shown, setShown] = useState(0);
  const [spinning, setSpinning] = useState(false);

  async function begin(force = false) {
    setBusy(true);
    try {
      const r = await api<{ id: string; result: LiuyaoResult; tosses: Toss[] | null }>("/api/liuyao", { body: { question, topic, method, force } });
      setCast(r); setShown(r.tosses ? 0 : 6); refreshMe();
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }
  function shake() {
    if (spinning || !cast?.tosses || shown >= 6) return;
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setShown((s) => s + 1); }, 950);
  }
  const done = cast && shown >= 6;
  const last = cast?.tosses && shown > 0 ? cast.tosses[shown - 1] : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-wider">六爻问事</h1>
        <p className="text-muted">心里想着一件具体的事，摇六次铜钱，从下往上成卦。纳甲、六亲、世应、用神都按古法排好。</p>
      </header>

      {!cast && (
        <div className="panel space-y-4 p-5">
          <div>
            <label className="label" htmlFor="lq">想问的事（越具体越好）</label>
            <textarea id="lq" className="field min-h-24" maxLength={200} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="比如：这次跳槽去新公司，半年内能顺利转正吗？" />
          </div>
          <div><span className="label">类别</span><div className="flex flex-wrap gap-2">{TOPICS.map(([k, l]) => <button key={k} className="chip" aria-pressed={topic === k} onClick={() => setTopic(k)}>{l}</button>)}</div></div>
          <div><span className="label">起卦方式</span><div className="flex flex-wrap gap-2">
            <button className="chip" aria-pressed={method === "coins"} onClick={() => setMethod("coins")}>铜钱摇卦</button>
            <button className="chip" aria-pressed={method === "time"} onClick={() => setMethod("time")}>按此刻时间起卦</button>
          </div></div>
          <p className="text-xs text-muted">一事不二占：同一件事 24 小时内只起一次卦。博彩、寿命、伤害他人的问题不在解答范围内。</p>
          <button className="btn btn-primary" disabled={busy || question.trim().length < 2} onClick={() => begin()}>{busy ? "准备中…" : "静心，开始"}</button>
        </div>
      )}

      {cast && !done && (
        <div className="panel space-y-5 p-6 text-center">
          <p className="font-serif">第 {shown + 1} 爻 · 默念所问之事，点一下摇钱</p>
          <button className="mx-auto flex gap-3 [perspective:600px]" onClick={shake} aria-label="摇铜钱">
            {[0, 1, 2].map((i) => <Coin key={i} i={i} spinning={spinning} face={last ? last.coins[i] : 3} />)}
          </button>
          <button className="btn btn-primary" onClick={shake} disabled={spinning}>{spinning ? "……" : "摇"}</button>
          <ol className="mx-auto w-48 space-y-1 text-left text-sm">
            {cast.tosses!.slice(0, shown).map((t, i) => <li key={i} className="flex justify-between"><span className="text-muted">{["初", "二", "三", "四", "五", "上"][i]}爻</span><span>{YAO_NAME[t.value]}</span></li>).reverse()}
          </ol>
        </div>
      )}

      {done && cast && (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted">所问：{question}</p>
          <LiuyaoView r={cast.result} />
          <InterpretSection id={cast.id} fresh label="断卦" />
          <button className="btn btn-ghost" onClick={() => { setCast(null); setQuestion(""); }}>问另一件事</button>
        </motion.div>
      )}
    </div>
  );
}
