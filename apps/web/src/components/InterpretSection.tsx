"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "./AppShell";
import { Feedback, Followups, Thinking } from "./ReadingExtras";
import { Paragraphs, Typewriter } from "./Typewriter";

interface R { text: string | null; followupsLeft: number; feedback: string | null; followups: { question: string; answer: string }[] }

/** 通用的“解读”区块：取回或生成解读，附带追问与反馈 */
export function InterpretSection({ id, fresh, label }: { id: string; fresh?: boolean; label?: string }) {
  const { handleError } = useApp();
  const [r, setR] = useState<R | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [animate, setAnimate] = useState(!!fresh);
  const [typed, setTyped] = useState(!fresh);
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const d = await api<{ reading: R }>(`/api/readings/${id}`);
        if (off) return;
        setR(d.reading);
        if (d.reading.text) { setText(d.reading.text); setAnimate(false); setTyped(true); return; }
        const g = await api<{ text: string }>(`/api/readings/${id}/interpret`, { body: {} });
        if (!off) setText(g.text);
      } catch (e) { handleError(e); }
    })();
    return () => { off = true; };
  }, [id, handleError]);
  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-7">
        <div className="ornament mb-4 font-serif text-sm">{label ?? "解读"}</div>
        {!text ? <Thinking label="解读师正在推演" /> : animate ? <Typewriter text={text} onDone={() => setTyped(true)} /> : <Paragraphs text={text} />}
        {text && typed && <p className="mt-4 text-xs text-muted">以上内容由 AI 结合规则推演生成，仅供娱乐参考。</p>}
      </section>
      {text && typed && r && (<><Followups id={id} left={r.followupsLeft} items={r.followups} /><Feedback id={id} initial={r.feedback} /></>)}
    </div>
  );
}
