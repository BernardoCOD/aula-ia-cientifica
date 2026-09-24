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
  getRecentConsultations,
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
import Anthropic from "@anthropic-ai/sdk";
import {
  askClaudeJson,
  ClaudeNotConfiguredError,
  isClaudeConfigured,
} from "./_core/claude";
import { agentInputSchema, runAgentTurn } from "./assistantAgent";
import { answerConsulta, consultaInputSchema } from "./consultas";
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

/** Convierte los errores de la API de Claude en mensajes comprensibles que el asistente puede leer. */
async function withClaude<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error(
      "[Claude]",
      error instanceof ClaudeNotConfiguredError ? error.message : error
    );
    const message =
      error instanceof ClaudeNotConfiguredError
        ? "La inteligencia artificial no está configurada: falta la clave ANTHROPIC_API_KEY en el archivo .env del servidor."
        : error instanceof Anthropic.AuthenticationError
          ? "La clave de Claude no es válida. Revisa ANTHROPIC_API_KEY en el archivo .env."
          : error instanceof Anthropic.RateLimitError
            ? "El servicio de IA está recibiendo demasiadas solicitudes. Espera unos segundos e inténtalo otra vez."
            : error instanceof Anthropic.APIConnectionError
              ? "No hay conexión con el servicio de IA. Revisa la conexión a internet."
              : error instanceof Anthropic.APIError
                ? "El servicio de IA tuvo un problema. Inténtalo otra vez en un momento."
                : "No pude completar la solicitud. Inténtalo otra vez.";
    throw new TRPCError({
      code:
        error instanceof ClaudeNotConfiguredError
          ? "PRECONDITION_FAILED"
          : "INTERNAL_SERVER_ERROR",
      message,
    });
  }
}

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
        const feedback = await withClaude(() =>
          askClaudeJson<{
            result: string;
            score: number;
            feedback: string;
            nextQuestion: string;
          }>({
            system:
              "Eres un tutor educativo para estudiantes de secundaria. Analiza la respuesta del estudiante sin hacerle la tarea. Devuelve result (correcta, parcial o incorrecta), score (entero de 0 a 100), feedback (2 a 4 frases claras, sin markdown, porque se leen en voz alta) y nextQuestion (una pregunta breve de seguimiento). Promueve verificar fuentes y elaborar respuestas propias.",
            messages: [
              {
                role: "user",
                content: `Módulo: ${input.moduleId}\nActividad: ${input.activity}\nPregunta: ${input.question}\nRespuesta del estudiante: ${input.response}`,
              },
            ],
            schema: {
              type: "object",
              properties: {
                result: {
                  type: "string",
                  enum: ["correcta", "parcial", "incorrecta"],
                },
                score: { type: "integer" },
                feedback: { type: "string" },
                nextQuestion: { type: "string" },
              },
              required: ["result", "score", "feedback", "nextQuestion"],
              additionalProperties: false,
            },
            effort: "medium",
          })
        );
        feedback.score = Math.max(0, Math.min(100, Math.round(feedback.score)));
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
    /** Indica al navegador si la IA está configurada, para avisarlo por voz desde el inicio. */
    status: publicProcedure.query(() => ({ aiReady: isClaudeConfigured() })),
    /** Un turno del agente: recibe la orden y la fotografía de la pantalla, devuelve voz y acciones. */
    act: publicProcedure
      .input(agentInputSchema)
      .mutation(({ input }) => withClaude(() => runAgentTurn(input))),
  }),
  consultas: router({
    ask: publicProcedure
      .input(consultaInputSchema)
      .mutation(({ input }) => withClaude(() => answerConsulta(input))),
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
      .mutation(({ input }) =>
        withClaude(() =>
          askClaudeJson<{
            nivel: string;
            hallazgo: string;
            recomendacion: string;
            pregunta: string;
          }>({
            system:
              "Eres asesor pedagógico para docentes de secundaria. Analiza una respuesta estudiantil con enfoque formativo. Devuelve nivel (fortaleza, en desarrollo o requiere apoyo), hallazgo (una frase), recomendacion (una acción concreta para el docente) y pregunta (una pregunta de seguimiento). No inventes datos ni califiques de forma punitiva.",
            messages: [
              {
                role: "user",
                content: `Pregunta: ${input.question}\nRespuesta: ${input.response}\nResultado automático: ${input.result ?? "no disponible"}\nPuntaje automático: ${input.score ?? "no disponible"}`,
              },
            ],
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
            effort: "medium",
          })
        )
      ),
    consultations: teacherProcedure.query(() => getRecentConsultations()),
  }),
});

export type AppRouter = typeof appRouter;
