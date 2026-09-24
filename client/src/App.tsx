import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AssistantProvider } from "./contexts/AssistantContext";
import { VoiceAssistant } from "./components/VoiceAssistant";
import Home from "./pages/Home";
import Identification from "./pages/Identification";
import Diagnostic from "./pages/Diagnostic";
import StudentDashboard from "./pages/StudentDashboard";
import ModulePage from "./pages/ModulePage";
import Admin from "./pages/Admin";
import TutorPage from "./pages/TutorPage";
import Postest from "./pages/Postest";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/identificacion" component={Identification} />
      <Route path="/diagnostico" component={Diagnostic} />
      <Route path="/dashboard" component={StudentDashboard} />
      <Route path="/modulo/:id" component={ModulePage} />
      <Route path="/tutor" component={TutorPage} />
      <Route path="/postest" component={Postest} />
      <Route path="/docente" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" />
          <AssistantProvider>
            <Router />
            <VoiceAssistant />
          </AssistantProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
