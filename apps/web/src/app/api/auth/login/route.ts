import { z } from "zod";
import { createSession, sha256 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { SIGNUP_GIFTS } from "@/lib/quota";

const Body = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  code: z.string().regex(/^\d{6}$/),
  invite: z.string().trim().max(32).optional(),
  agree: z.literal(true, { message: "请先同意用户协议和隐私政策" }),
});

export const POST = route(async (req) => {
  const { phone, code, invite } = await body(req, Body);
  const rec = await prisma.smsCode.findFirst({ where: { phone, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (!rec || rec.attempts >= 5) throw new ApiError(400, "验证码已失效，请重新获取");
  if (rec.codeHash !== sha256(phone + ":" + code)) {
    await prisma.smsCode.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, "验证码不对");
  }
  await prisma.smsCode.update({ where: { id: rec.id }, data: { usedAt: new Date() } });

  let user = await prisma.user.findUnique({ where: { phone } });
  let isNew = false;
  if (!user) {
    let invitedBy: string | undefined;
    if (process.env.INVITE_REQUIRED === "true") {
      if (!invite) throw new ApiError(403, "内测期需要邀请码才能注册", "invite_required");
      const ic = await prisma.redeemCode.findUnique({ where: { code: invite.toUpperCase() } });
      if (!ic || ic.product !== "invite" || ic.usedCount >= ic.maxUses || (ic.expiresAt && ic.expiresAt < new Date())) throw new ApiError(403, "邀请码无效或已用完", "invite_invalid");
      await prisma.redeemCode.update({ where: { code: ic.code }, data: { usedCount: { increment: 1 } } });
      invitedBy = ic.code;
    }
    user = await prisma.user.create({ data: { phone, invitedBy, entitlements: { create: SIGNUP_GIFTS.map((g) => ({ product: g.product, remaining: g.remaining, source: "gift" })) } } });
    isNew = true;
  }
  await createSession(user.id);
  return json({ ok: true, isNew });
});
