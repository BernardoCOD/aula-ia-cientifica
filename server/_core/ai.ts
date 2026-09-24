import type Anthropic from "@anthropic-ai/sdk";
import {
  askClaudeJson,
  askClaudeWithWebSearch,
  isClaudeConfigured,
  textOf,
} from "./claude";
import {
  geminiJson,
  geminiWithWebSearch,
  isGeminiConfigured,
  type ChatMessage,
} from "./gemini";

// Capa común de IA: la app funciona con Google Gemini (plan gratuito) o con Claude (de pago),
// según la clave que haya en .env. Si hay ambas, AI_PROVIDER decide (por defecto, Gemini).

export type { ChatMessage };
export type AiProvider = "gemini" | "claude";
export type WebAnswer = { text: string; sources: { title: string; url: string }[] };

export function aiProvider(): AiProvider | null {
  const gemini = isGeminiConfigured();
  const claude = isClaudeConfigured();
  if (gemini && claude)
    return process.env.AI_PROVIDER === "claude" ? "claude" : "gemini";
  if (gemini) return "gemini";
  if (claude) return "claude";
  return null;
}
export const isAiConfigured = () => aiProvider() !== null;

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "Falta la clave de IA en el archivo .env (GEMINI_API_KEY, gratuita en aistudio.google.com/apikey)."
    );
  }
}

/** Respuesta de la IA que cumple el esquema JSON indicado, ya interpretada. */
export async function askJson<T>(params: {
  system: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
}): Promise<T> {
  const provider = aiProvider();
  if (provider === "gemini") return geminiJson<T>(params);
  if (provider === "claude") return askClaudeJson<T>(params);
  throw new AiNotConfiguredError();
}

/** Respuesta en texto con búsqueda en internet y las fuentes usadas. */
export async function askWithWebSearch(params: {
  system: string;
  messages: ChatMessage[];
}): Promise<WebAnswer> {
  const provider = aiProvider();
  if (provider === "gemini") return geminiWithWebSearch(params);
  if (provider === "claude") {
    const response = await askClaudeWithWebSearch(params);
    return { text: textOf(response.content).trim(), sources: claudeSources(response.content) };
  }
  throw new AiNotConfiguredError();
}

/** Fuentes citadas por Claude o, si no citó, los primeros resultados de su búsqueda. */
function claudeSources(content: Anthropic.Beta.BetaContentBlock[]) {
  const sources = new Map<string, { title: string; url: string }>();
  for (const block of content)
    if (block.type === "text")
      for (const citation of block.citations ?? [])
        if (citation.type === "web_search_result_location")
          sources.set(citation.url, { title: citation.title || citation.url, url: citation.url });
  if (sources.size === 0)
    for (const block of content)
      if (block.type === "web_search_tool_result" && Array.isArray(block.content))
        for (const result of block.content.slice(0, 5))
          sources.set(result.url, { title: result.title, url: result.url });
  return Array.from(sources.values()).slice(0, 8);
}
