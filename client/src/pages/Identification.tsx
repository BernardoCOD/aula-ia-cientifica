import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { setStudent } from "@/lib/student";
import { useAssistantScreen } from "@/contexts/AssistantContext";
import { normalizeParticipantCode } from "@shared/participant";

export default function Identification() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  // Lo dictado ("pe cero uno") se muestra como quedará guardado ("P01").
  const normalized = normalizeParticipantCode(code);
  const register = trpc.student.register.useMutation();
  useAssistantScreen(
    {
      mode: "learning",
      route: "/identificacion",
      currentContent:
        "Ingreso del participante. Crea o di tu código de participante, por ejemplo P cero uno. Si ya participaste antes, usa el mismo código para continuar donde te quedaste. No se piden nombres ni datos personales.",
    },
    {
      onContinue: () =>
        document.querySelector<HTMLInputElement>("input")?.focus(),
    }
  );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!normalized) {
      toast.error(
        "Escribe o di un código de 2 a 32 letras o números, por ejemplo P01."
      );
      return;
    }
    setCode(normalized);
    setStudent({ code: normalized });
    let result: { returning: boolean; pretestDone: boolean } | undefined;
    try {
      result = await register.mutateAsync({ code: normalized });
    } catch {
      /* el avance se guarda también en este dispositivo: el recorrido sigue sin conexión */
    }
    if (result?.returning && result.pretestDone) {
      toast.success(`¡Qué bueno verte de nuevo, ${normalized}! Continúa con tu ruta.`);
      navigate("/dashboard");
      return;
    }
    toast.success(
      result?.returning
        ? `¡Qué bueno verte de nuevo, ${normalized}! Comencemos con el diagnóstico.`
        : `Listo, tu código es ${normalized}. Comencemos con un breve diagnóstico.`
    );
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
        aria-label="Pantalla de ingreso del participante"
        data-screen="identificacion"
        className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8 lg:pt-16"
      >
        <div className="float-in">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4e8ff] text-[#5b4bdb]">
            <KeyRound size={28} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
            Primer paso
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#26356b] sm:text-5xl">
            Ingresa con
            <br />
            tu código.
          </h1>
          <p className="mt-5 max-w-md leading-relaxed text-[#688084]">
            Solo necesitas un código para guardar tu avance. No pedimos
            nombres, correos ni datos personales.
          </p>
          <div className="mt-8 space-y-4 text-sm text-[#4b686c]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#e4e8ff] text-[#5b4bdb]">
                <Check size={14} />
              </span>
              <span>
                Crea tu código, por ejemplo P01. Puedes decirlo: "pe cero uno".
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffe7d6] text-[#b55e3d]">
                <Check size={14} />
              </span>
              <span>
                Si ya participaste antes, usa el mismo código para continuar.
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
              Ingreso del participante
            </p>
            <p className="mt-1 text-sm text-[#809294]">
              Es lo único que necesitas para entrar y retomar tu avance.
            </p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#36575b]">
              Código de participante <span className="text-[#e27a4f]">*</span>
            </span>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              onBlur={() => normalized && setCode(normalized)}
              required
              autoComplete="off"
              placeholder="Ej. P01"
              aria-label="Código de participante"
              aria-describedby="participant-code-help"
              data-ai-target="student-code-input"
              className="focus-ring w-full rounded-xl border border-[#cfe0df] bg-[#fbfdfd] px-4 py-3.5 text-[#26356b] outline-none transition focus:border-[#5b4bdb]"
            />
            <span
              id="participant-code-help"
              aria-live="polite"
              className="mt-2 block text-xs text-[#8a9a9b]"
            >
              {code.trim() && normalized && normalized !== code.trim()
                ? `Se guardará como ${normalized}.`
                : "Letras y números, sin espacios. Ejemplo: P01."}
            </span>
          </label>
          <button
            type="submit"
            disabled={register.isPending}
            aria-label="Ingresar"
            data-ai-target="continue-button"
            data-ai-action="submit-identification"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#26356b] px-5 py-4 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#4036a5] disabled:cursor-wait disabled:opacity-70"
          >
            {register.isPending ? "Guardando..." : "Ingresar"}
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
