"use client";
import { Search, X } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";
import { faNum } from "@/lib/format";

export default function SectionToolbar({ value, onChange, placeholder, count, filters = [], selected = "all", onFilter }) {
  return <div className="section-toolbar rounded-xl p-3 mb-5 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
    <div className="relative">
      <Search size={16} className="absolute right-3 top-3" style={{ color: C.faint }} />
      <input aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onChange("")} placeholder={placeholder}
        className="ops-input w-full rounded-lg pr-10 pl-10 py-2.5 text-sm" />
      {value && <button type="button" aria-label="پاک کردن جستجو" onClick={() => onChange("")}
        className="ops-tap absolute left-1 top-1 p-2 rounded-lg"><X size={16} /></button>}
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(({ key, label }) => <button type="button" key={key} onClick={() => onFilter(key)} aria-pressed={selected === key}
        className="ops-tap rounded-lg px-3 py-2 text-xs font-medium"
        style={{ color: selected === key ? tone("blue") : C.muted, background: selected === key ? toneSoft("blue") : C.panelAlt }}>{label}</button>)}
      <span role="status" className="text-xs mr-auto" style={{ color: C.faint }}>{faNum(count)} نتیجه</span>
    </div>
  </div>;
}
