"use client";
import type { LingQian } from "@moxing/engine";

export function QianView({ qian, items, topicLabel, tosses }: { qian: LingQian; items: { key: string; value: string }[]; topicLabel: string; tosses?: string[] }) {
  return (
    <div className="panel mx-auto max-w-md space-y-4 p-6 text-center">
      <p className="font-serif text-sm tracking-[0.3em] text-red">观音灵签 · 第{qian.no}签</p>
      <h2 className="font-serif text-2xl font-bold">{qian.title}</h2>
      <p className="inline-block rounded-full border border-red px-3 text-sm text-red">{qian.level || "未标等级"}</p>
      <div className="flex flex-row-reverse items-start justify-center gap-5 py-2 font-serif text-lg" aria-label={qian.poem.join("，")}>
        {qian.poem.map((l, i) => <span key={i} aria-hidden className="flex flex-col leading-[1.7]">{Array.from(l).map((c, j) => <span key={j}>{c}</span>)}</span>)}
      </div>
      <p className="text-left text-sm leading-7 text-muted">{qian.gloss}</p>
      <div className="rounded-xl bg-paper-2 p-3 text-left text-sm">
        <p className="mb-1 text-xs text-muted">问「{topicLabel}」，签上的断语</p>
        {items.length ? items.map((i) => <p key={i.key}><b>{i.key}</b>：{i.value}</p>) : <p className="text-muted">原签没有列这一项，看签诗整体的意思。</p>}
      </div>
      {tosses && <p className="text-xs text-muted">掷筊：{tosses.join(" → ")}{tosses[tosses.length - 1] !== "圣筊" && "（三次未得圣筊，可静心后再求）"}</p>}
    </div>
  );
}
