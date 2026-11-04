import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";
import { getOwnReading, publicReading } from "@/lib/readings";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  return json({ reading: publicReading(await getOwnReading(u, id)) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  await getOwnReading(u, id);
  await prisma.reading.delete({ where: { id } });
  return json({ ok: true });
});
