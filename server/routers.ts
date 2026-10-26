import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import {
  deleteStudentByCode,
  getAdminStats,
  getAdminStudents,
  getStudentDashboard,
  saveActivity,
  saveChallenge,
  saveEvaluation,
  saveProgress,
  upsertStudent,
} from "./db";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  enablePostest,
  getEligibility,
  getResearchDashboard,
  markPretest,
  saveAiInteraction,
  savePostest,
} from "./research";
import {
  isTeacherRequest,
  teacherCookieOptions,
  TEACHER_COOKIE,
  validateTeacherCredentials,
  createTeacherToken,
} from "./adminAuth";
import { TRPCError } from "@trpc/server";

const VOICE_INTENTS = [
  "NAVIGATE_HOME",
  "NAVIGATE_MODULE",
  "NAVIGATE_PRETEST",
  "NAVIGATE_POSTEST",
  "NAVIGATE_TUTOR",
  "NAVIGATE_IDENTIFICATION",
  "NAVIGATE_TEACHER",
  "OPEN_MENU",
  "OPEN_RESULTS",
  "NEXT_CONTENT",
  "PREVIOUS_CONTENT",
  "GO_TO_QUESTION",
  "REPEAT_CONTENT",
  "READ_SCREEN",
  "READ_SCREEN_FULL",
  "READ_CONTENT",
  "EXPLAIN_CONTENT",
  "SIMPLIFY_EXPLANATION",
  "START_ACTIVITY",
  "SELECT_OPTION",
  "WRITE_TEXT",
  "FILL_FORM",
  "LIST_CONTROLS",
  "ACTIVATE_CONTROL",
  "ACTIVATE_ASSISTANT",
  "STOP_ASSISTANT",
  "FOCUS_NEXT",
  "FOCUS_PREVIOUS",
  "ACTIVATE_FOCUSED",
  "TEXT_SCALE_UP",
  "TEXT_SCALE_DOWN",
  "PAUSE",
  "RESUME",
  "GO_BACK",
  "HELP",
  "CURRENT_MODULE",
  "CURRENT_CONTENT",
  "LIST_MODULES",
  "START_LEARNING",
  "CONFIRM_LOGOUT",
  "TOGGLE_SIMULATION",
  "DECLINE",
  "UNKNOWN",
] as const;

const intentInputSchema = z.object({
  text: z.string().trim().min(1).max(500),
  mode: z.enum(["learning", "evaluation"]),
  context: z
    .object({
      route: z.string().max(120).optional(),
      moduleId: z.string().max(32).optional(),
      moduleTitle: z.string().max(160).optional(),
      currentContent: z.string().max(2000).optional(),
      currentQuestion: z.string().max(1000).optional(),
      currentOptions: z.array(z.string().max(400)).max(4).optional(),
      questionIndex: z.number().int().min(0).max(9).optional(),
      totalQuestions: z.number().int().min(0).max(10).optional(),
    })
    .optional(),
});

const LEARNING_ASSISTANT_RULES =
  'Eres la capa de interpretación de intención de un asistente educativo y de accesibilidad por voz para Aula IA. Devuelve solo una intención de la lista cerrada, un mensaje breve en español natural y apto para síntesis, y un valor confidence entre 0 y 1 con tu certeza real sobre la interpretación (usa valores bajos, menores a 0.5, cuando la orden sea ambigua, incompleta o pueda confundirse con otro control o pantalla). Conoce todas las rutas: inicio, identificación, diagnóstico/pretest, dashboard o mi ruta, módulos, Tutor IA, postest y panel docente. Comprende abrir Tutor IA, tutor inteligente, retroalimentación, identificarme, panel docente, qué módulos hay, leer pantalla, lee todo (lectura detallada y completa, usa READ_SCREEN_FULL), activar texto a voz, dónde estoy, qué puedo hacer, continuar, siguiente pregunta, pregunta anterior, responder pregunta dos, ir a la pregunta tres, foco siguiente, activar control, aumentar o disminuir letra, abrir menú, ver resultados, volver al inicio, comenzar capacitación y modo simulación (usa TOGGLE_SIMULATION). Usa GO_TO_QUESTION con questionIndex basado en cero para una pregunta concreta. También interpreta "escribe" o "dicta" para WRITE_TEXT usando el campo enfocado, "completa estudiante ... colegio ..." para FILL_FORM usando solo campos no sensibles, "qué botones hay" para LIST_CONTROLS y "presiona continuar" o un nombre visible para ACTIVATE_CONTROL. Interpreta activar asistente, hablar con IA u oye Aula IA como ACTIVATE_ASSISTANT, y detener asistente o silenciar asistente como STOP_ASSISTANT. Usa el contexto de ruta y pantalla; no ejecutes acciones directamente. Ayuda a comprender, pero no hagas tareas para copiar. Nunca repitas, almacenes ni envíes contraseñas o datos sensibles; si aparecen, usa DECLINE. Si la intención es ambigua usa UNKNOWN con confidence bajo.';

