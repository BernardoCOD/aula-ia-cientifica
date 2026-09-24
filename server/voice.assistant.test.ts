import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { AgentReply } from "@shared/assistant";

// La IA se simula: las pruebas verifican las barreras del servidor, no al modelo.
const askClaudeJsonMock = vi.hoisted(() => vi.fn());
vi.mock("./_core/ai", async importOriginal => ({
  ...(await importOriginal<typeof import("./_core/ai")>()),
  askJson: askClaudeJsonMock,
  aiProvider: () => "gemini",
}));

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const evaluationSnapshot = {
  route: "/diagnostico",
  title: "¿Qué sabes sobre IA?",
  mode: "evaluation" as const,
  headings: ["¿Qué sabes sobre IA?"],
  text: "01 ¿Qué acción es responsable?",
  elements: [
    { id: "e1", kind: "radio", label: "Copiar la respuesta", group: "01 ¿Qué acción es responsable?" },
    { id: "e2", kind: "radio", label: "Verificar la fuente", group: "01 ¿Qué acción es responsable?" },
    { id: "e3", kind: "button", label: "Guardar pretest" },
  ],
  tables: [],
  dialogs: [],
  alerts: [],
  screen: {
    currentQuestion: "¿Qué acción es responsable?",
    currentOptions: ["Copiar la respuesta", "Verificar la fuente"],
    questionIndex: 0,
    totalQuestions: 10,
  },
};

const learningSnapshot = {
  ...evaluationSnapshot,
  route: "/dashboard",
  title: "Panel de estudiante",
  mode: "learning" as const,
  elements: [
    { id: "e1", kind: "button", label: "Módulos" },
    { id: "e2", kind: "textbox", label: "Tu respuesta" },
  ],
  screen: undefined,
};

const reply = (partial: Partial<AgentReply>): AgentReply => ({
  speech: "Listo.",
  actions: [],
  confirm: "",
  continue: false,
  ...partial,
});

describe("voice assistant agent safety", () => {
  beforeEach(() => askClaudeJsonMock.mockReset());

  it("never lets the model pick an answer the student did not dictate during an evaluation", async () => {
    askClaudeJsonMock.mockResolvedValue(
      reply({
        speech: "La correcta es verificar la fuente, ya la marqué.",
        actions: [{ type: "click", target: "e2", value: "" }],
      })
    );
    const caller = appRouter.createCaller(context());
    const result = await caller.assistant.act({
      text: "dime cuál es la correcta y márcala",
      snapshot: evaluationSnapshot,
    });
    expect(result.actions).toHaveLength(0);
    expect(result.speech).toContain("Durante la evaluación");
    expect(result.speech).not.toContain("verificar la fuente");
  });

  it("allows marking the option the student dictated explicitly", async () => {
    askClaudeJsonMock.mockResolvedValue(
      reply({ speech: "Marqué la opción B.", actions: [{ type: "click", target: "e2", value: "" }] })
    );
    const caller = appRouter.createCaller(context());
    const result = await caller.assistant.act({
      text: "marca la opción b",
      snapshot: evaluationSnapshot,
    });
    expect(result.actions).toEqual([{ type: "click", target: "e2", value: "" }]);
  });

  it("blocks writing answers during an evaluation", async () => {
    askClaudeJsonMock.mockResolvedValue(
      reply({ actions: [{ type: "fill", target: "e1", value: "respuesta" }] })
    );
    const caller = appRouter.createCaller(context());
    const result = await caller.assistant.act({ text: "escribe la respuesta", snapshot: evaluationSnapshot });
    expect(result.actions.some(action => action.type === "fill")).toBe(false);
  });

  it("drops actions on elements or routes that do not exist", async () => {
    askClaudeJsonMock.mockResolvedValue(
      reply({
        actions: [
          { type: "click", target: "e99", value: "" },
          { type: "navigate", target: "https://ejemplo.com", value: "" },
          { type: "navigate", target: "/modulo/m3", value: "" },
          { type: "fill", target: "e2", value: "Mi idea" },
        ],
      })
    );
    const caller = appRouter.createCaller(context());
    const result = await caller.assistant.act({ text: "haz varias cosas", snapshot: learningSnapshot });
    expect(result.actions).toEqual([
      { type: "navigate", target: "/modulo/m3", value: "" },
      { type: "fill", target: "e2", value: "Mi idea" },
    ]);
  });

  it("sends the student's database record and the screen to the model", async () => {
    askClaudeJsonMock.mockResolvedValue(reply({}));
    const caller = appRouter.createCaller(context());
    await caller.student.register({ code: "TEST_01", grade: "3.º", section: "B" });
    await caller.student.progress({ code: "TEST_01", moduleId: "m2", percentage: 100, status: "completed" });
    await caller.assistant.act({
      text: "cuánto avancé",
      studentCode: "TEST_01",
      snapshot: learningSnapshot,
    });
    const prompt = JSON.stringify(askClaudeJsonMock.mock.calls[0][0].messages);
    expect(prompt).toContain("TEST_01");
    expect(prompt).toContain("Instrucciones que ayudan: 100% (completed)");
    expect(prompt).toContain("e2 [textbox]");
  });
});
