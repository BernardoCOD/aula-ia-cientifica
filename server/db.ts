import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import {
  activities,
  aiInteractions,
  challenges,
  consultations,
  CREATE_TABLES_SQL,
  evaluations,
  moduleProgress,
  students,
} from "../drizzle/schema";

type Database = ReturnType<typeof drizzle>;
let _db: Promise<Database | null> | null = null;

/**
 * Dónde está la base de datos:
 * - en la PC, un archivo SQLite: DATABASE_URL="file:./data/aula.db" (por defecto);
 * - en la nube, una base Turso (libSQL, compatible con SQLite): DATABASE_URL="libsql://…" junto con
 *   DATABASE_AUTH_TOKEN. Es necesaria en servicios como Render, cuyo disco gratuito se borra.
 * En las pruebas se usa una base en memoria.
 */
export function databaseConfig(env: NodeJS.ProcessEnv = process.env): {
  url: string;
  authToken?: string;
} {
  const configured = env.DATABASE_URL?.trim();
  if (configured && /^(?:libsql|https?|wss?):\/\//.test(configured))
    return { url: configured, authToken: env.DATABASE_AUTH_TOKEN?.trim() || undefined };
  if (configured?.startsWith("file:") || configured === ":memory:")
    return { url: configured };
  if (configured)
    console.warn(
      "[Database] DATABASE_URL debe ser un archivo (file:...) o una base Turso (libsql://...). Se usará ./data/aula.db."
    );
  return { url: env.VITEST ? ":memory:" : "file:./data/aula.db" };
}

async function openDatabase(): Promise<Database | null> {
  try {
    const config = databaseConfig();
    if (config.url.startsWith("file:")) {
      const file = config.url.slice("file:".length);
      fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    }
    const client = createClient(config);
    for (const statement of CREATE_TABLES_SQL) await client.execute(statement);
    console.log(
      config.url.startsWith("file:") || config.url === ":memory:"
        ? `[Database] Base de datos local: ${config.url}`
        : `[Database] Base de datos en la nube: ${new URL(config.url).host}`
    );
    return drizzle(client);
  } catch (error) {
    console.warn("[Database] No se pudo abrir la base de datos:", error);
    return null;
  }
}

export function getDb() {
  _db ??= openDatabase();
  return _db;
}

export async function getStudentByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(students)
    .where(eq(students.code, code))
    .limit(1);
  return rows[0];
}

/**
 * Registra a un participante por su código o, si el código ya existe, lo reconoce como alguien que
 * vuelve (returning = true) sin tocar sus datos. No se guardan nombres ni datos personales.
 */
export async function upsertStudent(input: { code: string }) {
  const db = await getDb();
  if (!db) return { id: 0, code: input.code, returning: false, pretestDone: false };
  const existing = await getStudentByCode(input.code);
  if (existing) {
    await db
      .update(students)
      .set({ lastActivityAt: new Date() })
      .where(eq(students.id, existing.id));
    return {
      id: existing.id,
      code: existing.code,
      returning: true,
      pretestDone: Boolean(existing.pretestAt),
    };
  }
  // grade y section son columnas de la versión escolar: quedan vacías para los participantes.
  const [created] = await db
    .insert(students)
    .values({ code: input.code, grade: "", section: "", schoolName: null })
    .returning({ id: students.id });
  return { id: created.id, code: input.code, returning: false, pretestDone: false };
}

export async function saveProgress(input: {
  code: string;
  moduleId: string;
  percentage: number;
  status: "available" | "in_progress" | "completed";
}) {
  const db = await getDb();
  if (!db) return;
  const student = await getStudentByCode(input.code);
  if (!student) return;
  await db
    .insert(moduleProgress)
    .values({
      studentId: student.id,
      moduleId: input.moduleId,
      percentage: input.percentage,
      status: input.status,
    })
    .onConflictDoUpdate({
      target: [moduleProgress.studentId, moduleProgress.moduleId],
      set: {
        percentage: input.percentage,
        status: input.status,
        updatedAt: new Date(),
      },
    });
  await db
    .update(students)
    .set({ lastActivityAt: new Date() })
    .where(eq(students.id, student.id));
}

export async function saveEvaluation(input: {
  code: string;
  type: "diagnostic" | "module" | "final";
  moduleId?: string;
  score: number;
  total: number;
}) {
  const db = await getDb();
  if (!db) return;
  const student = await getStudentByCode(input.code);
  if (!student) return;
  await db
    .insert(evaluations)
    .values({
      studentId: student.id,
      type: input.type,
      moduleId: input.moduleId ?? null,
      score: input.score,
      total: input.total,
    });
  await db
    .update(students)
    .set({ lastActivityAt: new Date() })
    .where(eq(students.id, student.id));
}

