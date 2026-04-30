import { CircuitBuilderPanel } from "../components/CircuitBuilderPanel";
import { CircuitVisualization } from "../components/CircuitVisualization";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { OnboardingTour } from "../components/OnboardingTour";
import { SimulationPanel } from "../components/SimulationPanel";
import { TimelineSlider } from "../components/TimelineSlider";
import { useCircuitStore } from "../store/useCircuitStore";

export function SimulationPage() {
  const numQubits = useCircuitStore((s) => s.numQubits);
  const gates = useCircuitStore((s) => s.gates);
  const playbackIndex = useCircuitStore((s) => s.playbackIndex);
  const activeGateIndex = gates.length === 0 || playbackIndex < 0 ? -1 : playbackIndex;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 pointer-events-none">
        <div className="home-aurora h-full w-full opacity-[0.12] dark:opacity-[0.22]" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-20 opacity-[0.88] dark:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--mesh-1),_transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--mesh-2),_transparent_52%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-10 lg:px-8 lg:py-16 xl:max-w-[1400px] 2xl:max-w-[1600px]">
        <header className="w-full space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-ds-accent dark:text-accent-glow">Quantum Circuit Lab</p>
          <h1 className="text-3xl font-semibold text-ds-primary sm:text-4xl lg:text-5xl">Build, visualize, simulate.</h1>
          <p className="text-sm leading-relaxed text-ds-secondary sm:text-base">
            Build circuits in your browser, run them with our FastAPI and Qiskit Aer backend, and inspect both
            measurement counts and the exact quantum state.
          </p>
        </header>

        <ErrorBoundary title="Builder unavailable">
          <CircuitBuilderPanel />
        </ErrorBoundary>

        <ErrorBoundary title="Canvas unavailable">
          <section className="glass-card p-6 sm:p-8" data-tour="tour-canvas">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ds-accent dark:text-cyan-glow">Canvas</p>
                <h2 className="text-xl font-semibold text-ds-primary">Live circuit</h2>
              </div>
              <p className="max-w-xl text-xs leading-relaxed text-ds-secondary sm:text-sm">
                SVG preview mirrors the gate list. Step controls in the simulator panel highlight the active gate with
                smooth transitions.
              </p>
            </div>
            <div className="mt-6">
              <CircuitVisualization numQubits={numQubits} gates={gates} activeGateIndex={activeGateIndex} />
            </div>
          </section>
        </ErrorBoundary>

        <TimelineSlider />

        <ErrorBoundary title="Simulator crashed">
          <SimulationPanel />
        </ErrorBoundary>
      </div>

      <OnboardingTour />
    </div>
  );
}

