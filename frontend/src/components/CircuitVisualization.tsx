import { useMemo } from "react";

import type { Gate } from "../types";

type Props = {
  numQubits: number;
  gates: Gate[];
  /** Gate index to emphasize (aligned with playback), or -1 for none */
  activeGateIndex: number;
  emptyMessage?: string;
  demoMode?: boolean;
};

const COL = 84;
const LEFT = 48;
const TOP = 36;
const ROW = 58;

const gateTransition =
  "stroke 220ms ease, fill 220ms ease, stroke-width 220ms ease, filter 220ms ease, opacity 220ms ease";

function formatAngle(a: number): string {
  const pi = Math.PI;
  const near = (v: number, m: number) => Math.abs(v - m) < 0.06;
  if (near(a, pi)) return "π";
  if (near(a, pi / 2)) return "π/2";
  if (near(a, -pi / 2)) return "−π/2";
  if (near(a, pi / 4)) return "π/4";
  return a.toFixed(2);
}

function gateLabel(gate: Gate): { main: string; sub?: string } {
  if (gate.type === "CX") return { main: "CX" };
  if (gate.type === "RX" || gate.type === "RZ") {
    return { main: gate.type, sub: formatAngle(gate.angle) };
  }
  return { main: gate.type };
}

export function CircuitVisualization({ numQubits, gates, activeGateIndex, emptyMessage, demoMode = false }: Props) {
  const safeGates = Array.isArray(gates) ? gates : [];
  const isEmpty = !gates || safeGates.length === 0;
  const width = useMemo(() => {
    const cols = Math.max(safeGates.length, 1);
    return LEFT + cols * COL + 56;
  }, [safeGates.length]);

  const height = TOP + numQubits * ROW + 24;

  const qubitYs = useMemo(() => {
    const safeNumQubits = Number.isFinite(numQubits) ? Math.max(1, Math.floor(numQubits)) : 1;
    return Array.from({ length: safeNumQubits }, (_, q) => TOP + q * ROW);
  }, [numQubits]);

  const showPlaceholder = !demoMode && isEmpty;

  return (
    <div className="relative">
      <div className="circuit-canvas overflow-x-auto p-4" style={{ minHeight: `${height + 16}px` }}>
        {isEmpty ? null : (
          <svg
            className="circuit-svg min-w-full"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Quantum circuit diagram"
          >
            <defs>
              <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {qubitYs.map((y, qi) => (
              <g key={qi}>
                <text x={12} y={y + 5} className="fill-ds-secondary text-xs font-mono dark:fill-ds-muted">
                  q{qi}
                </text>
                <line
                  x1={LEFT}
                  y1={y}
                  x2={width - 32}
                  y2={y}
                  stroke="var(--cv-wire)"
                  strokeOpacity={0.95}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            ))}

            {safeGates.map((gate, index) => {
          const cx = LEFT + index * COL + COL / 2;
          const active = index === activeGateIndex;
          const stroke = active ? "var(--cv-stroke-active)" : "var(--cv-stroke)";
          const fill = active ? "var(--cv-fill-active)" : "var(--cv-fill)";

          if (gate.type === "CX") {
            const yc = qubitYs[gate.control] ?? TOP;
            const yt = qubitYs[gate.target] ?? TOP;
            const yTop = Math.min(yc, yt);
            const yBot = Math.max(yc, yt);
            return (
              <g
                key={gate.id}
                filter={active ? "url(#glow)" : undefined}
                style={{ transition: gateTransition }}
              >
                <line
                  x1={cx}
                  y1={yTop}
                  x2={cx}
                  y2={yBot}
                  stroke={stroke}
                  strokeWidth={active ? 3 : 2}
                  style={{ transition: gateTransition }}
                />
                <circle
                  cx={cx}
                  cy={yc}
                  r={active ? 8 : 7}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2}
                  style={{ transition: gateTransition }}
                />
                <circle
                  cx={cx}
                  cy={yt}
                  r={active ? 15 : 13}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={active ? 3 : 2}
                  style={{ transition: gateTransition }}
                />
                <line
                  x1={cx - 7}
                  y1={yt}
                  x2={cx + 7}
                  y2={yt}
                  stroke={stroke}
                  strokeWidth={2}
                  style={{ transition: gateTransition }}
                />
                <line
                  x1={cx}
                  y1={yt - 7}
                  x2={cx}
                  y2={yt + 7}
                  stroke={stroke}
                  strokeWidth={2}
                  style={{ transition: gateTransition }}
                />
              </g>
            );
          }

          const y = qubitYs[gate.target] ?? TOP;
          const tall = gate.type === "RX" || gate.type === "RZ";
          const h = tall ? 52 : 44;
          const w = tall ? 52 : 44;
          const { main, sub } = gateLabel(gate);

          return (
            <g key={gate.id} filter={active ? "url(#glow)" : undefined} style={{ transition: gateTransition }}>
              <rect
                x={cx - w / 2}
                y={y - h / 2}
                width={w}
                height={h}
                rx={12}
                fill={fill}
                stroke={stroke}
                strokeWidth={active ? 3 : 2}
                style={{ transition: gateTransition }}
              />
              <text
                x={cx}
                y={sub ? y - 4 : y + 6}
                textAnchor="middle"
                fill="var(--cv-text)"
                className="text-[13px] font-semibold tracking-wide"
                style={{ transition: gateTransition }}
              >
                {main}
              </text>
              {sub ? (
                <text
                  x={cx}
                  y={y + 14}
                  textAnchor="middle"
                  fill="var(--cv-text-sub)"
                  className="text-[10px] font-mono"
                  style={{ transition: gateTransition }}
                >
                  {sub}
                </text>
              ) : null}
            </g>
          );
            })}
          </svg>
        )}
      </div>
      {showPlaceholder ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border border-ds-line bg-ds-card/80 px-4 py-2 text-sm text-ds-secondary">
            {emptyMessage ?? "Add gates to start building your circuit"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
