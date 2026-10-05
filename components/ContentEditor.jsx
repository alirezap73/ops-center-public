"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pencil, Plus, ChevronDown, ChevronUp, Check, Copy } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";

/** Selectable reading view and an explicit, failure-safe writing mode. */
export default function ContentEditor({ value = "", label = "متن یادداشت", placeholder = "متن را اینجا بنویس…", onSave, appearance = "inset" }) {
  const id = useId();
  const preview = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const content = value || "";
  const dirty = draft !== content;

  useEffect(() => {
    if (!editing) setDraft(content);
  }, [content, editing]);

  useEffect(() => {
    if (!editing || !dirty) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editing, dirty]);

  useEffect(() => {
    const el = preview.current;
    if (!el) return;
    const measure = () => setOverflow(el.scrollHeight > 120);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [content, editing]);

  const begin = () => {
    setDraft(content);
    setMessage("");
    setEditing(true);
  };
  const cancel = () => {
    if (saving) return;
    setDraft(content);
    setEditing(false);
    setMessage("");
  };
  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setMessage("");
    try {
      const result = await onSave(draft);
      if (result === false) throw new Error("save failed");
      setEditing(false);
      setMessage("ذخیره شد");
    } catch {
      setMessage("ذخیره نشد؛ متن شما اینجا محفوظ است. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`mt-3 rounded-lg min-w-0 ${appearance === "paper" ? "pt-3" : "p-3"}`} aria-label={label}
      style={{ border: appearance === "paper" ? undefined : `1px solid ${C.border}`, borderTop: appearance === "paper" ? `1px solid ${C.border}` : undefined, background: appearance === "paper" ? "transparent" : C.panel }}>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <label htmlFor={editing ? id : undefined} className="text-xs font-semibold" style={{ color: C.muted }}>{label}</label>
        {!editing && <div className="flex items-center gap-1">
          {content.trim() && <button type="button" className="ops-tap rounded-md px-2 py-1.5 text-xs flex items-center gap-1"
            style={{ color: C.muted }} onClick={async () => {
              try { await navigator.clipboard.writeText(content); setMessage("متن کپی شد"); }
              catch { setMessage("کپی نشد؛ متن را انتخاب و دستی کپی کنید."); }
            }} aria-label={`کپی ${label}`}><Copy size={13} />کپی</button>}
          <button type="button" onClick={begin} className="ops-tap rounded-md px-2 py-1.5 text-xs flex items-center gap-1"
            style={{ color: tone("blue"), background: toneSoft("blue") }} aria-label={`${content.trim() ? "ویرایش" : "افزودن"} ${label}`}>
            {content.trim() ? <Pencil size={13} /> : <Plus size={13} />}{content.trim() ? "ویرایش متن" : "افزودن متن"}
          </button>
        </div>}
      </div>
      {editing ? <>
        <textarea id={id} autoFocus value={draft} disabled={saving} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(); }
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }} rows={7} dir="auto" placeholder={placeholder}
          className="ops-input w-full rounded-lg p-3 text-sm leading-7 resize-y outline-none focus:ring-2 focus:ring-blue-400 min-h-[180px] max-h-[65vh]" />
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <button type="button" disabled={saving || !dirty} onClick={save}
            className="ops-tap rounded-lg px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-50"
            style={{ background: tone("blue"), color: "#fff" }}><Check size={14} />{saving ? "در حال ذخیره…" : "ذخیره متن"}</button>
          <button type="button" disabled={saving} onClick={cancel} className="ops-tap rounded-lg px-3 py-2 text-xs" style={{ color: C.muted }}>لغو</button>
          <span className="text-xs" style={{ color: C.faint }}>{dirty ? "تغییرات ذخیره‌نشده" : "بدون تغییر"} · {draft.length.toLocaleString("fa-IR")} نویسه</span>
        </div>
        <p className="text-xs mt-2" style={{ color: C.faint }}>ذخیره: Ctrl / ⌘ + Enter · با کلیک بیرون، ویرایش بسته نمی‌شود.</p>
      </> : content.trim() ? <>
        <div id={`${id}-preview`} ref={preview} dir="auto"
          className="text-sm leading-6 whitespace-pre-wrap break-words select-text overflow-hidden"
          style={{ color: C.text, maxHeight: expanded ? undefined : 120, overflowWrap: "anywhere" }}>{content}</div>
        {overflow && <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={`${id}-preview`}
          className="ops-tap rounded-md px-2 py-2 mt-1 text-xs flex items-center gap-1" style={{ color: tone("blue") }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{expanded ? "نمایش خلاصه" : "خواندن متن کامل"}</button>}
      </> : <p className="text-xs leading-6" style={{ color: C.faint }}>هنوز متنی ثبت نشده؛ با «افزودن متن» شروع کنید.</p>}
      <p role="status" aria-live="polite" className={message ? "mt-2 text-xs leading-6" : "sr-only"}
        style={{ color: message.startsWith("ذخیره نشد") ? tone("red") : tone("jade") }}>{message}</p>
    </section>
  );
}
