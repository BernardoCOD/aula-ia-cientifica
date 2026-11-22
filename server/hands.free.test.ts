import { describe, expect, it } from "vitest";
import {
  CODE_QUESTION,
  describeControl,
  spokenCodeCandidate,
  welcomeMessage,
} from "../client/src/lib/handsFree";

describe("uso sin manos", () => {
  it("da una bienvenida breve con la primera orden posible", () => {
    expect(welcomeMessage()).toContain("di: quiero empezar");
    expect(welcomeMessage("P01")).toMatch(/^Hola de nuevo, P01\./);
    expect(welcomeMessage().length).toBeLessThan(220);
    expect(CODE_QUESTION).toContain("pe cero uno");
  });

  it("reconoce un código dictado en la pantalla de ingreso", () => {
    expect(spokenCodeCandidate("pe cero uno")).toBe("P01");
    expect(spokenCodeCandidate("mi código es pe uno dos")).toBe("P12");
  });

  it("no confunde una frase cualquiera con un código", () => {
    expect(spokenCodeCandidate("qué es esto")).toBeNull();
    expect(spokenCodeCandidate("ayúdame por favor")).toBeNull();
  });

  it("nombra cada control con su tipo y su estado", () => {
    expect(describeControl({ kind: "button", label: "Ingresar" })).toBe("Botón Ingresar.");
    expect(describeControl({ kind: "textbox", label: "Código de participante" })).toBe(
      "Campo de texto Código de participante."
    );
    expect(describeControl({ kind: "checkbox", label: "Acepto", state: "marcado" })).toBe(
      "Casilla Acepto, marcado."
    );
    expect(describeControl({ kind: "tab", label: "Retos", state: "pestaña activa" })).toBe(
      "Pestaña Retos, pestaña activa."
    );
  });
});
