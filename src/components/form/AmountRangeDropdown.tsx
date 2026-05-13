import { useMemo, useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import Label from "./Label";
import Input from "./input/InputField";
import { DollarLineIcon } from "../../icons";

const SLIDER_TRACK_MAX = 20_000;
const DEFAULT_SLIDER_MAX = SLIDER_TRACK_MAX;
const STEP = 100;

function parseNum(s: string): number | null {
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : null;
}

/** Rounds to nearest multiple of STEP; empty or invalid → "". */
function snapAmountString(raw: string): string {
  const t = raw.trim();
  if (t === "") return "";
  const n = parseNum(t);
  if (n == null) return "";
  return String(Math.max(0, Math.round(n / STEP) * STEP));
}

function snapStep(v: number) {
  return Math.round(v / STEP) * STEP;
}

export interface AmountRangeDropdownProps {
  id: string;
  label?: string;
  amountMin: string;
  amountMax: string;
  onChange: (next: { amountMin: string; amountMax: string }) => void;
  /** Upper bound for the slider track (never above 20,000; type a higher max in the inputs if needed). */
  sliderMax?: number;
  className?: string;
}

export default function AmountRangeDropdown({
  id,
  label = "Amount",
  amountMin,
  amountMax,
  onChange,
  sliderMax = DEFAULT_SLIDER_MAX,
  className = "",
}: AmountRangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePanelPosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(window.innerWidth - 16, Math.max(288, rect.width));
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const top = rect.bottom + 4;
    setPanelPos({ top, left, width });
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    setPanelPos(null);
  }, []);

  const openPanel = useCallback(() => {
    const el = buttonRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const width = Math.min(window.innerWidth - 16, Math.max(288, rect.width));
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      setPanelPos({ top: rect.bottom + 4, left, width });
    } else {
      setPanelPos({ top: 88, left: 16, width: 288 });
    }
    setOpen(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      closePanel();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, closePanel]);

  const sliderMaxSnapped = useMemo(() => {
    const capped = Math.min(Math.max(STEP, sliderMax), SLIDER_TRACK_MAX);
    return Math.max(STEP, Math.floor(capped / STEP) * STEP);
  }, [sliderMax]);

  const cappedHiForLo = useMemo(() => {
    if (amountMax.trim() === "") return sliderMaxSnapped;
    return Math.min(sliderMaxSnapped, parseNum(amountMax) ?? sliderMaxSnapped);
  }, [amountMax, sliderMaxSnapped]);

  const cappedLoForHi = useMemo(() => {
    if (amountMin.trim() === "") return 0;
    return Math.max(0, parseNum(amountMin) ?? 0);
  }, [amountMin]);

  const lo = useMemo(() => {
    if (amountMin.trim() === "") return 0;
    const n = parseNum(amountMin) ?? 0;
    const clamped = Math.min(Math.max(0, n), cappedHiForLo);
    return snapStep(clamped);
  }, [amountMin, cappedHiForLo]);

  const hi = useMemo(() => {
    if (amountMax.trim() === "") return sliderMaxSnapped;
    const n = parseNum(amountMax) ?? sliderMaxSnapped;
    const clamped = Math.min(Math.max(cappedLoForHi, n), sliderMaxSnapped);
    return snapStep(clamped);
  }, [amountMax, cappedLoForHi, sliderMaxSnapped]);

  const setLo = (raw: number) => {
    const snapped = snapStep(raw);
    const maxLo = Math.max(0, cappedHiForLo - STEP);
    const nextLo = Math.min(maxLo, Math.max(0, snapped));
    onChange({
      amountMin: nextLo <= 0 ? "" : String(nextLo),
      amountMax,
    });
  };

  const setHi = (raw: number) => {
    const snapped = snapStep(raw);
    const minHi = Math.min(sliderMaxSnapped, cappedLoForHi + STEP);
    const nextHi = Math.max(minHi, Math.min(sliderMaxSnapped, snapped));
    onChange({
      amountMin,
      amountMax: nextHi >= sliderMaxSnapped ? "" : String(nextHi),
    });
  };

  const summary = useMemo(() => {
    const hasMin = amountMin.trim() !== "";
    const hasMax = amountMax.trim() !== "";
    if (!hasMin && !hasMax) return "Any amount";
    const fmt = (s: string) => {
      const n = parseNum(s);
      return n == null ? s : n.toLocaleString();
    };
    if (hasMin && hasMax) return `${fmt(amountMin)} – ${fmt(amountMax)}`;
    if (hasMin) return `From ${fmt(amountMin)}`;
    return `Up to ${fmt(amountMax)}`;
  }, [amountMin, amountMax]);

  const rangeStyle = useMemo(() => {
    const max = sliderMaxSnapped;
    const left = max <= 0 ? 0 : (lo / max) * 100;
    const width = max <= 0 ? 0 : ((hi - lo) / max) * 100;
    return { left: `${left}%`, width: `${Math.max(0, width)}%` };
  }, [lo, hi, sliderMaxSnapped]);

  const rangeInputClass =
    "pointer-events-none absolute left-0 top-1/2 h-8 w-full -translate-y-1/2 appearance-none bg-transparent " +
    "[&::-webkit-slider-runnable-track]:pointer-events-none [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent " +
    "[&::-moz-range-track]:pointer-events-none [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 " +
    "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 " +
    "[&::-webkit-slider-thumb]:border-brand-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm " +
    "dark:[&::-webkit-slider-thumb]:border-brand-400 dark:[&::-webkit-slider-thumb]:bg-gray-900 " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand-500 [&::-moz-range-thumb]:bg-white " +
    "dark:[&::-moz-range-thumb]:border-brand-400 dark:[&::-moz-range-thumb]:bg-gray-900";

  return (
    <div ref={rootRef} className={twMerge("relative min-w-0", className)}>
      {label ? (
        <Label htmlFor={id} className="mb-1 block text-xs font-medium">
          {label}
        </Label>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (open) closePanel();
          else openPanel();
        }}
        className={twMerge(
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-left text-sm shadow-theme-xs",
          "text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800",
          !amountMin && !amountMax ? "text-gray-400 dark:text-gray-400" : "",
        )}
      >
        <span className="truncate">{summary}</span>
        <DollarLineIcon className="size-5 shrink-0 text-gray-500 dark:text-gray-400" />
      </button>

      {open && panelPos
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Amount range"
              style={{
                position: "fixed",
                top: panelPos.top,
                left: panelPos.left,
                width: panelPos.width,
                zIndex: 9999,
              }}
              className="rounded-xl border border-gray-200 bg-white p-3 shadow-xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10"
            >
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">Min</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    placeholder="0"
                    className="h-9 !px-2 !py-1.5 text-xs"
                    value={amountMin}
                    onChange={(e) =>
                      onChange({ amountMin: e.target.value, amountMax })
                    }
                    onBlur={() => {
                      const next = snapAmountString(amountMin);
                      if (next === amountMin.trim()) return;
                      let maxStr = amountMax;
                      const maxN = parseNum(maxStr);
                      const minN = parseNum(next);
                      if (minN != null && maxN != null && maxN < minN) {
                        maxStr = next;
                      }
                      onChange({ amountMin: next, amountMax: maxStr });
                    }}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">Max</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    placeholder="No max"
                    className="h-9 !px-2 !py-1.5 text-xs"
                    value={amountMax}
                    onChange={(e) =>
                      onChange({ amountMin: amountMin, amountMax: e.target.value })
                    }
                    onBlur={() => {
                      const next = snapAmountString(amountMax);
                      if (next === amountMax.trim()) return;
                      let minStr = amountMin;
                      const maxN = parseNum(next);
                      const minN = parseNum(minStr);
                      if (maxN != null && minN != null && minN > maxN) {
                        minStr = next;
                      }
                      onChange({ amountMin: minStr, amountMax: next });
                    }}
                  />
                </div>
              </div>

              <div className="relative mb-1 h-8">
                <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div
                  className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-500 dark:bg-brand-400"
                  style={rangeStyle}
                />
                {/* Max below, min above (higher z): tracks use pointer-events-none so only thumbs hit-test. */}
                <input
                  type="range"
                  min={0}
                  max={sliderMaxSnapped}
                  step={STEP}
                  value={hi}
                  onChange={(e) => setHi(Number(e.target.value))}
                  className={twMerge(rangeInputClass, "z-10")}
                />
                <input
                  type="range"
                  min={0}
                  max={sliderMaxSnapped}
                  step={STEP}
                  value={lo}
                  onChange={(e) => setLo(Number(e.target.value))}
                  className={twMerge(rangeInputClass, "z-20")}
                />
              </div>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Slider and amounts use steps of {STEP.toLocaleString()}. Type a max above{" "}
                {sliderMaxSnapped.toLocaleString()} if you need to.
              </p>

              <button
                type="button"
                className="mt-2 w-full rounded-lg border border-gray-200 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5"
                onClick={() => {
                  onChange({ amountMin: "", amountMax: "" });
                }}
              >
                Clear range
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
