"use client";
import { useMemo, useState } from "react";
import { CITIES } from "@moxing/engine";

export interface ProfileData {
  id?: string; name: string; relation: string; gender: "male" | "female"; calendar: "solar" | "lunar";
  year: number; month: number; day: number; leapMonth: boolean; hour: number | null; minute: number | null;
  placeName: string | null; longitude: number | null; ziSect: 1 | 2; isSelf?: boolean;
}

const REL = [["self", "本人"], ["partner", "伴侣"], ["family", "家人"], ["friend", "朋友"], ["other", "其他"]];

export function ProfileForm({ initial, onSubmit, submitLabel = "保存并排盘", busy }: { initial?: Partial<ProfileData>; onSubmit: (p: ProfileData) => void; submitLabel?: string; busy?: boolean }) {
  const [p, setP] = useState<ProfileData>({
    name: "", relation: "self", gender: "female", calendar: "solar", year: 1995, month: 1, day: 1, leapMonth: false, hour: 12, minute: 0,
    placeName: "北京", longitude: 116.41, ziSect: 1, ...initial,
  });
  const [unknownTime, setUnknownTime] = useState(initial?.hour === null);
  const [customLng, setCustomLng] = useState(false);
  const provinces = useMemo(() => Array.from(new Set(CITIES.map((c) => c.province))), []);
  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) => setP((x) => ({ ...x, [k]: v }));
  const dateStr = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  const timeStr = p.hour == null ? "" : `${String(p.hour).padStart(2, "0")}:${String(p.minute ?? 0).padStart(2, "0")}`;
  const valid = p.name.trim().length > 0 && p.year >= 1900 && p.year <= 2100;

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit({ ...p, hour: unknownTime ? null : p.hour, minute: unknownTime ? null : p.minute }); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="pn">称呼</label><input id="pn" className="field" maxLength={20} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="比如：自己、小周" required /></div>
        <div>
          <span className="label">关系</span>
          <div className="flex flex-wrap gap-2">{REL.map(([k, l]) => <button type="button" key={k} className="chip" aria-pressed={p.relation === k} onClick={() => set("relation", k)}>{l}</button>)}</div>
        </div>
        <div>
          <span className="label">性别</span>
          <div className="flex gap-2">{[["female", "女"], ["male", "男"]].map(([k, l]) => <button type="button" key={k} className="chip" aria-pressed={p.gender === k} onClick={() => set("gender", k as "male" | "female")}>{l}</button>)}</div>
        </div>
        <div>
          <span className="label">历法</span>
          <div className="flex gap-2">{[["solar", "公历"], ["lunar", "农历"]].map(([k, l]) => <button type="button" key={k} className="chip" aria-pressed={p.calendar === k} onClick={() => set("calendar", k as "solar" | "lunar")}>{l}</button>)}</div>
        </div>
        <div>
          <label className="label" htmlFor="pd">出生日期{p.calendar === "lunar" && "（农历，按数字填写）"}</label>
          <input id="pd" type="date" className="field" min="1900-01-01" max="2100-12-31" value={dateStr} onChange={(e) => { const [y, m, d] = e.target.value.split("-").map(Number); if (y) setP((x) => ({ ...x, year: y, month: m, day: d })); }} />
          {p.calendar === "lunar" && <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={p.leapMonth} onChange={(e) => set("leapMonth", e.target.checked)} />闰月</label>}
        </div>
        <div>
          <label className="label" htmlFor="pt">出生时间（北京时间）</label>
          <input id="pt" type="time" className="field" disabled={unknownTime} value={timeStr} onChange={(e) => { const [h, m] = e.target.value.split(":").map(Number); setP((x) => ({ ...x, hour: h, minute: m })); }} />
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={unknownTime} onChange={(e) => setUnknownTime(e.target.checked)} />不知道出生时辰（只排三柱）</label>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="pc">出生地（用来计算真太阳时）</label>
          {!customLng ? (
            <select id="pc" className="field" value={p.placeName ?? ""} onChange={(e) => { const c = CITIES.find((x) => x.name === e.target.value); setP((x) => ({ ...x, placeName: c?.name ?? null, longitude: c?.lng ?? null })); }}>
              <option value="">不校正（按北京时间排盘）</option>
              {provinces.map((pr) => <optgroup key={pr} label={pr}>{CITIES.filter((c) => c.province === pr).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</optgroup>)}
            </select>
          ) : (
            <div className="flex gap-2"><input className="field" placeholder="地名" value={p.placeName ?? ""} onChange={(e) => set("placeName", e.target.value)} /><input className="field" type="number" step="0.01" min={70} max={140} placeholder="东经，如 113.26" value={p.longitude ?? ""} onChange={(e) => set("longitude", e.target.value ? Number(e.target.value) : null)} /></div>
          )}
          <button type="button" className="mt-1 text-xs text-muted underline underline-offset-4" onClick={() => setCustomLng(!customLng)}>{customLng ? "从城市列表选择" : "列表里没有？手动填经度"}</button>
        </div>
        <div className="sm:col-span-2">
          <span className="label">子时换日（23:00–01:00 出生才有影响）</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={p.ziSect === 1} onClick={() => set("ziSect", 1)}>23 点换日（常用）</button>
            <button type="button" className="chip" aria-pressed={p.ziSect === 2} onClick={() => set("ziSect", 2)}>0 点换日（早晚子时）</button>
          </div>
        </div>
      </div>
      <button className="btn btn-primary w-full sm:w-auto" disabled={!valid || busy}>{busy ? "排盘中…" : submitLabel}</button>
    </form>
  );
}
