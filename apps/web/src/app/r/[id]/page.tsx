"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { BaziChart, DailyFortune, LingQian, LiuyaoResult } from "@moxing/engine";
import { useApp } from "@/components/AppShell";
import { BaziChartView } from "@/components/BaziChartView";
import { InterpretSection } from "@/components/InterpretSection";
import { LiuyaoView } from "@/components/LiuyaoView";
import { QianView } from "@/components/QianView";
import { Thinking } from "@/components/ReadingExtras";
import { Layout, ReadingBody, TarotResult } from "@/components/TarotTable";
import { Paragraphs } from "@/components/Typewriter";
import { api } from "@/lib/client";

interface R { id: string; kind: string; subtype: string; question: string | null; createdAt: string; text: string | null; status: string; result: Record<string, unknown> }

export default function ReadingPage() {
  const { id } = useParams<{ id: string }>();
  const { me, handleError } = useApp();
  const [r, setR] = useState<R | null>(null);
  useEffect(() => {
    if (!me?.user) { if (me) handleError({ status: 401 }); return; }
    api<{ reading: R }>(`/api/readings/${id}`).then((d) => setR(d.reading)).catch(handleError);
  }, [id, me, handleError]);
  if (!r) return <Thinking label="打开记录" />;

  const when = new Date(r.createdAt).toLocaleString("zh-CN", { hour12: false });
  const res = r.result;
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link href="/history" className="text-sm text-muted">← 占卜记录</Link>
        {r.question && <h1 className="font-serif text-2xl font-bold">{r.question}</h1>}
        <p className="text-xs text-muted">{when}</p>
      </header>
      {r.kind === "tarot" && (r.status === "drawing" ? <p className="text-muted">这次还没抽完牌。<Link href="/tarot" className="text-red">重新开始</Link></p> : (
        <>
          <h2 className="ornament font-serif">{(res as unknown as TarotResult).spreadName}</h2>
          <Layout result={res as unknown as TarotResult} flipped={99} uidBase={"r" + r.id.slice(-6)} />
          <ReadingBody id={r.id} result={res as unknown as TarotResult} />
        </>
      ))}
      {r.kind === "bazi" && (
        <>
          <BaziChartView chart={res.chart as BaziChart} name={res.name as string} />
          <section className="panel p-5 sm:p-7"><div className="ornament mb-4 font-serif text-sm">{r.subtype === "full" ? "完整命书" : "简批"}</div><Paragraphs text={r.text ?? ""} /></section>
        </>
      )}
      {r.kind === "daily" && (
        <section className="panel space-y-3 p-5">
          <h2 className="font-serif text-xl font-bold">{(res.fortune as DailyFortune).date} 运势 · {(res.fortune as DailyFortune).score} 分 {(res.fortune as DailyFortune).level}</h2>
          <Paragraphs text={r.text ?? ""} />
        </section>
      )}
      {r.kind === "liuyao" && (<><LiuyaoView r={res as unknown as LiuyaoResult} /><InterpretSection id={r.id} label="断卦" /></>)}
      {r.kind === "qian" && (<><QianView qian={res.qian as LingQian} items={res.items as { key: string; value: string }[]} topicLabel={res.topicLabel as string} tosses={res.tosses as string[]} /><InterpretSection id={r.id} label="解签" /></>)}
    </div>
  );
}
