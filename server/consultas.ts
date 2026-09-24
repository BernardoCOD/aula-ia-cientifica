import { z } from "zod";
import { askWithWebSearch, type ChatMessage } from "./_core/ai";
import { saveConsultation } from "./db";

export const consultaInputSchema = z.object({
  question: z.string().trim().min(3).max(600),
  studentCode: z.string().trim().max(32).optional(),
  history: z
    .array(
      z.object({
        question: z.string().max(600),
        answer: z.string().max(4000),
      })
    )
    .max(4)
    .default([]),
});

export type ConsultaSource = { title: string; url: string };
export type ConsultaResult = {
  related: boolean;
  answer: string;
  sources: ConsultaSource[];
};

const OFF_TOPIC_MARKER = "[FUERA_DE_TEMA]";

export const CONSULTAS_SYSTEM_PROMPT = `Eres el Área de consultas de Aula IA Científica, una plataforma de capacitación sobre inteligencia artificial para estudiantes de secundaria de Lima, Perú, con discapacidad visual o motriz. Tus respuestas se leen en voz alta.

Temas permitidos: inteligencia artificial (qué es, cómo funciona, herramientas, novedades), uso responsable y ético de la IA para aprender, escritura de prompts, verificación de información y fuentes, desinformación, investigación escolar, privacidad y seguridad digital, y tecnologías de accesibilidad para personas con discapacidad visual o motriz.

Si la pregunta no tiene relación con esos temas, responde solo con ${OFF_TOPIC_MARKER} seguido de una frase amable que explique que esta área solo busca temas de la capacitación y dé un ejemplo de pregunta válida. No busques en internet en ese caso.

Si la pregunta es válida:
- Busca en internet cuando necesites datos actuales o verificables, y prioriza fuentes confiables (instituciones, universidades, organismos públicos, medios reconocidos).
- Responde en español sencillo, en 2 a 4 párrafos cortos, sin markdown, viñetas, tablas, emojis ni URLs escritas (las fuentes se muestran aparte).
- Distingue lo comprobado de lo que es opinión o está en debate, e invita a verificar en las fuentes.
- No hagas tareas para copiar: explica para que la persona entienda y elabore su propia respuesta.`;

export async function answerConsulta(
  input: z.infer<typeof consultaInputSchema>
): Promise<ConsultaResult> {
  const messages: ChatMessage[] = [];
  for (const turn of input.history) {
    messages.push({ role: "user", content: turn.question });
    messages.push({ role: "assistant", content: turn.answer });
  }
  messages.push({ role: "user", content: input.question });

  const response = await askWithWebSearch({
    system: CONSULTAS_SYSTEM_PROMPT,
    messages,
  });
  // Se quitan marcas de formato (asteriscos, almohadillas) porque la respuesta se lee en voz alta.
  const raw = response.text.replace(/[*#`]+/g, "").trim();
  if (raw.startsWith(OFF_TOPIC_MARKER))
    return {
      related: false,
      answer: raw.slice(OFF_TOPIC_MARKER.length).trim(),
      sources: [],
    };
  const result = {
    related: true,
    answer: raw,
    sources: response.sources,
  };
  await saveConsultation({
    code: input.studentCode,
    question: input.question,
    answer: result.answer,
    sources: result.sources,
  }).catch(error => console.warn("[Consultas] No se pudo guardar:", error));
  return result;
}
