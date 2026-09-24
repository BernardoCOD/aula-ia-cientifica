import type {
  AssistantMode,
  PageSnapshot,
  SnapshotElement,
  SnapshotTable,
} from "@shared/assistant";

// Construye una "fotografía" accesible de la pantalla para el agente de IA: texto visible,
// controles interactivos con un id estable y tablas. Cada fotografía reemplaza los ids anteriores.

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='option']",
  "[role='menuitem']",
  "[role='combobox']",
  "[contenteditable='true']",
].join(",");

const ASSISTANT_ROOT = "[data-voice-assistant]";
const MAX_ELEMENTS = 160;
const MAX_TEXT = 6000;

type Registered = { element: HTMLElement; kind: string; label: string };
let registry = new Map<string, Registered>();

/**
 * Devuelve el elemento de la última fotografía. Si React lo reemplazó al volver a dibujar la
 * pantalla (por ejemplo, tras escribir en un campo), lo busca de nuevo por su tipo y nombre.
 */
export function elementById(id: string) {
  const entry = registry.get(id);
  if (!entry) return undefined;
  if (entry.element.isConnected) return entry.element;
  const replacement = Array.from(
    document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)
  ).find(
    candidate =>
      !candidate.closest(ASSISTANT_ROOT) &&
      kindOf(candidate) === entry.kind &&
      accessibleName(candidate) === entry.label &&
      isVisible(candidate)
  );
  if (replacement) entry.element = replacement;
  return replacement;
}

const clean = (value: string | null | undefined, max = 200) =>
  (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export function isVisible(element: HTMLElement) {
  if (element.closest("[aria-hidden='true'], [hidden], [inert]")) return false;
  const style = window.getComputedStyle(element);
  if (style.visibility === "hidden" || style.display === "none") return false;
  const rect = element.getBoundingClientRect();
  // Los radios y checkboxes nativos suelen estar ocultos a 0x0 detrás de un label visible.
  if (rect.width === 0 && rect.height === 0) {
    const label = (element as HTMLInputElement).labels?.[0];
    return Boolean(label && label.getBoundingClientRect().width > 0);
  }
  return true;
}

export function isPasswordField(element: HTMLElement) {
  return (
    (element instanceof HTMLInputElement && element.type === "password") ||
    /contraseña|contrasena|password|clave/i.test(
      `${element.getAttribute("name") ?? ""} ${element.getAttribute("autocomplete") ?? ""} ${element.getAttribute("aria-label") ?? ""}`
    )
  );
}

/** Texto de un <label> sin el contenido de los controles que envuelve (por ejemplo, las opciones de un select). */
function labelText(label: HTMLLabelElement) {
  const copy = label.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("select, input, textarea, button").forEach(node => node.remove());
  return clean(copy.textContent);
}

/** Nombre accesible aproximado de un control, en el orden en que lo calcularía un lector de pantalla. */
export function accessibleName(element: HTMLElement): string {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map(id => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    if (clean(text)) return clean(text);
  }
  const aria = element.getAttribute("aria-label");
  if (clean(aria)) return clean(aria);
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    const label = element.labels?.[0];
    if (label && labelText(label)) return labelText(label);
    if (clean(element.getAttribute("placeholder")))
      return clean(element.getAttribute("placeholder"));
  }
  const text = clean(element.innerText || element.textContent);
  if (text) return text;
  const title = element.getAttribute("title");
  if (clean(title)) return clean(title);
  const image = element.querySelector("img[alt], svg[aria-label]");
  if (image)
    return clean(image.getAttribute("alt") || image.getAttribute("aria-label"));
  return clean(element.getAttribute("name")) || "sin nombre";
}

function kindOf(element: HTMLElement) {
  const role = element.getAttribute("role");
  if (role) return role;
  if (element instanceof HTMLAnchorElement) return "link";
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLTextAreaElement) return "textarea";
  if (element instanceof HTMLInputElement) {
    if (["checkbox", "radio", "range"].includes(element.type)) return element.type;
    if (["submit", "button", "reset"].includes(element.type)) return "button";
    return "textbox";
  }
  if (element.tagName === "SUMMARY") return "button";
  if (element.isContentEditable) return "textbox";
  return "button";
}

