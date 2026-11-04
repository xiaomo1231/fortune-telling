import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { ProfileInput } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, id: string) {
  const p = await prisma.profile.findFirst({ where: { id, userId } });
  if (!p) throw new ApiError(404, "找不到这份档案");
  return p;
}

export const PUT = route<Ctx>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  await own(u.id, id);
  const p = await body(req, ProfileInput);
  const isSelf = p.relation === "self";
  if (isSelf) await prisma.profile.updateMany({ where: { userId: u.id, isSelf: true, NOT: { id } }, data: { isSelf: false, relation: "other" } });
  const updated = await prisma.profile.update({ where: { id }, data: { ...p, placeName: p.placeName ?? null, longitude: p.longitude ?? null, isSelf } });
  if (isSelf) await prisma.user.update({ where: { id: u.id }, data: { birthYear: p.year } });
  return json({ profile: updated });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const p = await own(u.id, id);
  await prisma.profile.delete({ where: { id } });
  if (p.isSelf) await prisma.user.update({ where: { id: u.id }, data: { birthYear: null } });
  return json({ ok: true });
});
