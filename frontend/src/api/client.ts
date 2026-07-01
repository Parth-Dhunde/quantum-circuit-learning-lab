import type { Gate, RunCircuitResponse } from "../types";

import { logDev } from "../utils/logDev";
import { parseRunCircuitResponse } from "./parseRunResponse";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const RETRY_DELAY_MS = 1500;
const MAX_ATTEMPTS = 2;
const FETCH_TIMEOUT_MS = 30_000;
const HEALTH_CACHE_MS = 15_000;

let lastHealthCheck: { ok: boolean; at: number } | null = null;

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

function isTransientNetworkError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("timed out") ||
    msg.includes("aborted")
  );
}

function toNetworkFriendlyMessage(error: unknown): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Please check your internet connection.";
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return "The request timed out. Please try again.";
  }
  return "Unable to connect to the backend. Please check your internet connection or try again.";
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkHealth(): Promise<boolean> {
  const now = Date.now();
  if (lastHealthCheck && now - lastHealthCheck.at < HEALTH_CACHE_MS) {
    return lastHealthCheck.ok;
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`, { method: "GET" });
    if (!response.ok) {
      lastHealthCheck = { ok: false, at: now };
      return false;
    }
    const text = await response.text();
    try {
      const payload = JSON.parse(text) as { status?: string };
      const ok = payload?.status === "ok";
      lastHealthCheck = { ok, at: now };
      return ok;
    } catch {
      lastHealthCheck = { ok: false, at: now };
      return false;
    }
  } catch (error) {
    logDev("Health check failed:", error);
    lastHealthCheck = { ok: false, at: now };
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
  if (
    msg.includes("unavailable") ||
    msg.includes("timeout") ||
    msg.includes("failed to fetch") ||
    msg.includes("network")
  ) {
    return "Unable to connect to the backend. Please check your internet connection or try again.";
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
        logDev(`Health check failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying...`);
        await sleep(RETRY_DELAY_MS);
        lastHealthCheck = null;
        continue;
      }
      throw new Error("Unable to connect to the backend. Please check your internet connection or try again.");
    }

    try {
      res = await fetchWithTimeout(`${API_BASE}/run-circuit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_qubits: numQubits,
          gates: gates.map(gateToPayload),
          shots,
          include_intermediate_states: includeIntermediateStates,
        }),
      });
    } catch (error) {
      if (isTransientNetworkError(error) && attempt < MAX_ATTEMPTS) {
        logDev(`Simulation request failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying...`);
        await sleep(RETRY_DELAY_MS);
        lastHealthCheck = null;
        continue;
      }
      throw new Error(toNetworkFriendlyMessage(error));
    }

    const text = await res.text();
    const data = safeParseJson(text);
    if (data == null) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error("Unable to connect to the backend. Please check your internet connection or try again.");
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
      throw new Error("Unable to connect to the backend. Please check your internet connection or try again.");
    }
  }

  throw new Error("Unable to connect to the backend. Please check your internet connection or try again.");
}
