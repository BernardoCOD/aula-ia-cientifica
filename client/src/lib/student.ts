import { courseModules } from "@shared/course";

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
const moduleLook: Record<string, { color: string; icon: string }> = {
  m1: { color: "bg-[#e4e8ff]", icon: "✦" },
  m2: { color: "bg-[#ffe7d6]", icon: "◎" },
  m3: { color: "bg-[#e7ddff]", icon: "⌁" },
  m4: { color: "bg-[#fff0c7]", icon: "⌕" },
  m5: { color: "bg-[#dceaff]", icon: "↗" },
  m6: { color: "bg-[#e3f4d8]", icon: "◌" },
};
export const modules = courseModules.map(module => ({
  ...module,
  ...moduleLook[module.id],
}));
export const moduleById = (id: string) =>
  modules.find(module => module.id === id) ?? modules[0];
