import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  grade: varchar("grade", { length: 24 }).notNull(),
  section: varchar("section", { length: 8 }).notNull(),
  schoolName: varchar("schoolName", { length: 160 }),
  pretestAt: timestamp("pretestAt"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  postestEnabledAt: timestamp("postestEnabledAt"),
  postestAt: timestamp("postestAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const moduleProgress = mysqlTable(
  "module_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("studentId").notNull(),
    moduleId: varchar("moduleId", { length: 32 }).notNull(),
    percentage: int("percentage").default(0).notNull(),
    status: mysqlEnum("status", [
      "locked",
      "available",
      "in_progress",
      "completed",
    ])
      .default("available")
      .notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    studentModuleUnique: unique("student_module_unique").on(
      table.studentId,
      table.moduleId
    ),
  })
);
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  type: mysqlEnum("type", [
    "diagnostic",
    "module",
    "final",
    "pretest",
    "postest",
  ]).notNull(),
  moduleId: varchar("moduleId", { length: 32 }),
  score: int("score").notNull(),
  total: int("total").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  activity: varchar("activity", { length: 120 }).notNull(),
  response: text("response").notNull(),
  result: varchar("result", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  challenge: varchar("challenge", { length: 120 }).notNull(),
  score: int("score").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const aiInteractions = mysqlTable("ai_interactions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  moduleId: varchar("moduleId", { length: 32 }).notNull(),
  activity: varchar("activity", { length: 120 }).notNull(),
  question: text("question").notNull(),
  response: text("response").notNull(),
  result: varchar("result", { length: 32 }).notNull(),
  score: int("score").default(0).notNull(),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
