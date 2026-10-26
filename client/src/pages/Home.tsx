import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { useAssistantScreen } from "@/contexts/AssistantContext";

const principles = [
  {
    icon: BrainCircuit,
    title: "Entender",
    text: "Descubre cómo funciona la IA y qué no puede garantizar.",
  },
  {
    icon: ShieldCheck,
    title: "Verificar",
    text: "Aprende a detectar errores, fuentes dudosas y datos que necesitan revisión.",
  },
  {
    icon: FlaskConical,
    title: "Comunicar",
    text: "Convierte tus ideas en explicaciones científicas claras y propias.",
  },
];

export default function Home() {
  useAssistantScreen({
    mode: "learning",
    route: "/",
    currentContent:
      "Página de bienvenida de Aula IA científica. Puedes comenzar la capacitación, ver cómo funciona, revisar los principios o entrar al panel docente.",
  });
  return (
    <div className="min-h-screen mesh-bg grid-paper">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 focus-ring rounded-xl"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#26356b] text-white shadow-soft">
            <Sparkles size={21} />
          </div>
          <div>
            <p className="font-bold tracking-tight text-[#26356b]">Aula IA</p>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#75878a]">
              científica
            </p>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#547074] md:flex">
          <a href="#como-funciona" className="transition hover:text-[#26356b]">
            Cómo funciona
          </a>
          <a href="#principios" className="transition hover:text-[#26356b]">
            Principios
          </a>
          <Link href="/docente" className="transition hover:text-[#26356b]">
            Panel docente
          </Link>
        </nav>
        <Link
          href="/identificacion"
          className="rounded-full border border-[#b9d5d3] bg-white/60 px-4 py-2 text-sm font-bold text-[#26356b] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
        >
          Ingresar
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-10 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-20">
          <div className="float-in">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b9d5d3] bg-white/70 px-3 py-2 text-xs font-bold uppercase tracking-[.13em] text-[#5b4bdb]">
              <span className="pulse-dot h-2 w-2 rounded-full bg-[#e27a4f]" />{" "}
              Capacitación para secundaria
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-bold leading-[1.03] text-[#26356b] sm:text-6xl lg:text-7xl">
              Piensa primero.
              <br />
              <span className="text-[#e27a4f]">Consulta mejor.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#4b686c]">
              Aprende a usar la inteligencia artificial como apoyo para
              comprender, verificar y comunicar ciencia.{" "}
              <strong className="text-[#26356b]">
                Tu criterio siempre está al frente.
              </strong>
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/identificacion"
                className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-[#26356b] px-6 py-4 font-bold text-white shadow-lift transition hover:-translate-y-1 hover:bg-[#4036a5]"
              >
                Comenzar capacitación <ArrowRight size={18} />
              </Link>
              <a
                href="#como-funciona"
                className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-[#b9d5d3] bg-white/70 px-6 py-4 font-bold text-[#26356b] transition hover:bg-white"
              >
                Ver el recorrido <ChevronRight size={18} />
              </a>
            </div>
            <div className="mt-9 flex items-center gap-4 text-sm text-[#688084]">
              <div className="flex -space-x-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#eef6f7] bg-[#d5f0e9] text-xs font-bold text-[#26356b]">
                  1°
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#eef6f7] bg-[#ffe7d6] text-xs font-bold text-[#26356b]">
                  2°
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#eef6f7] bg-[#e7ddff] text-xs font-bold text-[#26356b]">
                  3°
                </span>
              </div>
              <span>Diseñado para estudiantes de secundaria</span>
            </div>
          </div>
          <div className="float-in-delay relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-3 top-16 z-10 rounded-2xl bg-white p-4 shadow-lift sm:-left-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#769094]">
                <Target size={15} className="text-[#e27a4f]" /> Tu brújula
              </div>
              <div className="text-2xl font-bold text-[#26356b]">
                Piensa → Verifica
              </div>
            </div>
            <div className="rounded-[2.5rem] border border-white/70 bg-[#26356b] p-5 shadow-lift sm:p-7">
              <div className="rounded-[2rem] bg-[#eaf7f5] p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#5b4bdb]">
                    RUTA DE APRENDIZAJE
                  </span>
                  <span className="text-sm font-bold text-[#769094]">
                    01 / 06
                  </span>
                </div>
                <h2 className="mt-8 text-3xl font-bold text-[#26356b]">
                  Conociendo
                  <br />
                  la IA
                </h2>
                <p className="mt-3 max-w-xs leading-relaxed text-[#5d7779]">
                  No se trata de tener todas las respuestas. Se trata de hacer
                  mejores preguntas.
                </p>
                <div className="mt-9 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e4e8ff] text-[#5b4bdb]">
                      ✦
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#26356b]">
                        Qué es la IA generativa
                      </p>
                      <p className="text-xs text-[#769094]">
                        Explora el concepto
                      </p>
                    </div>
                    <Check size={18} className="ml-auto text-[#46a48e]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffe7d6] text-[#b55e3d]">
                      ◎
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#26356b]">
                        Mitos y límites
                      </p>
                      <p className="text-xs text-[#769094]">
                        Piensa críticamente
                      </p>
                    </div>
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#e27a4f]" />
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#c9e1de]">
                    <div className="h-full w-[27%] rounded-full bg-[#e27a4f]" />
                  </div>
                  <span className="text-xs font-bold text-[#26356b]">27%</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-2 rounded-2xl border border-[#f4cfc2] bg-[#fff6f1] px-4 py-3 text-sm font-bold text-[#9b4b34] shadow-soft sm:-right-7">
              <span className="mr-2">✦</span>Aprender es construir tu propia voz
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"
        >
          <div className="rounded-[2rem] bg-white/70 p-6 shadow-soft ring-1 ring-[#d8e8e7] sm:p-10">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
                  Una ruta, no un atajo
                </p>
                <h2 className="mt-2 text-3xl font-bold text-[#26356b] sm:text-4xl">
                  Tu aprendizaje paso a paso
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-[#688084]">
                Cada módulo te propone comprender antes de responder. Avanzas
                con retos cortos y evidencias de tu progreso.
              </p>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {principles.map(({ icon: Icon, title, text }, index) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[#dce9e7] bg-[#f8fcfb] p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4e8ff] text-[#5b4bdb]">
                      <Icon size={21} />
                    </div>
                    <span className="font-mono text-sm font-bold text-[#a7b9b8]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#26356b]">
                    {title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-[#688084]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          id="principios"
          className="border-t border-[#d8e8e7] bg-[#26356b] px-5 py-14 text-white lg:px-8"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.16em] text-[#b9b7ff]">
                La idea central
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
                La IA te acompaña.
                <br />
                <span className="text-[#f4a67d]">Tu voz comunica.</span>
              </h2>
            </div>
            <Link
              href="/identificacion"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#e27a4f] px-6 py-4 font-bold text-[#26356b] transition hover:bg-[#f4a67d]"
            >
              Empezar ahora <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-[#688084] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© 2026 Aula IA Científica · Educación con criterio</p>
        <p>
          Una herramienta de capacitación, no un reemplazo de tu pensamiento.
        </p>
      </footer>
    </div>
  );
}
