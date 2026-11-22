import ExcelJS from "exceljs";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { students, voiceEvents, type VoiceEvent } from "../drizzle/schema";
import {
  HELP_INTENTS,
  RECOGNIZED_BY,
  RECOGNIZED_BY_LABELS,
  isRecognized,
  redactHeard,
  taskFor,
  type RecognizedBy,
} from "@shared/evidence";
import { getDb, getStudentByCode } from "./db";
import { getResearchDashboard } from "./research";

// Evidencias del TIF (Fase 4): guarda cada orden al asistente y arma el Excel del panel docente.

export const voiceEventInputSchema = z.object({
  sessionId: z.string().trim().min(1).max(64),
  studentCode: z.string().trim().max(32).regex(/^[a-zA-Z0-9_-]*$/).optional(),
  route: z.string().max(200),
  inputMode: z.enum(["voz", "texto"]),
  heard: z.string().trim().min(1).max(500),
  asrConfidence: z.number().min(0).max(1).optional(),
  recognizedBy: z.enum(RECOGNIZED_BY),
  intent: z.string().trim().min(1).max(80),
  completed: z.boolean(),
  responseMs: z.number().int().min(0).max(600_000),
});
export type VoiceEventInput = z.infer<typeof voiceEventInputSchema>;

/** Guarda una interacción. La tarea y la "ayuda" se calculan aquí, con las mismas reglas para todos. */
export async function saveVoiceEvent(input: VoiceEventInput) {
  const db = await getDb();
  if (!db) return { saved: false };
  const student = input.studentCode ? await getStudentByCode(input.studentCode) : undefined;
  await db.insert(voiceEvents).values({
    studentId: student?.id ?? null,
    sessionId: input.sessionId,
    route: input.route,
    inputMode: input.inputMode,
    heard: redactHeard(input.heard),
    asrConfidence: input.asrConfidence ?? null,
    recognizedBy: input.recognizedBy,
    intent: input.intent,
    task: taskFor(input.intent),
    completed: input.completed,
    responseMs: input.responseMs,
    helpNeeded: HELP_INTENTS.includes(input.intent),
  });
  return { saved: true };
}

type EventRow = VoiceEvent & { code: string | null };

async function getVoiceEvents(): Promise<EventRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ event: voiceEvents, code: students.code })
    .from(voiceEvents)
    .leftJoin(students, eq(voiceEvents.studentId, students.id))
    .orderBy(desc(voiceEvents.createdAt));
  return attributeSessions(rows.map(row => ({ ...row.event, code: row.code })));
}

/**
 * Las órdenes dichas antes de ingresar el código ("quiero empezar", "pe cero uno") quedan sin
 * participante. Si en esa misma sesión del navegador luego ingresó alguien, se le asignan a esa persona.
 */
export function attributeSessions(events: EventRow[]): EventRow[] {
  const codeBySession = new Map<string, string>();
  for (const event of [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()))
    if (event.code && !codeBySession.has(event.sessionId)) codeBySession.set(event.sessionId, event.code);
  return events.map(event => ({ ...event, code: event.code ?? codeBySession.get(event.sessionId) ?? null }));
}

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : null);

export type ParticipantIndicators = {
  code: string;
  sessions: number;
  commands: number;
  byVoice: number;
  byText: number;
  recognized: number;
  recognizedPct: number | null;
  asrConfidenceAvg: number | null;
  completed: number;
  completedPct: number | null;
  responseMsAvg: number | null;
  responseMsLocalAvg: number | null;
  responseMsAiAvg: number | null;
  helpRequests: number;
};

