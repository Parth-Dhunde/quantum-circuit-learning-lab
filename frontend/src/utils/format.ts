import type { ComplexAmp } from "../types";

export function magnitudeSq(z: ComplexAmp): number {
  return z.real * z.real + z.imag * z.imag;
}

export function formatAmp(z: ComplexAmp): string {
  const r = z.real;
  const i = z.imag;
  if (Math.abs(i) < 1e-12) return r.toFixed(4);
  if (Math.abs(r) < 1e-12) return `${i.toFixed(4)}i`;
  const sign = i >= 0 ? "+" : "";
  return `${r.toFixed(4)}${sign}${i.toFixed(4)}i`;
}

export function indexToBitstring(index: number, numQubits: number): string {
  return index.toString(2).padStart(numQubits, "0");
}
