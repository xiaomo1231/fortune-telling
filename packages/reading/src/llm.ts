// 模型适配器：DeepSeek、通义千问、豆包都提供 OpenAI 兼容的 chat/completions 接口，
// 换模型只需要改环境变量。
export interface ChatMessage { role: "system" | "user" | "assistant"; content: string; }

export interface LlmConfig {
  baseUrl: string; // 例如 https://api.deepseek.com
  apiKey: string;
  fastModel: string; // 日常解读
  proModel: string; // 深度命书、凯尔特十字
  timeoutMs?: number;
}

export interface LlmProvider {
  name: string;
  complete(messages: ChatMessage[], opts: { tier: "fast" | "pro"; temperature?: number; maxTokens?: number; signal?: AbortSignal }): Promise<string>;
}

export function llmFromEnv(env: Record<string, string | undefined> = process.env): LlmProvider | null {
  const apiKey = env.AI_API_KEY;
  if (!apiKey) return null;
  return openAICompatible({
    baseUrl: env.AI_BASE_URL || "https://api.deepseek.com",
    apiKey,
    fastModel: env.AI_MODEL_FAST || "deepseek-chat",
    proModel: env.AI_MODEL_PRO || env.AI_MODEL_FAST || "deepseek-chat",
    timeoutMs: Number(env.AI_TIMEOUT_MS || 60000),
  });
}

export function openAICompatible(cfg: LlmConfig): LlmProvider {
  return {
    name: cfg.baseUrl,
    async complete(messages, opts) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 60000);
      opts.signal?.addEventListener("abort", () => ctrl.abort());
      try {
        const res = await fetch(cfg.baseUrl.replace(/\/$/, "") + "/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({
            model: opts.tier === "pro" ? cfg.proModel : cfg.fastModel,
            messages,
            temperature: opts.temperature ?? 0.85,
            max_tokens: opts.maxTokens ?? 1600,
            stream: false,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = json.choices?.[0]?.message?.content ?? "";
        if (!text.trim()) throw new Error("LLM 返回为空");
        return text;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
