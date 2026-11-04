"use client";
import { motion } from "motion/react";
import { useState } from "react";
import type { LingQian } from "@moxing/engine";
import { useApp } from "@/components/AppShell";
import { InterpretSection } from "@/components/InterpretSection";
import { QianView } from "@/components/QianView";
import { api } from "@/lib/client";

const TOPICS = [["other", "综合"], ["love", "感情婚姻"], ["career", "事业"], ["money", "财运"], ["health", "健康"], ["family", "家宅"], ["travel", "出行"], ["lost", "寻物寻人"], ["lawsuit", "官司纠纷"], ["birth", "生育"]] as const;
interface Draw { id: string; qian: LingQian; tosses: string[]; items: { key: string; value: string }[]; topicLabel: string }

export default function QianPage() {
  const { handleError, refreshMe } = useApp();
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number][0]>("other");
  const [phase, setPhase] = useState<"ask" | "shake" | "jiao" | "done">("ask");
  const [d, setD] = useState<Draw | null>(null);
  const [jiao, setJiao] = useState(0);

  async function shake() {
    setPhase("shake");
    try {
      const [r] = await Promise.all([api<Draw>("/api/qian", { body: { question, topic } }), new Promise((ok) => setTimeout(ok, 2200))]);
      setD(r); setJiao(0); setPhase("jiao"); refreshMe();
      r.tosses.forEach((_, i) => setTimeout(() => setJiao(i + 1), 700 * (i + 1)));
      setTimeout(() => setPhase("done"), 700 * r.tosses.length + 1100);
    } catch (e) { handleError(e); setPhase("ask"); }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-wider">观音灵签</h1>
        <p className="text-muted">百签原文，摇签后掷筊确认，得圣筊方为此签。</p>
      </header>

      {phase === "ask" && (
        <div className="panel space-y-4 p-5">
          <div><span className="label">所求之事</span><div className="flex flex-wrap gap-2">{TOPICS.map(([k, l]) => <button key={k} className="chip" aria-pressed={topic === k} onClick={() => setTopic(k)}>{l}</button>)}</div></div>
          <div><label className="label" htmlFor="qq">心里想的事（可不写）</label><input id="qq" className="field" maxLength={200} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="写下来，解签会更贴近你的处境" /></div>
          <button className="btn btn-primary" onClick={shake}>诚心摇签</button>
        </div>
      )}

      {(phase === "shake" || phase === "jiao") && (
        <div className="panel flex flex-col items-center gap-6 p-8">
          <motion.div className="relative h-44 w-24" animate={phase === "shake" ? { rotate: [-8, 8, -6, 7, -4, 0], y: [0, -6, 0, -4, 0] } : { rotate: 0 }} transition={{ duration: 0.55, repeat: phase === "shake" ? Infinity : 0 }}>
            <div className="absolute inset-x-0 bottom-0 h-28 rounded-b-xl rounded-t-md border-2 border-[#7a2a1c] bg-[#a8361f] shadow-lg" />
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="absolute bottom-16 h-24 w-2 rounded-t bg-[#d8b46a]" style={{ left: 18 + i * 13, transform: `rotate(${(i - 2) * 5}deg)` }} />)}
            {phase === "jiao" && d && <motion.div initial={{ y: 0, opacity: 0 }} animate={{ y: -70, opacity: 1 }} className="absolute bottom-24 left-[44px] h-28 w-3 rounded-t bg-[#e9c77b] text-[8px]" />}
          </motion.div>
          <p className="font-serif text-muted">{phase === "shake" ? "摇签中……" : `第 ${d?.qian.no} 签落地，掷筊请示`}</p>
          {phase === "jiao" && d && (
            <ul className="flex gap-3 text-sm">{d.tosses.slice(0, jiao).map((t, i) => <motion.li key={i} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-full border px-3 py-1 ${t === "圣筊" ? "border-red text-red" : "border-line text-muted"}`}>{t}</motion.li>)}</ul>
          )}
        </div>
      )}

      {phase === "done" && d && (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <QianView qian={d.qian} items={d.items} topicLabel={d.topicLabel} tosses={d.tosses} />
          <InterpretSection id={d.id} fresh label="解签" />
          <button className="btn btn-ghost" onClick={() => { setPhase("ask"); setD(null); }}>再求一签</button>
        </motion.div>
      )}
    </div>
  );
}
