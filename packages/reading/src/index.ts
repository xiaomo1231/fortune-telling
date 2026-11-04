import { checkReading, cleanText, CheckIssue, revisionNote, splitSentences } from "./checks";
import { templateReading } from "./fallback";
import type { ChatMessage, LlmProvider } from "./llm";
import { buildPrompt, ReadingRequest } from "./prompts";
import { filterOutput } from "./safety";
import { planStyle, SKELETONS, StylePlan } from "./style";

export * from "./checks";
export * from "./llm";
export * from "./prompts";
export * from "./safety";
export * from "./style";
export { templateReading } from "./fallback";

export interface GenerateOptions {
  llm: LlmProvider | null;
  personaId?: string;
  /** 用户最近解读的开头句 */
  history?: string[];
  /** 用户最近用过的骨架，尽量避开 */
  recentSkeletons?: string[];
  maxAttempts?: number;
  rnd?: () => number;
}

export interface GeneratedReading {
  text: string;
  source: "llm" | "template";
  personaId: string;
  skeleton: string;
  attempts: number;
  issues: CheckIssue[];
  opening: string;
}

/**
 * 生成一篇解读：模型写 → 自动检查 → 不合格带着修改意见重写（最多 maxAttempts 次）。
 * 结果整篇返回，由前端以不匀速的打字机效果呈现。
 */
export async function generateReading(req: ReadingRequest, o: GenerateOptions): Promise<GeneratedReading> {
  const rnd = o.rnd ?? Math.random;
  const avoid = (o.recentSkeletons ?? []).filter((s) => SKELETONS.includes(s));
  const plan: StylePlan = planStyle(o.personaId, rnd, avoid);
  const built = buildPrompt(req, plan);
  const checkOpts = { history: o.history, forbiddenNames: built.forbiddenNames, minLength: built.minLength };

  if (o.llm) {
    const messages: ChatMessage[] = [{ role: "system", content: built.system }, { role: "user", content: built.user }];
    let best: { text: string; issues: CheckIssue[] } | null = null;
    const max = o.maxAttempts ?? 3;
    for (let attempt = 1; attempt <= max; attempt++) {
      try {
        const raw = await o.llm.complete(messages, { tier: built.tier, maxTokens: built.maxTokens, temperature: 0.8 + rnd() * 0.12 });
        const text = filterOutput(cleanText(raw));
        const issues = checkReading(text, checkOpts);
        if (!best || issues.length < best.issues.length) best = { text, issues };
        if (!issues.length) break;
        messages.push({ role: "assistant", content: text }, { role: "user", content: revisionNote(issues) });
      } catch (e) {
        if (attempt === max && !best) break;
      }
    }
    if (best) return { text: best.text, source: "llm", personaId: plan.persona.id, skeleton: plan.skeleton, attempts: messages.length / 2, issues: best.issues, opening: splitSentences(best.text)[0] ?? "" };
  }
  const text = filterOutput(templateReading(req, plan, rnd));
  return { text, source: "template", personaId: plan.persona.id, skeleton: plan.skeleton, attempts: 0, issues: checkReading(text, checkOpts), opening: splitSentences(text)[0] ?? "" };
}
