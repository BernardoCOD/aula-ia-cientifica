import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { addEvaluation, getStudent } from "@/lib/student";
import { postestQuestions } from "@/lib/assessment";
import { useAssistantScreen } from "@/contexts/AssistantContext";

const questions = postestQuestions;
const LETTER_TO_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

export default function Postest() {
  const [, navigate] = useLocation();
  const student = getStudent();
  const code = student?.code ?? "";
  const eligibility = trpc.student.eligibility.useQuery(
    { code },
    { enabled: Boolean(code) }
  );
  const postest = trpc.student.postest.useMutation();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const available = eligibility.data?.eligible ?? false;
  useAssistantScreen(
    {
      mode: "evaluation",
      route: "/postest",
      currentQuestion: available ? questions[voiceIndex]?.text : undefined,
      currentOptions: available ? questions[voiceIndex]?.options : undefined,
      questionIndex: voiceIndex,
      totalQuestions: questions.length,
    },
    {
      onNext: () =>
        setVoiceIndex(index => Math.min(index + 1, questions.length - 1)),
      onPrevious: () => setVoiceIndex(index => Math.max(index - 1, 0)),
      onGoToQuestion: index => {
        const next = Math.max(0, Math.min(index, questions.length - 1));
        setVoiceIndex(next);
        window.setTimeout(() => {
          const target = document.querySelector<HTMLElement>(
            `[data-question-index="${next}"]`
          );
          target?.scrollIntoView({ behavior: "smooth", block: "center" });
          (target?.querySelector("input") as HTMLElement | null)?.focus();
        }, 0);
      },
      onSelectOption: letter =>
        setAnswers(previous => ({
          ...previous,
          [voiceIndex]: LETTER_TO_INDEX[letter],
        })),
    }
  );
  if (!student) return <EmptyState />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Responde todas las preguntas.");
      return;
    }
    const result = questions.reduce(
      (sum, question, index) =>
        sum + (answers[index] === question.correct ? 1 : 0),
      0
    );
    setScore(result);
    setSubmitted(true);
    addEvaluation({ type: "postest", score: result, total: questions.length });
    try {
      await postest.mutateAsync({
        code,
        score: result,
        total: questions.length,
      });
    } catch {}
  };
  return (
    <div className="min-h-screen bg-[#f5faf9]">
      <header className="border-b border-[#dce9e7] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-[#547074]"
          >
            <ArrowLeft size={17} /> Volver a mi ruta
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-[#26356b]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#26356b] text-white">
              <Sparkles size={17} />
            </span>
            Aula IA
          </div>
          <span className="text-xs font-bold uppercase tracking-[.14em] text-[#8a9a9b]">
            Evaluación final
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-10 lg:px-8">
        {!available ? (
          <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-lift">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7ddff] text-[#6954a8]">
              <LockKeyhole size={29} />
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[.15em] text-[#6954a8]">
              Postest bloqueado
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#26356b]">
              Tu evaluación final aún no está disponible
            </h1>
            <p className="mt-4 leading-relaxed text-[#688084]">
              El postest estará disponible cuando completes el período de
              capacitación configurado por tu investigador.
            </p>
            <div className="mt-7 rounded-2xl bg-[#f5f1ff] p-4 text-left text-sm text-[#6954a8]">
              <div className="flex items-center gap-2 font-bold">
                <Clock3 size={17} /> Condiciones de habilitación
              </div>
              <p className="mt-2">
                {eligibility.data?.reason ??
                  "Completa primero tu pretest y comienza la capacitación."}
              </p>
              <p className="mt-2 text-xs">
                Progreso registrado: {eligibility.data?.progress ?? 0}% ·
                Actividades: {eligibility.data?.activities ?? 0}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white"
            >
              Continuar capacitación <ArrowRight size={17} />
            </Link>
          </div>
        ) : submitted ? (
          <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-lift">
            <CheckCircle2 className="mx-auto text-[#46a48e]" size={45} />
            <p className="mt-6 text-sm font-bold uppercase tracking-[.15em] text-[#5b4bdb]">
              Postest registrado
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#26356b]">
              Resultado: {Math.round((score / questions.length) * 100)}%
            </h1>
            <p className="mt-4 leading-relaxed text-[#688084]">
              Tu resultado final se guardó de forma privada. El investigador
              podrá compararlo con tu pretest.
            </p>
            <Link
              href="/dashboard"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white"
            >
              Ver mi progreso <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-8 max-w-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4e8ff] text-[#5b4bdb]">
                <ShieldCheck size={25} />
              </div>
              <p className="text-sm font-bold uppercase tracking-[.15em] text-[#5b4bdb]">
                Postest disponible
              </p>
              <h1 className="mt-2 text-4xl font-bold text-[#26356b]">
                Demuestra lo que aprendiste
              </h1>
              <p className="mt-4 leading-relaxed text-[#688084]">
                Esta evaluación mide tu progreso después de la capacitación.
                Lee, analiza y responde con tus propias palabras cuando sea
                necesario.
              </p>
            </div>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <fieldset
                  data-question-index={index}
                  key={question.text}
                  className="rounded-2xl border border-[#dce9e7] bg-white p-5 shadow-soft"
                >
                  <legend className="mb-5 block w-full">
                    <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e4e8ff] text-xs font-bold text-[#5b4bdb]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-[#26356b]">
                      {question.text}
                    </span>
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${answers[index] === optionIndex ? "border-[#5b4bdb] bg-[#edf9f7]" : "border-[#e2ecea]"}`}
                      >
                        <input
                          type="radio"
                          name={`postest-${index}`}
                          checked={answers[index] === optionIndex}
                          onChange={() =>
                            setAnswers(previous => ({
                              ...previous,
                              [index]: optionIndex,
                            }))
                          }
                          className="mt-0.5 accent-[#5b4bdb]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white"
            >
              Guardar evaluación final <ArrowRight size={17} />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
function EmptyState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5faf9] p-5">
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-lift">
        <h1 className="text-2xl font-bold text-[#26356b]">
          Identifícate primero
        </h1>
        <Link
          href="/identificacion"
          className="mt-5 inline-flex rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white"
        >
          Comenzar
        </Link>
      </div>
    </div>
  );
}
