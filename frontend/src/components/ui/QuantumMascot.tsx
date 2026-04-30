import { useEffect, useRef } from "react";

const MAX_RADIUS = 7;

export default function QuantumMascot() {
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  });
  const currentRef = useRef({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  });
  const rafRef = useRef(0);

  useEffect(() => {
    const getOffset = (eyeEl: HTMLDivElement | null, mouseX: number, mouseY: number) => {
      if (!eyeEl) return { x: 0, y: 0 };
      const rect = eyeEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.0001) return { x: 0, y: 0 };
      const clamped = Math.min(MAX_RADIUS, distance);
      const nx = dx / distance;
      const ny = dy / distance;
      return { x: nx * clamped, y: ny * clamped };
    };

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current.left = getOffset(leftEyeRef.current, e.clientX, e.clientY);
      targetRef.current.right = getOffset(rightEyeRef.current, e.clientX, e.clientY);
    };

    const onMouseLeave = () => {
      targetRef.current.left = { x: 0, y: 0 };
      targetRef.current.right = { x: 0, y: 0 };
    };

    const animate = () => {
      rafRef.current = globalThis.requestAnimationFrame(animate);

      currentRef.current.left.x += (targetRef.current.left.x - currentRef.current.left.x) * 0.14;
      currentRef.current.left.y += (targetRef.current.left.y - currentRef.current.left.y) * 0.14;
      currentRef.current.right.x += (targetRef.current.right.x - currentRef.current.right.x) * 0.14;
      currentRef.current.right.y += (targetRef.current.right.y - currentRef.current.right.y) * 0.14;

      if (leftPupilRef.current) {
        leftPupilRef.current.style.transform = `translate(${currentRef.current.left.x.toFixed(2)}px, ${currentRef.current.left.y.toFixed(2)}px)`;
      }
      if (rightPupilRef.current) {
        rightPupilRef.current.style.transform = `translate(${currentRef.current.right.x.toFixed(2)}px, ${currentRef.current.right.y.toFixed(2)}px)`;
      }
    };

    globalThis.addEventListener("mousemove", onMouseMove);
    globalThis.addEventListener("mouseleave", onMouseLeave);
    rafRef.current = globalThis.requestAnimationFrame(animate);

    return () => {
      globalThis.removeEventListener("mousemove", onMouseMove);
      globalThis.removeEventListener("mouseleave", onMouseLeave);
      globalThis.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative mx-auto h-[200px] w-[200px] sm:h-[240px] sm:w-[240px] lg:h-[280px] lg:w-[280px]">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0f172a] to-[#020617] shadow-[0_0_60px_rgba(99,102,241,0.25)] animate-[breathe_4s_ease-in-out_infinite]" />
      <div className="absolute inset-0 flex items-center justify-center gap-6">
        <div
          ref={leftEyeRef}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white/95 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.1),0_6px_16px_rgba(15,23,42,0.2)]"
        >
          <div ref={leftPupilRef} className="relative h-[14px] w-[14px] rounded-full bg-black transition-transform duration-100">
            <div className="absolute left-[3px] top-[3px] h-[5px] w-[5px] rounded-full bg-white" />
          </div>
        </div>
        <div
          ref={rightEyeRef}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white/95 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.1),0_6px_16px_rgba(15,23,42,0.2)]"
        >
          <div ref={rightPupilRef} className="relative h-[14px] w-[14px] rounded-full bg-black transition-transform duration-100">
            <div className="absolute left-[3px] top-[3px] h-[5px] w-[5px] rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

