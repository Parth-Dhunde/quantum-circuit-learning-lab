import { useEffect, useMemo, useRef, useState } from "react";

import type { Gate } from "../types";
import type { DemoCircuit } from "../data/learningModules";
import { CircuitVisualization } from "./CircuitVisualization";
import { playbackStatevector, useCircuitStore } from "../store/useCircuitStore";

type Props = {
  demoCircuit: DemoCircuit;
  stepHints?: string[];
  keyInsight?: string;
  /** Autoplay step playback after simulation finishes. */
  autoPlay?: boolean;
};

type Snapshot = Pick<
  ReturnType<typeof useCircuitStore.getState>,
  "numQubits" | "gates" | "shots" | "lastResponse" | "error" | "playbackIndex" | "isPlaying" | "selectedPresetId"
>;

const uid = () => crypto.randomUUID();

function demoToGates(gates: DemoCircuit["gates"]): Gate[] {
  return (Array.isArray(gates) ? gates : []).map((g) => ({ ...g, id: uid() }) as Gate);
}

function formatAmp(amp: { real: number; imag: number }): string {
  const r = Math.abs(amp.real) < 1e-10 ? 0 : amp.real;
  const i = Math.abs(amp.imag) < 1e-10 ? 0 : amp.imag;
  return `${r.toFixed(3)} ${i >= 0 ? "+" : "−"} ${Math.abs(i).toFixed(3)}i`;
}

function getPlaybackInterval(speed: "slow" | "normal" | "fast"): number {
  if (speed === "slow") return 1200;
  if (speed === "fast") return 380;
  return 750;
}

function PlaceholderOverlay({ message }: { message: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      <div className="rounded-xl border border-ds-line bg-ds-card/90 px-5 py-3 text-sm text-ds-secondary shadow-card backdrop-blur-md transition-opacity duration-300 opacity-100">
        {message}
      </div>
    </div>
  );
}

