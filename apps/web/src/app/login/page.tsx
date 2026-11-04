"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppShell";
import { api, ApiErr } from "@/lib/client";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const { refreshMe } = useApp();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState("");
  const [needInvite, setNeedInvite] = useState(false);
  const [agree, setAgree] = useState(false);
  const [wait, setWait] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function send() {
    setMsg("");
    try { const r = await api<{ devCode?: string }>("/api/auth/sms", { body: { phone } }); setWait(60); if (r.devCode) { setCode(r.devCode); setMsg(`开发环境验证码：${r.devCode}`); } }
    catch (e) { setMsg(e instanceof ApiErr ? e.message : "发送失败"); }
  }
  async function login() {
    setBusy(true); setMsg("");
    try { await api("/api/auth/login", { body: { phone, code, invite: invite || undefined, agree } }); await refreshMe(); router.replace(next); }
    catch (e) { if (e instanceof ApiErr && (e.code === "invite_required" || e.code === "invite_invalid")) setNeedInvite(true); setMsg(e instanceof ApiErr ? e.message : "登录失败"); }
    finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-2xl font-bold tracking-widest">登录墨星</h1>
        <p className="text-sm text-muted">未注册的手机号验证后自动注册</p>
      </div>
      <div className="panel space-y-4 p-5">
        <div><label className="label" htmlFor="phone">手机号</label><input id="phone" className="field" inputMode="numeric" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="11 位手机号" /></div>
        <div>
          <label className="label" htmlFor="code">验证码</label>
          <div className="flex gap-2">
            <input id="code" className="field" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="6 位数字" />
            <button className="btn btn-ghost shrink-0" disabled={wait > 0 || phone.length !== 11} onClick={send}>{wait > 0 ? `${wait} 秒` : "获取验证码"}</button>
          </div>
        </div>
        {needInvite && <div><label className="label" htmlFor="inv">邀请码（内测期新用户需要）</label><input id="inv" className="field uppercase" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="MX-XXXX-XXXX" /></div>}
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>我已阅读并同意<Link href="/legal/terms" className="text-red">《用户协议》</Link>和<Link href="/legal/privacy" className="text-red">《隐私政策》</Link>，了解本产品仅供娱乐参考</span>
        </label>
        {msg && <p className="text-sm text-red" role="alert">{msg}</p>}
        <button className="btn btn-primary w-full" disabled={busy || phone.length !== 11 || code.length !== 6 || !agree} onClick={login}>{busy ? "登录中…" : "登录"}</button>
      </div>
    </div>
  );
}

export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
