import type { Profile, Reading, User } from "@prisma/client";
import { createHash } from "node:crypto";
import { BaziInput, computeBazi } from "@moxing/engine";
import { generateReading, ReadingRequest, screenInput, splitSentences } from "@moxing/reading";
import { prisma } from "./db";
import { ApiError } from "./http";
import { llm } from "./llm";

export function questionHash(kind: string, q: string | null | undefined): string | null {
  const t = (q || "").replace(/[\s，。？?！!、,.]/g, "").toLowerCase();
  if (t.length < 2) return null;
  return createHash("sha1").update(kind + ":" + t).digest("hex").slice(0, 20);
}

/** 输入安全检查；危机或违规时直接抛出，前端展示对应提示 */
export function screenOrThrow(text: string | null | undefined) {
  const r = screenInput(text || "");
  if (!r.ok) throw new ApiError(422, r.message, r.kind === "crisis" ? "crisis" : "refused");
}

/** 同一件事 24 小时内重复占卜时提醒 */
export async function findRecentSame(userId: string, kind: string, hash: string | null) {
  if (!hash) return null;
  return prisma.reading.findFirst({ where: { userId, kind, questionHash: hash, createdAt: { gt: new Date(Date.now() - 864e5) } }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } });
}

async function recentStyle(userId: string) {
  const rs = await prisma.reading.findMany({ where: { userId, text: { not: null } }, orderBy: { createdAt: "desc" }, take: 20, select: { text: true, result: true } });
  return {
    history: rs.map((r) => splitSentences(r.text || "")[0]).filter(Boolean) as string[],
    recentSkeletons: rs.map((r) => (r.result as { _skeleton?: string } | null)?._skeleton).filter(Boolean).slice(0, 3) as string[],
  };
}

export async function interpret(user: User, req: ReadingRequest) {
  const { history, recentSkeletons } = await recentStyle(user.id);
  return generateReading(req, { llm: llm(), personaId: user.personaId, history, recentSkeletons });
}

/** 返回给前端的 Reading，去掉服务端私有字段 */
export function publicReading(r: Reading & { followups?: { question: string; answer: string; createdAt: Date }[] }) {
  const { secret: _s, userId: _u, questionHash: _q, ...rest } = r;
  const result = r.result && typeof r.result === "object" ? Object.fromEntries(Object.entries(r.result as Record<string, unknown>).filter(([k]) => !k.startsWith("_"))) : r.result;
  return { ...rest, result };
}

export async function getOwnReading(user: User, id: string) {
  const r = await prisma.reading.findFirst({ where: { id, userId: user.id }, include: { followups: { orderBy: { createdAt: "asc" } } } });
  if (!r) throw new ApiError(404, "找不到这次记录");
  return r;
}

export function profileToInput(p: Profile): BaziInput {
  return {
    calendar: p.calendar === "lunar" ? "lunar" : "solar", year: p.year, month: p.month, day: p.day, leapMonth: p.leapMonth,
    hour: p.hour, minute: p.minute, gender: p.gender === "female" ? "female" : "male", longitude: p.longitude, placeName: p.placeName ?? undefined,
    useTrueSolar: p.longitude != null, ziSect: p.ziSect === 2 ? 2 : 1,
  };
}

export function chartOf(p: Profile) { return computeBazi(profileToInput(p)); }

export async function selfProfile(userId: string) {
  return prisma.profile.findFirst({ where: { userId, isSelf: true } });
}
