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

  it("opens the learning path with 'quiero empezar' and the home with 'pantalla inicial'", () => {
    expect(interpretLocalCommand("quiero comenzar")).toMatchObject({ path: "/dashboard" });
    expect(interpretLocalCommand("empezar la capacitación")).toMatchObject({ path: "/dashboard" });
    expect(interpretLocalCommand("llévame a la pantalla inicial")).toMatchObject({ path: "/" });
    // Las preguntas sobre el avance siguen yendo al agente, que consulta la base de datos.
    expect(interpretLocalCommand("cuánto avancé")).toBeNull();
    expect(interpretLocalCommand("quiero aprender qué es un prompt")).toBeNull();
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

  it("answers a specific question and submits the evaluation", () => {
    const inQuestion = { inQuestion: true };
    expect(interpretLocalCommand("en la pregunta tres marca la b", inQuestion)).toEqual({
      kind: "select_option",
      letter: "B",
      index: 2,
    });
    expect(
      interpretLocalCommand("la respuesta de la pregunta 10 es la d", inQuestion)
    ).toEqual({ kind: "select_option", letter: "D", index: 9 });
    expect(interpretLocalCommand("pregunta dos opción c", inQuestion)).toEqual({
      kind: "select_option",
      letter: "C",
      index: 1,
    });
    expect(interpretLocalCommand("ir a la pregunta 4", inQuestion)).toEqual({
      kind: "go_to_question",
      index: 3,
    });
    expect(interpretLocalCommand("guardar evaluación", inQuestion)).toEqual({
      kind: "submit_evaluation",
    });
    expect(interpretLocalCommand("enviar mis respuestas", inQuestion)).toEqual({
      kind: "submit_evaluation",
    });
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
    for (const phrase of ["Oye Jason", "Hey Yeison", "ok jeison", "Okay, Jason.", "OK Jeyson", "hola aula"])
      expect(WAKE_PATTERN.test(normalizeSpeech(phrase))).toBe(true);
    expect(WAKE_PATTERN.exec(normalizeSpeech("Oye Jason, abre el módulo dos"))?.[1]).toBe(
      "abre el modulo dos"
    );
    expect(interpretLocalCommand("Oye Jason")?.kind).toBe("wake");
    expect(WAKE_PATTERN.test(normalizeSpeech("hoy es jueves"))).toBe(false);
  });
});

describe("lecturas rápidas en evaluaciones (sin IA)", () => {
  const inQuestion = { inQuestion: true };
  it("va a una pregunta diciendo solo su número o pidiendo leerla", () => {
    expect(interpretLocalCommand("pregunta tres", inQuestion)).toEqual({ kind: "go_to_question", index: 2 });
    expect(interpretLocalCommand("lee la pregunta cinco", inQuestion)).toEqual({ kind: "go_to_question", index: 4 });
    expect(interpretLocalCommand("¿qué dice la pregunta 2?", inQuestion)).toEqual({ kind: "go_to_question", index: 1 });
  });

  it("lee una opción sin marcarla", () => {
    expect(interpretLocalCommand("lee la opción b", inQuestion)).toEqual({ kind: "read_option", letter: "B" });
    expect(interpretLocalCommand("¿cuál es la c?", inQuestion)).toEqual({ kind: "read_option", letter: "C" });
    // Decir la letra sigue marcándola.
    expect(interpretLocalCommand("opción b", inQuestion)).toEqual({ kind: "select_option", letter: "B" });
  });

  it("lee solo las opciones, solo la pregunta o el avance", () => {
    expect(interpretLocalCommand("lee las opciones", inQuestion)?.kind).toBe("read_options");
    expect(interpretLocalCommand("alternativas", inQuestion)?.kind).toBe("read_options");
    expect(interpretLocalCommand("solo la pregunta", inQuestion)?.kind).toBe("read_question_text");
    expect(interpretLocalCommand("cuántas me faltan", inQuestion)?.kind).toBe("evaluation_progress");
  });
});

describe("recorrer los controles con la voz (sin IA)", () => {
  it("siguiente, anterior y activar fuera de una pregunta", () => {
    expect(interpretLocalCommand("siguiente")?.kind).toBe("focus_next");
    expect(interpretLocalCommand("siguiente botón")?.kind).toBe("focus_next");
    expect(interpretLocalCommand("anterior")?.kind).toBe("focus_previous");
    expect(interpretLocalCommand("actívalo")?.kind).toBe("activate_focused");
    expect(interpretLocalCommand("pulsar")?.kind).toBe("activate_focused");
  });

  it("dentro de una pregunta, siguiente sigue cambiando de pregunta", () => {
    expect(interpretLocalCommand("siguiente", { inQuestion: true })?.kind).toBe("next_question");
  });
});
