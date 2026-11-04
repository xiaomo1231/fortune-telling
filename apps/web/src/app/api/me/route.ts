import { z } from "zod";
import { PERSONAS } from "@moxing/reading";
import { currentUser, destroySession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { body, json, route } from "@/lib/http";
import { walletOf } from "@/lib/quota";
import { selfProfile } from "@/lib/readings";

export const GET = route(async () => {
  const u = await currentUser();
  if (!u) return json({ user: null });
  const [wallet, self] = await Promise.all([walletOf(u.id), selfProfile(u.id)]);
  return json({ user: { id: u.id, phone: u.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"), nickname: u.nickname, personaId: u.personaId, hasSelfProfile: !!self }, wallet, personas: PERSONAS.map((p) => ({ id: p.id, name: p.name, title: p.title, intro: p.intro })) });
});

const Patch = z.object({ nickname: z.string().trim().max(20).optional(), personaId: z.enum(["qinghe", "alan", "mo"]).optional() });
export const PATCH = route(async (req) => {
  const u = await requireUser();
  const data = await body(req, Patch);
  await prisma.user.update({ where: { id: u.id }, data });
  return json({ ok: true });
});

/** 注销账号：删除账号及全部档案、记录（《个人信息保护法》要求提供删除途径） */
export const DELETE = route(async () => {
  const u = await requireUser();
  await prisma.user.delete({ where: { id: u.id } });
  await destroySession();
  return json({ ok: true });
});
