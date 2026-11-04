/** 墨星牌 78 张牌面的 SVG 生成器（纯字符串，Node SSR 与浏览器通用）。 */

export type Suit = "wands" | "cups" | "swords" | "pentacles";
export type Element = "fire" | "water" | "air" | "earth";
export type Rank =
  | "ace" | "two" | "three" | "four" | "five" | "six" | "seven" | "eight" | "nine" | "ten"
  | "page" | "knight" | "queen" | "king";
export type MajorId = `major-${number}`;
export type MinorId = `${Suit}-${string}`;
export type CardId = MajorId | MinorId;
export type ColorMode = "element" | "mono";

export interface RenderOptions {
  /** "element"（默认）按元素配色，"mono" 为单色（橙副线）。 */
  mode?: ColorMode;
  /** 同一页同一张牌出现多次时用来区分 SVG 内部的 pattern / clipPath id；省略时 id 只由牌 id 推出。 */
  uid?: string;
}

export interface CardMeta {
  id: CardId;
  arcana: "major" | "minor";
  /** 大牌 0–21；小牌 1–14（1 王牌，11 侍从，12 骑士，13 王后，14 国王） */
  num: number;
  /** 大牌 "0"、"I"…"XXI"；小牌 "I"…"XIV" */
  roman: string;
  zh: string;
  en: string;
  suit?: Suit;
  rank?: Rank;
  element: Element;
  /** 牌面左上角实际印的角标：大牌罗马数字；小牌 A、2–10、侍 / 骑 / 后 / 王 */
  label: string;
  /** 大牌的核心象征说明 */
  note?: string;
}

export interface Palette { O: string; P: string; A: string; T: string }

/** 78 张牌的 id：major-0 … major-21，然后 wands / cups / swords / pentacles 各 01–14。 */
export const CARD_IDS: CardId[];
/** 返回一张牌的 SVG 字符串（viewBox 0 0 210 360，无固定宽高）。未知 id 抛错。 */
export function renderCard(id: CardId | string, opts?: RenderOptions): string;
/** 返回严格中心对称的牌背 SVG 字符串。 */
export function renderBack(opts?: RenderOptions): string;
/** 一张牌的元数据；未知 id 返回 undefined。 */
export function cardMeta(id: CardId | string): CardMeta | undefined;
export const PALETTES: Record<"mono" | Element | "back", Palette>;
export const SUITS: Record<Suit, { zh: string; en: string; element: Element }>;