const EVALUATION_ASSISTANT_RULES =
  "Eres un asistente educativo y de accesibilidad por voz en MODO EVALUACIÓN. Solo puedes leer la pregunta y alternativas (incluida una lectura detallada con READ_SCREEN_FULL si piden 'lee todo'), repetir, informar progreso, seleccionar la opción que el estudiante diga, avanzar, regresar, leer instrucciones y ajustar accesibilidad, incluyendo activar o desactivar el modo simulación. Nunca resuelvas, sugieras, expliques, insinúes ni des pistas. Usa DECLINE para cualquier solicitud de respuesta o explicación. No repitas ni proceses contraseñas ni datos sensibles. Devuelve siempre un confidence entre 0 y 1.";

// Intenciones que jamás deben ejecutar contenido explicativo durante una evaluación,
// sin importar lo que haya decidido el modelo. Segunda barrera de seguridad, además del prompt.
const EVALUATION_FORBIDDEN_INTENTS = new Set([
  "EXPLAIN_CONTENT",
  "SIMPLIFY_EXPLANATION",
  "START_ACTIVITY",
  "START_LEARNING",
  "WRITE_TEXT",
  "FILL_FORM",
]);
const EVALUATION_SAFE_DECLINE_MESSAGE =
  "Durante la evaluación no puedo explicar ni sugerir alternativas, para no afectar tu resultado. Puedo leer la pregunta, repetir o avanzar cuando quieras.";

const studentCode = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "El código solo puede contener letras, números, guion y guion bajo"
  );
const teacherProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!isTeacherRequest(ctx.req, ctx.user))
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Acceso docente requerido",
    });
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  student: router({
    register: publicProcedure
      .input(
        z.object({
          code: studentCode,
          grade: z.string().min(1).max(24),
          section: z.string().min(1).max(8),
          schoolName: z.string().max(160).optional(),
        })
      )
      .mutation(({ input }) => upsertStudent(input)),
    dashboard: publicProcedure
      .input(z.object({ code: studentCode }))
      .query(({ input }) => getStudentDashboard(input.code)),
    progress: publicProcedure
      .input(
        z.object({
          code: studentCode,
          moduleId: z.string().min(1).max(32),
          percentage: z.number().int().min(0).max(100),
          status: z.enum(["available", "in_progress", "completed"]),
        })
      )
      .mutation(({ input }) =>
        saveProgress(input).then(() => ({ success: true }))
      ),
    evaluation: publicProcedure
      .input(
        z.object({
          code: studentCode,
          type: z.enum(["diagnostic", "module", "final"]),
          moduleId: z.string().max(32).optional(),
          score: z.number().int().min(0),
          total: z.number().int().positive(),
        })
      )
      .mutation(({ input }) =>
        saveEvaluation(input).then(() => ({ success: true }))
      ),
    pretest: publicProcedure
      .input(
        z.object({
          code: studentCode,
          score: z.number().int().min(0),
          total: z.number().int().positive(),
        })
      )
      .mutation(({ input }) =>
        markPretest(input.code, input.score, input.total).then(() => ({
          success: true,
          type: "pretest" as const,
        }))
      ),
    postest: publicProcedure
      .input(
        z.object({
          code: studentCode,
          score: z.number().int().min(0),
          total: z.number().int().positive(),
        })
      )
      .mutation(async ({ input }) => {
        const eligibility = await getEligibility(input.code);
        if (!eligibility.eligible)
          throw new Error("El postest aún está bloqueado");
        await savePostest(input.code, input.score, input.total);
        return { success: true, type: "postest" as const };
      }),
    eligibility: publicProcedure
      .input(z.object({ code: studentCode }))
      .query(({ input }) => getEligibility(input.code)),
    activity: publicProcedure
      .input(
        z.object({
          code: studentCode,
          activity: z.string().min(1).max(120),
          response: z.string().min(1),
          result: z.string().min(1).max(32),
        })
      )
      .mutation(({ input }) =>
        saveActivity(input).then(() => ({ success: true }))
      ),
    challenge: publicProcedure
      .input(
        z.object({
          code: studentCode,
          challenge: z.string().min(1).max(120),
          score: z.number().int().min(0).max(100),
        })
      )
      .mutation(({ input }) =>
        saveChallenge(input).then(() => ({ success: true }))
      ),
    tutor: publicProcedure
      .input(
        z.object({
          code: studentCode,
          moduleId: z.string().min(1).max(32),
          activity: z.string().min(1).max(120),
          question: z.string().min(1).max(1000),
          response: z
            .string()
            .min(10, "Escribe una respuesta de al menos 10 caracteres")
            .max(4000),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Eres un tutor educativo para estudiantes de secundaria. Analiza la respuesta del estudiante sin hacerle la tarea. Devuelve JSON con result (correcta, parcial o incorrecta), score (0 a 100), feedback (2 a 4 frases claras), nextQuestion (una pregunta breve de seguimiento). Promueve verificar fuentes y elaborar respuestas propias.",
            },
            {
              role: "user",
              content: `Módulo: ${input.moduleId}\nActividad: ${input.activity}\nPregunta: ${input.question}\nRespuesta del estudiante: ${input.response}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tutor_feedback",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  result: {
                    type: "string",
                    enum: ["correcta", "parcial", "incorrecta"],
                  },
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  feedback: { type: "string" },
                  nextQuestion: { type: "string" },
                },
                required: ["result", "score", "feedback", "nextQuestion"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : "{}";
        const feedback = JSON.parse(text) as {
          result: string;
          score: number;
          feedback: string;
          nextQuestion: string;
        };
        await saveAiInteraction({
          ...input,
          result: feedback.result,
          score: feedback.score,
          feedback: feedback.feedback,
        });
        await saveActivity({
          code: input.code,
          activity: `Tutor IA · ${input.activity}`,
          response: input.response,
          result: feedback.result,
        });
        return feedback;
      }),
  }),
  assistant: router({
    interpretIntent: publicProcedure
      .input(intentInputSchema)
      .mutation(async ({ input }) => {
        const context = input.context;
        const contextLines = [
          context?.route ? `Ruta actual: ${context.route}` : null,
          context?.moduleId
            ? `Módulo actual: ${context.moduleId}${context.moduleTitle ? ` (${context.moduleTitle})` : ""}`
            : null,
          context?.currentContent
            ? `Contenido visible en pantalla: ${context.currentContent}`
            : null,
          context?.currentQuestion
            ? `Pregunta actual: ${context.currentQuestion}`
            : null,
          context?.currentOptions?.length
            ? `Alternativas: ${context.currentOptions.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join(" | ")}`
            : null,
          typeof context?.questionIndex === "number" &&
          typeof context?.totalQuestions === "number"
            ? `Progreso: pregunta ${context.questionIndex + 1} de ${context.totalQuestions}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");

        const systemPrompt =
          input.mode === "evaluation"
            ? EVALUATION_ASSISTANT_RULES
            : LEARNING_ASSISTANT_RULES;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Contexto actual:\n${contextLines || "Sin contexto adicional."}\n\nMensaje del estudiante: "${input.text}"`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "voice_intent",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  intent: { type: "string", enum: [...VOICE_INTENTS] },
                  moduleNumber: { type: "integer" },
                  optionLetter: {
                    type: "string",
                    enum: ["A", "B", "C", "D", ""],
                  },
                  message: { type: "string" },
                  value: { type: "string" },
                  controlTarget: { type: "string" },
                  fields: {
                    type: "object",
                    properties: {
                      student: { type: "string" },
                      school: { type: "string" },
                    },
                    additionalProperties: false,
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                },
                required: ["intent", "moduleNumber", "optionLetter", "message"],
                additionalProperties: false,
              },
            },
          },
        }).catch(() => null);

        if (!response) {
          return {
            intent: "UNKNOWN" as const,
            moduleNumber: 0,
            optionLetter: "",
            message:
              "En este momento no puedo interpretar tu voz. Puedes continuar usando la navegación normal de la pantalla.",
            confidence: 0,
          };
        }

        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : "{}";
        let parsed: {
          intent: string;
          moduleNumber: number;
          optionLetter: string;
          message: string;
          confidence?: number;
        };
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = {
            intent: "UNKNOWN",
            moduleNumber: 0,
            optionLetter: "",
            message:
              "No logré entenderte. Puedes decir: 'abrir módulo dos' o 'repetir'.",
            confidence: 0,
          };
        }

        // Segunda barrera de seguridad: en modo evaluación, ninguna intención explicativa puede pasar,
        // sin importar lo que haya devuelto el modelo.
        if (
          input.mode === "evaluation" &&
          EVALUATION_FORBIDDEN_INTENTS.has(parsed.intent)
        ) {
          return {
            intent: "DECLINE" as const,
            moduleNumber: 0,
            optionLetter: "",
            message: EVALUATION_SAFE_DECLINE_MESSAGE,
            confidence: 1,
          };
        }

        if (
          !VOICE_INTENTS.includes(
            parsed.intent as (typeof VOICE_INTENTS)[number]
          )
        ) {
          return {
            intent: "UNKNOWN" as const,
            moduleNumber: 0,
            optionLetter: "",
            message:
              parsed.message ||
              "No logré entenderte. Puedes decir: 'abrir módulo dos' o 'repetir'.",
            confidence: parsed.confidence ?? 0.3,
          };
        }

        return {
          ...parsed,
          confidence:
            typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
        };
      }),
  }),
  admin: router({
    login: publicProcedure
      .input(
        z.object({
          username: z.string().min(1).max(80),
          password: z.string().min(1).max(200),
        })
      )
      .mutation(({ input, ctx }) => {
        if (!validateTeacherCredentials(input.username, input.password))
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuario o contraseña incorrectos",
          });
        ctx.res.cookie(
          TEACHER_COOKIE,
          createTeacherToken(),
          teacherCookieOptions
        );
        return { success: true as const };
      }),
    session: publicProcedure.query(({ ctx }) => ({
      authenticated: isTeacherRequest(ctx.req, ctx.user),
    })),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(TEACHER_COOKIE, {
        ...teacherCookieOptions,
        maxAge: -1,
      });
      return { success: true as const };
    }),
    stats: teacherProcedure.query(() => getAdminStats()),
    students: teacherProcedure.query(() => getAdminStudents()),
    research: teacherProcedure.query(() => getResearchDashboard()),
    enablePostest: teacherProcedure
      .input(z.object({ code: studentCode }))
      .mutation(async ({ input }) => ({
        success: await enablePostest(input.code),
      })),
    deleteStudent: teacherProcedure
      .input(
        z.object({ code: studentCode, confirmation: z.literal("ELIMINAR") })
      )
      .mutation(async ({ input }) => ({
        success: await deleteStudentByCode(input.code),
      })),
    analyzeResponse: teacherProcedure
      .input(
        z.object({
          question: z.string().min(1).max(1000),
          response: z.string().min(1).max(4000),
          result: z.string().max(32).optional(),
          score: z.number().int().min(0).max(100).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const answer = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Eres asesor pedagógico para docentes de secundaria. Analiza una respuesta estudiantil con enfoque formativo. Devuelve JSON con nivel (fortaleza, en desarrollo o requiere apoyo), hallazgo (una frase), recomendacion (una acción concreta para el docente) y pregunta (una pregunta de seguimiento). No inventes datos ni califiques de forma punitiva.",
            },
            {
              role: "user",
              content: `Pregunta: ${input.question}\nRespuesta: ${input.response}\nResultado automático: ${input.result ?? "no disponible"}\nPuntaje automático: ${input.score ?? "no disponible"}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "teacher_response_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  nivel: {
                    type: "string",
                    enum: ["fortaleza", "en desarrollo", "requiere apoyo"],
                  },
                  hallazgo: { type: "string" },
                  recomendacion: { type: "string" },
                  pregunta: { type: "string" },
                },
                required: ["nivel", "hallazgo", "recomendacion", "pregunta"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = answer.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : "{}";
        return JSON.parse(text) as {
          nivel: string;
          hallazgo: string;
          recomendacion: string;
          pregunta: string;
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
