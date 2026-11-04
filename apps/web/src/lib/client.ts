"use client";
// 前端调用接口的统一封装
export class ApiErr extends Error {
  constructor(public status: number, message: string, public code?: string, public data?: Record<string, unknown>) { super(message); }
}

export async function api<T = Record<string, unknown>>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "content-type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiErr(res.status, data.error || "请求失败", data.code, data);
  return data as T;
}
