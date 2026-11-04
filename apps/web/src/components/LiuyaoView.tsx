"use client";
import type { LiuyaoResult } from "@moxing/engine";

function Yao({ yang, moving }: { yang: boolean; moving: boolean }) {
  return (
    <div className="flex w-16 shrink-0 items-center gap-1.5" aria-label={yang ? "阳爻" : "阴爻"}>
      {yang ? <span className="h-2.5 flex-1 rounded-sm bg-red" /> : <><span className="h-2.5 flex-1 rounded-sm bg-red" /><span className="w-3" /><span className="h-2.5 flex-1 rounded-sm bg-red" /></>}
      <span className="w-4 text-center text-xs text-red">{moving ? (yang ? "○" : "×") : ""}</span>
    </div>
  );
}

/** 卦象表：自上而下，带六神、六亲、纳甲、世应、伏神与变爻 */
export function LiuyaoView({ r }: { r: LiuyaoResult }) {
  const lines = r.lines.slice().reverse();
  const hasHidden = r.lines.some((l) => l.hidden);
  return (
    <div className="panel space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-bold">{r.main.name}{r.changed && <span className="text-muted"> 之 {r.changed.name}</span>}</h2>
        <span className={`rounded-full px-3 py-0.5 text-sm ${r.verdict.includes("吉") ? "bg-red/10 text-red" : "bg-paper-2 text-muted"}`}>{r.verdict}</span>
      </div>
      <p className="text-sm text-muted">{r.main.palace}宫{r.main.generation} · {r.main.gist}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[340px] border-collapse text-sm">
          <thead><tr className="text-left text-xs text-muted"><th className="py-1 font-normal">六神</th>{hasHidden && <th className="font-normal">伏神</th>}<th className="font-normal">本卦</th><th className="font-normal" /><th className="font-normal">世应</th>{r.changed && <th className="font-normal">变爻</th>}</tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.position} className={`border-t border-line ${r.useGod.lines.includes(l.position) ? "bg-red/5" : ""}`}>
                <td className="py-2 pr-2 text-muted">{l.spirit}</td>
                {hasHidden && <td className="pr-2 text-xs text-muted">{l.hidden ? `${l.hidden.relative}${l.hidden.branch}${l.hidden.element}` : ""}</td>}
                <td className="whitespace-nowrap pr-3"><b>{l.relative}</b> {l.stem}{l.branch}{l.element}{l.empty && <span className="ml-1 text-xs text-muted">空</span>}{l.monthBreak && <span className="ml-1 text-xs text-muted">破</span>}</td>
                <td className="pr-3"><Yao yang={l.yang} moving={l.moving} /></td>
                <td className="font-bold text-red">{l.isShi ? "世" : l.isYing ? "应" : ""}</td>
                {r.changed && <td className="whitespace-nowrap text-muted">{l.changed ? `${l.changed.relative}${l.changed.branch}${l.changed.element}` : ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-6 text-muted">起卦 {r.date} · 月建{r.monthBranch} · 日辰{r.dayGanzhi} · 旬空{r.emptyBranches.join("")}<br />{r.useGod.reason}：{r.useGod.state}</p>
    </div>
  );
}
