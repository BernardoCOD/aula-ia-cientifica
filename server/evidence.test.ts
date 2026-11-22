import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createTeacherToken, TEACHER_COOKIE } from "./adminAuth";
import { isRecognized, redactHeard, taskFor } from "@shared/evidence";
import { attributeSessions, summarizeByParticipant } from "./evidence";

function context(teacher = false): TrpcContext {
  return {
    req: {
      protocol: "https",
      headers: teacher ? { cookie: `${TEACHER_COOKIE}=${createTeacherToken()}` } : {},
    } as TrpcContext["req"],
    res: { cookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

const base = {
  sessionId: "sesion-1",
  route: "/diagnostico",
  inputMode: "voz" as const,
  completed: true,
};

describe("registro de evidencias: reglas", () => {
  it("asigna la tarea de la ficha según la intención", () => {
    expect(taskFor("select_option")).toBe("Responder evaluación");
    expect(taskFor("codigo_dictado")).toBe("Ingresar con código");
    expect(taskFor("navigate,click")).toBe("Actuar sobre la pantalla");
    expect(taskFor("consult")).toBe("Consulta en internet");
    expect(taskFor("respuesta")).toBe("Pregunta a la IA");
    expect(taskFor("algo_nuevo")).toBe("Otra");
  });

  it("no guarda frases con contraseñas", () => {
    expect(redactHeard("mi contraseña es 1234")).toBe("[omitido por privacidad]");
    expect(redactHeard("opción B")).toBe("opción B");
  });

  it("cuenta como no reconocidas las no entendidas, sin IA o con error", () => {
    expect(isRecognized("local", "select_option")).toBe(true);
    expect(isRecognized("no_entendido", "confirmacion")).toBe(false);
    expect(isRecognized("ia_no_disponible", "sin_ia")).toBe(false);
    expect(isRecognized("ia", "error")).toBe(false);
  });
});

describe("registro de evidencias: guardado y Excel", () => {
  it("guarda las interacciones y calcula los indicadores por participante", async () => {
    const caller = appRouter.createCaller(context());
    await caller.student.register({ code: "EV01" });
    const log = (extra: object) => caller.student.logEvent({ ...base, studentCode: "EV01", ...extra } as never);
    await log({ heard: "opción b", asrConfidence: 0.9, recognizedBy: "local", intent: "select_option", responseMs: 40 });
    await log({ heard: "qué es un prompt", asrConfidence: 0.7, recognizedBy: "ia", intent: "respuesta", responseMs: 2400 });
    await log({ heard: "ayuda", inputMode: "texto", recognizedBy: "local", intent: "help", responseMs: 20 });
    await log({ heard: "eh", recognizedBy: "no_entendido", intent: "confirmacion", completed: false, responseMs: 30 });
    expect(await log({ heard: "mi contraseña es abc", recognizedBy: "local", intent: "decline", completed: false, responseMs: 10 })).toEqual({ saved: true });

    const workbook = await caller.admin.exportExcel().catch(error => error);
    expect(workbook).toBeInstanceOf(Error); // solo el docente puede descargarlo

    const teacher = appRouter.createCaller(context(true));
    const file = await teacher.admin.exportExcel();
    expect(file.filename).toMatch(/^evidencias-aula-ia-\d{4}-\d{2}-\d{2}\.xlsx$/);

    const book = new ExcelJS.Workbook();
    await book.xlsx.load(Buffer.from(file.base64, "base64"));
    expect(book.worksheets.map(sheet => sheet.name)).toEqual([
      "Resumen por participante",
      "Registro de interacciones",
      "Evaluaciones",
      "Definiciones",
    ]);
    const summary = book.getWorksheet("Resumen por participante")!;
    const header = (summary.getRow(1).values as string[]).slice(1);
    const row = summary.getRows(2, summary.rowCount - 1)!.find(r => r.getCell(1).value === "EV01")!;
    const cell = (name: string) => row.getCell(header.indexOf(name) + 1).value;
    expect(cell("Comandos emitidos")).toBe(5);
    expect(cell("Por texto")).toBe(1);
    expect(cell("Comandos reconocidos")).toBe(4);
    expect(cell("Tareas completadas")).toBe(3);
    expect(cell("Veces que pidió ayuda")).toBe(1);
    expect(cell("Tiempo medio, con IA (ms)")).toBe(2400);
    expect(cell("Confianza media del reconocimiento de voz (0-1)")).toBe(0.8);

    const registry = book.getWorksheet("Registro de interacciones")!;
    const heard = registry.getColumn(6).values.map(String);
    expect(heard).toContain("[omitido por privacidad]");
    expect(heard.join(" ")).not.toContain("abc");
  });

  it("agrupa sin código las órdenes de quien aún no ingresó", () => {
    const rows = summarizeByParticipant([
      { id: 1, studentId: null, code: null, sessionId: "s", route: "/", inputMode: "voz", heard: "hola", asrConfidence: null, recognizedBy: "ia", intent: "respuesta", task: "Pregunta a la IA", completed: true, responseMs: 1000, helpNeeded: false, createdAt: new Date() },
    ]);
    expect(rows[0]).toMatchObject({ code: "Sin código", commands: 1, recognized: 1 });
  });

  it("asigna al participante las órdenes que dijo antes de ingresar, en la misma sesión", () => {
    const event = (id: number, code: string | null, sessionId: string, minute: number) => ({
      id, studentId: null, code, sessionId, route: "/", inputMode: "voz" as const, heard: "x",
      asrConfidence: null, recognizedBy: "local", intent: "navigate", task: "Navegar entre pantallas",
      completed: true, responseMs: 1, helpNeeded: false, createdAt: new Date(2026, 10, 22, 10, minute),
    });
    const rows = attributeSessions([event(1, null, "a", 0), event(2, "P05", "a", 1), event(3, null, "b", 2)]);
    expect(rows.map(row => row.code)).toEqual(["P05", "P05", null]);
  });
});
