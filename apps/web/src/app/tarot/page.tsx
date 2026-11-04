"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TarotTable } from "@/components/TarotTable";

function Inner() {
  const s = useSearchParams().get("spread") || "three";
  return <TarotTable initialSpread={s} />;
}

export default function TarotPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-wider">塔罗占卜</h1>
        <p className="text-muted">洗牌、切牌、亲手抽牌。牌由服务端加密随机洗好，抽到就是你的。</p>
      </header>
      <Suspense><Inner /></Suspense>
    </div>
  );
}
