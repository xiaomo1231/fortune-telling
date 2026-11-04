"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "./AppShell";
import { Paragraphs, Typewriter } from "./Typewriter";

export function Feedback({ id, initial }: { id: string; initial?: string | null }) {
  const [fb, setFb] = useState<string | null>(initial ?? null);
  const [hl, setHl] = useState<string | null>(null);
  const send = async (data: Record<string, string>) => { try { await api(`/api/readings/${id}/feedback`, { body: data }); } catch { /* 反馈失败不打扰用户 */ } };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>这次解读</span>
      {[["accurate", "准"], ["inaccurate", "不太准"]].map(([k, l]) => (
        <button key={k} className="chip !min-h-8" aria-pressed={fb === k} onClick={() => { setFb(k); send({ feedback: k }); }}>{l}</button>
      ))}
      <span className="ml-2">读起来</span>
      {[["human", "像真人"], ["machine", "像机器"]].map(([k, l]) => (
        <button key={k} className="chip !min-h-8" aria-pressed={hl === k} onClick={() => { setHl(k); send({ humanLike: k }); }}>{l}</button>
      ))}
    </div>
  );
}

export function Followups({ id, left, items }: { id: string; left: number; items: { question: string; answer: string }[] }) {
  const { handleError } = useApp();
  const [list, setList] = useState(items);
  const [remain, setRemain] = useState(left);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(-1);
  async function ask() {
    setBusy(true);
    try {
      const r = await api<{ followup: { question: string; answer: string }; followupsLeft: number }>(`/api/readings/${id}/followup`, { body: { question: q } });
      setList((l) => [...l, r.followup]); setFresh(list.length); setRemain(r.followupsLeft); setQ("");
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }
  if (!list.length && remain <= 0) return null;
  return (
    <section className="space-y-4">
      {list.map((f, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-semibold text-red">你追问：{f.question}</p>
          {i === fresh ? <Typewriter text={f.answer} /> : <Paragraphs text={f.answer} />}
        </div>
      ))}
      {remain > 0 && (
        <div className="space-y-2">
          <label className="label" htmlFor="fq">还可以追问 {remain} 次（只针对这次结果）</label>
          <div className="flex gap-2">
            <input id="fq" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="比如：那我该主动联系吗？" maxLength={200} />
            <button className="btn btn-primary shrink-0" disabled={busy || q.trim().length < 2} onClick={ask}>{busy ? "思考中" : "追问"}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function Thinking({ label = "解读师正在看牌" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-6 text-muted" role="status">
      <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-red" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
      <span className="font-serif">{label}…</span>
    </div>
  );
}
