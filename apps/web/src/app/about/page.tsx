import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "关于墨星" };

export default function About() {
  return (
    <LegalPage title="关于墨星">
      <p>墨星想做一件简单的事：把塔罗牌和东方命理，用你听得懂的生活语言讲出来。</p>
      <h2>排盘是算出来的</h2>
      <p>八字按出生地经度和均时差换算真太阳时，考虑 1986–1991 年夏令时；旺衰、格局、喜用神由规则引擎先判定。六爻按京房八宫纳甲排出六亲、六神、世应、旬空、伏神。塔罗牌由服务端加密随机洗牌，抽到哪张就是哪张。</p>
      <h2>解读是“说”出来的</h2>
      <p>AI 只负责把已经算好的结论翻译成自然的话，不允许它改结论。三位解读师各有说话习惯，同一张牌也不会每次都是同一套句子。</p>
      <h2>我们不做的事</h2>
      <p>不预测彩票、寿命和死亡；不卖开光物品、不做化解法事；不制造焦虑来推销。所有内容仅供娱乐参考。</p>
      <h2>致谢</h2>
      <p>历法计算使用 lunar-javascript（MIT）；观音灵签原文整理自开源项目 guanyin-lingqian（MIT）。</p>
      <p><Link href="/" className="text-red">回到首页</Link></p>
    </LegalPage>
  );
}
