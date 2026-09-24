import { describe, expect, it } from "vitest";
import {
  WAKE_PATTERN,
  interpretLocalCommand,
  normalizeSpeech,
} from "../client/src/lib/voiceIntents";

describe("local voice commands (sin IA)", () => {
  it("navigates with explicit spoken destinations", () => {
    expect(interpretLocalCommand("abre el módulo tres")).toMatchObject({
      kind: "navigate",
      path: "/modulo/m3",
    });
    expect(interpretLocalCommand("llévame a mis resultados")).toMatchObject({
      path: "/dashboard?tab=resultados",
    });
    expect(interpretLocalCommand("abrir Tutor IA")).toMatchObject({ path: "/tutor" });
    expect(interpretLocalCommand("ir al área de consultas")).toMatchObject({
      path: "/consultas",
    });
    expect(interpretLocalCommand("abrir panel docente")).toMatchObject({
      path: "/docente",
    });
    expect(interpretLocalCommand("volver")).toEqual({ kind: "back" });
  });

  it("leaves questions and ambiguous phrases to the AI agent", () => {
    expect(interpretLocalCommand("¿qué es el postest?")).toBeNull();
    expect(interpretLocalCommand("activa el botón continuar")).toBeNull();
    expect(interpretLocalCommand("selecciona la pestaña de retos")).toBeNull();
    expect(interpretLocalCommand("cuánto avancé en el curso")).toBeNull();
  });

  it("stops the assistant instead of only pausing the reading", () => {
    expect(interpretLocalCommand("detener asistente")?.kind).toBe("stop_assistant");
    expect(interpretLocalCommand("deja de escuchar")?.kind).toBe("stop_assistant");
    expect(interpretLocalCommand("para")?.kind).toBe("pause");
  });

  it("distinguishes a brief reading from 'lee todo'", () => {
    expect(interpretLocalCommand("lee la pantalla")).toEqual({ kind: "read", full: false });
    expect(interpretLocalCommand("lee todo")).toEqual({ kind: "read", full: true });
    expect(interpretLocalCommand("lectura detallada")).toEqual({ kind: "read", full: true });
  });

  it("handles evaluation commands only while a question is active", () => {
    const inQuestion = { inQuestion: true };
    expect(interpretLocalCommand("opción b", inQuestion)).toEqual({
      kind: "select_option",
      letter: "B",
    });
    expect(interpretLocalCommand("marco la c", inQuestion)).toEqual({
      kind: "select_option",
      letter: "C",
    });
    expect(interpretLocalCommand("elijo la tercera", inQuestion)).toEqual({
      kind: "select_option",
      letter: "C",
    });
    expect(interpretLocalCommand("siguiente pregunta", inQuestion)?.kind).toBe("next_question");
    expect(interpretLocalCommand("ir a la pregunta 3", inQuestion)).toEqual({
      kind: "go_to_question",
      index: 2,
    });
    expect(interpretLocalCommand("lee la pregunta", inQuestion)?.kind).toBe("read_question");
    expect(interpretLocalCommand("opción b")).toBeNull();
  });

  it("never processes credentials", () => {
    expect(interpretLocalCommand("lee mi contraseña")?.kind).toBe("decline");
  });

  it("adjusts text size and speech rate", () => {
    expect(interpretLocalCommand("quiero aumentar la letra")).toEqual({
      kind: "text_size",
      direction: 1,
    });
    expect(interpretLocalCommand("habla más despacio")).toEqual({
      kind: "speech_rate",
      value: "slower",
    });
  });

  it("recognizes the wake phrase, including common transcriptions of 'Jason'", () => {
    for (const phrase of ["Oye Jason", "Hey Yeison", "ok jeison", "hola aula"])
      expect(WAKE_PATTERN.test(normalizeSpeech(phrase))).toBe(true);
    expect(WAKE_PATTERN.exec(normalizeSpeech("Oye Jason, abre el módulo dos"))?.[1]).toBe(
      "abre el modulo dos"
    );
    expect(interpretLocalCommand("Oye Jason")?.kind).toBe("wake");
  });
});
