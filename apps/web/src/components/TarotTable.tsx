"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SPREADS } from "@moxing/engine";
import { api } from "@/lib/client";
import { useApp } from "./AppShell";
import { CardBack, CardFace } from "./CardSvg";
import { Feedback, Followups, Thinking } from "./ReadingExtras";
import { Paragraphs, Typewriter } from "./Typewriter";

export interface DrawnView { id: string; zh: string; en: string; reversed: boolean; keywords: string; image: string; position: { name: string; meaning: string; x: number; y: number; rotate?: number } }
export interface TarotResult { spreadId: string; spreadName: string; cards: DrawnView[]; yesNo?: string; clues?: { label: string; value: string; source: string }[] }

const TOPICS = [["love", "感情"], ["work", "事业学业"], ["money", "财运"], ["self", "自我成长"]] as const;
type Phase = "setup" | "shuffle" | "cut" | "fan" | "reveal" | "reading";

export function TarotTable({ initialSpread = "three" }: { initialSpread?: string }) {
  const { handleError, refreshMe } = useApp();
  const [spreadId, setSpreadId] = useState(initialSpread);
  const [topic, setTopic] = useState<(typeof TOPICS)[number][0]>("love");
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [readingId, setReadingId] = useState<string | null>(null);
  const [deckSize, setDeckSize] = useState(78);
  const [picks, setPicks] = useState<number[]>([]);
  const [result, setResult] = useState<TarotResult | null>(null);
  const [flipped, setFlipped] = useState(0);
  const [busy, setBusy] = useState(false);
  const spread = SPREADS.find((s) => s.id === spreadId)!;

  async function start() {
    setBusy(true);
    try {
      const r = await api<{ id: string; deckSize: number; existing?: boolean; status?: string }>("/api/tarot/start", { body: { spreadId, question, topic } });
      setReadingId(r.id);
      if (r.existing && r.status !== "drawing") {
        const d = await api<{ reading: { result: TarotResult } }>(`/api/readings/${r.id}`);
        setResult(d.reading.result); setFlipped(d.reading.result.cards.length); setPhase("reading"); return;
      }
      setDeckSize(r.deckSize); setPicks([]); setPhase("shuffle");
      refreshMe();
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }

  async function finishPicks(p: number[]) {
    setBusy(true);
    try {
      const r = await api<{ result: TarotResult }>(`/api/tarot/${readingId}/pick`, { body: { picks: p } });
      setResult(r.result); setFlipped(0); setPhase("reveal");
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }

  function pick(i: number) {
    if (picks.includes(i) || picks.length >= spread.count || busy) return;
    const next = [...picks, i];
    setPicks(next);
    if (next.length === spread.count) setTimeout(() => finishPicks(next), 650);
  }

  // 翻牌：逐张翻开
  useEffect(() => {
    if (phase !== "reveal" || !result) return;
    if (flipped >= result.cards.length) { const t = setTimeout(() => setPhase("reading"), 900); return () => clearTimeout(t); }
    const t = setTimeout(() => setFlipped((f) => f + 1), flipped === 0 ? 500 : 750);
    return () => clearTimeout(t);
  }, [phase, flipped, result]);

  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold">选一个牌阵</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SPREADS.map((s) => (
              <button key={s.id} onClick={() => setSpreadId(s.id)} aria-pressed={spreadId === s.id}
                className={`panel flex min-h-[96px] flex-col items-start gap-1 p-3 text-left transition ${spreadId === s.id ? "!border-red ring-2 ring-red/30" : "hover:!border-red/60"}`}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-serif font-bold">{s.name}</span>
                  <span className={`shrink-0 rounded-full px-2 text-[11px] ${s.tier === "free" ? "bg-paper-2 text-muted" : "bg-red/10 text-red"}`}>{s.tier === "free" ? "免费" : s.id === "soulmate" ? "前 2 张免费" : "深度"}</span>
                </span>
                <span className="text-xs leading-5 text-muted">{s.desc} · {s.count} 张</span>
              </button>
            ))}
          </div>
        </section>
        {spreadId !== "daily" && (
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold">你想问什么</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="问题类型">
              {TOPICS.map(([k, l]) => <button key={k} className="chip" aria-pressed={topic === k} onClick={() => setTopic(k)}>{l}</button>)}
            </div>
            <textarea className="field min-h-[88px] resize-y" maxLength={200} value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder={spreadId === "yesno" ? "写一个能用“是/否”回答的问题，比如：这个月适合提离职吗？" : spreadId === "choice" ? "写下两个选项，比如：留在上海还是回老家？" : "说说你现在的处境和想问的事，越具体越好"} />
            <p className="text-xs text-muted">同一件事 24 小时内不宜反复问。</p>
          </section>
        )}
        <button className="btn btn-primary w-full sm:w-auto" disabled={busy || (spreadId !== "daily" && question.trim().length < 2)} onClick={start}>
          {busy ? "准备中…" : spreadId === "daily" ? "抽今天的牌" : "开始洗牌"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-bold">{spread.name}</h2>
        {question && <p className="truncate text-sm text-muted">「{question}」</p>}
      </div>
      {phase === "shuffle" && <Shuffle onDone={() => setPhase("cut")} />}
      {phase === "cut" && <Cut onDone={() => setPhase("fan")} />}
      {phase === "fan" && <Fan size={deckSize} picks={picks} need={spread.count} onPick={pick} positions={spread.positions.map((p) => p.name)} />}
      {(phase === "reveal" || phase === "reading") && result && <Layout result={result} flipped={flipped} uidBase={readingId ?? "x"} />}
      {phase === "reading" && result && readingId && <ReadingBody id={readingId} result={result} fresh />}
    </div>
  );
}

