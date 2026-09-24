import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { addEvaluation, getStudent } from "@/lib/student";
import { pretestQuestions } from "@/lib/assessment";
import { useAssistantScreen } from "@/contexts/AssistantContext";

const questions = pretestQuestions;
const LETTER_TO_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

export default function Diagnostic() {
  const [, navigate] = useLocation();
  const student = getStudent();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const evaluation = trpc.student.evaluation.useMutation();
  const pretest = trpc.student.pretest.useMutation();
  useAssistantScreen(
    {
      mode: "evaluation",
      route: "/diagnostico",
      currentQuestion: questions[voiceIndex]?.text,
      currentOptions: questions[voiceIndex]?.options,
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
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Responde las 10 preguntas antes de continuar.");
      return;
    }
    const score = questions.reduce(
      (sum, question, index) =>
        sum + (answers[index] === question.correct ? 1 : 0),
      0
    );
    setSubmitted(true);
    addEvaluation({ type: "pretest", score, total: questions.length });
    if (student) {
      try {
        await pretest.mutateAsync({
          code: student.code,
          score,
          total: questions.length,
        });
      } catch {
        try {
          await evaluation.mutateAsync({
            code: student.code,
            type: "diagnostic",
            score,
            total: questions.length,
          });
        } catch {}
      }
    }
  };
  return (
    <div className="min-h-screen bg-[#f5faf9]">
      <header className="border-b border-[#dce9e7] bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 lg:px-8">
          <Link
            href="/identificacion"
            className="flex items-center gap-2 text-sm font-bold text-[#547074]"
          >
            <ArrowLeft size={17} /> Volver
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-[#26356b]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#26356b] text-white">
              <Sparkles size={17} />
            </span>
            Aula IA
          </div>
          <span className="text-xs font-bold uppercase tracking-[.14em] text-[#8a9a9b]">
            Pretest inicial
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-10 lg:px-8">
        <div className="mb-9 max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe7d6] text-[#b55e3d]">
            <ClipboardCheck size={25} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
            Antes de la ruta
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[#26356b] sm:text-5xl">
            ¿Qué sabes sobre IA?
          </h1>
          <p className="mt-4 leading-relaxed text-[#688084]">
            Este diagnóstico de la versión 1 ahora funciona como tu{" "}
            <strong>PRETEST</strong>. Conocerá tu punto de partida y no mostrará
            estadísticas de otros estudiantes.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm text-[#547074]">
            <Info size={16} className="text-[#5b4bdb]" /> Responde con
            honestidad; equivocarse también es parte de aprender.
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {questions.map((question, index) => (
            <fieldset
              data-question-index={index}
              key={question.text}
              className="rounded-2xl border border-[#dce9e7] bg-white p-5 shadow-soft sm:p-6"
            >
              <legend className="mb-5 block w-full">
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e4e8ff] text-xs font-bold text-[#5b4bdb]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-bold leading-relaxed text-[#26356b]">
                  {question.text}
                </span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    className={`focus-within:ring-2 focus-within:ring-[#efaa96] flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${answers[index] === optionIndex ? "border-[#5b4bdb] bg-[#edf9f7] text-[#26356b]" : "border-[#e2ecea] text-[#688084] hover:bg-[#fbfdfd]"}`}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={answers[index] === optionIndex}
                      onChange={() =>
                        setAnswers(previous => ({
                          ...previous,
                          [index]: optionIndex,
                        }))
                      }
                      className="mt-0.5 accent-[#5b4bdb]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="sticky bottom-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#cfe0df] bg-white/95 p-4 shadow-lift backdrop-blur sm:flex-row">
            <div className="text-sm text-[#688084]">
              <strong className="text-[#26356b]">
                {Object.keys(answers).length}/10
              </strong>{" "}
              preguntas respondidas
            </div>
            {submitted ? (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white transition hover:bg-[#4036a5]"
              >
                Ver mi ruta <ArrowRight size={17} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={pretest.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white transition hover:bg-[#4036a5] disabled:opacity-60"
              >
                {pretest.isPending ? "Guardando..." : "Guardar pretest"}{" "}
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </form>
        {submitted && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#b8e4d8] bg-[#effbf6] p-5 text-sm text-[#5b4bdb]">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">Has completado tu evaluación inicial</p>
              <p className="mt-1">
                Tu pretest fue guardado como punto de partida. Ahora empieza la
                capacitación; tus resultados son privados y solo verás los
                tuyos.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
