import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";

export const GET = route(async (req) => {
  const u = await requireUser();
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;
  const rows = await prisma.reading.findMany({
    where: { userId: u.id, kind, status: { not: "drawing" } }, orderBy: { createdAt: "desc" }, take: 21,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, kind: true, subtype: true, question: true, createdAt: true, result: true, feedback: true },
  });
  const items = rows.slice(0, 20).map((r) => ({ ...r, result: undefined, title: titleOf(r.kind, r.subtype, r.result as Record<string, unknown> | null) }));
  return json({ items, nextCursor: rows.length > 20 ? rows[19].id : null });
});

function titleOf(kind: string, subtype: string, res: Record<string, unknown> | null): string {
  if (kind === "tarot") return "塔罗 · " + (res?.spreadName ?? subtype);
  if (kind === "bazi") return subtype === "full" ? "八字完整命书" : "八字简批";
  if (kind === "daily") return "每日运势";
  if (kind === "liuyao") return "六爻 · " + ((res?.main as { name?: string } | undefined)?.name ?? "");
  if (kind === "qian") return "灵签 · 第" + ((res?.qian as { no?: number } | undefined)?.no ?? "") + "签";
  return kind;
}
