"use client";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";

export default function DetailActions({ open, saving, hasDraft, hasContent, preview, openLabel, controls, onWrite, onToggle, toggleRef }) {
  return <div className="flex flex-wrap items-center gap-2">
    <div className="min-w-0 basis-full sm:basis-auto sm:flex-1 text-xs leading-6" style={{ color: C.muted }}>
      <p className="truncate">{open ? openLabel : preview}</p>
      {hasDraft && <span className="inline-block rounded-md px-2 py-0.5 text-[11px]" style={{ color: tone("amber"), background: toneSoft("amber") }}>پیش‌نویس ذخیره‌نشده</span>}
    </div>
    <div className="mr-auto flex shrink-0 items-center gap-2">
      <button type="button" disabled={saving} onClick={onWrite}
        className="ops-tap flex w-[7.5rem] items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs disabled:opacity-50"
        style={{ color: tone("blue"), background: toneSoft("blue") }}>
        <Pencil size={13} />{hasDraft ? "ادامه نوشتن" : hasContent ? "ویرایش محتوا" : "نوشتن محتوا"}
      </button>
      <button ref={toggleRef} type="button" disabled={saving} onClick={onToggle} aria-expanded={open} aria-controls={controls}
        className="ops-tap ops-primary flex min-w-[9rem] items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium">
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {open ? "جمع کردن جزئیات" : "مشاهده جزئیات"}
      </button>
    </div>
  </div>;
}
