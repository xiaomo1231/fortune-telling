"use client";
import { useEffect, useRef, useState } from "react";

/** 不匀速的打字机：标点处停顿，段落之间停得更久，像有人边想边说 */
export function Typewriter({ text, onDone, instant = false }: { text: string; onDone?: () => void; instant?: boolean }) {
  const [n, setN] = useState(instant ? text.length : 0);
  const done = useRef(false);
  useEffect(() => {
    if (instant) { setN(text.length); return; }
    setN(0); done.current = false;
    let i = 0, timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (i >= text.length) { if (!done.current) { done.current = true; onDone?.(); } return; }
      const burst = 1 + Math.floor(Math.random() * 3);
      i = Math.min(text.length, i + burst);
      setN(i);
      const ch = text[i - 1];
      const next = text[i];
      let d = 18 + Math.random() * 38;
      if ("，、；：".includes(ch)) d += 90 + Math.random() * 120;
      if ("。！？".includes(ch)) d += 220 + Math.random() * 260;
      if (ch === "\n" && next === "\n") d += 500 + Math.random() * 400;
      timer = setTimeout(step, d);
    };
    timer = setTimeout(step, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, instant]);
  const shown = text.slice(0, n);
  const paras = shown.split(/\n\s*\n/);
  return (
    <div className="reading-text font-serif text-[17px] leading-[1.95]">
      {paras.map((p, i) => <p key={i} className={i === paras.length - 1 && n < text.length ? "caret" : ""}>{p}</p>)}
      {n < text.length && <button type="button" onClick={() => setN(text.length)} className="mt-2 text-sm text-muted underline underline-offset-4">直接看全文</button>}
    </div>
  );
}

export function Paragraphs({ text }: { text: string }) {
  return <div className="reading-text font-serif text-[17px] leading-[1.95]">{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>;
}
