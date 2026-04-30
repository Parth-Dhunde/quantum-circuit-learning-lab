import { useEffect, useMemo, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

const ARROW_LIMIT = 0.78;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export default function QuantumBlochSphere() {
  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const targetTiltRef = useRef<Vec2>({ x: 0, y: 0 });
  const tiltRef = useRef<Vec2>({ x: 0, y: 0 });
  const targetArrowRef = useRef<Vec2>({ x: 0.12, y: -0.42 });
  const arrowRef = useRef<Vec2>({ x: 0.12, y: -0.42 });
  const orbitPhaseRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const media = globalThis.matchMedia("(max-width: 768px), (pointer: coarse)");
    const updateReducedMotion = () => {
      reducedMotionRef.current = media.matches;
      if (media.matches) {
        targetTiltRef.current = { x: 0, y: 0 };
        targetArrowRef.current = { x: 0.12, y: -0.42 };
      }
    };
    updateReducedMotion();
    media.addEventListener("change", updateReducedMotion);

    const onMove = (event: MouseEvent) => {
      if (reducedMotionRef.current || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = clamp((event.clientX - cx) / (rect.width / 2), -1, 1);
      const ny = clamp((event.clientY - cy) / (rect.height / 2), -1, 1);

      targetTiltRef.current = {
        x: clamp(-ny * 8, -8, 8),
        y: clamp(nx * 10, -10, 10),
      };

      targetArrowRef.current = {
        x: clamp(nx * ARROW_LIMIT, -ARROW_LIMIT, ARROW_LIMIT),
        y: clamp(ny * ARROW_LIMIT, -ARROW_LIMIT, ARROW_LIMIT),
      };
    };

    const onLeave = () => {
      targetTiltRef.current = { x: 0, y: 0 };
      targetArrowRef.current = { x: 0.12, y: -0.42 };
    };

    let last = performance.now();
    const animate = (now: number) => {
      rafRef.current = globalThis.requestAnimationFrame(animate);
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      const lerp = reducedMotionRef.current ? 0.08 : 0.14;
      tiltRef.current.x += (targetTiltRef.current.x - tiltRef.current.x) * lerp;
      tiltRef.current.y += (targetTiltRef.current.y - tiltRef.current.y) * lerp;
      arrowRef.current.x += (targetArrowRef.current.x - arrowRef.current.x) * lerp;
      arrowRef.current.y += (targetArrowRef.current.y - arrowRef.current.y) * lerp;
      orbitPhaseRef.current += dt * (reducedMotionRef.current ? 0.4 : 0.85);

      setRenderTick((v) => (v + 1) % 10000);
    };

    globalThis.addEventListener("mousemove", onMove);
    globalThis.addEventListener("mouseleave", onLeave);
    rafRef.current = globalThis.requestAnimationFrame(animate);

    return () => {
      globalThis.removeEventListener("mousemove", onMove);
      globalThis.removeEventListener("mouseleave", onLeave);
      media.removeEventListener("change", updateReducedMotion);
      globalThis.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const sphereTransform = useMemo(
    () =>
      `perspective(900px) rotateX(${tiltRef.current.x.toFixed(2)}deg) rotateY(${tiltRef.current.y.toFixed(2)}deg)`,
    [renderTick],
  );

  const arrowEnd = useMemo(() => {
    const cx = 140;
    const cy = 140;
    return {
      x: cx + arrowRef.current.x * 78,
      y: cy + arrowRef.current.y * 78,
    };
  }, [renderTick]);

  const particles = useMemo(() => {
    const phase = orbitPhaseRef.current;
    return Array.from({ length: 8 }, (_, i) => {
      const angle = phase + i * ((Math.PI * 2) / 8);
      const r = 78 + (i % 3) * 6;
      return {
        id: `p-${i}`,
        cx: 140 + Math.cos(angle) * r,
        cy: 140 + Math.sin(angle) * (r * 0.45),
        opacity: 0.28 + ((i % 4) * 0.12),
      };
    });
  }, [renderTick]);

  return (
    <div
      ref={frameRef}
      className="relative mx-auto h-[200px] w-[200px] sm:h-[240px] sm:w-[240px] lg:h-[280px] lg:w-[280px]"
      style={{ transform: sphereTransform, transition: "transform 120ms linear" }}
      aria-hidden
    >
      <svg viewBox="0 0 280 280" className="h-full w-full" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="bloch-core" cx="34%" cy="30%" r="78%">
            <stop offset="0%" stopColor="rgba(129,140,248,0.9)" />
            <stop offset="62%" stopColor="rgba(124,58,237,0.85)" />
            <stop offset="100%" stopColor="rgba(67,56,202,0.9)" />
          </radialGradient>
          <filter id="bloch-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="bloch-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(244,244,255,0.95)" />
          </marker>
        </defs>

        <circle
          cx="140"
          cy="140"
          r="86"
          fill="url(#bloch-core)"
          className="animate-[bloch-glow-pulse_3.8s_ease-in-out_infinite]"
          filter="url(#bloch-glow)"
        />
        <ellipse
          cx="140"
          cy="140"
          rx="88"
          ry="30"
          fill="none"
          stroke="rgba(226,232,240,0.65)"
          strokeWidth="1.4"
        />
        <line x1="140" y1="48" x2="140" y2="232" stroke="rgba(226,232,240,0.52)" strokeWidth="1.4" />

        {particles.map((p, i) => (
          <circle
            key={p.id}
            cx={p.cx}
            cy={p.cy}
            r="2.2"
            fill="rgba(196,181,253,0.9)"
            opacity={reducedMotionRef.current ? 0.3 : p.opacity}
          />
        ))}

        <line
          x1="140"
          y1="140"
          x2={arrowEnd.x}
          y2={arrowEnd.y}
          stroke="rgba(248,250,252,0.95)"
          strokeWidth="2.6"
          markerEnd="url(#bloch-arrow)"
        />
      </svg>
    </div>
  );
}

