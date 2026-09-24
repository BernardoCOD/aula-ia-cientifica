import { ApiError, GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";

// Proveedor gratuito: API de Google Gemini (clave sin tarjeta en https://aistudio.google.com/apikey).
// El plan gratuito tiene límites por minuto y por día; si un modelo se queda sin cupo (429) o no
// existe (404), se prueba el siguiente de la lista.

const DEFAULT_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"];
export const GEMINI_MODELS = (process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL, ...DEFAULT_MODELS]
  : DEFAULT_MODELS
).filter((model, index, list) => list.indexOf(model) === index);
// La búsqueda de Google solo es gratuita en la familia 2.5 (500 búsquedas diarias compartidas).
export const GEMINI_SEARCH_MODEL =
  process.env.GEMINI_SEARCH_MODEL || "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
function getGemini() {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Convierte el historial al formato de Gemini, uniendo turnos seguidos del mismo rol. */
function toContents(messages: ChatMessage[]): Content[] {
  const contents: Content[] = [];
  for (const message of messages) {
    const role = message.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last?.role === role) last.parts!.push({ text: message.content });
    else contents.push({ role, parts: [{ text: message.content }] });
  }
  return contents;
}

// Poco razonamiento: para la voz importa más la rapidez. La familia 2.5 usa otro parámetro.
const thinkingFor = (model: string) =>
  model.startsWith("gemini-2.5")
    ? { thinkingBudget: model.includes("lite") ? 0 : 512 }
    : { thinkingLevel: ThinkingLevel.LOW };

const shouldTryNextModel = (error: unknown) =>
  error instanceof ApiError && [404, 429, 500, 503].includes(error.status);

export async function geminiJson<T>(params: {
  system: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
}): Promise<T> {
  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await getGemini().models.generateContent({
        model,
        contents: toContents(params.messages),
        config: {
          systemInstruction: params.system,
          responseMimeType: "application/json",
          responseJsonSchema: params.schema,
          thinkingConfig: thinkingFor(model),
          temperature: 0.3,
        },
      });
      const text = response.text;
      if (!text) throw new Error("Gemini no devolvió respuesta.");
      return JSON.parse(text) as T;
    } catch (error) {
      lastError = error;
      if (!shouldTryNextModel(error)) throw error;
      console.warn(`[Gemini] ${model} no disponible (${(error as ApiError).status}); pruebo otro modelo.`);
    }
  }
  throw lastError;
}

export async function geminiWithWebSearch(params: {
  system: string;
  messages: ChatMessage[];
}) {
  const response = await getGemini().models.generateContent({
    model: GEMINI_SEARCH_MODEL,
    contents: toContents(params.messages),
    config: {
      systemInstruction: params.system,
      tools: [{ googleSearch: {} }],
      thinkingConfig: thinkingFor(GEMINI_SEARCH_MODEL),
    },
  });
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources = new Map<string, { title: string; url: string }>();
  for (const chunk of chunks)
    if (chunk.web?.uri)
      sources.set(chunk.web.uri, {
        title: chunk.web.title || chunk.web.uri,
        url: chunk.web.uri,
      });
  return {
    text: response.text?.trim() ?? "",
    sources: Array.from(sources.values()).slice(0, 8),
  };
}
