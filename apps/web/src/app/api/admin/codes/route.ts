import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";

const Body = z.object({
  product: z.enum(["invite", "tarot-deep", "soulmate", "liuyao", "bazi-full", "member-month", "member-year"]),
  quantity: z.number().int().min(1).max(100).default(1),
  days: z.number().int().min(1).max(3660).optional(),
  count: z.number().int().min(1).max(500).default(1),
  maxUses: z.number().int().min(1).max(10000).default(1),
  note: z.string().max(100).optional(),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
});

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeCode() { const b = randomBytes(8); return "MX-" + Array.from(b, (x, i) => ALPHA[x % ALPHA.length] + (i === 3 ? "-" : "")).join(""); }

/** 内测运营用：批量生成兑换码或邀请码。需要请求头 x-admin-token。 */
export const POST = route(async (req) => {
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected || token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) throw new ApiError(401, "unauthorized");
  const b = await body(req, Body);
  const expiresAt = b.expiresInDays ? new Date(Date.now() + b.expiresInDays * 864e5) : null;
  const codes = Array.from({ length: b.count }, makeCode);
  await prisma.redeemCode.createMany({ data: codes.map((code) => ({ code, product: b.product, quantity: b.quantity, days: b.days, maxUses: b.maxUses, note: b.note, expiresAt })) });
  return json({ codes });
});
