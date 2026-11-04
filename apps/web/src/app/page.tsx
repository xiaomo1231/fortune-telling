"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DailyFortune } from "@moxing/engine";
import { useApp } from "@/components/AppShell";
import { CardBack } from "@/components/CardSvg";
import { Thinking } from "@/components/ReadingExtras";
import { Paragraphs, Typewriter } from "@/components/Typewriter";
import { api, ApiErr } from "@/lib/client";

interface Daily { id: string; fortune: DailyFortune; dayMaster: string; strength: string; name: string; text: string }

const MODULES = [
  { href: "/tarot?spread=daily", t: "每日一牌", d: "抽一张今天的提醒", k: "牌" },
  { href: "/tarot?spread=yesno", t: "是与否", d: "一件事，三张牌给倾向", k: "问" },
  { href: "/tarot?spread=love-cross", t: "感情牌阵", d: "你、TA、关系走向", k: "缘" },
  { href: "/tarot?spread=soulmate", t: "正缘画像", d: "TA 的样子与相遇线索", k: "画" },
  { href: "/bazi", t: "八字命盘", d: "真太阳时排盘与命书", k: "命" },
  { href: "/liuyao", t: "六爻问事", d: "摇六次铜钱问一件具体的事", k: "爻" },
  { href: "/qian", t: "观音灵签", d: "掷筊求签，百签原文", k: "签" },
  { href: "/history", t: "占卜记录", d: "回看每一次结果", k: "录" },
];
const ASPECT = [["love", "感情"], ["work", "事业"], ["money", "财运"], ["health", "健康"]] as const;

export default function Home() {
  const { me, handleError } = useApp();
  const [daily, setDaily] = useState<Daily | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "noprofile">("idle");
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    if (!me?.user) return;
    let off = false;
    setState("loading");
    const t0 = Date.now();
    api<Daily>("/api/daily").then((d) => { if (!off) { setDaily(d); setFresh(Date.now() - t0 > 1500); setState("idle"); } }).catch((e) => {
      if (off) return;
      if (e instanceof ApiErr && e.code === "no_profile") setState("noprofile"); else { setState("idle"); handleError(e); }
    });
    return () => { off = true; };
  }, [me?.user, handleError]);

  return (
    <div className="space-y-8">
      {!me?.user ? (
        <section className="grid items-center gap-6 py-4 sm:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-wider sm:text-5xl">把牌和命盘，<br />说成你听得懂的话</h1>
            <p className="max-w-lg text-muted">塔罗、八字、六爻、观音灵签。排盘按传统规则一步步算，解读像一个懂行的朋友在跟你聊，不念模板。</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tarot?spread=daily" className="btn btn-primary">抽今天的牌</Link>
              <Link href="/login" className="btn btn-ghost">登录看个人运势</Link>
            </div>
          </div>
          <div className="mx-auto hidden w-[180px] rotate-3 sm:block"><CardBack uid="hero" className="shadow-xl" /></div>
        </section>
      ) : state === "loading" ? (
        <section className="panel p-6"><Thinking label="正在看你今天的日子" /></section>
      ) : state === "noprofile" ? (
        <section className="panel space-y-3 p-6 text-center">
          <h1 className="font-serif text-2xl font-bold">先告诉我你的生辰</h1>
          <p className="text-muted">每日运势是按你的日主和喜用神算的，填一次以后每天自动更新。</p>
          <Link href="/bazi" className="btn btn-primary">填写生辰</Link>
        </section>
      ) : daily && (
        <section className="panel space-y-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{daily.fortune.date} · {daily.fortune.lunar} · {daily.fortune.dayGanzhi}日{daily.fortune.jieqi ? " · " + daily.fortune.jieqi : ""}</p>
              <h1 className="font-serif text-2xl font-bold">{daily.name}的今日运势</h1>
            </div>
            <div className="text-right">
              <span className="font-serif text-5xl font-bold text-red">{daily.fortune.score}</span>
              <span className="ml-2 rounded-full border border-red px-2 text-sm text-red">{daily.fortune.level}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ASPECT.map(([k, l]) => (
              <div key={k} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{l}</span><span className="text-muted">{daily.fortune.aspects[k]}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full bg-red" style={{ width: `${daily.fortune.aspects[k]}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="reading-text leading-8">{fresh ? <Typewriter text={daily.text} /> : <Paragraphs text={daily.text} />}</div>
          <div className="grid gap-3 rounded-xl bg-paper-2 p-4 text-sm sm:grid-cols-2">
            <p><span className="text-muted">宜</span> {daily.fortune.yi.join("、")}</p>
            <p><span className="text-muted">忌</span> {daily.fortune.ji.join("、")}</p>
            <p><span className="text-muted">幸运色</span> {daily.fortune.luckyColors.join("、")}</p>
            <p><span className="text-muted">方位 / 数字</span> {daily.fortune.luckyDirection} · {daily.fortune.luckyNumber}</p>
          </div>
          <p className="text-xs text-muted">日主{daily.dayMaster}（{daily.strength}），今日{daily.fortune.stemGod}当值。仅供娱乐参考。</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="ornament font-serif text-lg">今天想问点什么</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="panel group flex items-start gap-3 p-4 no-underline transition hover:border-red">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red/40 font-serif text-lg text-red group-hover:bg-red group-hover:text-white">{m.k}</span>
              <span><b className="block font-serif">{m.t}</b><span className="text-xs text-muted">{m.d}</span></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
