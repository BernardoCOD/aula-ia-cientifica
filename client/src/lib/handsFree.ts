import { normalizeParticipantCode } from "@shared/participant";

// Textos y reglas del uso sin manos: bienvenida hablada, ingreso del código por voz y recorrido de
// los controles de la pantalla con "siguiente", "anterior" y "activar".

export const CODE_QUESTION =
  "¿Cuál es tu código de participante? Dilo letra por letra, por ejemplo: pe cero uno.";

/** Bienvenida al abrir la app: breve, con la primera acción posible. */
export function welcomeMessage(code?: string | null) {
  const intro = code
    ? `Hola de nuevo, ${code}. Soy Jason, tu asistente de voz.`
    : "Hola, soy Jason, tu asistente de voz.";
  return `${intro} Háblame cuando quieras; si estoy hablando, solo interrúmpeme. Para ${code ? "ir a tu ruta" : "empezar la capacitación"}, di: quiero empezar. Para conocer más órdenes, di: ayuda.`;
}

/**
 * Código dictado en la pantalla de ingreso. Debe tener al menos un número (como P01) para no
 * confundir una frase cualquiera ("qué es esto") con un código.
 */
export function spokenCodeCandidate(text: string): string | null {
  const code = normalizeParticipantCode(text);
  return code && /\d/.test(code) && code.length <= 12 ? code : null;
}

const KIND_NAMES: Record<string, string> = {
  button: "botón",
  link: "enlace",
  textbox: "campo de texto",
  textarea: "campo de texto",
  searchbox: "campo de búsqueda",
  checkbox: "casilla",
  radio: "opción",
  switch: "interruptor",
  tab: "pestaña",
  select: "lista",
  combobox: "lista",
  option: "opción de la lista",
  menuitem: "opción del menú",
};

/** "Botón Ingresar", "Casilla Acepto, marcada", "Campo de texto Código de participante". */
export function describeControl(control: { kind: string; label: string; state?: string }) {
  const kind = KIND_NAMES[control.kind] ?? "control";
  const text = `${kind.charAt(0).toUpperCase()}${kind.slice(1)} ${control.label.replace(/[.,;:]+$/, "")}`;
  return control.state ? `${text}, ${control.state}.` : `${text}.`;
}
