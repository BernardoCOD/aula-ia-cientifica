import { ApiError, GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";
import { searchWikipedia } from "./webSources";

// Proveedor gratuito: API de Google Gemini (clave sin tarjeta en https://aistudio.google.com/apikey).
// El plan gratuito tiene límites por minuto y por día, y a veces un modelo está saturado: si un
// modelo no responde (sin cupo, saturado, inexistente o demasiado lento), se prueba el siguiente.
// Primero Gemma (modelo abierto de Google, gratuito y en la práctica el menos saturado del plan
// gratuito); después los Gemini Flash como respaldo.

const DEFAULT_MODELS = [
  "gemma-4-26b-a4b-it",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemma-4-31b-it",
];
/** Tiempo máximo por intento: con voz, más vale probar otro modelo que esperar mucho. */
const ATTEMPT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 30_000;
export const GEMINI_MODELS = (process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL, ...DEFAULT_MODELS]
  : DEFAULT_MODELS
).filter((model, index, list) => list.indexOf(model) === index);
// Búsqueda de Google integrada (GEMINI_SEARCH=google): solo si la cuenta la tiene habilitada.
// Por defecto el Área de consultas busca en Wikipedia, que es gratuita.
export const GEMINI_SEARCH_MODEL =
  process.env.GEMINI_SEARCH_MODEL || "gemini-flash-latest";

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

// Poco razonamiento: para la voz importa más la rapidez. Gemma no acepta este ajuste y la familia
// 2.5 usa otro parámetro.
const thinkingFor = (model: string) =>
  model.startsWith("gemma")
    ? undefined
    : model.startsWith("gemini-2.5")
      ? { thinkingBudget: model.includes("lite") ? 0 : 512 }
      : { thinkingLevel: ThinkingLevel.LOW };

const shouldTryNextModel = (error: unknown) =>
  (error instanceof ApiError && [404, 429, 500, 503, 504].includes(error.status)) ||
  (error instanceof Error && /abort|timeout|timed out/i.test(`${error.name} ${error.message}`));

const statusOf = (error: unknown) =>
  error instanceof ApiError ? error.status : "tiempo agotado";

/**
 * Llama a Gemini probando los modelos en orden hasta que uno responda. Si todos están saturados,
 * espera un momento y hace una segunda vuelta (la saturación del plan gratuito suele ser breve).
 */
async function generateWithFallback(
  build: (model: string) => Parameters<GoogleGenAI["models"]["generateContent"]>[0]
) {
  let lastError: unknown;
  const attempts = [...GEMINI_MODELS, "pausa", ...GEMINI_MODELS.slice(0, 3)];
  for (const model of attempts) {
    if (model === "pausa") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }
    try {
      const request = build(model);
      return await getGemini().models.generateContent({
        ...request,
        config: { ...request.config, httpOptions: { timeout: ATTEMPT_TIMEOUT_MS } },
      });
    } catch (error) {
      lastError = error;
      if (!shouldTryNextModel(error)) throw error;
      console.warn(`[Gemini] ${model} no disponible (${statusOf(error)}); pruebo otro modelo.`);
    }
  }
  throw lastError;
}

export async function geminiJson<T>(params: {
  system: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
}): Promise<T> {
  const response = await generateWithFallback(model => ({
    model,
    contents: toContents(params.messages),
    config: {
      systemInstruction: params.system,
      responseMimeType: "application/json",
      responseJsonSchema: params.schema,
      thinkingConfig: thinkingFor(model),
      temperature: 0.3,
    },
  }));
  const text = response.text;
  if (!text) throw new Error("Gemini no devolvió respuesta.");
  return JSON.parse(text) as T;
}

type WebAnswer = { text: string; sources: { title: string; url: string }[] };

/** Búsqueda de Google integrada en Gemini (no incluida en el plan gratuito de todas las cuentas). */
async function answerWithGoogleSearch(params: { system: string; messages: ChatMessage[] }): Promise<WebAnswer> {
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
      sources.set(chunk.web.uri, { title: chunk.web.title || chunk.web.uri, url: chunk.web.uri });
  return { text: response.text?.trim() ?? "", sources: Array.from(sources.values()).slice(0, 8) };
}

/**
 * Búsqueda gratuita: Gemini propone términos de búsqueda, se consultan artículos de Wikipedia en
 * español y Gemini redacta la respuesta usando solo esos textos, que se muestran como fuentes.
 */
async function answerWithWikipedia(params: { system: string; messages: ChatMessage[] }): Promise<WebAnswer> {
  const question = params.messages[params.messages.length - 1]?.content ?? "";
  const { queries } = await geminiJson<{ queries: string[] }>({
    system:
      "Propón de 1 a 3 términos de búsqueda cortos (2 a 5 palabras, en español) para encontrar artículos de Wikipedia que respondan la pregunta. Si la pregunta no trata de inteligencia artificial, uso responsable de la IA, prompts, verificación de información, investigación, privacidad o accesibilidad digital, devuelve una lista vacía.",
    messages: [{ role: "user", content: question }],
    schema: {
      type: "object",
      properties: { queries: { type: "array", items: { type: "string" } } },
      required: ["queries"],
    },
  });
  const found = queries.length ? await searchWikipedia(queries).catch(() => []) : [];
  const sourcesText = found.length
    ? found.map((source, index) => `[${index + 1}] ${source.title}: ${source.extract}`).join("\n\n")
    : "No se encontraron fuentes.";
  const messages: ChatMessage[] = [
    ...params.messages.slice(0, -1),
    {
      role: "user",
      content: `${question}

Fuentes encontradas (Wikipedia en español):
${sourcesText}`,
    },
  ];
  const response = await generateWithFallback(model => ({
    model,
    contents: toContents(messages),
    config: {
      systemInstruction: `${params.system}

No tienes un buscador: basa tu respuesta en las fuentes encontradas que acompañan la pregunta. Si no alcanzan para responder algo, dilo con honestidad y sugiere dónde verificarlo. No menciones los números de las fuentes.`,
      thinkingConfig: thinkingFor(model),
    },
  }));
  return {
    text: response.text?.trim() ?? "",
    sources: found.map(({ title, url }) => ({ title, url })),
  };
}

export async function geminiWithWebSearch(params: {
  system: string;
  messages: ChatMessage[];
}): Promise<WebAnswer> {
  if (process.env.GEMINI_SEARCH === "google") {
    try {
      return await answerWithGoogleSearch(params);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      console.warn(`[Gemini] Búsqueda de Google no disponible (${error.status}); uso Wikipedia.`);
    }
  }
  return answerWithWikipedia(params);
}
