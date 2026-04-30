import { useMemo } from "react";

import { useCircuitStore, playbackStatevector } from "../store/useCircuitStore";
import { HintBubble } from "./HintBubble";
import { StepControls } from "./StepControls";

const STATEVECTOR_TOP_K = 16;

export function SimulationPanel() {
  const numQubits = useCircuitStore((s) => s.numQubits);
  const gates = useCircuitStore((s) => s.gates);
  const shots = useCircuitStore((s) => s.shots);
  const setShots = useCircuitStore((s) => s.setShots);
  const runSimulation = useCircuitStore((s) => s.runSimulation);
  const loading = useCircuitStore((s) => s.loading);
  const error = useCircuitStore((s) => s.error);
  const lastResponse = useCircuitStore((s) => s.lastResponse);
  const playbackIndex = useCircuitStore((s) => s.playbackIndex);
  const markResultsHintSeen = useCircuitStore((s) => s.markResultsHintSeen);
  const hasSeenResultsHint = useCircuitStore((s) => s.hasSeenResultsHint);

  const statePreview = playbackStatevector(numQubits, gates, lastResponse, playbackIndex);
  const counts = lastResponse?.measurement_counts ?? {};
  const preview = Array.isArray(statePreview) ? statePreview : [];
  const steps = Array.isArray(lastResponse?.step_states) ? lastResponse.step_states : [];

  const countsSorted = useMemo(() => {
    return Object.entries(counts || {}).sort((a, b) => b[1] - a[1]);
  }, [counts]);
  const derived = useMemo(() => {
    try {
      const safeCountsSorted = (Array.isArray(countsSorted) ? countsSorted : []).sort((a, b) => b[1] - a[1]);
      const safePreviewRows = (Array.isArray(preview) ? preview : []).map((amp, index) => ({
        index,
        state: index.toString(2).padStart(numQubits, "0"),
        amplitudeText: `${amp.real.toFixed(3)} + ${amp.imag.toFixed(3)}i`,
        probability: amp.real * amp.real + amp.imag * amp.imag,
      }));
      const sorted = [...safePreviewRows].sort((a, b) => b.probability - a.probability);
      const top = sorted.slice(0, STATEVECTOR_TOP_K);
      const safeDisplayRows = top.length > 0 ? top : safePreviewRows;
      return {
        maxCount: safeCountsSorted[0]?.[1] ?? 1,
        totalCounts: safeCountsSorted.reduce((acc, [, c]) => acc + c, 0) || 1,
        hasStepData: (Array.isArray(steps) ? steps : []).length > 0,
        previewRows: safePreviewRows,
        displayPreviewRows: safeDisplayRows,
        truncated: safePreviewRows.length > STATEVECTOR_TOP_K,
        deriveError: null as string | null,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return {
        maxCount: 1,
        totalCounts: 1,
        hasStepData: false,
        previewRows: [] as Array<{ index: number; state: string; amplitudeText: string; probability: number }>,
        displayPreviewRows: [] as Array<{ index: number; state: string; amplitudeText: string; probability: number }>,
        truncated: false,
        deriveError: "Failed to derive simulation preview data.",
      };
    }
  }, [countsSorted, numQubits, preview, steps]);

  const handleRun = async () => {
    try {
      await runSimulation();
    } catch {
      /* runSimulation already records error state */
    }
    markResultsHintSeen();
  };

  const diagramText =
    lastResponse && typeof lastResponse.circuit_diagram === "string" ? lastResponse.circuit_diagram : "";

  return (
    <section className="glass-card flex flex-col gap-8 p-6 sm:p-8">
      <header
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        data-tour="tour-run"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ds-accent dark:text-cyan-glow">Simulator</p>
          <h2 className="text-xl font-semibold text-ds-primary">Run & inspect</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-ds-secondary">
            <span>Shots</span>
            <input
              type="number"
              min={1}
              max={100000}
              value={shots}
              onChange={(e) => setShots(Number(e.target.value))}
              className="field-input w-24 py-1.5"
            />
          </label>
          <button type="button" onClick={handleRun} disabled={loading} className="btn-cyan">
            {loading ? "Running…" : "Run circuit"}
          </button>
        </div>
      </header>

      <StepControls />

      <div className="flex flex-col gap-8" data-tour="tour-results">
      {loading ? (
        <div className="rounded-xl border border-ds-line bg-ds-surface px-4 py-3 text-sm text-ds-secondary">
          <p className="font-semibold text-ds-primary">Running simulation...</p>
          <p className="mt-1 text-xs">Waking up server...</p>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-ds-danger-border bg-ds-danger-bg px-4 py-3 text-sm">
          <p className="font-semibold text-ds-danger">Something went wrong. Try again.</p>
          <p className="mt-1 text-xs text-ds-danger">{error}</p>
        </div>
      ) : null}

      {derived.deriveError ? (
        <div className="rounded-xl border border-ds-danger-border bg-ds-danger-bg px-4 py-3 text-sm text-ds-danger">
          {derived.deriveError}
        </div>
      ) : null}

      {!error && preview.length === 0 && countsSorted.length === 0 && !diagramText && !derived.hasStepData ? (
        <div className="rounded-xl border border-ds-line bg-ds-surface px-4 py-3 text-sm text-ds-secondary">
          No simulation data available. Try running again.
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ds-primary">Measurement counts</p>
            <HintBubble
              pulse={!hasSeenResultsHint}
              label="Each bar is how often that bitstring appeared across shots. Tall bars mean high probability for that classical outcome."
              preferredPlacement="bottom"
            >
              <span className="text-[11px] text-ds-muted">Probabilities</span>
            </HintBubble>
          </div>
          {countsSorted.length === 0 ? (
            <p className="text-sm text-ds-muted">Run the circuit to populate counts.</p>
          ) : (
            <ul className="space-y-3">
              {(Array.isArray(countsSorted) ? countsSorted : []).map(([bitstring, count]) => (
                <li key={bitstring}>
                  <div className="flex items-center justify-between text-xs text-ds-secondary">
                    <span className="font-mono text-ds-primary">|{bitstring}⟩</span>
                    <span>
                      {count} ({((count / derived.totalCounts) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-ds-line">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-glow transition-all duration-200"
                      style={{ width: `${Math.max(6, (count / derived.maxCount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-ds-primary">Statevector preview</p>
            <span className="text-xs text-ds-muted">
              {playbackIndex < 0 ? "Initial |0…0⟩" : `After gate ${playbackIndex + 1}`}
            </span>
          </div>
          {derived.truncated ? (
            <p className="rounded-lg border border-ds-line bg-ds-warn-bg px-2 py-1.5 text-xs font-medium text-ds-warn-text">
              Showing most probable states (top {STATEVECTOR_TOP_K})
            </p>
          ) : null}
          {derived.previewRows.length === 0 ? (
            <p className="text-sm text-ds-muted">
              No statevector available. Ensure circuit is valid and simulation ran correctly.
            </p>
          ) : (
            <div className="panel-inset max-h-64 overflow-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-ds-line bg-ds-surface text-ds-secondary backdrop-blur-sm">
                  <tr>
                    <th className="px-3 py-2 font-medium">Index</th>
                    <th className="px-3 py-2 font-medium">State</th>
                    <th className="px-3 py-2 font-medium">Amplitude</th>
                    <th className="px-3 py-2 font-medium">Prob (norm)</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(derived.displayPreviewRows) ? derived.displayPreviewRows : []).map((row) => (
                    <tr
                      key={row.index}
                      className="border-t border-ds-line text-ds-primary first:border-t-0"
                    >
                      <td className="px-3 py-1.5 font-mono text-ds-muted">{row.index}</td>
                      <td className="px-3 py-1.5 font-mono">{row.state}</td>
                      <td className="px-3 py-1.5 font-mono text-ds-accent dark:text-accent-glow">
                        {row.amplitudeText}
                      </td>
                      <td className="px-3 py-1.5">{(row.probability * 100).toFixed(4)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-ds-primary">Qiskit text diagram</p>
        {!lastResponse || !diagramText ? (
          <p className="mt-2 text-sm text-ds-muted">Diagram appears after a successful run.</p>
        ) : (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl border border-ds-line bg-ds-code-bg p-4 font-mono text-[11px] leading-relaxed text-ds-code-text">
            {diagramText}
          </pre>
        )}
      </div>
      </div>
    </section>
  );
}
