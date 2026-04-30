import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "qc-lab-guided-tour-complete";

const STEPS = [
  {
    target: "tour-qubits",
    title: "Choose your workspace",
    body: "Set how many qubits your circuit uses. The state grows as 2ⁿ complex amplitudes — start with two while you learn.",
  },
  {
    target: "tour-gates",
    title: "This is your circuit builder",
    body: "Add quantum gates here (H, X, Y, Z, RX, RZ, CX) or load Bell / GHZ / superposition examples. Each row is a qubit wire.",
  },
  {
    target: "tour-run",
    title: "Run simulation",
    body: "Pick shots and press Run circuit. The FastAPI + Qiskit backend executes your program and returns results.",
  },
  {
    target: "tour-results",
    title: "Understand the results panel",
    body: "Measurement counts show classical outcomes after repeated shots. Statevector preview lists amplitudes before measurement. The Qiskit text diagram mirrors your gate list.",
  },
  {
    target: "tour-canvas",
    title: "Circuit visualization",
    body: "This area draws your circuit as an SVG. During step playback, the active gate is highlighted so you can follow the evolution.",
  },
] as const;

type Rect = { top: number; left: number; width: number; height: number };

function readComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function OnboardingTour() {
  const [open, setOpen] = useState(() => (typeof window !== "undefined" ? !readComplete() : false));
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);

  const closeTour = useCallback(() => {
    writeComplete();
    setOpen(false);
  }, []);

  const updateSpotlight = useCallback(() => {
    if (!open) return;
    const id = STEPS[stepIndex]?.target;
    if (!id) return;
    const el = document.querySelector(`[data-tour="${id}"]`);
    if (!(el instanceof HTMLElement)) {
      setSpotlight(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 10;
    setSpotlight({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });
  }, [open, stepIndex]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updateSpotlight();
    const onScroll = () => updateSpotlight();
    const onResize = () => updateSpotlight();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, stepIndex, updateSpotlight]);

  useEffect(() => {
    if (!open) return;
    const id = STEPS[stepIndex]?.target;
    if (!id) return;
    const el = document.querySelector(`[data-tour="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, [open, stepIndex]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="tour-root fixed inset-0 z-[100] flex flex-col justify-end p-4 sm:p-6" aria-live="polite">
      <div
        className="tour-scrim absolute inset-0 bg-[var(--color-overlay-scrim)] backdrop-blur-[2px]"
        aria-hidden
      />

      {spotlight ? (
        <div
          className="tour-spotlight pointer-events-none absolute rounded-xl border-2 border-[var(--color-accent)] shadow-[0_0_24px_rgba(79,70,229,0.35)] transition-[top,left,width,height] duration-300 ease-out dark:shadow-[0_0_28px_rgba(167,139,250,0.35)]"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      ) : null}

      <div
        className="glass-card relative z-[110] mx-auto mb-4 w-full max-w-lg animate-fadeIn p-6 shadow-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-ds-accent dark:text-accent-glow">
          Guided tour · Step {stepIndex + 1} / {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-3 text-xl font-semibold text-ds-primary sm:text-2xl">
          {step.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ds-secondary">{step.body}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="btn-ghost px-4 py-2.5 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) closeTour();
              else setStepIndex((i) => i + 1);
            }}
            className="btn-accent px-5 py-2.5"
          >
            {isLast ? "Done" : "Next"}
          </button>
          <button type="button" onClick={closeTour} className="btn-ghost ml-auto px-4 py-2.5 text-ds-muted">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
