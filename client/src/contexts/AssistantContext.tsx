import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type {
  AssistantHandlers,
  AssistantScreenContext,
} from "@/lib/voiceIntents";

type AssistantContextValue = {
  screenContext: AssistantScreenContext;
  handlersRef: MutableRefObject<AssistantHandlers>;
  publishScreen: (
    context: AssistantScreenContext,
    handlers?: AssistantHandlers
  ) => void;
};

const defaultContext: AssistantScreenContext = { mode: "learning" };

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [screenContext, setScreenContext] =
    useState<AssistantScreenContext>(defaultContext);
  const handlersRef = useRef<AssistantHandlers>({});

  const publishScreen = useCallback(
    (context: AssistantScreenContext, handlers?: AssistantHandlers) => {
      setScreenContext(context);
      handlersRef.current = handlers ?? {};
    },
    []
  );

  return (
    <AssistantContext.Provider
      value={{ screenContext, handlersRef, publishScreen }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistantContext() {
  const context = useContext(AssistantContext);
  if (!context)
    throw new Error(
      "useAssistantContext debe usarse dentro de AssistantProvider"
    );
  return context;
}

/**
 * Hook que usa cada página para declarar al asistente de voz qué hay en pantalla:
 * modo (aprendizaje o evaluación), módulo actual, contenido a leer, pregunta/alternativas
 * vigentes, y manejadores opcionales para "siguiente", "anterior" o "seleccionar opción".
 * Se limpia automáticamente al desmontar la pantalla.
 */
export function useAssistantScreen(
  context: AssistantScreenContext,
  handlers?: AssistantHandlers
) {
  const { publishScreen } = useAssistantContext();
  const contextKey = JSON.stringify(context);
  useEffect(() => {
    publishScreen(context, handlers);
    return () => publishScreen(defaultContext, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);
}
