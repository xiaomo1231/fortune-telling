"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppShell";
import { ProfileData, ProfileForm } from "@/components/ProfileForm";
import { api } from "@/lib/client";

const CREDIT_NAME: Record<string, string> = { "tarot-deep": "深度牌阵", soulmate: "正缘画像", liuyao: "六爻详解", "bazi-full": "完整命书" };
const FREE_NAME: Record<string, string> = { "tarot:daily": "每日一牌", "tarot:yesno": "是与否", "tarot:three": "三张牌", qian: "灵签" };
type P = ProfileData & { id: string };

export default function MePage() {
  const { me, refreshMe, handleError, showNotice } = useApp();
  const router = useRouter();
  const [profiles, setProfiles] = useState<P[]>([]);
  const [editing, setEditing] = useState<P | "new" | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setProfiles((await api<{ profiles: P[] }>("/api/profiles")).profiles); } catch (e) { handleError(e); } }, [handleError]);
  useEffect(() => { if (me?.user) load(); else if (me && !me.user) handleError({ status: 401 }); }, [me, load, handleError]);
  if (!me?.user) return null;
  const w = me.wallet;

  async function persona(id: string) { try { await api("/api/me", { method: "PATCH", body: { personaId: id } }); refreshMe(); } catch (e) { handleError(e); } }
  async function saveProfile(p: ProfileData) {
    setBusy(true);
    try {
      if (editing && editing !== "new") await api(`/api/profiles/${editing.id}`, { method: "PUT", body: p }); else await api("/api/profiles", { body: p });
      setEditing(null); await load(); refreshMe();
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }
  async function delProfile(id: string) { if (!confirm("删除这份档案？相关记录会保留。")) return; try { await api(`/api/profiles/${id}`, { method: "DELETE" }); load(); refreshMe(); } catch (e) { handleError(e); } }
  async function redeem() {
    setBusy(true);
    try { const r = await api<{ productName: string; quantity: number }>("/api/redeem", { body: { code } }); setCode(""); showNotice("兑换成功", `已到账：${r.productName}${r.quantity > 1 ? " × " + r.quantity : ""}`); refreshMe(); }
    catch (e) { handleError(e); } finally { setBusy(false); }
  }
  async function logout() { await api("/api/auth/logout", { body: {} }).catch(() => {}); await refreshMe(); router.push("/"); }
  async function deleteAccount() {
    if (!confirm("注销后，账号、档案、全部占卜记录和未用完的权益都会永久删除，无法恢复。确定吗？")) return;
    try { await api("/api/me", { method: "DELETE" }); await refreshMe(); router.push("/"); } catch (e) { handleError(e); }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="font-serif text-3xl font-bold tracking-wider">我的</h1><p className="text-sm text-muted">{me.user.phone}</p></div>
        <Link href="/history" className="btn btn-ghost">占卜记录</Link>
      </header>

      <section className="panel space-y-3 p-5">
        <h2 className="font-serif text-lg font-bold">权益</h2>
        <p>{w?.member ? <>会员有效期至 <b>{new Date(w.member.expiresAt).toLocaleDateString("zh-CN")}</b></> : <span className="text-muted">还不是会员（月卡 ¥25 / 年卡 ¥168，全部牌阵与六爻不限次，每月送一份完整命书）</span>}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(w?.credits ?? {}).map(([k, v]) => <span key={k} className="chip !cursor-default">{CREDIT_NAME[k] ?? k} <b className="ml-1 text-red">{v}</b></span>)}
        </div>
        <p className="text-xs text-muted">今日免费剩余：{Object.entries(w?.freeLeft ?? {}).map(([k, v]) => `${FREE_NAME[k] ?? k} ${v}`).join(" · ")}</p>
        <div className="flex gap-2"><input className="field" placeholder="输入兑换码" value={code} onChange={(e) => setCode(e.target.value)} maxLength={32} /><button className="btn btn-primary shrink-0" disabled={busy || code.trim().length < 4} onClick={redeem}>兑换</button></div>
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="font-serif text-lg font-bold">解读师</h2>
        <p className="text-sm text-muted">选一位你喜欢的说话方式，之后的解读都由 TA 来写。</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {me.personas?.map((p) => (
            <button key={p.id} className={`panel p-4 text-left ${me.user!.personaId === p.id ? "!border-red" : ""}`} aria-pressed={me.user!.personaId === p.id} onClick={() => persona(p.id)}>
              <b className="font-serif text-lg">{p.name}</b> <span className="text-xs text-muted">{p.title}</span>
              <p className="mt-1 text-sm text-muted">{p.intro}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="panel space-y-3 p-5">
        <div className="flex items-center justify-between"><h2 className="font-serif text-lg font-bold">生辰档案</h2><button className="btn btn-ghost !min-h-9 text-sm" onClick={() => setEditing("new")}>+ 新档案</button></div>
        {editing ? (
          <div className="space-y-3">
            <ProfileForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? { relation: profiles.some((p) => p.isSelf) ? "friend" : "self" } : editing} onSubmit={saveProfile} busy={busy} submitLabel="保存" />
            <button className="text-sm text-muted underline" onClick={() => setEditing(null)}>取消</button>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                <span><b>{p.name}</b>{p.isSelf && <span className="ml-1 text-xs text-red">本人</span>}<span className="ml-2 text-xs text-muted">{p.calendar === "lunar" ? "农历" : "公历"} {p.year}-{p.month}-{p.day} {p.hour != null ? `${p.hour}:${String(p.minute ?? 0).padStart(2, "0")}` : "时辰不详"} · {p.placeName ?? "未校正"}</span></span>
                <span className="flex shrink-0 gap-3 text-sm"><button className="text-red" onClick={() => setEditing(p)}>编辑</button><button className="text-muted" onClick={() => delProfile(p.id)}>删除</button></span>
              </li>
            ))}
            {!profiles.length && <li className="py-2 text-sm text-muted">还没有档案</li>}
          </ul>
        )}
      </section>

      <section className="flex flex-wrap gap-3 text-sm">
        <button className="btn btn-ghost" onClick={logout}>退出登录</button>
        <button className="btn btn-ghost !text-muted" onClick={deleteAccount}>注销账号</button>
      </section>
    </div>
  );
}
