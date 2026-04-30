import type { ComplexAmp, RunCircuitResponse, StepState } from "../types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isComplexAmp(x: unknown): x is ComplexAmp {
  if (!isRecord(x)) return false;
  return (
    typeof x.real === "number" &&
    typeof x.imag === "number" &&
    Number.isFinite(x.real) &&
    Number.isFinite(x.imag)
  );
}

function isComplexTuple(x: unknown): x is [number, number] {
  if (!Array.isArray(x) || x.length !== 2) return false;
  const [re, im] = x;
  return (
    typeof re === "number" &&
    typeof im === "number" &&
    Number.isFinite(re) &&
    Number.isFinite(im)
  );
}

function isStepState(x: unknown): x is StepState {
  if (!isRecord(x)) return false;
  if (typeof x.after_gate_index !== "number" || !Number.isFinite(x.after_gate_index)) return false;
  if (!Array.isArray(x.statevector) || !x.statevector.every((a) => isComplexAmp(a) || isComplexTuple(a))) return false;
  return true;
}

/** Validates API JSON so UI never assumes fields exist. */
export function parseRunCircuitResponse(data: unknown): RunCircuitResponse {
  if (!isRecord(data)) {
    throw new Error("Invalid response: expected a JSON object.");
  }
  const allowedKeys = new Set(["measurement_counts", "statevector", "circuit_diagram", "step_states", "error"]);
  for (const k of Object.keys(data)) {
    if (!allowedKeys.has(k)) {
      throw new Error(`Invalid response: unexpected field ${JSON.stringify(k)}.`);
    }
  }

  const countsRaw = data.measurement_counts;
  if (!isRecord(countsRaw)) {
    throw new Error("Invalid response: missing or invalid measurement_counts.");
  }
  const measurement_counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(countsRaw)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
      throw new Error(`Invalid response: bad count for key ${JSON.stringify(k)}.`);
    }
    measurement_counts[k] = v;
  }

  if (!Array.isArray(data.statevector) || !data.statevector.every(isComplexTuple)) {
    throw new Error("Invalid response: statevector must be an array of [real, imag].");
  }
  const statevector: ComplexAmp[] = data.statevector.map(([real, imag]) => ({ real, imag }));

  if (typeof data.circuit_diagram !== "string") {
    throw new TypeError("Invalid response: circuit_diagram must be a string.");
  }
  if (data.circuit_diagram.trim().length === 0) {
    throw new Error("Invalid response: circuit_diagram must be non-empty.");
  }

  let step_states: StepState[] = [];
  if (data.step_states != null) {
    if (!Array.isArray(data.step_states) || !data.step_states.every(isStepState)) {
      throw new Error("Invalid response: step_states must be an array of step objects.");
    }
    // Ensure step indices are consistent and increasing.
    for (let i = 0; i < data.step_states.length; i++) {
      const s = data.step_states[i]!;
      if (s.after_gate_index !== i) {
        throw new Error("Invalid response: step_states indices do not match gate order.");
      }
    }
    step_states = data.step_states.map((s) => ({
      after_gate_index: s.after_gate_index,
      statevector: (Array.isArray(s.statevector) ? s.statevector : []).map((amp) =>
        Array.isArray(amp) ? { real: amp[0]!, imag: amp[1]! } : amp,
      ),
    }));
  }

  return {
    measurement_counts,
    statevector,
    circuit_diagram: data.circuit_diagram,
    step_states,
    error: typeof data.error === "string" ? data.error : undefined,
  };
}
