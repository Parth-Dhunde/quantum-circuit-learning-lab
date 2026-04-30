import { useCircuitStore } from "../store/useCircuitStore";

export function TimelineSlider() {
  const gates = useCircuitStore((s) => s.gates);
  const playbackIndex = useCircuitStore((s) => s.playbackIndex);
  const setPlaybackIndex = useCircuitStore((s) => s.setPlaybackIndex);
  const hasStepData = useCircuitStore((s) => Boolean(s.lastResponse?.step_states?.length));

  if (!gates.length || !hasStepData) return null;

  const maxIdx = gates.length - 1;
  const clamped = Math.max(-1, Math.min(playbackIndex, maxIdx));
  const span = maxIdx + 1;
  const progressPercent = span <= 0 ? 0 : ((clamped + 1) / span) * 100;

  return (
    <section className="panel-inset mt-4 mb-6 p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ds-primary">Timeline</p>
        <span className="text-xs text-ds-secondary">{clamped < 0 ? "Step: Initial" : `Step: Gate ${clamped + 1}`}</span>
      </div>
      <input
        type="range"
        min={-1}
        max={maxIdx}
        value={clamped}
        onChange={(e) => setPlaybackIndex(Number(e.target.value))}
        aria-label="Simulation timeline slider"
        className="timeline-slider w-full"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #8b5cf6 ${progressPercent}%, var(--color-border) ${progressPercent}%, var(--color-border) 100%)`,
        }}
      />
    </section>
  );
}

