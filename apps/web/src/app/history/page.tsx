"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppShell";
import { Thinking } from "@/components/ReadingExtras";
import { api } from "@/lib/client";

interface Item { id: string; kind: string; title: string; question: string | null; createdAt: string; feedback: string | null }
const KINDS = [["", "全部"], ["tarot", "塔罗"], ["bazi", "八字"], ["daily", "运势"], ["liuyao", "六爻"], ["qian", "灵签"]];

export default function HistoryPage() {
  const { me, handleError } = useApp();
  const [kind, setKind] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  const load = useCallback(async (k: string, c?: string) => {
    try {
      const r = await api<{ items: Item[]; nextCursor: string | null }>(`/api/readings?${new URLSearchParams({ ...(k ? { kind: k } : {}), ...(c ? { cursor: c } : {}) })}`);
      setItems((x) => (c && x ? [...x, ...r.items] : r.items)); setCursor(r.nextCursor);
    } catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { if (me?.user) { setItems(null); load(kind); } else if (me && !me.user) handleError({ status: 401 }); }, [me, kind, load, handleError]);

  async function del(id: string) {
    if (!confirm("删除这条记录？")) return;
    try { await api(`/api/readings/${id}`, { method: "DELETE" }); setItems((x) => x?.filter((i) => i.id !== id) ?? null); } catch (e) { handleError(e); }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl font-bold tracking-wider">占卜记录</h1>
      <div className="flex flex-wrap gap-2">{KINDS.map(([k, l]) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}</div>
      {!items ? <Thinking label="翻记录" /> : !items.length ? <p className="text-muted">这里还空着。<Link href="/tarot?spread=daily" className="text-red">抽一张今天的牌</Link></p> : (
        <ul className="panel divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/r/${i.id}`} className="min-w-0 flex-1 no-underline">
                <b className="font-serif">{i.title}</b>
                {i.question && <p className="truncate text-sm text-muted">{i.question}</p>}
                <p className="text-xs text-muted">{new Date(i.createdAt).toLocaleString("zh-CN", { hour12: false })}</p>
              </Link>
              <button className="shrink-0 text-xs text-muted" onClick={() => del(i.id)} aria-label="删除">删除</button>
            </li>
          ))}
        </ul>
      )}
      {cursor && <button className="btn btn-ghost" onClick={() => load(kind, cursor)}>更多</button>}
    </div>
  );
}
