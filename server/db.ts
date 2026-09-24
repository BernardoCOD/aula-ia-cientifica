import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activities,
  aiInteractions,
  challenges,
  evaluations,
  InsertUser,
  moduleProgress,
  students,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = new Date();
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return rows[0];
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

export async function upsertStudent(input: {
  code: string;
  grade: string;
  section: string;
  schoolName?: string;
}) {
  const db = await getDb();
  if (!db) return { ...input, id: 0 };
  const existing = await getStudentByCode(input.code);
  if (existing) {
    await db
      .update(students)
      .set({
        grade: input.grade,
        section: input.section,
        schoolName: input.schoolName ?? null,
      })
      .where(eq(students.id, existing.id));
    return { ...existing, ...input };
  }
  const result = await db
    .insert(students)
    .values({ ...input, schoolName: input.schoolName ?? null });
  return { id: Number(result[0].insertId), ...input };
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
    .onDuplicateKeyUpdate({
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
