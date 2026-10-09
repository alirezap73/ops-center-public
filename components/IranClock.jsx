"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";

const formatter = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran", day: "numeric", month: "long",
});

export default function IranClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = window.setInterval(tick, 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const parts = now ? formatter.formatToParts(now) : [];
  const getPart = (type) => parts.find((part) => part.type === type)?.value || "––";

  return (
    <div className="inline-flex min-w-[200px] shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2"
      style={{ background: C.panelAlt, borderColor: C.border }} title="ساعت محلی تهران · Asia/Tehran">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: toneSoft("jade"), color: tone("jade") }}>
          <Clock3 size={16} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <span className="block text-[11px] font-medium" style={{ color: C.text }}>زمان ایران</span>
          <span className="mt-1 block text-[10px]" style={{ color: C.muted }}>
            {now ? dateFormatter.format(now) : "تهران"}
          </span>
        </div>
      </div>
      <time dateTime={now?.toISOString()} dir="ltr" aria-live="off"
        aria-label={now ? `ساعت ایران ${formatter.format(now)}` : "در حال نمایش ساعت ایران"}
        className="tnum inline-flex w-[4.6rem] shrink-0 items-baseline justify-end gap-0.5 whitespace-nowrap">
        <span className="text-lg font-medium leading-none" style={{ color: C.text }}>{getPart("hour")}:{getPart("minute")}</span>
        <span className="text-[10px] font-normal" style={{ color: C.faint }}>:{getPart("second")}</span>
      </time>
    </div>
  );
}
