"use client";
import { renderBack, renderCard } from "@moxing/card-art";
import { useMemo } from "react";

/** 牌面 SVG。uid 用来区分同一页面里同一张牌的多个实例 */
export function CardFace({ id, uid, reversed, className = "" }: { id: string; uid?: string; reversed?: boolean; className?: string }) {
  const svg = useMemo(() => renderCard(id, { uid }), [id, uid]);
  return <div className={`card-svg aspect-[7/12] overflow-hidden rounded-[8px] ${reversed ? "rotate-180" : ""} ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function CardBack({ uid, className = "" }: { uid?: string; className?: string }) {
  const svg = useMemo(() => renderBack({ uid }), [uid]);
  return <div className={`card-svg aspect-[7/12] overflow-hidden rounded-[8px] ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}
