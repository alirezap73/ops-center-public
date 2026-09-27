"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Armchair } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";

const STORAGE_KEY = "ops-sit-timer";
const LIMITS = [30, 45, 60, 90];
const DEFAULT_LIMIT = 45;

/**
 * وضعیت در localStorage نگه داشته می‌شود، نه در state تنها — وگرنه با هر رفرش
 * یا رفتن به صفحه‌ی دیگر شمارش صفر می‌شد. زمان سپری‌شده از روی timestamp حساب
 * می‌شود، نه با شمردن تیک‌ها، تا اگر تب در پس‌زمینه throttle شد عقب نماند.
 */
function readState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return {
      running: Boolean(s.running),
      startedAt: typeof s.startedAt === "number" ? s.startedAt : null,
      acc: typeof s.acc === "number" ? s.acc : 0,
      limit: LIMITS.includes(s.limit) ? s.limit : DEFAULT_LIMIT,
    };
  } catch {
    return null;
  }
}

const format = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export default function SitTimer({ compact = false }) {
  const [state, setState] = useState({
    running: false,
    startedAt: null,
    acc: 0,
    limit: DEFAULT_LIMIT,
  });
  const [mounted, setMounted] = useState(false);
  const [, forceTick] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    setState(readState() || { running: false, startedAt: null, acc: 0, limit: DEFAULT_LIMIT });
    setMounted(true);
  }, []);

  // فقط وقتی در حال شمارش است تیک می‌زنیم
  useEffect(() => {
    clearInterval(timer.current);
    if (state.running) timer.current = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer.current);
  }, [state.running]);

  const save = useCallback((next) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* حالت خصوصی مرورگر — شمارش در همین صفحه کار می‌کند، فقط ذخیره نمی‌شود */
    }
  }, []);

  const elapsed = state.acc + (state.running && state.startedAt ? Date.now() - state.startedAt : 0);
  const limitMs = state.limit * 60000;
  const over = elapsed >= limitMs;
  const t = over ? "red" : state.running ? "jade" : "slate";

  const toggle = () =>
    save(
      state.running
        ? { ...state, running: false, acc: elapsed, startedAt: null }
        : { ...state, running: true, startedAt: Date.now() }
    );

  // بعد از بلندشدن و تحرک، شمارش از صفر — ولی اگر در حال شمارش بود همان‌طور ادامه می‌دهد
  const reset = () =>
    save({ ...state, acc: 0, startedAt: state.running ? Date.now() : null });

  const cycleLimit = () =>
    save({ ...state, limit: LIMITS[(LIMITS.indexOf(state.limit) + 1) % LIMITS.length] });

  // تا mount نشده چیزی که به localStorage وابسته است رندر نمی‌کنیم (hydration)
  if (!mounted) {
    return <div className={compact ? "w-24 h-7" : "h-16"} aria-hidden />;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          title={state.running ? "توقف شمارش" : "شروع شمارش زمان پشت لپ‌تاپ"}
          className="flex items-center gap-1 px-2 py-1 rounded-lg mono tnum text-xs ops-tap"
          style={{ color: tone(t), background: toneSoft(t) }}
        >
          {state.running ? <Pause size={11} /> : <Play size={11} />}
          {format(elapsed)}
        </button>
        {elapsed > 0 && (
          <button
            onClick={reset}
            title="صفر کردن"
            className="p-1 rounded-lg ops-tap"
            style={{ color: C.faint }}
          >
            <RotateCcw size={11} />
            <span className="sr-only">صفر کردن</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: over ? toneSoft("red") : C.panelAlt, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
          <Armchair size={12} className="shrink-0" />
          زمان پشت لپ‌تاپ
        </span>
        <button
          onClick={cycleLimit}
          title="کلیک برای تغییر حد یادآوری"
          className="mono tnum text-xs px-1.5 py-0.5 rounded-md ops-tap"
          style={{ color: C.faint }}
        >
          حد {state.limit}′
        </button>
      </div>

      <div className="mono tnum text-2xl font-bold leading-none mb-2" style={{ color: tone(t) }}>
        {format(elapsed)}
      </div>

      {over && (
        <p className="text-xs mb-2" style={{ color: tone("red") }}>
          وقت بلندشدن و تحرک — بعدش صفرش کن.
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium ops-primary"
        >
          {state.running ? <Pause size={12} /> : <Play size={12} />}
          {state.running ? "توقف" : elapsed > 0 ? "ادامه" : "شروع"}
        </button>
        <button
          onClick={reset}
          title="صفر کردن"
          className="px-2.5 py-1.5 rounded-lg ops-tap"
          style={{ border: `1px solid ${C.border}`, color: C.muted }}
        >
          <RotateCcw size={12} />
          <span className="sr-only">صفر کردن</span>
        </button>
      </div>
    </div>
  );
}
