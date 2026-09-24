import { describe, expect, it } from "vitest";
import { interpretLocalCommand } from "../client/src/lib/voiceIntents";

describe("global voice accessibility commands", () => {
  it("understands natural Spanish navigation commands without the AI", () => {
    expect(interpretLocalCommand("lee la pantalla")?.intent).toBe(
      "READ_SCREEN"
    );
    expect(interpretLocalCommand("quiero aumentar la letra")?.intent).toBe(
      "TEXT_SCALE_UP"
    );
    expect(interpretLocalCommand("abrir módulo tres")).toMatchObject({
      intent: "NAVIGATE_MODULE",
      moduleNumber: 3,
    });
    expect(interpretLocalCommand("ir a mis resultados")?.intent).toBe(
      "OPEN_RESULTS"
    );
    expect(
      interpretLocalCommand("responde Mi respuesta sobre fotosíntesis")
    ).toMatchObject({
      intent: "WRITE_TEXT",
      value: "Mi respuesta sobre fotosíntesis",
    });
    expect(
      interpretLocalCommand(
        "en el apartado de colegio escribe Virgen del Rosario"
      )
    ).toMatchObject({
      intent: "WRITE_TEXT",
      controlTarget: "colegio",
      value: "Virgen del Rosario",
    });
    expect(interpretLocalCommand("responde la segunda")).toMatchObject({
      intent: "SELECT_OPTION",
      optionLetter: "B",
    });
    expect(interpretLocalCommand("responder pregunta dos")).toMatchObject({
      intent: "GO_TO_QUESTION",
      questionIndex: 1,
    });
    expect(interpretLocalCommand("ir a la pregunta 3")).toMatchObject({
      intent: "GO_TO_QUESTION",
      questionIndex: 2,
    });
    expect(interpretLocalCommand("pregunta siguiente")?.intent).toBe(
      "NEXT_CONTENT"
    );
    expect(interpretLocalCommand("activar texto a voz")?.intent).toBe(
      "READ_SCREEN"
    );
    expect(interpretLocalCommand("encender lectura en voz alta")?.intent).toBe(
      "READ_SCREEN"
    );
    expect(
      interpretLocalCommand("completa estudiante 01 colegio Virgen del Rosario")
    ).toMatchObject({
      intent: "FILL_FORM",
      fields: { student: "01", school: "Virgen del Rosario" },
    });
    expect(interpretLocalCommand("presiona continuar")).toMatchObject({
      intent: "ACTIVATE_CONTROL",
      controlTarget: "continuar",
    });
    expect(interpretLocalCommand("qué botones hay")?.intent).toBe(
      "LIST_CONTROLS"
    );
    expect(interpretLocalCommand("activar asistente")?.intent).toBe(
      "ACTIVATE_ASSISTANT"
    );
    expect(interpretLocalCommand("Ok Yeison")?.intent).toBe(
      "ACTIVATE_ASSISTANT"
    );
    expect(interpretLocalCommand("Hey Yeison")?.intent).toBe(
      "ACTIVATE_ASSISTANT"
    );
    expect(interpretLocalCommand("OK Jason")?.intent).toBe(
      "ACTIVATE_ASSISTANT"
    );
    expect(interpretLocalCommand("Hey Jason")?.intent).toBe(
      "ACTIVATE_ASSISTANT"
    );
    expect(interpretLocalCommand("abrir Tutor IA")?.intent).toBe(
      "NAVIGATE_TUTOR"
    );
    expect(interpretLocalCommand("quiero retroalimentación")?.intent).toBe(
      "NAVIGATE_TUTOR"
    );
    expect(interpretLocalCommand("abrir panel docente")?.intent).toBe(
      "NAVIGATE_TEACHER"
    );
    expect(interpretLocalCommand("qué módulos hay")?.intent).toBe(
      "LIST_MODULES"
    );
  });

  it("never converts a password phrase into a voice action", () => {
    expect(interpretLocalCommand("leer mi contraseña")?.intent).not.toBe(
      "READ_SCREEN"
    );
  });

  it("distinguishes the default brief reading from an explicit detailed 'lee todo' request", () => {
    expect(interpretLocalCommand("lee la pantalla")?.intent).toBe(
      "READ_SCREEN"
    );
    expect(interpretLocalCommand("lee todo")?.intent).toBe("READ_SCREEN_FULL");
    expect(interpretLocalCommand("quiero una lectura detallada")?.intent).toBe(
      "READ_SCREEN_FULL"
    );
    expect(interpretLocalCommand("describeme todo")?.intent).toBe(
      "READ_SCREEN_FULL"
    );
  });

  it("recognizes the simulation mode toggle command", () => {
    expect(interpretLocalCommand("activar modo simulación")?.intent).toBe(
      "TOGGLE_SIMULATION"
    );
    expect(interpretLocalCommand("modo simulacion")?.intent).toBe(
      "TOGGLE_SIMULATION"
    );
  });

  it("assigns high confidence to deterministic pattern matches and lower confidence to free-form targets", () => {
    expect(
      interpretLocalCommand("lee la pantalla")?.confidence
    ).toBeGreaterThanOrEqual(0.9);
    expect(
      interpretLocalCommand("presiona continuar")?.confidence
    ).toBeLessThan(0.9);
  });
});
