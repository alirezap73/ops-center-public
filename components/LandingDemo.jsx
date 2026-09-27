"use client";
import { useState } from "react";
import { Check, Circle, Layers, RotateCcw } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";

const VIEWS = [
  { id: "projects", label: "پروژه‌ها", title: "فروشگاه دست‌ساز", subtitle: "قدم بعدی روشنه؛ یکی‌یکی پیش برو.", tasks: ["طراحی صفحه محصول", "بررسی نمایش موبایل", "نوشتن متن درباره ما"], color: "jade" },
  { id: "today", label: "کارهای امروز", title: "امروز، همین سه کار", subtitle: "یک فهرست کوتاه برای یک روز پربار.", tasks: ["مرور بازخورد مشتری‌ها", "آماده‌کردن عکس محصول", "برنامه‌ریزی فردا"], color: "blue" },
  { id: "content", label: "محتوا", title: "از ایده تا انتشار", subtitle: "قدم‌های آماده‌سازی محتوای این هفته.", tasks: ["انتخاب موضوع پست", "نوشتن پیش‌نویس", "بازبینی متن نهایی"], color: "violet" },
];

export default function LandingDemo() {
  const [active, setActive] = useState("projects");
  const [completed, setCompleted] = useState({ projects: [2], today: [], content: [0] });
  const view = VIEWS.find(item => item.id === active);
  const done = completed[active];
  const percent = Math.round(done.length / view.tasks.length * 100);
  return <div id="try-it" className="landing-demo scroll-mt-24 min-w-0">
    <div className="flex justify-between gap-2 px-4 py-3 text-xs" style={{ background: C.panelAlt, borderBottom: `1px solid ${C.border}` }}><span style={{ color: tone("jade") }}>● پیش‌نمایش تعاملی</span><span className="mono" dir="ltr" style={{ color: C.faint }}>DADASH / DEMO</span></div>
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-7" aria-label="انتخاب نمای آزمایشی">{VIEWS.map(item => <button key={item.id} type="button" aria-pressed={active === item.id} onClick={() => setActive(item.id)} className="text-xs sm:text-sm px-3 py-2 rounded-xl ops-tap" style={{ color: active === item.id ? tone(item.color) : C.muted, background: active === item.id ? toneSoft(item.color) : C.panelAlt }}>{item.label}</button>)}</div>
      <div className="flex justify-between gap-4"><div><p className="text-xs mb-2" style={{ color: tone(view.color) }}>فضای کار نمونه / شخصی</p><h2 className="text-xl font-bold">{view.title}</h2><p className="text-xs leading-6 mt-2" style={{ color: C.muted }}>{view.subtitle}</p></div><Layers size={24} className="shrink-0" style={{ color: tone(view.color) }} /></div>
      <div className="my-6"><div className="flex justify-between text-xs mb-2" style={{ color: C.muted }}><span>پیشرفت این نمونه</span><span aria-live="polite">{percent.toLocaleString("fa-IR")}٪</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background: C.border }}><div className="h-full rounded-full landing-demo-progress" style={{ width: `${percent}%`, background: tone(view.color) }} /></div></div>
      <div className="space-y-3">{view.tasks.map((task, index) => <button key={`${active}-${index}`} type="button" aria-pressed={done.includes(index)} onClick={() => setCompleted(previous => ({ ...previous, [active]: previous[active].includes(index) ? previous[active].filter(item => item !== index) : [...previous[active], index] }))} className="landing-demo-task w-full flex items-center gap-3 text-right p-3 sm:p-4 rounded-xl" style={{ border: `1px solid ${done.includes(index) ? tone(view.color) : C.border}`, background: done.includes(index) ? toneSoft(view.color) : C.panelAlt }}>
        <span className="shrink-0" style={{ color: done.includes(index) ? tone(view.color) : C.faint }}>{done.includes(index) ? <Check size={19} /> : <Circle size={19} />}</span><span className={`text-sm flex-1 ${done.includes(index) ? "line-through" : ""}`}>{task}</span><span className="text-xs hidden sm:inline" style={{ color: C.muted }}>{done.includes(index) ? "انجام شد" : "تیک بزن"}</span>
      </button>)}</div>
      <div className="mt-5 flex justify-between items-center gap-2 text-xs"><p role="status" style={{ color: tone(view.color) }}>{done.length === 3 ? "همه کارهای این نمونه انجام شد!" : "روی یک کار بزن؛ پیشرفت را ببین."}</p><button type="button" onClick={() => setCompleted(previous => ({ ...previous, [active]: [] }))} className="p-2 rounded-lg ops-tap" aria-label="شروع دوباره نمونه" style={{ color: C.muted }}><RotateCcw size={15} /></button></div>
    </div>
    <p className="px-4 sm:px-6 py-3 text-xs leading-6" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>این فقط یک نمونه است؛ تغییراتش در حساب ذخیره نمی‌شوند.</p>
  </div>;
}