/** 洗牌：牌堆来回穿插，可以多洗几次 */
function Shuffle({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [moving, setMoving] = useState(true);
  useEffect(() => { setMoving(true); const t = setTimeout(() => setMoving(false), 1900); return () => clearTimeout(t); }, [round]);
  const offsets = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * (30 + Math.random() * 60), r: (Math.random() - 0.5) * 30, d: i * 0.05 })), [round]);
  return (
    <div className="space-y-6 text-center">
      <div className="relative mx-auto h-[220px] w-[130px]">
        {offsets.map((o, i) => (
          <motion.div key={round + "-" + i} className="absolute inset-0" initial={{ x: 0, rotate: 0, y: -i * 0.6 }}
            animate={moving ? { x: [0, o.x, -o.x * 0.6, o.x * 0.3, 0], rotate: [0, o.r, -o.r, o.r * 0.5, 0], y: [-i * 0.6, -10, 4, -4, -i * 0.6] } : { x: 0, rotate: 0, y: -i * 0.6 }}
            transition={{ duration: 1.8, delay: o.d, ease: "easeInOut" }}>
            <CardBack uid={`sh${i}`} className="shadow-lg" />
          </motion.div>
        ))}
      </div>
      <p className="font-serif text-muted">{moving ? "正在洗牌，心里默念你的问题" : "洗好了。准备好了就切牌"}</p>
      <div className="flex justify-center gap-3">
        <button className="btn btn-ghost" disabled={moving} onClick={() => setRound((r) => r + 1)}>再洗一次</button>
        <button className="btn btn-primary" disabled={moving} onClick={onDone}>切牌</button>
      </div>
    </div>
  );
}

