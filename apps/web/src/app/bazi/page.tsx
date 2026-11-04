"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BaziChart } from "@moxing/engine";
import { useApp } from "@/components/AppShell";
import { BaziChartView } from "@/components/BaziChartView";
import { ProfileData, ProfileForm } from "@/components/ProfileForm";
import { Thinking } from "@/components/ReadingExtras";
import { Paragraphs, Typewriter } from "@/components/Typewriter";
import { api } from "@/lib/client";

interface BaziResp { id: string; chart: BaziChart; text: string; fullReportId: string | null; profileId: string | null }

export default function BaziPage() {
  const { me, handleError, refreshMe } = useApp();
  const [profiles, setProfiles] = useState<(ProfileData & { id: string })[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [data, setData] = useState<BaziResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState<{ text: string; fresh: boolean } | null>(null);
  const [fullBusy, setFullBusy] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api<{ profiles: (ProfileData & { id: string })[] }>("/api/profiles"); setProfiles(r.profiles); if (!r.profiles.length) setAdding(true); }
    catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { if (me?.user) load(); else if (me && !me.user) handleError({ status: 401 }); }, [me, load, handleError]);

  async function chartFor(profileId: string) {
    setSelected(profileId); setBusy(true); setData(null); setFull(null);
    try {
      const r = await api<BaziResp>("/api/bazi", { body: { profileId } });
      setData(r);
      if (r.fullReportId) { const f = await api<{ reading: { text: string } }>(`/api/readings/${r.fullReportId}`); setFull({ text: f.reading.text, fresh: false }); }
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }
  async function save(p: ProfileData) {
    setBusy(true);
    try { const r = await api<{ profile: { id: string } }>("/api/profiles", { body: p }); setAdding(false); await load(); refreshMe(); await chartFor(r.profile.id); }
    catch (e) { handleError(e); setBusy(false); }
  }
  async function buyFull() {
    if (!selected) return;
    setFullBusy(true);
    try { const r = await api<{ text: string; existing: boolean }>("/api/bazi/full", { body: { profileId: selected } }); setFull({ text: r.text, fresh: !r.existing }); refreshMe(); }
    catch (e) { handleError(e); } finally { setFullBusy(false); }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-wider">八字命盘</h1>
        <p className="text-muted">按真太阳时排盘，规则引擎先定旺衰、格局、喜用，再由解读师翻译成生活里的话。</p>
      </header>

      {profiles && profiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => <button key={p.id} className="chip" aria-pressed={selected === p.id} onClick={() => { setAdding(false); chartFor(p.id); }}>{p.name}{p.isSelf ? "（本人）" : ""}</button>)}
          <button className="chip" aria-pressed={adding} onClick={() => { setAdding(true); setData(null); setSelected(null); }}>+ 新档案</button>
        </div>
      )}
      {adding && <div className="panel p-5"><ProfileForm initial={{ relation: profiles?.some((p) => p.isSelf) ? "friend" : "self" }} onSubmit={save} busy={busy} /></div>}
      {busy && !adding && <Thinking label="正在排盘" />}
      {data && (
        <div className="space-y-6">
          <BaziChartView chart={data.chart} name={profiles?.find((p) => p.id === selected)?.name} />
          <section className="panel p-5 sm:p-7">
            <div className="ornament mb-4 font-serif text-sm">简批</div>
            <Paragraphs text={data.text} />
          </section>
          <section className="panel space-y-3 p-5 sm:p-7">
            <div className="ornament font-serif text-sm">完整命书</div>
            {full ? (full.fresh ? <Typewriter text={full.text} /> : <Paragraphs text={full.text} />) : fullBusy ? <Thinking label="正在写完整命书，大约需要半分钟" /> : (
              <div className="space-y-3 text-center">
                <p className="font-serif">性格、事业、感情、财运、健康，加上未来十年每一步大运的细批</p>
                <button className="btn btn-primary" onClick={buyFull}>生成完整命书</button>
                <p className="text-xs text-muted">同一命盘生成一次永久保存；会员每月赠送一份</p>
              </div>
            )}
          </section>
          <p className="text-center text-sm"><Link href="/" className="text-red">看看今天的个人运势 →</Link></p>
        </div>
      )}
    </div>
  );
}