function stateOf(element: HTMLElement) {
  const states: string[] = [];
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  )
    states.push("deshabilitado");
  if (element instanceof HTMLInputElement && element.checked)
    states.push("marcado");
  const checked = element.getAttribute("aria-checked");
  if (checked === "true") states.push("marcado");
  if (element.getAttribute("aria-selected") === "true")
    states.push(element.getAttribute("role") === "tab" ? "pestaña activa" : "seleccionado");
  if (element.getAttribute("aria-pressed") === "true") states.push("presionado");
  if (element.getAttribute("aria-expanded") === "true") states.push("abierto");
  if (element.getAttribute("aria-current")) states.push("página actual");
  if (element.getAttribute("aria-invalid") === "true") states.push("con error");
  if (element.hasAttribute("required")) states.push("obligatorio");
  return states.join(", ") || undefined;
}

function valueOf(element: HTMLElement) {
  if (isPasswordField(element)) return undefined;
  if (element instanceof HTMLSelectElement) {
    const options = Array.from(element.options)
      .map(option => option.text.trim())
      .join(" / ");
    return clean(`${element.selectedOptions[0]?.text ?? ""} (opciones: ${options})`, 400);
  }
  if (
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLInputElement &&
      !["checkbox", "radio", "submit", "button"].includes(element.type))
  )
    return clean(element.value, 400) || undefined;
  if (element.isContentEditable) return clean(element.innerText, 400) || undefined;
  return undefined;
}

/** Contexto del control: la pregunta (fieldset/legend) o el encabezado de la sección donde está. */
function groupOf(element: HTMLElement) {
  const legend = element.closest("fieldset")?.querySelector("legend");
  if (legend) return clean(legend.textContent, 160);
  const labelledGroup = element.closest<HTMLElement>(
    "[role='radiogroup'][aria-label], [role='group'][aria-label], [role='tablist'][aria-label], nav[aria-label]"
  );
  if (labelledGroup) return clean(labelledGroup.getAttribute("aria-label"), 160);
  return undefined;
}

function readTables(root: ParentNode): SnapshotTable[] {
  const tables: SnapshotTable[] = [];
  root.querySelectorAll<HTMLTableElement>("table").forEach(table => {
    if (tables.length >= 4 || !isVisible(table) || table.closest(ASSISTANT_ROOT))
      return;
    const headers = Array.from(table.querySelectorAll("thead th")).map(cell =>
      clean(cell.textContent, 80)
    );
    const rows = Array.from(table.querySelectorAll("tbody tr"))
      .slice(0, 30)
      .map(row =>
        Array.from(row.querySelectorAll("th, td")).map(cell =>
          clean((cell as HTMLElement).innerText, 120)
        )
      );
    const caption =
      clean(table.caption?.textContent) ||
      clean(table.getAttribute("aria-label")) ||
      clean(
        table.closest("section, [role='region'], div")?.querySelector("h1, h2, h3")
          ?.textContent
      ) ||
      "Tabla";
    tables.push({ caption, headers, rows });
  });
  return tables;
}

function visibleText(root: HTMLElement) {
  // innerText respeta lo oculto por CSS; se excluye el panel del asistente.
  const assistant = root.querySelector<HTMLElement>(ASSISTANT_ROOT);
  const previous = assistant?.style.display;
  if (assistant) assistant.style.display = "none";
  const text = root.innerText;
  if (assistant) assistant.style.display = previous ?? "";
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_TEXT);
}

