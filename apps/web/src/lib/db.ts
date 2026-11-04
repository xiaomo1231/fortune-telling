import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

import type { Prisma } from "@prisma/client";
/** 引擎结果是普通对象，序列化一次去掉 undefined，并满足 Prisma 的 Json 类型 */
export function asJson(x: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(x)) as Prisma.InputJsonValue; }
