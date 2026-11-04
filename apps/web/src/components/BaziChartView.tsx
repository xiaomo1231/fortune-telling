"use client";
import type { BaziChart } from "@moxing/engine";
import { BRANCH_ELEMENT, STEM_ELEMENT } from "@moxing/engine";

const EL_COLOR: Record<string, string> = { 木: "#3f7d4a", 火: "#c8321f", 土: "#a37428", 金: "#8a8076", 水: "#2f6f86" };

function Ch({ c, big }: { c: string; big?: boolean }) {
  const el = (STEM_ELEMENT as Record<string, string>)[c] ?? (BRANCH_ELEMENT as Record<string, string>)[c];
  return <span className={big ? "font-serif text-3xl font-bold" : ""} style={{ color: EL_COLOR[el] }}>{c}</span>;
}

export function BaziChartView({ chart, name }: { chart: BaziChart; name?: string }) {
  const t = chart.time;
  const cols = chart.pillars;
  return (
    <div className="space-y-4">
      <section className="panel space-y-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-xl font-bold">{name ? name + " · " : ""}{chart.input.gender === "male" ? "乾造" : "坤造"} · 属{chart.zodiac}</h2>
          <span className="text-sm text-muted">{chart.lunarText}</span>
        </div>
        <p className="text-xs leading-6 text-muted">
          排盘时间 {chart.solarText}
          {t && (t.dstApplied || t.useTrueSolar) && <>（{t.dstApplied && "当年夏令时已减 1 小时；"}{t.useTrueSolar && `真太阳时校正 ${t.totalMinutes >= 0 ? "+" : ""}${Math.round(t.totalMinutes - (t.dstApplied ? -60 : 0))} 分钟`}）</>}
          {!chart.hasHour && "（时辰不详，只排三柱）"} · 子时{chart.input.ziSect === 2 ? "零点" : "23 点"}换日
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] table-fixed border-collapse text-center text-sm">
            <thead><tr className="text-xs text-muted"><th className="w-12" />{cols.map((p) => <th key={p.label} className={`py-1 font-normal ${p.label === "日柱" ? "text-red" : ""}`}>{p.label}</th>)}</tr></thead>
            <tbody>
              <tr><td className="text-xs text-muted">十神</td>{cols.map((p) => <td key={p.label} className="py-1">{p.stemGod}</td>)}</tr>
              <tr><td className="text-xs text-muted">天干</td>{cols.map((p) => <td key={p.label} className={p.label === "日柱" ? "bg-red/5" : ""}><Ch c={p.stem} big /></td>)}</tr>
              <tr><td className="text-xs text-muted">地支</td>{cols.map((p) => <td key={p.label} className={p.label === "日柱" ? "bg-red/5" : ""}><Ch c={p.branch} big /></td>)}</tr>
              <tr><td className="text-xs text-muted">藏干</td>{cols.map((p) => <td key={p.label} className="py-1 text-xs leading-5">{p.hidden.map((h) => <div key={h.stem}><Ch c={h.stem} /> {h.god}</div>)}</td>)}</tr>
              <tr><td className="text-xs text-muted">纳音</td>{cols.map((p) => <td key={p.label} className="text-xs">{p.nayin}</td>)}</tr>
              <tr><td className="text-xs text-muted">长生</td>{cols.map((p) => <td key={p.label} className="text-xs">{p.dishi}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">{chart.yun.startText}，{chart.yun.forward ? "顺排" : "逆排"}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="panel space-y-2 p-4">
          <h3 className="font-serif font-bold">五行力量</h3>
          {(["木", "火", "土", "金", "水"] as const).map((e) => (
            <div key={e} className="flex items-center gap-2 text-sm">
              <span className="w-4 font-bold" style={{ color: EL_COLOR[e] }}>{e}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full" style={{ width: `${chart.elementPercent[e]}%`, background: EL_COLOR[e] }} /></div>
              <span className="w-9 text-right text-xs text-muted">{chart.elementPercent[e]}%</span>
            </div>
          ))}
        </div>
        <div className="panel space-y-1.5 p-4 text-sm">
          <h3 className="font-serif font-bold">命理依据</h3>
          <p>日主 <b className="text-red">{chart.dayMaster}{chart.dayElement}</b>，{chart.strength.level}</p>
          <p className="text-xs text-muted">{chart.strength.reasons.join("；")}</p>
          <p>格局：{chart.pattern.name} <span className="text-xs text-muted">（{chart.pattern.from}）</span></p>
          <p>喜用：<b>{chart.useful.favorable.join("、")}</b>{chart.useful.unfavorable.length > 0 && <> · 忌：{chart.useful.unfavorable.join("、")}</>}</p>
          <p className="text-xs text-muted">{chart.useful.method}{chart.useful.climate ? "；" + chart.useful.climate : ""}</p>
          {chart.relations.length > 0 && <p className="text-xs text-muted">{chart.relations.join("；")}</p>}
        </div>
      </section>

      {chart.shensha.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {chart.shensha.map((s, i) => <span key={i} className="chip !cursor-default" title={s.meaning}>{s.name}<span className="ml-1 text-xs text-muted">{s.where}</span></span>)}
        </section>
      )}

      <section className="panel space-y-3 p-4">
        <h3 className="font-serif font-bold">大运</h3>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {chart.yun.pillars.map((l) => (
            <div key={l.ganzhi + l.startYear} className={`min-w-[74px] rounded-xl border p-2 text-center text-xs ${chart.yun.current?.startYear === l.startYear ? "border-red bg-red/5" : "border-line"}`}>
              <div className="font-serif text-lg font-bold"><Ch c={l.ganzhi[0]} /><Ch c={l.ganzhi[1]} /></div>
              <div>{l.startYear}</div><div className="text-muted">{l.startAge} 岁</div>
              <div className={l.favorable === "吉" ? "text-red" : "text-muted"}>{l.stemGod}·{l.favorable}</div>
            </div>
          ))}
        </div>
        <h3 className="pt-2 font-serif font-bold">近几年流年</h3>
        <ul className="space-y-1 text-sm">
          {chart.years.map((y) => <li key={y.year}><b>{y.year} {y.ganzhi}</b> <span className="text-muted">{y.stemGod} · {y.favorable}{y.notes.length ? " · " + y.notes.join("，") : ""}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
