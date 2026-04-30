import { useCallback, useEffect, useMemo, useState } from "react";

import type { GateType } from "../types";
import { useCircuitStore } from "../store/useCircuitStore";
import { buildQiskitScript, circuitToApiPayload, downloadJson, downloadText } from "../utils/exportCircuit";
import { CIRCUIT_PRESETS, type PresetId } from "../utils/presets";
import { HintBubble } from "./HintBubble";

const TWO_PI = 2 * Math.PI;

function clampAngleRad(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(TWO_PI, Math.max(-TWO_PI, v));
}

function AngleShortcuts({ onPick }: { onPick: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="w-full text-[10px] uppercase tracking-wide text-ds-muted">Shortcuts</span>
      {[
        { label: "π", v: Math.PI },
        { label: "π/2", v: Math.PI / 2 },
        { label: "π/4", v: Math.PI / 4 },
      ].map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onPick(clampAngleRad(s.v))}
          className="rounded-md border border-ds-line bg-ds-card px-2 py-1 text-xs font-mono text-ds-secondary transition-[transform,border-color,background-color,color] duration-200 hover:border-ds-accent hover:text-ds-accent active:scale-95 dark:hover:text-accent-glow"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function CircuitBuilderPanel() {
  const numQubits = useCircuitStore((s) => s.numQubits);
  const gates = useCircuitStore((s) => s.gates);
  const setNumQubits = useCircuitStore((s) => s.setNumQubits);
  const addGate = useCircuitStore((s) => s.addGate);
  const removeGate = useCircuitStore((s) => s.removeGate);
  const undo = useCircuitStore((s) => s.undo);
  const clearGates = useCircuitStore((s) => s.clearGates);
  const loadPreset = useCircuitStore((s) => s.loadPreset);
  const markGateHintSeen = useCircuitStore((s) => s.markGateHintSeen);
  const hasSeenGateHint = useCircuitStore((s) => s.hasSeenGateHint);
  const markCxHintSeen = useCircuitStore((s) => s.markCxHintSeen);
  const hasSeenCxHint = useCircuitStore((s) => s.hasSeenCxHint);

  const [selectedPreset, setSelectedPreset] = useState<"" | PresetId>("");
  const [gateType, setGateType] = useState<GateType>("H");
  const [target, setTarget] = useState(0);
  const [control, setControl] = useState(1);
  const [angle, setAngle] = useState(() => clampAngleRad(Math.PI / 2));
  const setAngleSafe = useCallback((v: number) => setAngle(clampAngleRad(v)), []);

  useEffect(() => {
    if (target >= numQubits) setTarget(numQubits - 1);
    if (control >= numQubits) setControl(Math.max(0, numQubits - 1));
  }, [numQubits, target, control]);

  useEffect(() => {
    if (numQubits < 2 && gateType === "CX") setGateType("H");
  }, [numQubits, gateType]);

  const gateHint = useMemo(() => {
    if (gateType === "H")
      return "Hadamard (H) creates Z-basis superposition by rotating around an axis midway between +X and +Z.";
    if (gateType === "X") return "Pauli‑X flips |0⟩ ↔ |1⟩ (a π rotation about +X on the Bloch sphere).";
    if (gateType === "Y") return "Pauli‑Y is a π rotation about +Y, mixing phases while swapping computational basis components.";
    if (gateType === "Z") return "Pauli‑Z adds a relative phase between |0⟩ and |1⟩ (a π rotation about +Z).";
    if (gateType === "RX")
      return "RX(θ) rotates the Bloch vector about +X by θ radians. Angles are clamped to ±2π.";
    if (gateType === "RZ")
      return "RZ(θ) rotates the phase about +Z by θ radians. Angles are clamped to ±2π.";
    return "Controlled‑NOT flips the target only when the control is |1⟩. Always pick two different qubits.";
  }, [gateType]);

  const handleAdd = () => {
    if (gateType === "CX") {
      if (control === target) return;
      addGate({ type: "CX", control, target });
    } else if (gateType === "RX" || gateType === "RZ") {
      addGate({ type: gateType, target, angle: clampAngleRad(angle) });
    } else {
      addGate({ type: gateType, target });
    }
    setSelectedPreset("");
    markGateHintSeen();
    if (gateType === "CX") markCxHintSeen();
  };

  const handleExportJson = () => {
    downloadJson("circuit.json", circuitToApiPayload(numQubits, gates));
  };

  const handleExportQiskit = () => {
    downloadText("circuit_export.py", buildQiskitScript(numQubits, gates));
  };

  const handlePresetChange = (value: PresetId | "") => {
    setSelectedPreset(value);
    if (!value) return;
    loadPreset(value);
  };

  const selectedPresetInfo = useMemo(
    () => (selectedPreset ? CIRCUIT_PRESETS.find((p) => p.id === selectedPreset) ?? null : null),
    [selectedPreset],
  );

  const formatGateLine = (gate: (typeof gates)[number]) => {
    if (gate.type === "CX") return `CX control=${gate.control} → target=${gate.target}`;
    if (gate.type === "RX" || gate.type === "RZ")
      return `${gate.type}(θ=${gate.angle.toFixed(3)}) @ q${gate.target}`;
    return `${gate.type} @ q${gate.target}`;
  };

  return (
    <section className="glass-card flex flex-col gap-8 p-6 sm:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ds-accent dark:text-cyan-glow">Builder</p>
          <h2 className="text-xl font-semibold text-ds-primary">Circuit controls</h2>
        </div>
        <HintBubble
          pulse={!hasSeenGateHint}
          label="Work in small steps: pick a gate, confirm indices (and angles for RX/RZ), then append. Undo removes the last gate only."
          preferredPlacement="bottom"
        >
          <span className="text-xs text-ds-muted">Quick tips</span>
        </HintBubble>
      </header>

      <div className="panel-inset flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-xs text-ds-secondary">
          Load example circuit
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value as PresetId | "")}
            className="select-field w-full px-3 py-2 text-sm"
          >
            <option value="">Choose preset…</option>
            {CIRCUIT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportJson} className="btn-ghost text-xs sm:text-sm">
            Export circuit JSON
          </button>
          <button type="button" onClick={handleExportQiskit} className="btn-ghost text-xs sm:text-sm">
            Export Qiskit code
          </button>
        </div>
      </div>

      {selectedPresetInfo ? (
        <div className="panel-inset px-4 py-3 text-sm text-ds-secondary">
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted">Preset hint</p>
          <p className="mt-2 leading-relaxed text-ds-secondary">{selectedPresetInfo.description}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <label
          className="flex flex-col gap-2 text-sm text-ds-secondary"
          data-tour="tour-qubits"
        >
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-ds-muted">
            Qubits
            <HintBubble
              label="More qubits increase the state space exponentially (2^n complex amplitudes)."
              preferredPlacement="bottom"
            />
          </span>
          <input
            type="range"
            min={1}
            max={8}
            value={numQubits}
            onChange={(e) => {
              setNumQubits(Number(e.target.value));
              setSelectedPreset("");
            }}
            className="accent-[color:var(--color-accent)]"
          />
          <div className="flex items-center justify-between text-xs text-ds-muted">
            <span>1</span>
            <span className="font-medium text-ds-primary">{numQubits} qubits</span>
            <span>8</span>
          </div>
        </label>

        <div className="panel-inset flex flex-col gap-3 p-4" data-tour="tour-gates">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs uppercase tracking-wide text-ds-muted">Gate</label>
            <HintBubble label={gateHint} preferredPlacement="bottom">
              <span className="text-[11px] text-ds-muted">Why this gate?</span>
            </HintBubble>
          </div>
          <select
            value={gateType}
            onChange={(e) => {
              setGateType(e.target.value as GateType);
              markGateHintSeen();
            }}
            className="select-field px-3 py-2 text-sm"
          >
            <option value="H">Hadamard (H)</option>
            <option value="X">Pauli‑X</option>
            <option value="Y">Pauli‑Y</option>
            <option value="Z">Pauli‑Z</option>
            <option value="RX">Rotation RX(θ)</option>
            <option value="RZ">Rotation RZ(θ)</option>
            <option value="CX" disabled={numQubits < 2}>
              Controlled‑NOT (CX) {numQubits < 2 ? "(needs ≥2 qubits)" : ""}
            </option>
          </select>

          {gateType === "CX" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-ds-secondary">
                <span className="flex items-center gap-2">
                  Control qubit
                  <HintBubble
                    pulse={!hasSeenCxHint}
                    label="The control qubit is not moved by CX. If it is |1⟩, the target picks up an X rotation."
                    preferredPlacement="bottom"
                  >
                    <span className="text-[10px] text-ds-muted">info</span>
                  </HintBubble>
                </span>
                <input
                  type="number"
                  min={0}
                  max={numQubits - 1}
                  value={control}
                  onChange={(e) => setControl(Number(e.target.value))}
                  className="field-input mt-1 w-full"
                />
              </label>
              <label className="text-xs text-ds-secondary">
                Target
                <input
                  type="number"
                  min={0}
                  max={numQubits - 1}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="field-input mt-1 w-full"
                />
              </label>
            </div>
          ) : gateType === "RX" || gateType === "RZ" ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-ds-secondary">
                  Target qubit
                  <input
                    type="number"
                    min={0}
                    max={numQubits - 1}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="field-input mt-1 w-full"
                  />
                </label>
                <label className="text-xs text-ds-secondary">
                  Angle (radians)
                  <input
                    type="number"
                    step={0.1}
                    min={-TWO_PI}
                    max={TWO_PI}
                    value={angle}
                    onChange={(e) => setAngleSafe(Number(e.target.value))}
                    onBlur={() => setAngleSafe(angle)}
                    className="field-input mt-1 w-full"
                  />
                </label>
              </div>
              <AngleShortcuts onPick={setAngleSafe} />
            </div>
          ) : (
            <label className="text-xs text-ds-secondary">
              Target qubit
              <input
                type="number"
                min={0}
                max={numQubits - 1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="field-input mt-1 w-full"
              />
            </label>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={gateType === "CX" && control === target}
            className="btn-accent"
          >
            Add to circuit
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            undo();
            setSelectedPreset("");
          }}
          className="btn-ghost"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            clearGates();
            setSelectedPreset("");
          }}
          className="btn-danger-ghost"
        >
          Clear all
        </button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-ds-muted">Gate list</p>
        <ul className="mt-3 space-y-2">
          {gates.length === 0 ? (
            <li className="rounded-xl border border-dashed border-ds-line px-4 py-6 text-center text-sm text-ds-muted">
              No gates yet — add your first operation or load an example.
            </li>
          ) : (
            gates.map((gate, idx) => (
              <li
                key={gate.id}
                className="flex items-center justify-between rounded-xl border border-ds-line bg-ds-surface px-4 py-3 text-sm"
              >
                <span className="font-mono text-ds-primary">{idx + 1}. {formatGateLine(gate)}</span>
                <button
                  type="button"
                  onClick={() => {
                    removeGate(gate.id);
                    setSelectedPreset("");
                  }}
                  className="text-xs uppercase tracking-wide text-ds-danger transition hover:brightness-110"
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