export async function saveActivity(input: {
  code: string;
  activity: string;
  response: string;
  result: string;
}) {
  const db = await getDb();
  if (!db) return;
  const student = await getStudentByCode(input.code);
  if (!student) return;
  await db
    .insert(activities)
    .values({
      studentId: student.id,
      activity: input.activity,
      response: input.response,
      result: input.result,
    });
  await db
    .update(students)
    .set({ lastActivityAt: new Date() })
    .where(eq(students.id, student.id));
}

export async function saveChallenge(input: {
  code: string;
  challenge: string;
  score: number;
}) {
  const db = await getDb();
  if (!db) return;
  const student = await getStudentByCode(input.code);
  if (!student) return;
  await db
    .insert(challenges)
    .values({
      studentId: student.id,
      challenge: input.challenge,
      score: input.score,
    });
  await db
    .update(students)
    .set({ lastActivityAt: new Date() })
    .where(eq(students.id, student.id));
}

export async function getStudentDashboard(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const student = await getStudentByCode(code);
  if (!student) return undefined;
  const [progress, evaluationRows, activityRows, challengeRows] =
    await Promise.all([
      db
        .select()
        .from(moduleProgress)
        .where(eq(moduleProgress.studentId, student.id)),
      db
        .select()
        .from(evaluations)
        .where(eq(evaluations.studentId, student.id))
        .orderBy(desc(evaluations.createdAt)),
      db
        .select()
        .from(activities)
        .where(eq(activities.studentId, student.id))
        .orderBy(desc(activities.createdAt)),
      db
        .select()
        .from(challenges)
        .where(eq(challenges.studentId, student.id))
        .orderBy(desc(challenges.createdAt)),
    ]);
  return {
    student,
    progress,
    evaluations: evaluationRows,
    activities: activityRows,
    challenges: challengeRows,
  };
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db)
    return { students: 0, completed: 0, diagnosticAverage: 0, finalAverage: 0 };
  const [studentCount, completedCount, diagnostics, finals] = await Promise.all(
    [
      db.select({ count: sql<number>`count(*)` }).from(students),
      db
        .select({
          count: sql<number>`count(distinct ${moduleProgress.studentId})`,
        })
        .from(moduleProgress)
        .where(eq(moduleProgress.status, "completed")),
      db
        .select({ score: evaluations.score, total: evaluations.total })
        .from(evaluations)
        .where(eq(evaluations.type, "diagnostic")),
      db
        .select({ score: evaluations.score, total: evaluations.total })
        .from(evaluations)
        .where(eq(evaluations.type, "final")),
    ]
  );
  const average = (rows: { score: number; total: number }[]) =>
    rows.length
      ? Math.round(
          (rows.reduce(
            (sum, row) => sum + (row.total ? row.score / row.total : 0),
            0
          ) /
            rows.length) *
            100
        )
      : 0;
  return {
    students: Number(studentCount[0]?.count ?? 0),
    completed: Number(completedCount[0]?.count ?? 0),
    diagnosticAverage: average(diagnostics),
    finalAverage: average(finals),
  };
}

export async function getAdminStudents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(students).orderBy(desc(students.updatedAt));
}

export async function deleteStudentByCode(code: string) {
  const db = await getDb();
  if (!db) return false;
  const student = await getStudentByCode(code);
  if (!student) return false;
  await db.transaction(async tx => {
    await tx
      .delete(aiInteractions)
      .where(eq(aiInteractions.studentId, student.id));
    await tx.delete(activities).where(eq(activities.studentId, student.id));
    await tx.delete(challenges).where(eq(challenges.studentId, student.id));
    await tx.delete(evaluations).where(eq(evaluations.studentId, student.id));
    await tx
      .delete(moduleProgress)
      .where(eq(moduleProgress.studentId, student.id));
    await tx.delete(students).where(eq(students.id, student.id));
  });
  return true;
}

export async function saveConsultation(input: {
  code?: string;
  question: string;
  answer: string;
  sources: { title: string; url: string }[];
}) {
  const db = await getDb();
  if (!db) return;
  const student = input.code ? await getStudentByCode(input.code) : undefined;
  await db.insert(consultations).values({
    studentId: student?.id ?? null,
    question: input.question,
    answer: input.answer,
    sources: JSON.stringify(input.sources),
  });
}

export async function getRecentConsultations(limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: consultations.id,
      question: consultations.question,
      answer: consultations.answer,
      createdAt: consultations.createdAt,
      code: students.code,
    })
    .from(consultations)
    .leftJoin(students, eq(consultations.studentId, students.id))
    .orderBy(desc(consultations.createdAt))
    .limit(limit);
  return rows;
}
