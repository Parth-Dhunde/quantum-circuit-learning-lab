import type { Gate, RunCircuitResponse } from "../types";

import { parseRunCircuitResponse } from "./parseRunResponse";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const RETRY_DELAY_MS = 1500;
const MAX_ATTEMPTS = 2;

function gateToPayload(g: Gate): Record<string, string | number> {
  if (g.type === "CX") {
    return { type: "CX", control: g.control, target: g.target };
  }
  if (g.type === "RX" || g.type === "RZ") {
    return { type: g.type, target: g.target, angle: g.angle };
  }
  return { type: g.type, target: g.target };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: "GET" });
    if (!response.ok) return false;
    const text = await response.text();
    try {
      const payload = JSON.parse(text) as { status?: string };
      return payload?.status === "ok";
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

function toFriendlyMessage(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("out of range") || msg.includes("invalid gate") || msg.includes("invalid input")) {
    return "Invalid input. Please check your circuit.";
  }
  if (msg.includes("too many gates") || msg.includes("large circuit")) {
    return "Circuit is too large. Please reduce the number of gates and try again.";
  }
  if (msg.includes("server is waking up")) {
    return "Server is waking up. Try again in a moment.";
  }
  if (msg.includes("unavailable") || msg.includes("timeout")) {
    return "Server unavailable. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

function safeParseJson(text: string): unknown | null {
  if (!text || text.trim().length === 0) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function runCircuitApi(
  numQubits: number,
  gates: Gate[],
  shots: number,
  includeIntermediateStates: boolean,
): Promise<RunCircuitResponse> {
  if (!Number.isFinite(numQubits) || numQubits < 1) {
    throw new Error("Invalid input. Please check your circuit.");
  }
  if (!Array.isArray(gates)) {
    throw new Error("Invalid input. Please check your circuit.");
  }
  if (!Number.isFinite(shots) || shots < 1) {
    throw new Error("Invalid input. Please check your circuit.");
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let res: Response;
    const healthy = await checkHealth();
    if (!healthy) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error("Server unavailable. Please try again.");
    }
    try {
      res = await fetch(`${API_BASE}/run-circuit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_qubits: numQubits,
          gates: gates.map(gateToPayload),
          shots,
          include_intermediate_states: includeIntermediateStates,
        }),
      });
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error("Server unavailable. Please try again.");
    }

    const text = await res.text();
    const data = safeParseJson(text);
    if (data == null) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error("Server unavailable. Please try again.");
    }

    if (!res.ok) {
      const statusError = `Server error: ${res.status}`;
      const payload = data as { detail?: unknown; error?: unknown };
      let detail = statusError;
      if (typeof payload?.detail === "string") detail = payload.detail;
      else if (typeof payload?.error === "string") detail = payload.error;
      if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error(toFriendlyMessage(detail));
    }

    try {
      return parseRunCircuitResponse(data);
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error("Server unavailable. Please try again.");
    }
  }

  throw new Error("Server unavailable. Please try again.");
}