export function ModuleDemoPlayer({
  demoCircuit,
  stepHints,
  keyInsight,
  autoPlay = false,
}: Props) {
  const snapshotRef = useRef<Snapshot | null>(null);
  const requestIdRef = useRef(0);
  const [hasStarted, setHasStarted] = useState(false);

  const numQubits = useCircuitStore((s) => s.numQubits);
  const gates = useCircuitStore((s) => s.gates);
  const loading = useCircuitStore((s) => s.loading);
  const error = useCircuitStore((s) => s.error);
  const lastResponse = useCircuitStore((s) => s.lastResponse);
  const playbackIndex = useCircuitStore((s) => s.playbackIndex);
  const isPlaying = useCircuitStore((s) => s.isPlaying);
  const [playbackSpeed, setPlaybackSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const runSimulation = useCircuitStore((s) => s.runSimulation);
  const togglePlay = useCircuitStore((s) => s.togglePlay);
  const stopPlay = useCircuitStore((s) => s.stopPlay);
  const setPlaybackIndex = useCircuitStore((s) => s.setPlaybackIndex);

  const activeGateIndex = gates.length === 0 || playbackIndex < 0 ? -1 : playbackIndex;
  const preview = playbackStatevector(numQubits, gates, lastResponse, playbackIndex) ?? [];
  const hasStepStates = Array.isArray(lastResponse?.step_states) && lastResponse.step_states.length > 0;
  const intervalMs = getPlaybackInterval(playbackSpeed);
  const atLastStep = gates.length > 0 && playbackIndex >= gates.length - 1 && !isPlaying;
  const hasRunDemo = lastResponse !== null;
  const showOverlay = !hasStarted;
  const isZeroGateModule = demoCircuit.gates.length === 0;
  const stepHintIndex = playbackIndex < 0 ? 0 : playbackIndex + 1;
  const currentStepHint =
    (Array.isArray(stepHints) && stepHints[stepHintIndex]) ||
    (Array.isArray(stepHints) && stepHints[stepHints.length - 1]) ||
    "Follow the highlighted gate to track how the state changes each step.";

  const previewRows = useMemo(() => {
    const safe = Array.isArray(preview) ? preview : [];
    const rows = safe.map((amp, index) => ({
      index,
      state: index.toString(2).padStart(numQubits, "0"),
      prob: amp.real * amp.real + amp.imag * amp.imag,
      ampText: formatAmp(amp),
    }));
    return rows.sort((a, b) => b.prob - a.prob).slice(0, 6);
  }, [numQubits, preview]);

  useEffect(() => {
    const snap: Snapshot = useCircuitStore.getState();
    snapshotRef.current = snap;
    return () => {
      const snapshot = snapshotRef.current;
      if (!snapshot) return;
      useCircuitStore.setState({
        numQubits: snapshot.numQubits,
        gates: snapshot.gates,
        shots: snapshot.shots,
        lastResponse: snapshot.lastResponse,
        error: snapshot.error,
        playbackIndex: snapshot.playbackIndex,
        isPlaying: snapshot.isPlaying,
        selectedPresetId: snapshot.selectedPresetId,
        loading: false,
      });
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setHasStarted(false);
    useCircuitStore.setState({
      numQubits: Math.max(1, Math.floor(demoCircuit.numQubits)),
      gates: demoToGates(demoCircuit.gates),
      shots: 1000,
      lastResponse: null,
      error: null,
      selectedPresetId: null,
      playbackIndex: -1,
      isPlaying: false,
      loading: false,
    });

    return () => {
      if (requestIdRef.current === requestId) {
        useCircuitStore.setState({ isPlaying: false });
      }
    };
  }, [demoCircuit.gates, demoCircuit.numQubits]);

  useEffect(() => {
    if (!isPlaying || gates.length === 0) return undefined;

    const interval = window.setInterval(() => {
      useCircuitStore.setState((state) => {
        if (!state.isPlaying || state.gates.length === 0) return {};
        const lastStepIndex = state.gates.length - 1;
        if (state.playbackIndex >= lastStepIndex) {
          return { isPlaying: false };
        }
        return { playbackIndex: state.playbackIndex + 1 };
      });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [gates.length, intervalMs, isPlaying]);

  const onRestart = () => {
    stopPlay();
    setPlaybackIndex(-1);
    if (gates.length > 0) {
      useCircuitStore.setState({ isPlaying: true });
    }
  };

  const runDemoFromPlay = async () => {
    const requestId = ++requestIdRef.current;
    setHasStarted(true);
    useCircuitStore.setState({
      numQubits: Math.max(1, Math.floor(demoCircuit.numQubits)),
      gates: demoToGates(demoCircuit.gates),
      shots: 1000,
      lastResponse: null,
      error: null,
      selectedPresetId: null,
      playbackIndex: -1,
      isPlaying: false,
      loading: false,
    });

    await runSimulation();
    if (requestIdRef.current !== requestId) return;
    useCircuitStore.setState({ playbackIndex: -1 });
    window.setTimeout(() => {
      if (requestIdRef.current !== requestId) return;
      if (useCircuitStore.getState().gates.length > 0 || autoPlay) {
        useCircuitStore.setState({ isPlaying: true });
      }
    }, 260);
  };

  return (
    <section className="glass-card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-ds-muted">Demo</p>
          <p className="truncate text-sm font-semibold text-ds-primary">View-only simulation</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setHasStarted(true);
              if (isPlaying) {
                stopPlay();
                return;
              }
              if (!hasRunDemo || playbackIndex >= gates.length - 1) {
                void runDemoFromPlay();
                return;
              }
              togglePlay();
            }}
            disabled={loading}
            className="btn-play px-3 py-1.5 text-xs disabled:opacity-40"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(e.target.value as "slow" | "normal" | "fast")}
            className="field-input py-1.5 text-sm"
            aria-label="Demo playback speed"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
          <button type="button" onClick={onRestart} className="btn-ghost px-3 py-1.5 text-xs">
            Restart
          </button>
        </div>
      </div>

      <div className="panel-inset relative overflow-hidden">
        <div className={showOverlay ? "pointer-events-none blur-sm transition-[filter] duration-300" : "transition-[filter] duration-300"}>
          <CircuitVisualization numQubits={numQubits} gates={gates} activeGateIndex={activeGateIndex} demoMode />
        </div>
        {showOverlay ? <PlaceholderOverlay message="Click Play to see how this concept works" /> : null}
      </div>
      {!showOverlay && isZeroGateModule ? (
        <p className="text-center text-xs text-ds-secondary">This is the initial quantum state |0⟩.</p>
      ) : null}
      {atLastStep ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setPlaybackIndex(-1);
              useCircuitStore.setState({ isPlaying: true });
            }}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            Replay Demo
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-inset p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted">State preview</p>
            <p className="text-[11px] text-ds-secondary">
              {playbackIndex < 0 ? "Initial |0…0⟩" : `After gate ${playbackIndex + 1}/${gates.length}`}
            </p>
          </div>
          {!hasRunDemo ? (
            <p className="mt-3 text-sm text-ds-muted">
              {isZeroGateModule ? "This demo shows the initial quantum state." : "Click Play to see how this concept works."}
            </p>
          ) : previewRows.length === 0 ? (
            <p className="mt-3 text-sm text-ds-muted">{loading ? "Running simulation…" : "No preview available."}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {previewRows.map((row) => (
                <li key={row.index} className="flex items-center justify-between gap-4">
                  <span className="font-mono text-ds-primary">|{row.state}⟩</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="hidden font-mono text-ds-secondary sm:inline">{row.ampText}</span>
                    <span className="w-16 text-right text-ds-muted">{(row.prob * 100).toFixed(1)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-inset p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted">Step hint</p>
          <p key={stepHintIndex} className="mt-2 text-sm leading-relaxed text-ds-secondary transition-opacity duration-200">
            {error ? (
              <span className="text-ds-danger">Simulation error: {error}</span>
            ) : (
              currentStepHint
            )}
          </p>
          {!hasStepStates && gates.length > 0 ? (
            <p className="mt-2 text-[11px] text-ds-muted">
              Step states unavailable; showing gate-by-gate fallback animation using highlighted gates.
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-ds-muted">
            Tip: The circuit is locked in this view so you can focus on the concept.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-ds-accent/40 bg-ds-surface px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ds-accent">Key insight</p>
        <p className="mt-1 text-sm leading-relaxed text-ds-primary">
          {keyInsight ?? "Watch how each gate transforms amplitudes and final probabilities."}
        </p>
      </div>
    </section>
  );
}

