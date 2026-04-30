import type { ComplexAmp } from "../types";

export type BlochCoords = { x: number; y: number; z: number };

/**
 * Bloch vector (x, y, z) for a single-qubit state α|0⟩ + β|1⟩.
 * Uses the standard convention x = 2·Re(α*β*), y = 2·Im(α*β*), z = |α|² − |β|².
 */
export function blochCoordsFrom2Amplitudes(alpha: ComplexAmp, beta: ComplexAmp): BlochCoords {
  const ar = alpha.real;
  const ai = alpha.imag;
  const br = beta.real;
  const bi = beta.imag;
  const re = ar * br + ai * bi;
  const im = ai * br - ar * bi;
  const p0 = ar * ar + ai * ai;
  const p1 = br * br + bi * bi;
  return { x: 2 * re, y: 2 * im, z: p0 - p1 };
}
