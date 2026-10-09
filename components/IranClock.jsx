"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { C, tone } from "@/lib/theme";

const formatter = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
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

  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs"
      style={{ background: C.panelAlt, color: C.muted }} title="ساعت محلی تهران">
      <Clock3 size={14} aria-hidden="true" style={{ color: tone("jade") }} />
      <span>زمان ایران</span>
      <time dateTime={now?.toISOString()} dir="ltr" aria-live="off"
        className="tnum inline-block min-w-[4.5rem] text-center font-medium"
        style={{ color: C.text }}>
        {now ? formatter.format(now) : "––:––:––"}
      </time>
    </div>
  );
}
