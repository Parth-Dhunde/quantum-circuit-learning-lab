import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { subscribeTooltipReposition } from "../theme/tooltipSingleton";

type PreferredPlacement = "top" | "bottom" | "left" | "right";

type HintBubbleProps = {
  label: string;
  children: ReactNode;
  preferredPlacement?: PreferredPlacement;
  pulse?: boolean;
};

const VIEWPORT_PAD = 8;
const GAP = 8;
const OPEN_DELAY_MS = 200;
const CLOSE_DELAY_MS = 120;
const MAX_WIDTH = 288;

type Pt = { left: number; top: number; placement: PreferredPlacement };

function maxTooltipHeight() {
  if (typeof window === "undefined") return 360;
  return Math.min(360, Math.floor(window.innerHeight * 0.42));
}

function computeTooltipPosition(
  anchor: DOMRect,
  tw: number,
  th: number,
  vw: number,
  vh: number,
  prefer: PreferredPlacement,
): Pt {
  const order: PreferredPlacement[] = [
    prefer,
    ...(["top", "bottom", "left", "right"] as const).filter((p) => p !== prefer),
  ];

  const fits = (left: number, top: number) =>
    left >= VIEWPORT_PAD - 0.5 &&
    top >= VIEWPORT_PAD - 0.5 &&
    left + tw <= vw - VIEWPORT_PAD + 0.5 &&
    top + th <= vh - VIEWPORT_PAD + 0.5;

  for (const placement of order) {
    let left = 0;
    let top = 0;
    const ax = anchor.left + anchor.width / 2;
    const ay = anchor.top + anchor.height / 2;

    if (placement === "bottom") {
      left = ax - tw / 2;
      top = anchor.bottom + GAP;
    } else if (placement === "top") {
      left = ax - tw / 2;
      top = anchor.top - GAP - th;
    } else if (placement === "right") {
      left = anchor.right + GAP;
      top = ay - th / 2;
    } else {
      left = anchor.left - GAP - tw;
      top = ay - th / 2;
    }

    if (fits(left, top)) {
      return { left, top, placement };
    }

    const clampedLeft = Math.min(Math.max(VIEWPORT_PAD, left), vw - tw - VIEWPORT_PAD);
    const clampedTop = Math.min(Math.max(VIEWPORT_PAD, top), vh - th - VIEWPORT_PAD);
    if (fits(clampedLeft, clampedTop)) {
      return { left: clampedLeft, top: clampedTop, placement };
    }
  }

  const fallbackLeft = Math.min(
    Math.max(VIEWPORT_PAD, anchor.left + anchor.width / 2 - tw / 2),
    vw - tw - VIEWPORT_PAD,
  );
  const fallbackTop = Math.min(
    Math.max(VIEWPORT_PAD, anchor.bottom + GAP),
    vh - th - VIEWPORT_PAD,
  );
  return { left: fallbackLeft, top: fallbackTop, placement: prefer };
}

export function HintBubble({
  label,
  children,
  preferredPlacement = "top",
  pulse = false,
}: HintBubbleProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Pt | null>(null);

  const clearOpenTimer = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleOpen = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    openTimer.current = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }, []);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setCoords(null);
    }, CLOSE_DELAY_MS);
  }, []);

  useEffect(() => () => {
    clearOpenTimer();
    clearCloseTimer();
  }, []);

  const measureAndPlace = useCallback(() => {
    const wrap = wrapRef.current;
    const tip = tipRef.current;
    if (!wrap || !tip) return;
    const anchor = wrap.getBoundingClientRect();
    const maxH = maxTooltipHeight();
    const tw = Math.min(tip.scrollWidth, MAX_WIDTH);
    const th = Math.min(tip.scrollHeight, maxH);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setCoords(computeTooltipPosition(anchor, tw, th, vw, vh, preferredPlacement));
  }, [preferredPlacement]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return undefined;
    }
    measureAndPlace();
    const unsub = subscribeTooltipReposition(measureAndPlace);
    return () => unsub();
  }, [open, label, preferredPlacement, measureAndPlace]);

  const tooltip =
    open &&
    createPortal(
      <div
        ref={tipRef}
        role="tooltip"
        style={{
          position: "fixed",
          left: coords?.left ?? 0,
          top: coords?.top ?? 0,
          visibility: coords ? "visible" : "hidden",
          maxWidth: MAX_WIDTH,
          maxHeight: maxTooltipHeight(),
          zIndex: 9999,
          opacity: coords ? 1 : 0,
          transform: coords ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
        className="tooltip-popover pointer-events-none overflow-y-auto p-3 text-xs leading-relaxed [overflow-wrap:anywhere]"
      >
        {label}
      </div>,
      document.body,
    );

  return (
    <span ref={wrapRef} className="inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        aria-label="More info"
        aria-expanded={open}
        onPointerEnter={scheduleOpen}
        onPointerLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-[transform,background-color,border-color,color] duration-200 active:scale-95 ${
          pulse ? "animate-pulseSoft" : ""
        } border-ds-line bg-ds-card text-ds-accent hover:border-ds-accent hover:bg-ds-surface dark:hover:bg-white/10`}
      >
        ?
      </button>
      {tooltip}
    </span>
  );
}
