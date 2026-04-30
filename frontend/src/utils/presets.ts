import type { Gate } from "../types";

export type PresetId =
  | "bell"
  | "ghz"
  | "superposition"
  | "quantum_not"
  | "hadamard_interference"
  | "phase_demo";

export type PresetDefinition = {
  id: PresetId;
  name: string;
  description: string;
  numQubits: number;
  /** Gates without `id` (assigned when loading). */
  gates: Omit<Gate, "id">[];
};

export const CIRCUIT_PRESETS: PresetDefinition[] = [
  {
    id: "bell",
    name: "Bell State (Entanglement Demo)",
    description: "Creates entanglement. Measuring one qubit strongly correlates the other.",
    numQubits: 2,
    gates: [{ type: "H", target: 0 }, { type: "CX", control: 0, target: 1 }],
  },
  {
    id: "ghz",
    name: "GHZ State",
    description: "Three-qubit entanglement: |000⟩ + |111⟩ (up to phase).",
    numQubits: 3,
    gates: [
      { type: "H", target: 0 },
      { type: "CX", control: 0, target: 1 },
      { type: "CX", control: 0, target: 2 },
    ],
  },
  {
    id: "superposition",
    name: "Superposition Demo",
    description: "Places each qubit into an equal superposition with H.",
    numQubits: 2,
    gates: [{ type: "H", target: 0 }, { type: "H", target: 1 }],
  },
  {
    id: "quantum_not",
    name: "Quantum NOT",
    description: "Applies X to flip |0⟩ ↔ |1⟩.",
    numQubits: 1,
    gates: [{ type: "X", target: 0 }],
  },
  {
    id: "hadamard_interference",
    name: "Hadamard Interference",
    description: "H followed by H returns |0⟩ (constructive/destructive interference).",
    numQubits: 1,
    gates: [{ type: "H", target: 0 }, { type: "H", target: 0 }],
  },
  {
    id: "phase_demo",
    name: "Phase Demo",
    description: "H → Z → H turns a phase flip into a bit flip (shows relative phase effects).",
    numQubits: 1,
    gates: [{ type: "H", target: 0 }, { type: "Z", target: 0 }, { type: "H", target: 0 }],
  },
];
