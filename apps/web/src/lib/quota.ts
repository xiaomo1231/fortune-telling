// 额度与权益：免费次数、次卡、会员（含公平使用上限）
import type { Prisma, User } from "@prisma/client";
import { isMinor } from "@moxing/reading";
import { prisma } from "./db";
import { cnDay, cnMonth } from "./dates";
import { ApiError } from "./http";

export const PRODUCTS = {
  "tarot-deep": { name: "深度塔罗牌阵（含 3 次追问）", price: 6.6 },
  soulmate: { name: "正缘画像完整解读", price: 19.9 },
  liuyao: { name: "六爻问事详解", price: 9.9 },
  "bazi-full": { name: "八字完整命书", price: 29.9 },
  "member-month": { name: "月会员", price: 25, days: 30 },
  "member-year": { name: "年会员", price: 168, days: 365 },
} as const;
export type Product = keyof typeof PRODUCTS;
export const CREDIT_PRODUCTS: Product[] = ["tarot-deep", "soulmate", "liuyao", "bazi-full"];

export type Action = "tarot:daily" | "tarot:yesno" | "tarot:three" | "tarot:deep" | "tarot:soulmate" | "liuyao" | "bazi:full" | "qian";

interface Rule { free: number; product?: Product; member: boolean; }
const RULES: Record<Action, Rule> = {
  "tarot:daily": { free: 1, member: true },
  "tarot:yesno": { free: 3, member: true },
  "tarot:three": { free: 1, product: "tarot-deep", member: true },
  "tarot:deep": { free: 0, product: "tarot-deep", member: true },
  "tarot:soulmate": { free: 0, product: "soulmate", member: true },
  liuyao: { free: 0, product: "liuyao", member: true },
  "bazi:full": { free: 0, product: "bazi-full", member: false },
  qian: { free: 3, member: true },
};

/** 会员每天每类的公平使用上限 */
export const MEMBER_DAILY_CAP = 20;
/** 会员每月赠送的完整命书份数 */
export const MEMBER_MONTHLY_BAZI = 1;
/** 新用户注册时赠送的体验次数 */
export const SIGNUP_GIFTS: { product: Product; remaining: number }[] = [{ product: "tarot-deep", remaining: 1 }, { product: "liuyao", remaining: 1 }];

export async function activeMembership(userId: string, tx: Prisma.TransactionClient = prisma) {
  return tx.entitlement.findFirst({ where: { userId, product: { in: ["member-month", "member-year"] }, expiresAt: { gt: new Date() } }, orderBy: { expiresAt: "desc" } });
}

async function usage(tx: Prisma.TransactionClient, userId: string, day: string, kind: string) {
  return (await tx.usage.findUnique({ where: { userId_day_kind: { userId, day, kind } } }))?.count ?? 0;
}
async function bump(tx: Prisma.TransactionClient, userId: string, day: string, kind: string) {
  await tx.usage.upsert({ where: { userId_day_kind: { userId, day, kind } }, create: { userId, day, kind, count: 1 }, update: { count: { increment: 1 } } });
}

export type ConsumeResult = { via: "free" | "member" | "credit"; product?: Product };

/** 检查并扣减一次额度。不够时抛出 402，前端据此弹出解锁面板。 */
export async function consume(user: User, action: Action): Promise<ConsumeResult> {
  const rule = RULES[action];
  const day = cnDay();
  const minor = isMinor(user.birthYear);
  return prisma.$transaction(async (tx) => {
    const used = await usage(tx, user.id, day, action);
    const freeLimit = minor ? Math.min(rule.free, 1) : rule.free;
    if (used < freeLimit) { await bump(tx, user.id, day, action); return { via: "free" as const }; }
    if (minor) throw new ApiError(402, "今天的免费次数用完了，明天再来吧", "quota_minor");

    if (action === "bazi:full") {
      const m = await activeMembership(user.id, tx);
      if (m) {
        const monthKey = "bazi-full-month:" + cnMonth();
        if ((await usage(tx, user.id, "month", monthKey)) < MEMBER_MONTHLY_BAZI) { await bump(tx, user.id, "month", monthKey); return { via: "member" as const }; }
      }
    } else if (rule.member) {
      const m = await activeMembership(user.id, tx);
      if (m) {
        const mk = "member:" + action;
        if ((await usage(tx, user.id, day, mk)) >= MEMBER_DAILY_CAP) throw new ApiError(429, `今天已经用了 ${MEMBER_DAILY_CAP} 次，休息一下，明天再来`, "fair_use");
        await bump(tx, user.id, day, mk);
        return { via: "member" as const };
      }
    }
    if (rule.product) {
      const ent = await tx.entitlement.findFirst({ where: { userId: user.id, product: rule.product, remaining: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { createdAt: "asc" } });
      if (ent) {
        const r = await tx.entitlement.updateMany({ where: { id: ent.id, remaining: { gt: 0 } }, data: { remaining: { decrement: 1 } } });
        if (r.count === 1) return { via: "credit" as const, product: rule.product };
      }
      throw new ApiError(402, "需要解锁后才能继续", "payment_required", { product: rule.product, productName: PRODUCTS[rule.product].name, price: PRODUCTS[rule.product].price });
    }
    throw new ApiError(402, "今天的免费次数用完了，明天再来，或者开通会员", "quota_exceeded", { product: "member-month" });
  });
}

/** 我的权益概览 */
export async function walletOf(userId: string) {
  const [member, credits, todays] = await Promise.all([
    activeMembership(userId),
    prisma.entitlement.groupBy({ by: ["product"], where: { userId, product: { in: CREDIT_PRODUCTS }, remaining: { gt: 0 } }, _sum: { remaining: true } }),
    prisma.usage.findMany({ where: { userId, day: cnDay() } }),
  ]);
  const freeLeft = Object.fromEntries((Object.keys(RULES) as Action[]).filter((a) => RULES[a].free > 0).map((a) => [a, Math.max(0, RULES[a].free - (todays.find((u) => u.kind === a)?.count ?? 0))]));
  return {
    member: member ? { product: member.product, expiresAt: member.expiresAt } : null,
    credits: Object.fromEntries(credits.map((c) => [c.product, c._sum.remaining ?? 0])),
    freeLeft,
  };
}
