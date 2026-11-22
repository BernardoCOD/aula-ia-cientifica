import { describe, expect, it } from "vitest";
import {
  spokenOption,
  spokenOptions,
  spokenProgress,
  spokenQuestion,
} from "../client/src/lib/questionSpeech";

const question = {
  index: 2,
  total: 10,
  text: "¿Qué instrucción es más útil?",
  options: ["Explícame esto.", "Haz mi tarea.", "Explica con un ejemplo.", "Nada."],
};

describe("lectura corta de las evaluaciones", () => {
  it("lee la pregunta y cada alternativa con su letra, sin relleno", () => {
    expect(spokenQuestion(question)).toBe(
      "Pregunta 3 de 10. ¿Qué instrucción es más útil? A: Explícame esto. B: Haz mi tarea. C: Explica con un ejemplo. D: Nada."
    );
  });

  it("puede leer solo la pregunta, solo las opciones o una opción", () => {
    expect(spokenQuestion(question, { withOptions: false })).toBe(
      "Pregunta 3 de 10. ¿Qué instrucción es más útil?"
    );
    expect(spokenOptions(question.options)).toBe(
      "A: Explícame esto. B: Haz mi tarea. C: Explica con un ejemplo. D: Nada."
    );
    expect(spokenOption(question.options, "c")).toBe("C: Explica con un ejemplo.");
    expect(spokenOption(question.options, "E")).toBe("Esta pregunta tiene opciones de la A a la D.");
  });

  it("resume el avance en una frase", () => {
    expect(spokenProgress(10, [5, 6, 7])).toBe("Respondiste 7 de 10. Te faltan las preguntas 5, 6 y 7.");
    expect(spokenProgress(10, [9])).toBe("Respondiste 9 de 10. Te falta la pregunta 9.");
    expect(spokenProgress(10, [])).toBe(
      "Respondiste las 10 preguntas. Para enviarlas, di: guardar evaluación."
    );
  });
});
