"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiErr } from "@/lib/client";

export interface Me {
  user: { id: string; phone: string; nickname: string | null; personaId: string; hasSelfProfile: boolean } | null;
  wallet?: { member: { product: string; expiresAt: string } | null; credits: Record<string, number>; freeLeft: Record<string, number> };
  personas?: { id: string; name: string; title: string; intro: string }[];
}

type Modal =
  | { kind: "paywall"; message: string; product?: string; productName?: string; price?: number }
  | { kind: "crisis"; message: string }
  | { kind: "notice"; title: string; message: string; href?: string; hrefLabel?: string }
  | null;

interface Ctx { me: Me | null; refreshMe: () => Promise<void>; handleError: (e: unknown) => void; showNotice: (title: string, message: string) => void; }
const AppCtx = createContext<Ctx>({ me: null, refreshMe: async () => {}, handleError: () => {}, showNotice: () => {} });
export const useApp = () => useContext(AppCtx);

const NAV = [
  { href: "/tarot", label: "塔罗" },
  { href: "/bazi", label: "八字" },
  { href: "/liuyao", label: "六爻" },
  { href: "/qian", label: "灵签" },
  { href: "/me", label: "我的" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const router = useRouter();
  const path = usePathname();

  const refreshMe = useCallback(async () => { try { setMe(await api<Me>("/api/me")); } catch { setMe({ user: null }); } }, []);
  useEffect(() => { refreshMe(); }, [refreshMe]);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiErr) {
      if (e.status === 401) { router.push("/login?next=" + encodeURIComponent(path)); return; }
      if (e.status === 402) { setModal({ kind: "paywall", message: e.message, product: e.data?.product as string, productName: e.data?.productName as string, price: e.data?.price as number }); return; }
      if (e.code === "crisis") { setModal({ kind: "crisis", message: e.message }); return; }
      if (e.code === "same_question") { setModal({ kind: "notice", title: "这件事刚问过", message: e.message, href: "/r/" + e.data?.readingId, hrefLabel: "看上次的结果" }); return; }
      setModal({ kind: "notice", title: "提示", message: e.message });
      return;
    }
    setModal({ kind: "notice", title: "网络好像不太稳", message: "请稍后再试一次。" });
  }, [router, path]);
  const showNotice = useCallback((title: string, message: string) => setModal({ kind: "notice", title, message }), []);

  return (
    <AppCtx.Provider value={{ me, refreshMe, handleError, showNotice }}>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md border-2 border-red font-serif text-lg font-bold text-red">墨</span>
            <span className="font-serif text-lg font-bold tracking-[0.12em]">墨星</span>
          </Link>
          <nav className="hidden gap-1 sm:flex" aria-label="主导航">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`rounded-full px-4 py-1.5 text-[15px] no-underline ${path.startsWith(n.href) ? "bg-red text-white" : "hover:text-red"}`}>{n.label}</Link>
            ))}
          </nav>
          {me?.user === null && <Link href="/login" className="btn btn-ghost !min-h-9 !px-4 text-sm sm:ml-2">登录</Link>}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:pb-16">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-24 text-center text-xs leading-6 text-muted sm:pb-10">
        <p>墨星是传统文化与心理娱乐产品，所有内容仅供娱乐参考，不构成医疗、法律、投资等专业建议。解读内容由 AI 生成。</p>
        <p className="space-x-3"><Link href="/legal/terms">用户协议</Link><Link href="/legal/privacy">隐私政策</Link><Link href="/about">关于墨星</Link>{process.env.NEXT_PUBLIC_ICP && <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">{process.env.NEXT_PUBLIC_ICP}</a>}</p>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden" aria-label="底部导航">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`flex h-14 items-center justify-center font-serif text-[15px] no-underline ${path.startsWith(n.href) ? "font-bold text-red" : "text-muted"}`}>{n.label}</Link>
        ))}
      </nav>
      {modal && <ModalView modal={modal} onClose={() => setModal(null)} onRedeemed={() => { setModal(null); refreshMe(); }} />}
    </AppCtx.Provider>
  );
}

function ModalView({ modal, onClose, onRedeemed }: { modal: NonNullable<Modal>; onClose: () => void; onRedeemed: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel w-full max-w-md rounded-b-none p-6 sm:rounded-b-[14px]" onClick={(e) => e.stopPropagation()}>
        {modal.kind === "paywall" && <Paywall modal={modal} onClose={onClose} onRedeemed={onRedeemed} />}
        {modal.kind === "crisis" && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold">先停一下</h2>
            <p>{modal.message}</p>
            <div className="rounded-xl bg-paper-2 p-4 text-sm leading-7">
              <p>全国心理援助热线：<a className="font-bold text-red" href="tel:12356">12356</a></p>
              <p>希望 24 热线：<a className="font-bold text-red" href="tel:4001619995">400-161-9995</a></p>
              <p>紧急情况：<a className="font-bold text-red" href="tel:120">120</a> / <a className="font-bold text-red" href="tel:110">110</a></p>
            </div>
            <button className="btn btn-ghost w-full" onClick={onClose}>我知道了</button>
          </div>
        )}
        {modal.kind === "notice" && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold">{modal.title}</h2>
            <p className="text-muted">{modal.message}</p>
            <div className="flex gap-3">
              {modal.href && <Link href={modal.href} onClick={onClose} className="btn btn-primary flex-1">{modal.hrefLabel}</Link>}
              <button className="btn btn-ghost flex-1" onClick={onClose}>好的</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Paywall({ modal, onClose, onRedeemed }: { modal: Extract<NonNullable<Modal>, { kind: "paywall" }>; onClose: () => void; onRedeemed: () => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function redeem() {
    setBusy(true); setMsg("");
    try { const r = await api<{ productName: string }>("/api/redeem", { body: { code } }); setMsg(`已兑换：${r.productName}，可以继续了`); setTimeout(onRedeemed, 900); }
    catch (e) { setMsg(e instanceof ApiErr ? e.message : "兑换失败"); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold">{modal.productName ? `解锁「${modal.productName}」` : "今天的免费次数用完了"}</h2>
      <p className="text-muted">{modal.message}</p>
      <div className="grid grid-cols-2 gap-3 text-center text-sm">
        {modal.productName && <div className="rounded-xl border border-red p-3"><div className="font-serif text-2xl font-bold text-red">¥{modal.price}</div><div>单次</div></div>}
        <div className="rounded-xl border border-line p-3"><div className="font-serif text-2xl font-bold">¥25<span className="text-sm font-normal">/月</span></div><div>会员不限塔罗与六爻</div></div>
      </div>
      <p className="rounded-lg bg-paper-2 p-3 text-xs leading-6 text-muted">内测期间暂未开通在线支付，可以用运营发放的兑换码解锁。</p>
      <div className="flex gap-2">
        <input className="field" placeholder="输入兑换码" value={code} onChange={(e) => setCode(e.target.value)} aria-label="兑换码" />
        <button className="btn btn-primary shrink-0" disabled={busy || code.length < 4} onClick={redeem}>兑换</button>
      </div>
      {msg && <p className="text-sm text-red">{msg}</p>}
      <button className="btn btn-ghost w-full" onClick={onClose}>先不了</button>
    </div>
  );
}
