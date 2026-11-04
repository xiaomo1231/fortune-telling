import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, body, json, route } from "@/lib/http";
import { ProfileInput } from "@/lib/schemas";

export const GET = route(async () => {
  const u = await requireUser();
  return json({ profiles: await prisma.profile.findMany({ where: { userId: u.id }, orderBy: [{ isSelf: "desc" }, { createdAt: "asc" }] }) });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const p = await body(req, ProfileInput);
  if ((await prisma.profile.count({ where: { userId: u.id } })) >= 20) throw new ApiError(400, "最多保存 20 份档案");
  const isSelf = p.relation === "self";
  if (isSelf) await prisma.profile.updateMany({ where: { userId: u.id, isSelf: true }, data: { isSelf: false, relation: "other" } });
  const created = await prisma.profile.create({ data: { ...p, placeName: p.placeName ?? null, longitude: p.longitude ?? null, isSelf, userId: u.id } });
  if (isSelf) await prisma.user.update({ where: { id: u.id }, data: { birthYear: p.calendar === "solar" ? p.year : p.year } });
  return json({ profile: created });
});
