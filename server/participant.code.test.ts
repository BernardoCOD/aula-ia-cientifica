import { describe, expect, it } from "vitest";
import { normalizeParticipantCode } from "@shared/participant";

describe("código de participante dicho por voz", () => {
  it("convierte letras y números dictados en un código compacto", () => {
    expect(normalizeParticipantCode("pe cero uno")).toBe("P01");
    expect(normalizeParticipantCode("P cero uno")).toBe("P01");
    expect(normalizeParticipantCode("p 1 2")).toBe("P12");
    expect(normalizeParticipantCode("pe doce")).toBe("P12");
    expect(normalizeParticipantCode("ese cero tres")).toBe("S03");
    expect(normalizeParticipantCode("ele cero uno")).toBe("L01");
    expect(normalizeParticipantCode("doble ve cinco")).toBe("W5");
  });

  it("quita las frases de relleno", () => {
    expect(normalizeParticipantCode("mi código es pe cero uno")).toBe("P01");
    expect(normalizeParticipantCode("Mi código de participante es P07.")).toBe("P07");
    expect(normalizeParticipantCode("soy el pe dos")).toBe("P2");
  });

  it("respeta lo escrito con teclado", () => {
    expect(normalizeParticipantCode("p01")).toBe("P01");
    expect(normalizeParticipantCode("ATE-024")).toBe("ATE-024");
    expect(normalizeParticipantCode("pe guion cero uno")).toBe("P-01");
  });

  it("rechaza códigos vacíos, muy cortos o con símbolos", () => {
    expect(normalizeParticipantCode("")).toBe("");
    expect(normalizeParticipantCode("pe")).toBe("");
    expect(normalizeParticipantCode("P01 / x")).toBe("");
  });
});
