export type StudentSession = {
  code: string;
  grade: string;
  section: string;
  schoolName?: string;
};

const SESSION_KEY = "aula-ia-student";
const PROGRESS_KEY = "aula-ia-progress";
const EVAL_KEY = "aula-ia-evaluations";
const CHALLENGE_KEY = "aula-ia-challenges";

export function getStudent(): StudentSession | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
export function setStudent(student: StudentSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(student));
}
export function clearStudent() {
  localStorage.removeItem(SESSION_KEY);
}
export function getProgress(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}
export function setProgress(moduleId: string, percentage: number) {
  const progress = getProgress();
  progress[moduleId] = percentage;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
export function getEvaluations(): {
  type: string;
  score: number;
  total: number;
}[] {
  try {
    return JSON.parse(localStorage.getItem(EVAL_KEY) || "[]");
  } catch {
    return [];
  }
}
export function addEvaluation(item: {
  type: string;
  score: number;
  total: number;
}) {
  const items = getEvaluations().filter(entry => entry.type !== item.type);
  items.push(item);
  localStorage.setItem(EVAL_KEY, JSON.stringify(items));
}
export function getChallenges(): { name: string; score: number }[] {
  try {
    return JSON.parse(localStorage.getItem(CHALLENGE_KEY) || "[]");
  } catch {
    return [];
  }
}
export function addChallenge(item: { name: string; score: number }) {
  const items = getChallenges().filter(entry => entry.name !== item.name);
  items.push(item);
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(items));
}
export const modules = [
  {
    id: "m1",
    number: "01",
    title: "IA para comprender",
    short: "Reconoce la IA como apoyo para entender contenidos de clase.",
    color: "bg-[#e4e8ff]",
    icon: "✦",
  },
  {
    id: "m2",
    number: "02",
    title: "Instrucciones que ayudan",
    short:
      "Formula prompts claros para aprender, practicar y recibir orientación.",
    color: "bg-[#ffe7d6]",
    icon: "◎",
  },
  {
    id: "m3",
    number: "03",
    title: "Pensar con apoyo de IA",
    short: "Resuelve problemas sin entregar tu razonamiento a la herramienta.",
    color: "bg-[#e7ddff]",
    icon: "⌁",
  },
  {
    id: "m4",
    number: "04",
    title: "Verificar antes de usar",
    short: "Contrasta respuestas, fuentes, fechas y evidencias.",
    color: "bg-[#fff0c7]",
    icon: "⌕",
  },
  {
    id: "m5",
    number: "05",
    title: "Investigar y organizar",
    short:
      "Usa la IA para ordenar preguntas e información sin reemplazar tus fuentes.",
    color: "bg-[#dceaff]",
    icon: "↗",
  },
  {
    id: "m6",
    number: "06",
    title: "Comunicar con criterio",
    short:
      "Elabora respuestas propias, éticas y fundamentadas para tus clases.",
    color: "bg-[#e3f4d8]",
    icon: "◌",
  },
];
export const moduleById = (id: string) =>
  modules.find(module => module.id === id) ?? modules[0];
