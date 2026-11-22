// Frases cortas para leer las evaluaciones en voz alta, como un examen oral: primero la pregunta y
// luego cada alternativa con su letra, sin frases de relleno.

export type SpokenQuestion = {
  index: number;
  total?: number;
  text: string;
  options?: string[];
};

export const optionLetter = (index: number) => String.fromCharCode(65 + index);

/** Quita los puntos y espacios finales para que la voz no haga pausas dobles. */
const trimEnd = (value: string) => value.trim().replace(/[.\s]+$/, "");

export function spokenOptions(options: string[] = []) {
  return options.map((option, index) => `${optionLetter(index)}: ${trimEnd(option)}.`).join(" ");
}

/** "Pregunta 3 de 10. ¿…? A: …. B: …." */
export function spokenQuestion(question: SpokenQuestion, { withOptions = true } = {}) {
  const header = `Pregunta ${question.index + 1}${question.total ? ` de ${question.total}` : ""}.`;
  const text = `${trimEnd(question.text)}${/[?!]$/.test(question.text.trim()) ? "" : "."}`;
  return [header, text, withOptions ? spokenOptions(question.options) : ""]
    .filter(Boolean)
    .join(" ");
}

/** "B: …." o un aviso si la letra no existe en esta pregunta. */
export function spokenOption(options: string[] = [], letter: string) {
  const index = letter.toUpperCase().charCodeAt(0) - 65;
  const option = options[index];
  if (!option)
    return `Esta pregunta tiene opciones de la A a la ${optionLetter(Math.max(options.length - 1, 0))}.`;
  return `${optionLetter(index)}: ${trimEnd(option)}.`;
}

/** "Respondiste 4 de 10. Te faltan las preguntas 5, 6 y 7." */
export function spokenProgress(total: number, unanswered: number[]) {
  const answered = total - unanswered.length;
  if (!unanswered.length) return `Respondiste las ${total} preguntas. Para enviarlas, di: guardar evaluación.`;
  const list =
    unanswered.length === 1
      ? `la pregunta ${unanswered[0]}`
      : `las preguntas ${unanswered.slice(0, -1).join(", ")} y ${unanswered[unanswered.length - 1]}`;
  return `Respondiste ${answered} de ${total}. Te ${unanswered.length === 1 ? "falta" : "faltan"} ${list}.`;
}
