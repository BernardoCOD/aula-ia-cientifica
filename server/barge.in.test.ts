import { describe, expect, it } from "vitest";
import { isLikelyEcho, shouldInterrupt } from "../client/src/lib/bargeIn";

const reading =
  "Pregunta 2 de 10. ¿Qué instrucción sería más útil para obtener una respuesta adecuada? A: Explícame la fotosíntesis. B: Haz mi tarea.";

describe("interrumpir al asistente hablando", () => {
  it("ignora la propia voz del asistente captada por el micrófono", () => {
    expect(isLikelyEcho("qué instrucción sería más útil", reading)).toBe(true);
    expect(isLikelyEcho("instrucción sería útil para obtener", reading)).toBe(true);
    expect(shouldInterrupt("respuesta adecuada", reading, true)).toBe(false);
  });

  it("se detiene cuando la persona da una orden distinta", () => {
    expect(shouldInterrupt("opción c", reading, true)).toBe(true);
    expect(shouldInterrupt("siguiente pregunta", reading, false)).toBe(true);
    expect(shouldInterrupt("abre el módulo dos", reading, false)).toBe(true);
  });

  it("se detiene siempre con para, basta o su nombre", () => {
    expect(shouldInterrupt("para", reading, false)).toBe(true);
    expect(shouldInterrupt("basta", reading, true)).toBe(true);
    expect(shouldInterrupt("oye jason", reading, false)).toBe(true);
  });

  it("espera más de una palabra en resultados parciales para no cortar por un ruido", () => {
    expect(shouldInterrupt("eh", reading, false)).toBe(false);
    expect(shouldInterrupt("", reading, true)).toBe(false);
  });
});
