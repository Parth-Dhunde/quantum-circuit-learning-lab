export type GateType = "H" | "X" | "Y" | "Z" | "CX" | "RX" | "RZ";

export type Gate =
  | { id: string; type: "H" | "X" | "Y" | "Z"; target: number }
  | { id: string; type: "CX"; control: number; target: number }
  | { id: string; type: "RX" | "RZ"; target: number; angle: number };

export type ComplexAmp = { real: number; imag: number };

export type StepState = {
  after_gate_index: number;
  statevector: ComplexAmp[];
};

export type RunCircuitResponse = {
  measurement_counts: Record<string, number>;
  statevector: ComplexAmp[];
  circuit_diagram: string;
  step_states: StepState[];
  error?: string;
};

export type PlaybackSpeed = "slow" | "normal" | "fast";