/** Indicadores de la ficha de observación por participante (los eventos sin código van aparte). */
export function summarizeByParticipant(events: EventRow[]): ParticipantIndicators[] {
  const groups = new Map<string, EventRow[]>();
  for (const event of events) {
    const code = event.code ?? "Sin código";
    groups.set(code, [...(groups.get(code) ?? []), event]);
  }
  return Array.from(groups, ([code, rows]) => {
    const recognized = rows.filter(row => isRecognized(row.recognizedBy as RecognizedBy, row.intent)).length;
    const completed = rows.filter(row => row.completed).length;
    const confidences = rows
      .map(row => row.asrConfidence)
      .filter((value): value is number => typeof value === "number" && value > 0);
    return {
      code,
      sessions: new Set(rows.map(row => row.sessionId)).size,
      commands: rows.length,
      byVoice: rows.filter(row => row.inputMode === "voz").length,
      byText: rows.filter(row => row.inputMode === "texto").length,
      recognized,
      recognizedPct: percent(recognized, rows.length),
      asrConfidenceAvg: confidences.length
        ? Math.round((confidences.reduce((sum, value) => sum + value, 0) / confidences.length) * 100) / 100
        : null,
      completed,
      completedPct: percent(completed, rows.length),
      responseMsAvg: average(rows.map(row => row.responseMs)),
      responseMsLocalAvg: average(rows.filter(row => row.recognizedBy === "local").map(row => row.responseMs)),
      responseMsAiAvg: average(rows.filter(row => row.recognizedBy === "ia").map(row => row.responseMs)),
      helpRequests: rows.filter(row => row.helpNeeded).length,
    };
  }).sort((a, b) => a.code.localeCompare(b.code, "es"));
}

/** Fecha y hora de Lima, legible en el Excel. */
const limaTime = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF26356B" } };

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: { header: string; key: string; width: number }[],
  rows: Record<string, unknown>[]
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns;
  sheet.addRows(rows);
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 32;
  if (rows.length) sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return sheet;
}

const yesNo = (value: boolean) => (value ? "Sí" : "No");

