import { z } from "zod";
import { isMinor } from "@moxing/reading";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { activeMembership, Product, PRODUCTS } from "@/lib/quota";

const Body = z.object({ code: z.string().trim().min(4).max(32) });

export const POST = route(async (req) => {
  const u = await requireUser();
  if (isMinor(u.birthYear)) throw new ApiError(403, "未满 18 岁暂不支持兑换付费权益");
  const code = (await body(req, Body)).code.toUpperCase();
  const rc = await prisma.redeemCode.findUnique({ where: { code } });
  if (!rc || rc.product === "invite") throw new ApiError(404, "兑换码不存在");
  if (rc.expiresAt && rc.expiresAt < new Date()) throw new ApiError(410, "兑换码已过期");
  if (rc.usedCount >= rc.maxUses) throw new ApiError(410, "兑换码已被使用");
  if (await prisma.redemption.findUnique({ where: { code_userId: { code, userId: u.id } } })) throw new ApiError(409, "你已经兑换过这个码了");
  const product = rc.product as Product;
  if (!(product in PRODUCTS)) throw new ApiError(400, "兑换码配置有误");
  await prisma.$transaction(async (tx) => {
    const r = await tx.redeemCode.updateMany({ where: { code, usedCount: { lt: rc.maxUses } }, data: { usedCount: { increment: 1 } } });
    if (r.count !== 1) throw new ApiError(410, "兑换码已被使用");
    await tx.redemption.create({ data: { code, userId: u.id } });
    if (product === "member-month" || product === "member-year") {
      const days = (rc.days ?? PRODUCTS[product].days) * rc.quantity;
      const cur = await activeMembership(u.id, tx);
      const start = cur?.expiresAt && cur.expiresAt > new Date() ? cur.expiresAt : new Date();
      await tx.entitlement.create({ data: { userId: u.id, product, expiresAt: new Date(start.getTime() + days * 864e5), source: "redeem" } });
    } else {
      await tx.entitlement.create({ data: { userId: u.id, product, remaining: rc.quantity, source: "redeem" } });
    }
  });
  return json({ ok: true, product, productName: PRODUCTS[product].name, quantity: rc.quantity });
});