/** 切牌：把牌分成三叠，凭直觉选一叠 */
function Cut({ onDone }: { onDone: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="space-y-6 text-center">
      <p className="font-serif text-muted">凭直觉选一叠</p>
      <div className="flex justify-center gap-4 sm:gap-8">
        {[0, 1, 2].map((i) => (
          <motion.button key={i} aria-label={`第 ${i + 1} 叠`} className="relative w-[84px] sm:w-[110px]" whileHover={{ y: -8 }}
            animate={chosen === null ? { opacity: 1, y: 0 } : chosen === i ? { y: -24, scale: 1.08 } : { opacity: 0.25, y: 10 }}
            onClick={() => { if (chosen === null) { setChosen(i); setTimeout(onDone, 800); } }}>
            {[0, 1, 2, 3].map((k) => <div key={k} className="absolute inset-0" style={{ transform: `translate(${k * 1.5}px, ${-k * 1.5}px)` }}><CardBack uid={`cut${i}${k}`} className="shadow" /></div>)}
            <div className="invisible"><CardBack uid={`cutg${i}`} /></div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** 扇形铺牌，用户亲手点选 */
function Fan({ size, picks, need, onPick, positions }: { size: number; picks: number[]; need: number; onPick: (i: number) => void; positions: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const step = size > 30 ? 20 : 30, w = 64;
  const width = (size - 1) * step + w + 40;
  useEffect(() => { const el = ref.current; if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; }, []);
  return (
    <div className="space-y-4">
      <p className="text-center font-serif">
        {picks.length < need ? <>请抽第 <b className="text-red">{picks.length + 1}</b> 张：{positions[picks.length]}</> : "抽好了，正在翻牌…"}
      </p>
      <div ref={ref} className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:thin]">
        <div className="relative h-[190px]" style={{ width }}>
          {Array.from({ length: size }, (_, i) => {
            const t = size > 1 ? i / (size - 1) - 0.5 : 0;
            const taken = picks.includes(i);
            return (
              <motion.button key={i} aria-label={`第 ${i + 1} 张牌`} disabled={taken || picks.length >= need}
                onClick={() => onPick(i)} className="absolute bottom-2 origin-bottom" style={{ left: 20 + i * step, width: w }}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: taken ? 0 : 1, y: taken ? -120 : Math.abs(t) * 46, rotate: t * 40 }}
                whileHover={taken ? undefined : { y: Math.abs(t) * 46 - 18 }} transition={{ duration: 0.35, delay: taken ? 0 : Math.min(i * 0.006, 0.5) }}>
                <CardBack uid={`fan${i}`} className="shadow-md" />
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {Array.from({ length: need }, (_, i) => <span key={i} className={`h-2 w-6 rounded-full ${i < picks.length ? "bg-red" : "bg-line"}`} />)}
      </div>
      {size > 30 && <p className="text-center text-xs text-muted">左右滑动可以看到整副牌</p>}
    </div>
  );
}

/** 按牌阵坐标摆牌并逐张翻开 */
export function Layout({ result, flipped, uidBase }: { result: TarotResult; flipped: number; uidBase: string }) {
  const cs = result.cards;
  const xs = cs.map((c) => c.position.x), ys = cs.map((c) => c.position.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const cols = maxX - minX + 1, rows = maxY - minY + 1;
  const [vw, setVw] = useState(960);
  useEffect(() => { const f = () => setVw(Math.min(960, window.innerWidth - 32)); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const base = cs.length === 1 ? 160 : cs.length <= 3 ? 116 : cs.length <= 5 ? 92 : 74;
  const cardW = Math.max(cs.length > 5 ? 58 : 70, Math.min(base, Math.floor(vw / ((cols - 1) * 1.18 + 1))));
  const gapX = cardW * 1.18, gapY = cardW * 12 / 7 + 44;
  const W = (cols - 1) * gapX + cardW, H = (rows - 1) * gapY + cardW * 12 / 7 + 44;
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        {cs.map((c, i) => {
          const left = (c.position.x - minX) * gapX, top = (maxY - c.position.y) * gapY;
          const open = i < flipped;
          return (
            <div key={i} className="absolute" style={{ left, top, width: cardW, zIndex: c.position.rotate ? 2 : 1 }}>
              <div style={{ transform: c.position.rotate ? `rotate(${c.position.rotate}deg) translateY(${cardW * 0.1}px)` : undefined, perspective: 900 }}>
                <motion.div className="relative" style={{ transformStyle: "preserve-3d" }} initial={false} animate={{ rotateY: open ? 180 : 0 }} transition={{ duration: 0.7, ease: [0.3, 0.7, 0.2, 1] }}>
                  <div style={{ backfaceVisibility: "hidden" }}><CardBack uid={`${uidBase}b${i}`} className="shadow-md" /></div>
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}><CardFace id={c.id} uid={`${uidBase}f${i}`} reversed={c.reversed} className="shadow-md" /></div>
                </motion.div>
              </div>
              {!c.position.rotate && (
                <p className="mt-1.5 text-center text-[12px] leading-4">
                  <span className="text-muted">{c.position.name}</span><br />
                  <AnimatePresence>{open && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold">{c.zh}{c.reversed ? "·逆" : ""}</motion.span>}</AnimatePresence>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FullReading { text: string | null; unlocked: boolean; followupsLeft: number; feedback: string | null; followups: { question: string; answer: string }[]; subtype: string }

/** 牌意要点 + 解读正文 + 解锁 / 追问 / 反馈 */
export function ReadingBody({ id, result, fresh }: { id: string; result: TarotResult; fresh?: boolean }) {
  const { handleError, refreshMe } = useApp();
  const [text, setText] = useState<string | null>(null);
  const [animate, setAnimate] = useState(!!fresh);
  const [full, setFull] = useState<FullReading | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [typed, setTyped] = useState(!fresh);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const d = await api<{ reading: FullReading }>(`/api/readings/${id}`);
        if (off) return;
        setFull(d.reading);
        if (d.reading.text) { setText(d.reading.text); setAnimate(false); setTyped(true); return; }
        const r = await api<{ text: string }>(`/api/readings/${id}/interpret`, { body: {} });
        if (!off) setText(r.text);
      } catch (e) { handleError(e); }
    })();
    return () => { off = true; };
  }, [id, handleError]);

  async function unlock() {
    setUnlocking(true);
    try { const r = await api<{ text: string }>(`/api/readings/${id}/unlock`, { body: {} }); setText(r.text); setAnimate(true); setTyped(false); setFull((f) => f && { ...f, unlocked: true }); refreshMe(); }
    catch (e) { handleError(e); } finally { setUnlocking(false); }
  }

  const locked = result.spreadId === "soulmate" && full && !full.unlocked;
  return (
    <div className="space-y-6">
      {result.yesNo && <p className="text-center font-serif text-2xl font-bold text-red">{result.yesNo}</p>}
      <details className="panel p-4 text-sm">
        <summary className="cursor-pointer font-serif font-bold">牌意要点</summary>
        <ul className="mt-3 space-y-2">
          {result.cards.map((c, i) => <li key={i}><b>{c.position.name} · {c.zh}{c.reversed ? "（逆位）" : ""}</b><span className="text-muted">：{c.keywords}</span></li>)}
        </ul>
      </details>
      <section className="panel p-5 sm:p-7">
        <div className="ornament mb-4 font-serif text-sm">解读</div>
        {!text ? <Thinking /> : animate ? <Typewriter text={text} onDone={() => setTyped(true)} /> : <Paragraphs text={text} />}
        {text && typed && <p className="mt-4 text-xs text-muted">以上内容由 AI 结合牌意生成，仅供娱乐参考。</p>}
      </section>
      {result.clues && !locked && typed && (
        <section className="grid gap-3 sm:grid-cols-2">
          {result.clues.map((c) => <div key={c.label} className="panel p-4"><p className="text-xs text-muted">{c.label} · 来自{c.source}</p><p className="font-serif">{c.value}</p></div>)}
        </section>
      )}
      {locked && text && (
        <div className="panel space-y-3 border-red/40 p-5 text-center">
          <p className="font-serif text-lg">后面 8 张牌里，藏着 TA 的样子和你们相遇的线索</p>
          <button className="btn btn-primary" disabled={unlocking} onClick={unlock}>{unlocking ? "解读中…" : "解锁完整正缘画像"}</button>
        </div>
      )}
      {text && typed && full && (
        <>
          <Followups id={id} left={full.followupsLeft} items={full.followups} />
          <Feedback id={id} initial={full.feedback} />
          <div className="flex flex-wrap gap-3"><Link href="/tarot" className="btn btn-ghost">再问一件事</Link><Link href="/history" className="btn btn-ghost">占卜记录</Link></div>
        </>
      )}
    </div>
  );
}
