"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pencil, Plus, ChevronDown, ChevronUp, Check, Copy, FileText } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";
import DetailActions from "@/components/DetailActions";

/** Selectable reading view and an explicit, failure-safe writing mode. */
export default function ContentEditor({ value = "", label = "متن یادداشت", placeholder = "متن را اینجا بنویس…", onSave, appearance = "inset", collapsible = false, defaultExpanded = false, editRequest = 0, onStateChange, detailActions = false }) {
  const id = useId();
  const preview = useRef(null);
  const input = useRef(null);
  const toggle = useRef(null);
  const lastEditRequest = useRef(editRequest);
  const [collapsed, setCollapsed] = useState(collapsible && !defaultExpanded);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const content = value || "";
  const dirty = draft !== content;

  useEffect(() => {
    onStateChange?.({ dirty: editing && dirty, saving });
  }, [editing, dirty, saving, onStateChange]);

  useEffect(() => {
    if (editRequest === lastEditRequest.current) return;
    lastEditRequest.current = editRequest;
    if (!editing) setDraft(content);
    setEditing(true);
    setCollapsed(false);
    setMessage("");
  }, [editRequest, editing, content]);

  useEffect(() => {
    if (editing && !collapsed) input.current?.focus();
  }, [editing, collapsed, editRequest]);

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
    if (!editing) setDraft(content);
    setMessage("");
    setEditing(true);
    setCollapsed(false);
    setConfirmDiscard(false);
  };
  const fold = () => {
    if (saving) return;
    setCollapsed(true);
    setConfirmDiscard(false);
    toggle.current?.focus();
  };
  const cancel = () => {
    if (saving) return;
    if (dirty && !confirmDiscard) { setConfirmDiscard(true); return; }
    setDraft(content);
    setEditing(false);
    setMessage("");
    setConfirmDiscard(false);
    if (collapsible) window.requestAnimationFrame(() => toggle.current?.focus());
  };
  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setMessage("");
    try {
      const result = await onSave(draft);
      if (result === false) throw new Error("save failed");
      setEditing(false);
      setConfirmDiscard(false);
      setMessage("ذخیره شد");
      if (collapsible) window.requestAnimationFrame(() => toggle.current?.focus());
    } catch {
      setMessage("ذخیره نشد؛ متن شما اینجا محفوظ است. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`mt-3 rounded-lg min-w-0 ${appearance === "paper" ? "pt-3" : "p-3"}`} aria-label={label}
      style={{ border: appearance === "paper" ? undefined : `1px solid ${C.border}`, borderTop: appearance === "paper" ? `1px solid ${C.border}` : undefined, background: appearance === "paper" ? "transparent" : C.panel }}>
      {detailActions && <DetailActions open={!collapsed} saving={saving} hasDraft={editing && dirty} hasContent={Boolean(content.trim())}
        preview={content.trim() || "هنوز محتوایی ثبت نشده است."} openLabel={label} controls={`${id}-content`} toggleRef={toggle}
        onWrite={begin} onToggle={() => collapsed ? setCollapsed(false) : fold()} />}
      <div className={detailActions && collapsed ? "hidden" : "flex items-center justify-between gap-2 flex-wrap mt-2"}>
        {collapsible && !detailActions ? <button ref={toggle} type="button" disabled={saving}
          onClick={() => collapsed ? setCollapsed(false) : fold()} aria-expanded={!collapsed} aria-controls={`${id}-content`}
          aria-label={`${collapsed ? "باز کردن" : "جمع کردن"} ${label}`}
          className="ops-tap flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-right">
          <FileText size={15} className="shrink-0" style={{ color: tone("blue") }} />
          <span className="text-xs font-medium" style={{ color: C.text }}>{label}</span>
          {editing && dirty && <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: toneSoft("amber"), color: tone("amber") }}>پیش‌نویس</span>}
          <span className="mr-auto" style={{ color: C.faint }}>{collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</span>
        </button> : <label htmlFor={editing ? id : undefined} className="text-xs font-semibold" style={{ color: C.muted }}>{label}</label>}
        {(!editing || collapsed) && <div className="flex items-center gap-1">
          {content.trim() && <button type="button" className="ops-tap rounded-md px-2 py-1.5 text-xs flex items-center gap-1"
            style={{ color: C.muted }} onClick={async () => {
              try { await navigator.clipboard.writeText(content); setMessage("متن کپی شد"); }
              catch { setMessage("کپی نشد؛ متن را انتخاب و دستی کپی کنید."); }
            }} aria-label={`کپی ${label}`}><Copy size={13} />کپی</button>}
          {!detailActions && <button type="button" onClick={begin} className="ops-tap rounded-md px-2 py-1.5 text-xs flex items-center gap-1"
            style={{ color: tone("blue"), background: toneSoft("blue") }} aria-label={`${editing ? "ادامه نوشتن" : content.trim() ? "ویرایش" : "افزودن"} ${label}`}>
            {content.trim() || editing ? <Pencil size={13} /> : <Plus size={13} />}{editing ? "ادامه نوشتن" : content.trim() ? "ویرایش" : "نوشتن"}
          </button>}
        </div>}
      </div>
      {collapsible && collapsed && !detailActions && <p dir="auto" className="mt-1 truncate text-xs leading-6" style={{ color: C.muted }}>
        {editing && dirty ? "متن ناتمام حفظ شده؛ برای ادامه، بخش را باز کنید." : content.trim() || "هنوز متنی نیست؛ با «نوشتن» شروع کنید."}
      </p>}
      <div id={`${id}-content`} hidden={collapsible && collapsed} className="mt-2">
      {editing ? <>
        <label htmlFor={id} className="sr-only">{label}</label>
        <textarea ref={input} id={id} value={draft} disabled={saving} onChange={(e) => { setDraft(e.target.value); setConfirmDiscard(false); }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(); }
            if (e.key === "Escape") { e.preventDefault(); collapsible ? fold() : cancel(); }
          }} rows={7} dir="auto" placeholder={placeholder}
          className="ops-input w-full rounded-lg p-3 text-sm leading-7 resize-y outline-none focus:ring-2 focus:ring-blue-400 min-h-[180px] max-h-[65vh]" />
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <button type="button" disabled={saving || !dirty} onClick={save}
            className="ops-tap rounded-lg px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-50"
            style={{ background: tone("blue"), color: "#fff" }}><Check size={14} />{saving ? "در حال ذخیره…" : "ذخیره متن"}</button>
          <button type="button" disabled={saving} onClick={cancel} className="ops-tap rounded-lg px-3 py-2 text-xs" style={{ color: C.muted }}>لغو</button>
          {collapsible && !detailActions && <button type="button" disabled={saving} onClick={fold} className="ops-tap mr-auto rounded-lg px-3 py-2 text-xs flex items-center gap-1" style={{ color: C.muted }}><ChevronUp size={13} />جمع کردن</button>}
          <span className="text-xs" style={{ color: C.faint }}>{dirty ? "تغییرات ذخیره‌نشده" : "بدون تغییر"} · {draft.length.toLocaleString("fa-IR")} نویسه</span>
        </div>
        {confirmDiscard && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg p-3 text-xs" style={{ background: toneSoft("amber"), color: tone("amber") }}>
          <span className="w-full">تغییرات هنوز ذخیره نشده‌اند. کنار گذاشته شوند؟</span>
          <button type="button" onClick={cancel} className="ops-tap rounded-md px-2 py-2 font-medium">کنار گذاشتن تغییرات</button>
          <button type="button" onClick={() => { setConfirmDiscard(false); input.current?.focus(); }} className="ops-tap rounded-md px-2 py-2">ادامه ویرایش</button>
        </div>}
        <p className="text-xs mt-2" style={{ color: C.faint }}>ذخیره: Ctrl / ⌘ + Enter{collapsible ? " · جمع کردن، متن ناتمام را حفظ می‌کند؛ تا وقتی در این بخش هستید." : " · با کلیک بیرون، ویرایش بسته نمی‌شود."}</p>
      </> : content.trim() ? <>
        <div id={`${id}-preview`} ref={preview} dir="auto"
          className="text-sm leading-6 whitespace-pre-wrap break-words select-text overflow-hidden"
          style={{ color: C.text, maxHeight: collapsible || expanded ? undefined : 120, overflowWrap: "anywhere" }}>{content}</div>
        {!collapsible && overflow && <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={`${id}-preview`}
          className="ops-tap rounded-md px-2 py-2 mt-1 text-xs flex items-center gap-1" style={{ color: tone("blue") }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{expanded ? "نمایش خلاصه" : "خواندن متن کامل"}</button>}
      </> : <p className="text-xs leading-6" style={{ color: C.faint }}>هنوز متنی ثبت نشده؛ با «{collapsible ? "نوشتن" : "افزودن متن"}» شروع کنید.</p>}
      {collapsible && !detailActions && !editing && content.trim() && <button type="button" onClick={fold} className="ops-tap mt-2 flex items-center gap-1 rounded-lg px-2 py-2 text-xs" style={{ color: C.muted }}><ChevronUp size={13} />جمع کردن متن</button>}
      </div>
      <p role="status" aria-live="polite" className={message ? "mt-2 text-xs leading-6" : "sr-only"}
        style={{ color: message.startsWith("ذخیره نشد") ? tone("red") : tone("jade") }}>{message}</p>
    </section>
  );
}
