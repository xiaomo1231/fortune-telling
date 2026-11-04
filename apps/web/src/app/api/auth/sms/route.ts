import { randomInt } from "node:crypto";
import { z } from "zod";
import { sha256 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, body, clientIp, json, route } from "@/lib/http";
import { sendSmsCode } from "@/lib/sms";

const Body = z.object({ phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不对") });

export const POST = route(async (req) => {
  const { phone } = await body(req, Body);
  const ip = clientIp(req);
  const since = new Date(Date.now() - 864e5);
  const last = await prisma.smsCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < 60_000) throw new ApiError(429, "发送太频繁了，请一分钟后再试");
  if ((await prisma.smsCode.count({ where: { phone, createdAt: { gt: since } } })) >= 10) throw new ApiError(429, "今天发送次数太多了，明天再试");
  if ((await prisma.smsCode.count({ where: { ip, createdAt: { gt: since } } })) >= 30) throw new ApiError(429, "这个网络今天请求太多了");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.smsCode.create({ data: { phone, codeHash: sha256(phone + ":" + code), ip, expiresAt: new Date(Date.now() + 5 * 60_000) } });
  const r = await sendSmsCode(phone, code);
  return json({ ok: true, devCode: r.devCode });
});
