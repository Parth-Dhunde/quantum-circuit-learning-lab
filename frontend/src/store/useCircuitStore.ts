import { create } from "zustand";

import { runCircuitApi } from "../api/client";
import type { ComplexAmp, Gate, PlaybackSpeed, RunCircuitResponse } from "../types";
import type { PresetId } from "../utils/presets";
import { CIRCUIT_PRESETS } from "../utils/presets";

const uid = () => crypto.randomUUID();

type CircuitState = {
  numQubits: number;
  gates: Gate[];
  shots: number;
  lastResponse: RunCircuitResponse | null;
  loading: boolean;
  error: string | null;
  /** Preset used to build the current gate list; cleared when the user edits the circuit manually. */
  selectedPresetId: PresetId | null;
  /** -1 = before any gate (|0…0⟩), 0..n-1 = after gate k (highlight gate k) */
  playbackIndex: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  hasSeenGateHint: boolean;
  hasSeenCxHint: boolean;
  hasSeenResultsHint: boolean;
  setNumQubits: (n: number) => void;
  setShots: (s: number) => void;
  setPlaybackSpeed: (s: PlaybackSpeed) => void;
  loadPreset: (id: PresetId) => void;
  addGate: (g: Omit<Gate, "id">) => void;
  removeGate: (id: string) => void;
  undo: () => void;
  clearGates: () => void;
  runSimulation: () => Promise<void>;
  setPlaybackIndex: (i: number) => void;
  stepPrev: () => void;
  stepNext: () => void;
  togglePlay: () => void;
  stopPlay: () => void;
  clearPresetSelection: () => void;
  markGateHintSeen: () => void;
  markCxHintSeen: () => void;
  markResultsHintSeen: () => void;
  resetForLogout: () => void;
};

const initialZeroState = (numQubits: number): ComplexAmp[] => {
  const dim = 2 ** numQubits;
  return Array.from({ length: dim }, (_, i) =>
    i === 0 ? { real: 1, imag: 0 } : { real: 0, imag: 0 },
  );
};

const MAX_SIM_GATES = 160;

export const useCircuitStore = create<CircuitState>((set, get) => ({
  numQubits: 2,
  gates: [],
  shots: 1000,
  lastResponse: null,
  loading: false,
  error: null,
  selectedPresetId: null,
  playbackIndex: -1,
  isPlaying: false,
  playbackSpeed: "normal",
  hasSeenGateHint: false,
  hasSeenCxHint: false,
  hasSeenResultsHint: false,

  setNumQubits: (n) => {
    const clamped = Math.min(8, Math.max(1, Math.floor(n)));
    set({ numQubits: clamped, selectedPresetId: null });
  },

  setShots: (s) => set({ shots: Math.min(100_000, Math.max(1, Math.floor(s))) }),

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  loadPreset: (id) => {
    const preset = CIRCUIT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const gates: Gate[] = preset.gates.map((g) => ({ ...g, id: uid() }));
    set({
      numQubits: preset.numQubits,
      gates,
      lastResponse: null,
      error: null,
      selectedPresetId: id,
      playbackIndex: -1,
      isPlaying: false,
    });
  },

  addGate: (g) => {
    const gate = { ...g, id: uid() } as Gate;
    set((state) => ({ gates: [...state.gates, gate], selectedPresetId: null }));
  },

  removeGate: (id) =>
    set((state) => ({ gates: state.gates.filter((x) => x.id !== id), selectedPresetId: null })),

  undo: () =>
    set((state) => ({
      gates: state.gates.length ? state.gates.slice(0, -1) : [],
      selectedPresetId: null,
    })),

  clearGates: () =>
    set({ gates: [], lastResponse: null, error: null, selectedPresetId: null }),

  clearPresetSelection: () => set({ selectedPresetId: null }),

  runSimulation: async () => {
    const { numQubits, gates, shots } = get();
    if (!Array.isArray(gates) || gates.length === 0) {
      set({
        loading: false,
        error: "Add at least one gate before running a simulation.",
        lastResponse: null,
        playbackIndex: -1,
        isPlaying: false,
      });
      return;
    }
    if (gates.length > MAX_SIM_GATES) {
      set({
        loading: false,
        error: `Large circuits can freeze the UI. Please keep gate count below ${MAX_SIM_GATES}.`,
        lastResponse: null,
        playbackIndex: -1,
        isPlaying: false,
      });
      return;
    }
    set({ loading: true, error: null });
    try {
      const includeSteps = true;
      const data = await runCircuitApi(numQubits, gates, shots, includeSteps);
      set({
        lastResponse: data,
        loading: false,
        error: null,
        playbackIndex: gates.length > 0 ? -1 : 0,
        isPlaying: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      set({ loading: false, error: msg, lastResponse: null });
    }
  },

  setPlaybackIndex: (i) =>
    set((state) => ({
      playbackIndex: Math.max(-1, Math.min(state.gates.length - 1, Math.floor(i))),
      isPlaying: false,
    })),

  stepPrev: () => {
    const { gates, playbackIndex } = get();
    if (gates.length === 0) return;
    set({ playbackIndex: Math.max(-1, playbackIndex - 1), isPlaying: false });
  },

  stepNext: () => {
    const { gates, playbackIndex } = get();
    if (gates.length === 0) return;
    set({
      playbackIndex: Math.min(gates.length - 1, playbackIndex + 1),
      isPlaying: false,
    });
  },

  togglePlay: () => {
    const { gates, isPlaying, playbackIndex } = get();
    if (!gates.length) return;
    if (isPlaying) {
      set({ isPlaying: false });
      return;
    }
    const atEnd = playbackIndex >= gates.length - 1;
    set({ isPlaying: true, playbackIndex: atEnd ? -1 : playbackIndex });
  },

  stopPlay: () => set({ isPlaying: false }),

  markGateHintSeen: () => set({ hasSeenGateHint: true }),
  markCxHintSeen: () => set({ hasSeenCxHint: true }),
  markResultsHintSeen: () => set({ hasSeenResultsHint: true }),
  resetForLogout: () =>
    set({
      lastResponse: null,
      loading: false,
      error: null,
      playbackIndex: -1,
      isPlaying: false,
      playbackSpeed: "normal",
      selectedPresetId: null,
      gates: [],
      numQubits: 2,
      shots: 1000,
    }),
}));

export function playbackStatevector(
  numQubits: number,
  gates: Gate[],
  lastResponse: RunCircuitResponse | null,
  playbackIndex: number,
): ComplexAmp[] | null {
  if (!lastResponse) return null;
  const base = lastResponse.statevector;
  if (!Array.isArray(base) || base.length === 0) return null;
  if (gates.length === 0) return base;
  if (playbackIndex < 0) return initialZeroState(numQubits);
  const steps = lastResponse.step_states;
  if (steps && playbackIndex >= 0 && playbackIndex < steps.length) {
    const sv = steps[playbackIndex]?.statevector;
    if (Array.isArray(sv) && sv.length > 0) return sv;
  }
  return base;
}

export function playbackIntervalMs(speed: PlaybackSpeed): number {
  if (speed === "slow") return 1200;
  if (speed === "fast") return 380;
  return 750;
}
