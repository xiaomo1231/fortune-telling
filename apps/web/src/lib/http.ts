import { NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public extra?: Record<string, unknown>) { super(message); }
}

export function json(data: unknown, init?: ResponseInit) { return NextResponse.json(data, init); }

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** 统一错误处理：ApiError 原样返回，其它错误记录日志后返回 500 */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message, code: e.code, ...e.extra }, { status: e.status });
      if (e instanceof ZodError) return json({ error: "参数不正确", issues: e.issues.map((i) => i.path.join(".") + " " + i.message) }, { status: 400 });
      console.error("[api]", req.method, new URL(req.url).pathname, e);
      return json({ error: "服务暂时出了点问题，请稍后再试" }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw new ApiError(400, "请求格式不正确"); }
  return schema.parse(raw);
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
