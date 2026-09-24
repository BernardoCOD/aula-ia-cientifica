import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  School,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { setStudent } from "@/lib/student";
import { useAssistantScreen } from "@/contexts/AssistantContext";

export default function Identification() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [grade, setGrade] = useState("2.º de secundaria");
  const [section, setSection] = useState("A");
  const [school, setSchool] = useState("");
  const register = trpc.student.register.useMutation();
  useAssistantScreen(
    {
      mode: "learning",
      route: "/identificacion",
      currentContent:
        "Ficha de estudiante. Completa código, grado, sección y colegio opcional para comenzar el diagnóstico.",
    },
    {
      onContinue: () =>
        document.querySelector<HTMLInputElement>("input")?.focus(),
    }
  );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (code.trim().length < 2) {
      toast.error("Escribe un código de estudiante válido.");
      return;
    }
    const session = {
      code: code.trim().toUpperCase(),
      grade,
      section,
      schoolName: school.trim() || undefined,
    };
    setStudent(session);
    try {
      await register.mutateAsync(session);
    } catch {
      /* local persistence keeps the learning flow usable offline */
    }
    toast.success("¡Listo! Comencemos con un breve diagnóstico.");
    navigate("/diagnostico");
  };
  return (
    <div className="min-h-screen mesh-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-[#26356b]"
        >
          <ArrowLeft size={17} /> Volver al inicio
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold text-[#26356b]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#26356b] text-white">
            <Sparkles size={17} />
          </span>
          Aula IA
        </div>
      </header>
      <main
        aria-label="Pantalla de identificación del estudiante"
        data-screen="identificacion"
        className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8 lg:pt-16"
      >
        <div className="float-in">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4e8ff] text-[#5b4bdb]">
            <GraduationCap size={28} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
            Primer paso
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#26356b] sm:text-5xl">
            Identifícate
            <br />
            para comenzar.
          </h1>
          <p className="mt-5 max-w-md leading-relaxed text-[#688084]">
            Solo necesitamos información básica para guardar tu avance. No
            pedimos nombres, correos ni datos personales innecesarios.
          </p>
          <div className="mt-8 space-y-4 text-sm text-[#4b686c]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#e4e8ff] text-[#5b4bdb]">
                <Check size={14} />
              </span>
              <span>Tu código conecta tus resultados con tu progreso.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffe7d6] text-[#b55e3d]">
                <Check size={14} />
              </span>
              <span>
                Podrás continuar desde el celular, tablet o computadora.
              </span>
            </div>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="float-in-delay rounded-[2rem] bg-white p-6 shadow-lift ring-1 ring-[#d8e8e7] sm:p-9"
        >
          <div className="mb-7">
            <p className="text-sm font-bold text-[#26356b]">
              Ficha de estudiante
            </p>
            <p className="mt-1 text-sm text-[#809294]">
              Completa los campos para personalizar tu ruta.
            </p>
          </div>
          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-bold text-[#36575b]">
              Código del estudiante <span className="text-[#e27a4f]">*</span>
            </span>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              placeholder="Ej. ATE-024"
              aria-label="Código del estudiante"
              data-ai-target="student-code-input"
              className="focus-ring w-full rounded-xl border border-[#cfe0df] bg-[#fbfdfd] px-4 py-3.5 text-[#26356b] outline-none transition focus:border-[#5b4bdb]"
            />
            <span className="mt-2 block text-xs text-[#8a9a9b]">
              Usa el código entregado por tu docente.
            </span>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#36575b]">
                Grado
              </span>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="focus-ring w-full rounded-xl border border-[#cfe0df] bg-[#fbfdfd] px-4 py-3.5 text-[#26356b] outline-none"
              >
                <option>1.º de secundaria</option>
                <option>2.º de secundaria</option>
                <option>3.º de secundaria</option>
                <option>4.º de secundaria</option>
                <option>5.º de secundaria</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#36575b]">
                Sección
              </span>
              <select
                value={section}
                onChange={e => setSection(e.target.value)}
                className="focus-ring w-full rounded-xl border border-[#cfe0df] bg-[#fbfdfd] px-4 py-3.5 text-[#26356b] outline-none"
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>D</option>
              </select>
            </label>
          </div>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-[#36575b]">
              Colegio{" "}
              <span className="font-normal text-[#9aa9aa]">(opcional)</span>
            </span>
            <div className="relative">
              <School
                size={18}
                className="absolute left-4 top-4 text-[#8aa0a0]"
              />
              <input
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="Nombre de tu colegio"
                className="focus-ring w-full rounded-xl border border-[#cfe0df] bg-[#fbfdfd] py-3.5 pl-11 pr-4 text-[#26356b] outline-none transition focus:border-[#5b4bdb]"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={register.isPending}
            aria-label="Continuar al diagnóstico"
            data-ai-target="continue-button"
            data-ai-action="submit-identification"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#26356b] px-5 py-4 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#4036a5] disabled:cursor-wait disabled:opacity-70"
          >
            {register.isPending ? "Guardando..." : "Continuar al diagnóstico"}
            <ArrowRight size={18} />
          </button>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#8a9a9b]">
            <BookOpen size={14} /> 10 preguntas · sin calificación inmediata
          </div>
        </form>
      </main>
    </div>
  );
}
