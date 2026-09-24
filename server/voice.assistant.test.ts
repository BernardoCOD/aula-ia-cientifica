import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const invokeLLMMock = vi.hoisted(() => vi.fn());
vi.mock("./_core/llm", () => ({ invokeLLM: invokeLLMMock }));

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("voice assistant safety", () => {
  beforeEach(() => {
    invokeLLMMock.mockReset();
  });

  it("blocks explanatory help during an evaluation even if the model requests it", async () => {
    invokeLLMMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              intent: "EXPLAIN_CONTENT",
              moduleNumber: 0,
              optionLetter: "",
              message: "Te explico la respuesta correcta.",
            }),
          },
        },
      ],
    });

    const caller = appRouter.createCaller(context());
    const result = await caller.assistant.interpretIntent({
      text: "Dime cuál alternativa es correcta",
      mode: "evaluation",
      context: {
        route: "/diagnostico",
        currentQuestion: "¿Qué acción es responsable?",
        currentOptions: ["A", "B", "C", "D"],
        questionIndex: 0,
        totalQuestions: 10,
      },
    });

    expect(result.intent).toBe("DECLINE");
    expect(result.message).toContain("Durante la evaluación");
    expect(result.message.toLowerCase()).not.toContain("alternativa correcta");
  });

  it("fills in a default confidence when the model omits it, and passes through an explicit low-confidence value", async () => {
    invokeLLMMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              intent: "READ_SCREEN",
              moduleNumber: 0,
              optionLetter: "",
              message: "Leeré la pantalla.",
            }),
          },
        },
      ],
    });
    const caller = appRouter.createCaller(context());
    const withoutConfidence = await caller.assistant.interpretIntent({
      text: "lee la pantalla",
      mode: "learning",
      context: { route: "/dashboard" },
    });
    expect(withoutConfidence.confidence).toBeGreaterThan(0);

    invokeLLMMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              intent: "ACTIVATE_CONTROL",
              moduleNumber: 0,
              optionLetter: "",
              message: "Buscaré ese botón.",
              controlTarget: "algo ambiguo",
              confidence: 0.3,
            }),
          },
        },
      ],
    });
    const lowConfidence = await caller.assistant.interpretIntent({
      text: "activa eso",
      mode: "learning",
      context: { route: "/dashboard" },
    });
    expect(lowConfidence.confidence).toBe(0.3);
  });
});