export function takeSnapshot(
  route: string,
  mode: AssistantMode,
  screen?: PageSnapshot["screen"]
): PageSnapshot {
  // Si hay un diálogo modal abierto, el foco del usuario está ahí: se describe solo el diálogo.
  const modal = Array.from(
    document.querySelectorAll<HTMLElement>("[role='dialog'][aria-modal='true'], [role='alertdialog']")
  ).find(dialog => !dialog.closest(ASSISTANT_ROOT) && isVisible(dialog));
  const root = modal ?? document.body;

  registry = new Map();
  const elements: SnapshotElement[] = [];
  const seen = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR).forEach(element => {
    if (elements.length >= MAX_ELEMENTS || seen.has(element)) return;
    if (element.closest(ASSISTANT_ROOT) || !isVisible(element)) return;
    seen.add(element);
    const id = `e${elements.length + 1}`;
    const kind = kindOf(element);
    const name = accessibleName(element);
    registry.set(id, { element, kind, label: name });
    const href =
      element instanceof HTMLAnchorElement
        ? element.getAttribute("href") ?? undefined
        : undefined;
    elements.push({
      id,
      kind,
      label: isPasswordField(element) ? `${name} (campo de contraseña)` : name,
      value: valueOf(element),
      state: stateOf(element),
      href: href?.startsWith("/") || href?.startsWith("#") ? href : undefined,
      group: groupOf(element),
    });
  });

  const headings = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3"))
    .filter(heading => !heading.closest(ASSISTANT_ROOT) && isVisible(heading))
    .map(heading => clean(heading.innerText, 160))
    .filter(Boolean)
    .slice(0, 30);
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>("[role='dialog'], [role='alertdialog']")
  )
    .filter(dialog => !dialog.closest(ASSISTANT_ROOT) && isVisible(dialog))
    .map(dialog => clean(dialog.getAttribute("aria-label") || dialog.innerText, 400));
  const alerts = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[role='alert'], [role='status'], [aria-live='assertive'], [data-sonner-toast]"
    )
  )
    .filter(alert => !alert.closest(ASSISTANT_ROOT) && isVisible(alert))
    .map(alert => clean(alert.innerText, 200))
    .filter(Boolean)
    .slice(0, 8);
  const active = document.activeElement as HTMLElement | null;
  const focused =
    active && active !== document.body && !active.closest(ASSISTANT_ROOT)
      ? accessibleName(active)
      : undefined;

  return {
    route,
    title: clean(root.querySelector<HTMLElement>("h1")?.innerText || document.title, 200),
    mode,
    headings,
    text: visibleText(root),
    elements,
    tables: readTables(root),
    dialogs,
    alerts,
    focused,
    screen,
  };
}

/** Resumen breve para leer en voz alta sin usar la IA (título, descripción y controles principales). */
export function speakableSummary(snapshot: PageSnapshot) {
  const main = document.querySelector("main");
  const description = clean(
    main?.querySelector("h1 ~ p, h1 + p")?.textContent,
    300
  );
  const question = snapshot.screen?.currentQuestion
    ? `Pregunta ${(snapshot.screen.questionIndex ?? 0) + 1} de ${snapshot.screen.totalQuestions ?? ""}: ${snapshot.screen.currentQuestion} Alternativas: ${(snapshot.screen.currentOptions ?? []).map((option, index) => `${String.fromCharCode(65 + index)}, ${option}`).join(". ")}.`
    : "";
  const controls = snapshot.elements
    .filter(element => !element.state?.includes("deshabilitado"))
    .slice(0, 8)
    .map(element => element.label.replace(/[.,;:]+$/, ""))
    .join(", ");
  return [
    snapshot.title && `Estás en: ${snapshot.title}.`,
    question || description || snapshot.screen?.currentContent,
    snapshot.alerts.length ? `Aviso: ${snapshot.alerts.join(". ")}.` : "",
    controls && `Puedes usar: ${controls}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Lectura completa y ordenada de la pantalla ("lee todo"). */
export function speakableFull(snapshot: PageSnapshot) {
  const parts = [
    snapshot.title && `Pantalla: ${snapshot.title}.`,
    snapshot.dialogs.length ? `Diálogo abierto: ${snapshot.dialogs.join(". ")}.` : "",
    snapshot.alerts.length ? `Avisos: ${snapshot.alerts.join(". ")}.` : "",
    snapshot.text.replace(/\n/g, ". "),
    ...snapshot.tables.map(
      table =>
        `Tabla ${table.caption}, con ${table.rows.length} filas. ${table.rows
          .slice(0, 10)
          .map(row =>
            row
              .map((cell, index) =>
                table.headers[index] ? `${table.headers[index]}: ${cell}` : cell
              )
              .join(", ")
          )
          .join(". ")}.`
    ),
  ];
  return parts.filter(Boolean).join(" ").replace(/\.\s*\./g, ".");
}
