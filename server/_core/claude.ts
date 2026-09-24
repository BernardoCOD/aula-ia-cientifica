import Anthropic from "@anthropic-ai/sdk";

// Modelo y esfuerzo configurables por variables de entorno. El asistente de voz necesita respuestas
// rápidas, por eso el esfuerzo por defecto es "low"; el Área de consultas usa uno mayor.
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];
const envEffort = (value: string | undefined, fallback: Effort): Effort =>
  EFFORTS.includes(value as Effort) ? (value as Effort) : fallback;
export const ASSISTANT_EFFORT = envEffort(process.env.ANTHROPIC_EFFORT, "low");
export const RESEARCH_EFFORT = envEffort(
  process.env.ANTHROPIC_RESEARCH_EFFORT,
  "medium"
);

// Si Claude rechaza una solicitud por sus filtros de seguridad, la API reintenta automáticamente
// con un modelo alternativo dentro de la misma llamada ("fallbacks").
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;

export function isClaudeConfigured() {
  return Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
  );
}

export class ClaudeNotConfiguredError extends Error {
  constructor() {
    super(
      "Falta ANTHROPIC_API_KEY en el archivo .env: el asistente inteligente no está disponible."
    );
  }
}

export function getClaude() {
  if (!isClaudeConfigured()) throw new ClaudeNotConfiguredError();
  // Un timeout corto evita que la voz quede "pensando" demasiado si la red falla.
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 2 });
  return client;
}

export function textOf(content: Anthropic.Beta.BetaContentBlock[]) {
  return content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map(block => block.text)
    .join("");
}

/**
 * Pide a Claude una respuesta que cumpla exactamente el esquema JSON indicado
 * (salidas estructuradas) y la devuelve ya interpretada.
 */
export async function askClaudeJson<T>(params: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: Record<string, unknown>;
  effort?: Effort;
  maxTokens?: number;
}): Promise<T> {
  const response = await getClaude().beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: params.maxTokens ?? 8000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    system: [
      {
        type: "text",
        text: params.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: params.messages,
    output_config: {
      effort: params.effort ?? ASSISTANT_EFFORT,
      format: { type: "json_schema", schema: params.schema },
    },
  });
  if (response.stop_reason === "refusal")
    throw new Error("Claude no pudo responder a esta solicitud.");
  if (response.stop_reason === "max_tokens")
    throw new Error("La respuesta de Claude quedó incompleta.");
  return JSON.parse(textOf(response.content)) as T;
}

/**
 * Llamada con la herramienta de búsqueda web de Anthropic (se ejecuta en sus servidores).
 * Si la búsqueda interna alcanza su límite de iteraciones, la API devuelve "pause_turn" y se
 * reanuda enviando de nuevo la conversación, sin agregar mensajes nuevos.
 */
export async function askClaudeWithWebSearch(params: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  maxSearches?: number;
}) {
  const messages = [...params.messages];
  for (let continuation = 0; continuation < 4; continuation++) {
    const response = await getClaude().beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: params.system,
      messages,
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: params.maxSearches ?? 5,
        },
      ],
      output_config: { effort: RESEARCH_EFFORT },
    });
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    if (response.stop_reason === "refusal")
      throw new Error("Claude no pudo responder a esta consulta.");
    return response;
  }
  throw new Error("La búsqueda tardó demasiado. Intenta con una pregunta más concreta.");
}
