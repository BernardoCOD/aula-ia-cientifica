import type { AgentAction } from "@shared/assistant";
import { accessibleName, elementById, isPasswordField } from "./pageSnapshot";

// Ejecuta sobre la página las acciones que decide el agente. Cada acción devuelve un texto con
// lo que realmente pasó, que se usa para verificar y, en órdenes de varios pasos, se envía de
// vuelta al agente.

export type ActionEnvironment = {
  navigate: (path: string) => void;
  goBack: () => void;
  readPage: (mode: "summary" | "full") => void;
  changeTextSize: (direction: 1 | -1) => void;
  changeSpeechRate: (value: "slower" | "faster" | "normal") => void;
  stopAssistant: () => void;
};

export type ActionOutcome = { ok: boolean; detail: string };

/**
 * Simula un clic real. Algunos componentes (listas desplegables y menús de Radix) se abren con
 * pointerdown y no con click, por eso se envía la secuencia completa de eventos del puntero.
 */
export function realClick(element: HTMLElement) {
  element.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
  element.focus({ preventScroll: true });
  const pointer = { bubbles: true, cancelable: true, button: 0, pointerType: "mouse", isPrimary: true };
  element.dispatchEvent(new PointerEvent("pointerdown", pointer));
  element.dispatchEvent(new MouseEvent("mousedown", pointer));
  element.dispatchEvent(new PointerEvent("pointerup", pointer));
  element.dispatchEvent(new MouseEvent("mouseup", pointer));
  element.click();
}

/** Escribe un valor en un campo controlado por React (el setter nativo dispara su onChange). */
export function setFieldValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Controles que no deben activarse sin confirmación: envíos, borrados, publicaciones, salidas. */
export function isRiskyElement(element: HTMLElement) {
  // Un <button> sin type es "submit" por defecto, pero solo envía algo si está dentro de un formulario.
  if (
    (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) &&
    element.type === "submit" &&
    element.form
  )
    return true;
  const signal = `${element.getAttribute("data-ai-action") ?? ""} ${accessibleName(element)}`.toLocaleLowerCase("es");
  return /(enviar|publicar|eliminar|borrar|delete|submit|guardar pretest|guardar postest|guardar evaluaci|finalizar|cerrar sesi|salir|reiniciar)/.test(
    signal
  );
}

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

export async function executeAction(
  action: AgentAction,
  env: ActionEnvironment
): Promise<ActionOutcome> {
  const element = action.target ? elementById(action.target) : undefined;
  const name = element ? accessibleName(element) : action.target;
  switch (action.type) {
    case "navigate":
      env.navigate(action.target);
      return { ok: true, detail: `abrí ${action.target}` };
    case "back":
      window.history.length > 1 ? env.goBack() : env.navigate("/");
      return { ok: true, detail: "volví a la pantalla anterior" };
    case "click": {
      if (!element)
        return { ok: false, detail: `no encontré el control ${action.target}` };
      if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true")
        return { ok: false, detail: `"${name}" está deshabilitado` };
      const before = window.location.href;
      realClick(element);
      await wait(60);
      const after = window.location.href;
      return {
        ok: true,
        detail:
          after !== before
            ? `pulsé "${name}" y se abrió ${new URL(after).pathname}`
            : `pulsé "${name}"`,
      };
    }
    case "fill": {
      if (!element)
        return { ok: false, detail: `no encontré el campo ${action.target}` };
      if (isPasswordField(element))
        return { ok: false, detail: "no escribo en campos de contraseña" };
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.focus();
        setFieldValue(element, action.value);
        return { ok: true, detail: `escribí "${action.value}" en "${name}"` };
      }
      if (element.isContentEditable) {
        element.focus();
        element.textContent = action.value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        return { ok: true, detail: `escribí en "${name}"` };
      }
      return { ok: false, detail: `"${name}" no es un campo de texto` };
    }
    case "select": {
      if (!(element instanceof HTMLSelectElement))
        return element
          ? (realClick(element), { ok: true, detail: `abrí "${name}"` })
          : { ok: false, detail: `no encontré la lista ${action.target}` };
      const wanted = action.value.toLocaleLowerCase("es").trim();
      const option = Array.from(element.options).find(
        item =>
          item.text.toLocaleLowerCase("es").trim() === wanted ||
          item.value.toLocaleLowerCase("es") === wanted
      ) ??
        Array.from(element.options).find(item =>
          item.text.toLocaleLowerCase("es").includes(wanted)
        );
      if (!option) return { ok: false, detail: `no existe la opción "${action.value}"` };
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(
        element,
        option.value
      );
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, detail: `elegí "${option.text}" en "${name}"` };
    }
    case "focus":
      if (!element) return { ok: false, detail: `no encontré ${action.target}` };
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      element.focus();
      return { ok: true, detail: `enfoqué "${name}"` };
    case "scroll": {
      const amount = window.innerHeight * 0.8;
      if (element) element.scrollIntoView({ block: "center", behavior: "smooth" });
      else if (action.target === "up") window.scrollBy({ top: -amount, behavior: "smooth" });
      else if (action.target === "down") window.scrollBy({ top: amount, behavior: "smooth" });
      else if (action.target === "top") window.scrollTo({ top: 0, behavior: "smooth" });
      else if (action.target === "bottom")
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return { ok: true, detail: "desplacé la pantalla" };
    }
    case "read_page":
      env.readPage(action.value === "full" ? "full" : "summary");
      return { ok: true, detail: "leí la pantalla" };
    case "text_size":
      env.changeTextSize(action.value === "down" ? -1 : 1);
      return { ok: true, detail: "cambié el tamaño de letra" };
    case "speech_rate":
      env.changeSpeechRate(
        action.value === "slower" || action.value === "faster" ? action.value : "normal"
      );
      return { ok: true, detail: "cambié la velocidad de voz" };
    case "consult":
      env.navigate(`/consultas?q=${encodeURIComponent(action.value)}`);
      return { ok: true, detail: `busqué "${action.value}" en el Área de consultas` };
    case "stop_assistant":
      env.stopAssistant();
      return { ok: true, detail: "dejé de escuchar" };
    default:
      return { ok: false, detail: "acción desconocida" };
  }
}

/** Espera a que la pantalla termine de cambiar (nueva ruta y contenido renderizado). */
export async function waitForPageToSettle(previousPath: string) {
  const started = Date.now();
  while (Date.now() - started < 1500) {
    await wait(100);
    if (window.location.pathname !== previousPath) break;
  }
  // Un margen para que React pinte la pantalla nueva y sus datos iniciales.
  await wait(450);
}
