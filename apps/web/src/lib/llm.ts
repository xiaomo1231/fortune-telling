import { llmFromEnv, LlmProvider } from "@moxing/reading";

let cached: LlmProvider | null | undefined;
export function llm(): LlmProvider | null {
  if (cached === undefined) cached = llmFromEnv(process.env);
  return cached;
}
