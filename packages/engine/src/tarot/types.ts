export type Suit = "wands" | "cups" | "swords" | "pentacles";
export type Topic = "love" | "work" | "money" | "self";

/** 紧凑格式，见 majors.ts 顶部注释 */
export type RawCard = [
  string, string, string, string, string, string,
  [string, string], [string, string], [string, string], [string, string], [string, string], [number, number], string,
];

export interface TarotCard {
  id: string;
  arcana: "major" | "minor";
  suit?: Suit;
  rank?: number; // 1–14
  zh: string; en: string;
  image: string;
  keywords: { up: string; rev: string };
  topics: Record<Topic, { up: string; rev: string }>;
  advice: { up: string; rev: string };
  tone: { up: number; rev: number };
  astro: string;
  element: "火" | "水" | "风" | "土";
}