/** Libro Excel con los indicadores del TIF, listo para anexos y análisis. */
export async function buildEvidenceWorkbook(now = new Date()) {
  const [events, research] = await Promise.all([getVoiceEvents(), getResearchDashboard()]);
  const evaluationsByCode = new Map(research.students.map(student => [student.code, student]));
  const summary = summarizeByParticipant(events);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Aula IA Científica";
  workbook.created = now;

  addSheet(
    workbook,
    "Resumen por participante",
    [
      { header: "Código", key: "code", width: 14 },
      { header: "Sesiones", key: "sessions", width: 10 },
      { header: "Comandos emitidos", key: "commands", width: 12 },
      { header: "Por voz", key: "byVoice", width: 9 },
      { header: "Por texto", key: "byText", width: 9 },
      { header: "Comandos reconocidos", key: "recognized", width: 13 },
      { header: "% reconocidos", key: "recognizedPct", width: 12 },
      { header: "Confianza media del reconocimiento de voz (0-1)", key: "asrConfidenceAvg", width: 16 },
      { header: "Tareas completadas", key: "completed", width: 12 },
      { header: "% tareas completadas", key: "completedPct", width: 12 },
      { header: "Tiempo medio de respuesta (ms)", key: "responseMsAvg", width: 14 },
      { header: "Tiempo medio, comandos locales (ms)", key: "responseMsLocalAvg", width: 15 },
      { header: "Tiempo medio, con IA (ms)", key: "responseMsAiAvg", width: 14 },
      { header: "Veces que pidió ayuda", key: "helpRequests", width: 12 },
      { header: "Pretest (%)", key: "pretest", width: 10 },
      { header: "Postest (%)", key: "postest", width: 10 },
      { header: "Diferencia (puntos)", key: "difference", width: 11 },
    ],
    summary.map(row => {
      const evaluation = evaluationsByCode.get(row.code);
      return {
        ...row,
        pretest: evaluation?.pretest ?? null,
        postest: evaluation?.postest ?? null,
        difference: evaluation?.difference ?? null,
      };
    })
  );

  addSheet(
    workbook,
    "Registro de interacciones",
    [
      { header: "Fecha y hora (Lima)", key: "date", width: 20 },
      { header: "Código", key: "code", width: 12 },
      { header: "Sesión", key: "session", width: 12 },
      { header: "Pantalla", key: "route", width: 16 },
      { header: "Medio", key: "inputMode", width: 8 },
      { header: "Comando emitido (lo que dijo o escribió)", key: "heard", width: 40 },
      { header: "Confianza del reconocimiento (0-1)", key: "asrConfidence", width: 14 },
      { header: "Reconocido por", key: "recognizedBy", width: 20 },
      { header: "Intención", key: "intent", width: 20 },
      { header: "Tarea", key: "task", width: 26 },
      { header: "Completada", key: "completed", width: 11 },
      { header: "Tiempo de respuesta (ms)", key: "responseMs", width: 13 },
      { header: "Pidió ayuda", key: "helpNeeded", width: 10 },
    ],
    events.map(event => ({
      date: limaTime(event.createdAt),
      code: event.code ?? "Sin código",
      session: event.sessionId.slice(0, 8),
      route: event.route,
      inputMode: event.inputMode,
      heard: event.heard,
      asrConfidence: event.asrConfidence ?? null,
      recognizedBy: RECOGNIZED_BY_LABELS[event.recognizedBy as RecognizedBy] ?? event.recognizedBy,
      intent: event.intent,
      task: event.task,
      completed: yesNo(event.completed),
      responseMs: event.responseMs,
      helpNeeded: yesNo(event.helpNeeded),
    }))
  );

  addSheet(
    workbook,
    "Evaluaciones",
    [
      { header: "Código", key: "code", width: 14 },
      { header: "Pretest (%)", key: "pretest", width: 12 },
      { header: "Postest (%)", key: "postest", width: 12 },
      { header: "Diferencia (puntos)", key: "difference", width: 14 },
      { header: "Postest habilitado", key: "postestEnabled", width: 14 },
    ],
    research.students.map(student => ({
      code: student.code,
      pretest: student.pretest,
      postest: student.postest,
      difference: student.difference,
      postestEnabled: yesNo(student.postestEnabled),
    }))
  );

  const definitions = addSheet(
    workbook,
    "Definiciones",
    [
      { header: "Indicador", key: "name", width: 34 },
      { header: "Cómo se obtiene", key: "definition", width: 110 },
    ],
    [
      { name: "Comandos emitidos", definition: "Cantidad de órdenes que la persona dijo (o escribió) al asistente. Cada frase es una fila del registro." },
      { name: "Comandos reconocidos", definition: "Órdenes que el asistente entendió y pudo atender: comando local, IA, código de participante o confirmación. No cuentan las 'No entendido', 'IA no disponible' ni los errores de la IA." },
      { name: "Confianza del reconocimiento de voz", definition: "Valor de 0 a 1 que informa el reconocedor de voz del navegador (Web Speech API) para cada frase dicha. Algunos navegadores no lo informan." },
      { name: "Tareas completadas", definition: "Órdenes cuya acción se realizó: el comando local se ejecutó, o las acciones de la IA se completaron sin fallar. La tarea se asigna según la intención (por ejemplo, 'Responder evaluación')." },
      { name: "Tiempo de respuesta (ms)", definition: "Milisegundos desde que se reconoció la frase hasta que el asistente tuvo lista su respuesta (antes de empezar a hablar). Incluye la consulta a la IA cuando la hubo." },
      { name: "Pidió ayuda", definition: "La persona pidió ayuda ('ayuda', '¿qué puedo decir?') o que repita lo último ('repite'). La ayuda de un facilitador no se registra automáticamente: anotarla en la ficha de observación." },
      { name: "Sesión", definition: "Una visita a la app en un navegador. Agrupa las órdenes seguidas de una misma persona." },
      { name: "Privacidad", definition: "No se graba audio. Solo se guarda el texto de cada orden; las frases que mencionan contraseñas o claves se guardan como '[omitido por privacidad]'." },
      { name: "Generado", definition: `${limaTime(now)} (hora de Lima), desde el panel docente de Aula IA Científica.` },
    ]
  );
  definitions.getColumn("definition").alignment = { wrapText: true, vertical: "top" };

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    filename: `evidencias-aula-ia-${limaTime(now).slice(0, 10)}.xlsx`,
    base64: Buffer.from(buffer).toString("base64"),
    events: events.length,
    participants: summary.length,
  };
}
