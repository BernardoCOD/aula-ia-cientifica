import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  aiInteractions,
  activities,
  evaluations,
  moduleProgress,
  students,
} from "../drizzle/schema";

export const POSTEST_CONFIG = {
  minDaysFromPretest: Number(process.env.POSTEST_MIN_DAYS ?? 7),
  minProgress: Number(process.env.POSTEST_MIN_PROGRESS ?? 60),
  minActivities: Number(process.env.POSTEST_MIN_ACTIVITIES ?? 1),
};

export async function getEligibility(code: string) {
  const db = await getDb();
  if (!db)
    return {
      eligible: false,
      reason:
        "La evaluación estará disponible después del período de capacitación.",
      config: POSTEST_CONFIG,
    };
  const student = (
    await db.select().from(students).where(eq(students.code, code)).limit(1)
  )[0];
  if (!student)
    return {
      eligible: false,
      reason: "Registra tu ficha para iniciar la capacitación.",
      config: POSTEST_CONFIG,
    };
  const [progress, activityCount] = await Promise.all([
    db
      .select({
        average: sql<number>`coalesce(avg(${moduleProgress.percentage}), 0)`,
      })
      .from(moduleProgress)
      .where(eq(moduleProgress.studentId, student.id)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(eq(activities.studentId, student.id)),
  ]);
  const progressValue = Number(progress[0]?.average ?? 0);
  const activitiesValue = Number(activityCount[0]?.count ?? 0);
  const days = student.pretestAt
    ? Math.floor((Date.now() - student.pretestAt.getTime()) / 86400000)
    : 0;
  const eligibleByProgress =
    days >= POSTEST_CONFIG.minDaysFromPretest &&
    progressValue >= POSTEST_CONFIG.minProgress &&
    activitiesValue >= POSTEST_CONFIG.minActivities;
  const eligible =
    Boolean(student.pretestAt) &&
    (Boolean(student.postestEnabledAt) || eligibleByProgress);
  if (eligible && !student.postestEnabledAt)
    await db
      .update(students)
      .set({ postestEnabledAt: new Date(), lastActivityAt: new Date() })
      .where(eq(students.id, student.id));
  const reason = !student.pretestAt
    ? "Completa el pretest para iniciar el período de capacitación."
    : `Disponible cuando transcurran ${POSTEST_CONFIG.minDaysFromPretest} días, alcances ${POSTEST_CONFIG.minProgress}% de progreso y registres ${POSTEST_CONFIG.minActivities} actividad(es).`;
  return {
    eligible,
    reason,
    daysFromPretest: days,
    progress: Math.round(progressValue),
    activities: activitiesValue,
    config: POSTEST_CONFIG,
  };
}

export async function markPretest(code: string, score: number, total: number) {
  const db = await getDb();
  if (!db) return;
  const student = (
    await db.select().from(students).where(eq(students.code, code)).limit(1)
  )[0];
  if (!student) return;
  const now = new Date();
  await db
    .update(students)
    .set({ pretestAt: now, startedAt: now, lastActivityAt: now })
    .where(eq(students.id, student.id));
  await db
    .insert(evaluations)
    .values({
      studentId: student.id,
      type: "pretest",
      score,
      total,
      createdAt: now,
    });
}

export async function savePostest(code: string, score: number, total: number) {
  const db = await getDb();
  if (!db) return;
  const student = (
    await db.select().from(students).where(eq(students.code, code)).limit(1)
  )[0];
  if (!student) return;
  const now = new Date();
  await db
    .insert(evaluations)
    .values({
      studentId: student.id,
      type: "postest",
      score,
      total,
      createdAt: now,
    });
  await db
    .update(students)
    .set({ postestAt: now, lastActivityAt: now })
    .where(eq(students.id, student.id));
}

export async function enablePostest(code: string) {
  const db = await getDb();
  if (!db) return false;
  const student = (
    await db.select().from(students).where(eq(students.code, code)).limit(1)
  )[0];
  if (!student?.pretestAt) return false;
  await db
    .update(students)
    .set({ postestEnabledAt: new Date(), lastActivityAt: new Date() })
    .where(eq(students.id, student.id));
  return true;
}

export async function saveAiInteraction(input: {
  code: string;
  moduleId: string;
  activity: string;
  question: string;
  response: string;
  result: string;
  score: number;
  feedback: string;
}) {
  const db = await getDb();
  if (!db) return;
  const student = (
    await db
      .select()
      .from(students)
      .where(eq(students.code, input.code))
      .limit(1)
  )[0];
  if (!student) return;
  await db
    .insert(aiInteractions)
    .values({
      studentId: student.id,
      moduleId: input.moduleId,
      activity: input.activity,
      question: input.question,
      response: input.response,
      result: input.result,
      score: input.score,
      feedback: input.feedback,
    });
  await db
    .update(students)
    .set({ lastActivityAt: new Date() })
    .where(eq(students.id, student.id));
}

export async function getResearchDashboard() {
  const db = await getDb();
  if (!db)
    return {
      summary: {
        total: 0,
        withPretest: 0,
        inTraining: 0,
        withPostest: 0,
        pretestAvg: 0,
        postestAvg: 0,
        difference: 0,
        aiInteractions: 0,
      },
      students: [],
      pretestDistribution: [],
      moduleUsage: [],
      aiResponses: [],
    };
  const allStudents = await db
    .select()
    .from(students)
    .orderBy(desc(students.updatedAt));
  const evals = await db
    .select()
    .from(evaluations)
    .orderBy(desc(evaluations.createdAt));
  const interactions = await db
    .select()
    .from(aiInteractions)
    .orderBy(desc(aiInteractions.createdAt));
  const modules = await db
    .select({
      moduleId: moduleProgress.moduleId,
      average: sql<number>`round(avg(${moduleProgress.percentage}))`,
      users: sql<number>`count(distinct ${moduleProgress.studentId})`,
    })
    .from(moduleProgress)
    .groupBy(moduleProgress.moduleId);
  const studentById = new Map(
    allStudents.map(student => [student.id, student])
  );
  const byStudent = allStudents.map(student => {
    const pre = evals.find(
      item =>
        item.studentId === student.id &&
        (item.type === "pretest" || item.type === "diagnostic")
    );
    const post = evals.find(
      item =>
        item.studentId === student.id &&
        (item.type === "postest" || item.type === "final")
    );
    return {
      id: student.id,
      code: student.code,
      school: student.schoolName ?? "Sin institución",
      grade: student.grade,
      section: student.section,
      pretest: pre ? Math.round((pre.score / pre.total) * 100) : null,
      postest: post ? Math.round((post.score / post.total) * 100) : null,
      difference:
        pre && post
          ? Math.round((post.score / post.total - pre.score / pre.total) * 100)
          : null,
      postestEnabled: Boolean(student.postestEnabledAt),
    };
  });
  const avg = (type: string) => {
    const rows = evals.filter(
      item =>
        item.type === type ||
        (type === "pretest" && item.type === "diagnostic") ||
        (type === "postest" && item.type === "final")
    );
    return rows.length
      ? Math.round(
          (rows.reduce((sum, item) => sum + item.score / item.total, 0) /
            rows.length) *
            100
        )
      : 0;
  };
  const pretestAvg = avg("pretest");
  const postestAvg = avg("postest");
  const aiResponses = interactions.slice(0, 30).map(item => {
    const student = studentById.get(item.studentId);
    return {
      id: item.id,
      code: student?.code ?? "Sin código",
      school: student?.schoolName ?? "Sin institución",
      grade: student?.grade ?? "—",
      moduleId: item.moduleId,
      activity: item.activity,
      question: item.question,
      response: item.response,
      result: item.result,
      score: item.score,
      feedback: item.feedback,
      createdAt: item.createdAt,
    };
  });
  return {
    summary: {
      total: allStudents.length,
      withPretest: byStudent.filter(item => item.pretest !== null).length,
      inTraining: byStudent.filter(
        item => item.pretest !== null && item.postest === null
      ).length,
      withPostest: byStudent.filter(item => item.postest !== null).length,
      pretestAvg,
      postestAvg,
      difference: postestAvg - pretestAvg,
      aiInteractions: interactions.length,
    },
    students: byStudent,
    pretestDistribution: evals
      .filter(item => item.type === "pretest" || item.type === "diagnostic")
      .map(item => Math.round((item.score / item.total) * 100)),
    moduleUsage: modules,
    aiResponses,
  };
}
