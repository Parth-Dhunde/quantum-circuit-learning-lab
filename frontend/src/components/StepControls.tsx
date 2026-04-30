import { useEffect, type ChangeEvent } from "react";

import type { PlaybackSpeed } from "../types";
import { playbackIntervalMs, useCircuitStore } from "../store/useCircuitStore";

export function StepControls() {
  const gates = useCircuitStore((s) => s.gates);
  const playbackIndex = useCircuitStore((s) => s.playbackIndex);
  const isPlaying = useCircuitStore((s) => s.isPlaying);
  const lastResponse = useCircuitStore((s) => s.lastResponse);
  const playbackSpeed = useCircuitStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useCircuitStore((s) => s.setPlaybackSpeed);
  const stepPrev = useCircuitStore((s) => s.stepPrev);
  const stepNext = useCircuitStore((s) => s.stepNext);
  const togglePlay = useCircuitStore((s) => s.togglePlay);
  const setPlaybackIndex = useCircuitStore((s) => s.setPlaybackIndex);

  const intervalMs = playbackIntervalMs(playbackSpeed);

  useEffect(() => {
    if (!isPlaying || gates.length === 0) return undefined;
    let cancelled = false;
    let raf = 0;
    let acc = 0;
    let last = performance.now();

    const loop = (now: number) => {
      if (cancelled) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(now - last, intervalMs * 4);
      last = now;
      acc += dt;
      if (acc >= intervalMs) {
        acc %= intervalMs;
        useCircuitStore.setState((s) => {
          if (!s.isPlaying || s.gates.length === 0) return {};
          if (s.playbackIndex < s.gates.length - 1) {
            return { playbackIndex: s.playbackIndex + 1 };
          }
          return { isPlaying: false };
        });
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isPlaying, gates.length, intervalMs]);

  if (!gates.length || !lastResponse?.step_states?.length) {
    return <p className="text-xs text-ds-muted">Run a circuit with at least one gate to unlock step playback.</p>;
  }

  const maxIdx = gates.length - 1;

  const onSpeedChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPlaybackSpeed(e.target.value as PlaybackSpeed);
  };

  return (
    <div className="panel-inset flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-ds-primary">Step playback</p>
          <p className="text-xs text-ds-secondary">
            Frame {playbackIndex < 0 ? "start" : playbackIndex + 1} / {gates.length + 1}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[11px] text-ds-secondary">
            <span>Speed</span>
            <select value={playbackSpeed} onChange={onSpeedChange} className="select-field px-2 py-1 text-xs">
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </label>
          <button type="button" onClick={() => setPlaybackIndex(-1)} className="btn-ghost px-3 py-1.5 text-xs">
            Reset
          </button>
          <button
            type="button"
            onClick={stepPrev}
            disabled={playbackIndex <= -1}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={stepNext}
            disabled={playbackIndex >= maxIdx}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ds-on-accent shadow-md transition-[transform,filter,box-shadow] duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-glow) 100%)",
              boxShadow: "var(--shadow-button)",
            }}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}
