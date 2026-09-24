import {
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

// Base de datos SQLite local (un solo archivo, sin servidor). Las fechas se guardan como
// milisegundos y Drizzle las convierte en objetos Date.
const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });
const now = () => new Date();

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: timestamp("createdAt").$defaultFn(now).notNull(),
  updatedAt: timestamp("updatedAt").$defaultFn(now).$onUpdate(now).notNull(),
  lastSignedIn: timestamp("lastSignedIn").$defaultFn(now).notNull(),
});
export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  schoolName: text("schoolName"),
  pretestAt: timestamp("pretestAt"),
  startedAt: timestamp("startedAt").$defaultFn(now).notNull(),
  lastActivityAt: timestamp("lastActivityAt").$defaultFn(now).notNull(),
  postestEnabledAt: timestamp("postestEnabledAt"),
  postestAt: timestamp("postestAt"),
  createdAt: timestamp("createdAt").$defaultFn(now).notNull(),
  updatedAt: timestamp("updatedAt").$defaultFn(now).$onUpdate(now).notNull(),
});
export const moduleProgress = sqliteTable(
  "module_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("studentId").notNull(),
    moduleId: text("moduleId").notNull(),
    percentage: integer("percentage").default(0).notNull(),
    status: text("status", {
      enum: ["locked", "available", "in_progress", "completed"],
    })
      .default("available")
      .notNull(),
    updatedAt: timestamp("updatedAt").$defaultFn(now).$onUpdate(now).notNull(),
  },
  table => [
    unique("student_module_unique").on(table.studentId, table.moduleId),
  ]
);
export const evaluations = sqliteTable("evaluations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  type: text("type", {
    enum: ["diagnostic", "module", "final", "pretest", "postest"],
  }).notNull(),
  moduleId: text("moduleId"),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("createdAt").$defaultFn(now).notNull(),
});
export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  activity: text("activity").notNull(),
  response: text("response").notNull(),
  result: text("result").notNull(),
  createdAt: timestamp("createdAt").$defaultFn(now).notNull(),
});
export const challenges = sqliteTable("challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  challenge: text("challenge").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("createdAt").$defaultFn(now).notNull(),
});
export const aiInteractions = sqliteTable("ai_interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  moduleId: text("moduleId").notNull(),
  activity: text("activity").notNull(),
  question: text("question").notNull(),
  response: text("response").notNull(),
  result: text("result").notNull(),
  score: integer("score").default(0).notNull(),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("createdAt").$defaultFn(now).notNull(),
});
/** Preguntas hechas en el Área de consultas (con o sin estudiante identificado). */
export const consultations = sqliteTable("consultations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: text("sources").notNull(),
  createdAt: timestamp("createdAt").$defaultFn(now).notNull(),
});

// Crea las tablas si no existen, para que la app funcione sin pasos de migración manuales.
export const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openId TEXT NOT NULL UNIQUE,
    name TEXT, email TEXT, loginMethod TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, lastSignedIn INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    grade TEXT NOT NULL, section TEXT NOT NULL, schoolName TEXT,
    pretestAt INTEGER, startedAt INTEGER NOT NULL, lastActivityAt INTEGER NOT NULL,
    postestEnabledAt INTEGER, postestAt INTEGER,
    createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS module_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL, moduleId TEXT NOT NULL,
    percentage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    updatedAt INTEGER NOT NULL,
    CONSTRAINT student_module_unique UNIQUE (studentId, moduleId)
  )`,
  `CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL, type TEXT NOT NULL, moduleId TEXT,
    score INTEGER NOT NULL, total INTEGER NOT NULL, createdAt INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL, activity TEXT NOT NULL, response TEXT NOT NULL,
    result TEXT NOT NULL, createdAt INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL, challenge TEXT NOT NULL, score INTEGER NOT NULL,
    createdAt INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ai_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL, moduleId TEXT NOT NULL, activity TEXT NOT NULL,
    question TEXT NOT NULL, response TEXT NOT NULL, result TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0, feedback TEXT NOT NULL, createdAt INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER, question TEXT NOT NULL, answer TEXT NOT NULL,
    sources TEXT NOT NULL, createdAt INTEGER NOT NULL
  )`,
];

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type Consultation = typeof consultations.$inferSelect;
