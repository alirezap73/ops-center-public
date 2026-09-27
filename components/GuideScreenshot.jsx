"use client";

import { useRef } from "react";
import { Maximize2, X } from "lucide-react";
import { C, tone } from "@/lib/theme";

export default function GuideScreenshot({ name, title, caption }) {
  const dialog = useRef(null);
  const source = `/guide/${name}.png`;
  const compact = ["notes", "ideas", "tasks", "roadmap"].includes(name);
  const width = compact ? 1100 : 1440;
  const height = compact ? 820 : ["projects", "backup", "content", "links-competitors"].includes(name) ? 1000 : 1050;
  return (
    <figure className="my-5">
      <button type="button" onClick={() => dialog.current.showModal()} className="block w-full overflow-hidden rounded-xl text-right ops-tap" style={{ border: `1px solid ${C.borderStrong}`, background: C.bg }} aria-label={`بزرگ‌نمایی تصویر ${title}`}>
        <img src={source} alt={`تصویر بخش ${title} در پنل داداش با اطلاعات نمونه`} loading="lazy" decoding="async" width={width} height={height} className="block w-full h-auto" />
        <span className="flex items-center justify-between gap-2 px-3 py-2 text-xs" style={{ color: C.muted }}><span>نمای واقعی پنل · داده‌های نمونه</span><span className="inline-flex items-center gap-1" style={{ color: tone("jade") }}><Maximize2 size={13} /> بزرگ‌نمایی</span></span>
      </button>
      <figcaption className="text-xs leading-6 mt-2" style={{ color: C.muted }}>{caption}</figcaption>
      <dialog ref={dialog} aria-label={`تصویر بزرگ ${title}`} className="rounded-2xl p-0 w-[96vw] max-w-[1600px] max-h-[94vh] backdrop:bg-black/80" style={{ color: C.text, background: C.panel, border: `1px solid ${C.borderStrong}` }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }}>
        <div className="sticky top-0 flex justify-between items-center gap-4 p-3 border-b" style={{ background: C.panel, borderColor: C.border }}>
          <span className="text-sm font-semibold">{title}</span>
          <button type="button" autoFocus onClick={() => dialog.current.close()} className="p-2 rounded-lg ops-tap" aria-label="بستن تصویر"><X size={20} /></button>
        </div>
        { /* The full image stays scrollable on small screens for readable labels. */ }
        <div className="overflow-auto" tabIndex={0} aria-label="تصویر قابل پیمایش"><img src={source} alt={`جزئیات ${title}`} loading="lazy" className="block w-full min-w-[900px] h-auto" /></div>
        <p className="p-3 text-sm leading-7" style={{ color: C.muted }}>{caption}</p>
      </dialog>
    </figure>
  );
}
