import { beforeEach, describe, expect, it, vi } from "vitest";

// Se simula el SDK de Google: se verifica cómo se arma la petición, sin llamar a internet.
const generateContent = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", async importOriginal => {
  const original = await importOriginal<typeof import("@google/genai")>();
  return {
    ...original,
    GoogleGenAI: class {
      models = { generateContent };
    },
  };
});

process.env.GEMINI_API_KEY = "clave-de-prueba";
const { ApiError } = await import("@google/genai");
const { geminiJson, geminiWithWebSearch, GEMINI_MODELS } = await import(
  "./_core/gemini"
);
const { aiProvider } = await import("./_core/ai");

describe("Gemini (proveedor gratuito)", () => {
  beforeEach(() => generateContent.mockReset());

  it("is chosen when only GEMINI_API_KEY is configured", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(aiProvider()).toBe("gemini");
  });

  it("asks for JSON with the schema and joins consecutive turns of the same role", async () => {
    generateContent.mockResolvedValue({ text: '{"speech":"Hola"}' });
    const schema = { type: "object", properties: { speech: { type: "string" } } };
    const result = await geminiJson<{ speech: string }>({
      system: "reglas",
      messages: [
        { role: "user", content: "a" },
        { role: "user", content: "b" },
        { role: "assistant", content: "c" },
        { role: "user", content: "d" },
      ],
      schema,
    });
    expect(result).toEqual({ speech: "Hola" });
    const request = generateContent.mock.calls[0][0];
    expect(request.model).toBe(GEMINI_MODELS[0]);
    expect(request.config.systemInstruction).toBe("reglas");
    expect(request.config.responseMimeType).toBe("application/json");
    expect(request.config.responseJsonSchema).toBe(schema);
    expect(request.contents.map((item: { role: string }) => item.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
    expect(request.contents[0].parts).toHaveLength(2);
  });

  it("falls back to the next model when the free quota is exhausted (429)", async () => {
    generateContent
      .mockRejectedValueOnce(new ApiError({ message: "cuota", status: 429 }))
      .mockResolvedValueOnce({ text: '{"ok":true}' });
    const result = await geminiJson<{ ok: boolean }>({
      system: "s",
      messages: [{ role: "user", content: "hola" }],
      schema: { type: "object" },
    });
    expect(result).toEqual({ ok: true });
    expect(generateContent.mock.calls[1][0].model).toBe(GEMINI_MODELS[1]);
  });

  it("uses Google Search when GEMINI_SEARCH=google and returns the grounding sources", async () => {
    process.env.GEMINI_SEARCH = "google";
    generateContent.mockResolvedValue({
      text: "Respuesta",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: "https://unesco.org/ia", title: "UNESCO" } },
              { web: { uri: "https://unesco.org/ia", title: "UNESCO" } },
            ],
          },
        },
      ],
    });
    const result = await geminiWithWebSearch({
      system: "s",
      messages: [{ role: "user", content: "¿Qué es la IA?" }],
    });
    expect(generateContent.mock.calls[0][0].config.tools).toEqual([{ googleSearch: {} }]);
    expect(result).toEqual({
      text: "Respuesta",
      sources: [{ title: "UNESCO", url: "https://unesco.org/ia" }],
    });
    delete process.env.GEMINI_SEARCH;
  });

  it("answers from Spanish Wikipedia articles by default (free search)", async () => {
    generateContent
      .mockResolvedValueOnce({ text: '{"queries":["inteligencia artificial"]}' })
      .mockResolvedValueOnce({ text: "La IA es..." });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ query: { search: [{ title: "Inteligencia artificial" }] } }))
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            query: {
              pages: [
                {
                  title: "Inteligencia artificial",
                  extract: "La inteligencia artificial es un campo...",
                  fullurl: "https://es.wikipedia.org/wiki/Inteligencia_artificial",
                },
              ],
            },
          })
        )
      );
    const result = await geminiWithWebSearch({
      system: "s",
      messages: [{ role: "user", content: "¿Qué es la IA?" }],
    });
    expect(fetchMock.mock.calls[0][0]).toContain("es.wikipedia.org");
    const finalPrompt = JSON.stringify(generateContent.mock.calls[1][0].contents);
    expect(finalPrompt).toContain("La inteligencia artificial es un campo");
    expect(result).toEqual({
      text: "La IA es...",
      sources: [
        {
          title: "Inteligencia artificial (Wikipedia)",
          url: "https://es.wikipedia.org/wiki/Inteligencia_artificial",
        },
      ],
    });
    fetchMock.mockRestore();
  });
});
