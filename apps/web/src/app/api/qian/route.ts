import { z } from "zod";
import { drawQian, QianTopic, qianItems } from "@moxing/engine";
import { requireUser } from "@/lib/auth";
import { asJson, prisma } from "@/lib/db";
import { body, json, route } from "@/lib/http";
import { consume } from "@/lib/quota";
import { screenOrThrow } from "@/lib/readings";

const LABEL: Record<QianTopic, string> = { love: "感情婚姻", career: "事业", money: "财运", health: "健康", family: "家宅", travel: "出行", lost: "寻物寻人", lawsuit: "官司纠纷", birth: "生育", other: "综合" };
const Body = z.object({ question: z.string().trim().max(200).default(""), topic: z.enum(["love", "career", "money", "health", "family", "travel", "lost", "lawsuit", "birth", "other"]).default("other") });

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req, Body);
  screenOrThrow(b.question);
  await consume(u, "qian");
  const { qian, tosses } = drawQian();
  const result = { qian, tosses, items: qianItems(qian, b.topic), topicLabel: LABEL[b.topic] };
  const r = await prisma.reading.create({ data: { userId: u.id, kind: "qian", subtype: String(qian.no), question: b.question || null, topic: b.topic, result: asJson(result), status: "ready", followupsLeft: 1 } });
  return json({ id: r.id, ...result });
});
