"use client";

import { useState } from "react";
import {
  Pin, PinOff, Copy, Check, ExternalLink, Tag, Link2, ChevronDown,
} from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import ContentEditor from "@/components/ContentEditor";
import { autoGrow } from "@/lib/autoGrow";
import { C, tone, toneSoft } from "@/lib/theme";
import { safeHref, hostOf } from "@/lib/url";
import { PRIORITY, PRIORITY_ORDER } from "@/lib/priority";

export const splitTags = (s) => [...new Set(
  (s || "")
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean))];

/**
 * «باز کردن یک بخشِ خالی» — فقط آیکون، داخل نوار بالای کارت.
 * عمداً ردیف جدا نمی‌گیرد تا یادداشت‌های کوتاه کوتاه بمانند.
 */
function AddFieldButton({ icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="shrink-0 px-2 py-1.5 rounded-lg ops-tap flex items-center gap-1 text-xs"
      style={{ color: C.muted }}
    >
      {icon}
      <span>{title}</span>
    </button>
  );
}

export function CopyButton({ text }) {
  const [ok, setOk] = useState(false);
  if (!text?.trim()) return null;
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          /* اجازه‌ی clipboard داده نشده — بی‌صدا رد می‌شویم */
        }
      }}
      title="کپی متن یادداشت"
      className="shrink-0 p-1.5 rounded-lg ops-tap"
      style={{ color: ok ? tone("jade") : C.faint }}
    >
      {ok ? <Check size={13} /> : <Copy size={13} />}
      <span className="sr-only">کپی</span>
    </button>
  );
}

/**
 * کارت یادداشت — هم در صفحه‌ی /notes و هم در تب یادداشت‌های هر پروژه.
 * `slot` برای افزودن کنترل اضافه (مثلا انتخاب پروژه) بدون شاخه‌زدن در همین فایل.
 */
export default function NoteCard({ note, onPatch, onDelete, slot = null }) {
  const [title, setTitle] = useState(note.title);
  const [url, setUrl] = useState(note.url);
  const [tags, setTags] = useState(note.tags);
  const [editUrl, setEditUrl] = useState(false);
  // بخش‌های خالی رندر نمی‌شوند تا یادداشتِ «فقط عنوان و لینک» جای زیادی نگیرد.
  // openedX یعنی همین حالا با دکمه باز شد → فقط در آن حالت autoFocus بدهیم.
  const [openedTags, setOpenedTags] = useState(false);
  const showTags = openedTags;
  const updated = note.updated_at && !Number.isNaN(Date.parse(note.updated_at))
    ? new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(note.updated_at)) : null;

  const href = safeHref(note.url);
  const p = PRIORITY[note.priority] || PRIORITY.medium;
  const save = (field, value, current) => {
    if (value !== current) onPatch(note.id, { [field]: value });
  };

  return (
    <article
      className="note-card rounded-xl p-4 sm:p-5 ops-card min-w-0"
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRight: `3px solid ${tone(p.tone)}`,
      }}
    >
      <div className="flex items-start gap-2 mb-3">
        <textarea
          ref={autoGrow}
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onInput={(e) => autoGrow(e.currentTarget)}
          onBlur={() => save("title", title, note.title)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder="عنوان یادداشت"
          aria-label="عنوان یادداشت"
          className="flex-1 min-w-0 text-base font-semibold leading-7 bg-transparent outline-none resize-none overflow-hidden rounded-md"
          style={{ color: C.text }}
        />
        <button
          onClick={() => onPatch(note.id, { pinned: !note.pinned })}
          title={note.pinned ? "برداشتن سنجاق" : "سنجاق به بالا"}
          aria-pressed={Boolean(note.pinned)}
          className="shrink-0 p-1.5 rounded-lg ops-tap"
          style={{ color: note.pinned ? tone("amber") : C.faint }}
        >
          {note.pinned ? <Pin size={13} /> : <PinOff size={13} />}
          <span className="sr-only">{note.pinned ? "برداشتن سنجاق" : "سنجاق"}</span>
        </button>
        <ConfirmDelete onConfirm={() => onDelete(note.id)} />
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs mb-2" style={{color:C.muted}}>
        <select aria-label="اهمیت یادداشت" value={note.priority || "medium"}
          onChange={(e) => onPatch(note.id, { priority: e.target.value })}
          className="text-xs font-medium rounded-lg py-1.5 px-2 max-w-[110px]" style={{color:tone(p.tone),background:toneSoft(p.tone)}}>
          {PRIORITY_ORDER.map((key) => <option key={key} value={key}>{PRIORITY[key].label}</option>)}
        </select>
        {note.pinned && <span className="flex items-center gap-1" style={{color:tone("amber")}}><Pin size={11}/>سنجاق‌شده</span>}
        {updated && <span className="mr-auto">ویرایش {updated}</span>}
      </div>

      <ContentEditor value={note.body} label="متن یادداشت" appearance="paper"
        placeholder="جزئیات، ایده‌ها و نکات این یادداشت را بنویس…"
        onSave={(body) => onPatch(note.id, { body })} />

      <div className="flex items-center gap-1 flex-wrap pt-3 mt-3" style={{borderTop:`1px solid ${C.border}`}}>
        {!editUrl && !href && !url.trim() && (
          <AddFieldButton
            icon={<Link2 size={13} />}
            title="افزودن لینک"
            onClick={() => setEditUrl(true)}
          />
        )}
        {!showTags && !note.tags?.trim() && (
          <AddFieldButton
            icon={<Tag size={13} />}
            title="افزودن برچسب"
            onClick={() => setOpenedTags(true)}
          />
        )}
      {editUrl || (!href && url.trim()) ? (
        <input
          autoFocus={editUrl}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => {
            save("url", url, note.url);
            setEditUrl(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="لینک (اختیاری) — example.com"
          aria-label="لینک یادداشت"
          dir="ltr"
          className="w-full mono text-xs px-2 py-1.5 rounded-md outline-none ops-input mb-2 last:mb-0"
        />
      ) : href ? (
        <div className="flex items-center gap-1.5 mb-2 last:mb-0 min-w-0">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            dir="ltr"
            className="mono text-xs truncate underline decoration-dotted underline-offset-2"
            style={{ color: tone("blue") }}
            title={href}
          >
            {hostOf(href)}
          </a>
          <ExternalLink size={11} className="shrink-0" style={{ color: C.faint }} />
          <button
            onClick={() => setEditUrl(true)}
            className="text-xs px-1.5 py-0.5 rounded ops-tap shrink-0"
            style={{ color: C.faint }}
          >
            ویرایش
          </button>
        </div>
      ) : null}

      {showTags && (
        <div className="flex items-center gap-1.5 min-w-0">
          <Tag size={11} className="shrink-0" style={{ color: C.faint }} />
          <input
            autoFocus={openedTags}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onBlur={() => save("tags", tags, note.tags)}
            placeholder="برچسب‌ها با کاما: کاری، ایده"
            aria-label="برچسب‌های یادداشت"
            className="flex-1 min-w-0 text-xs bg-transparent outline-none"
            style={{ color: C.muted }}
          />
        </div>
      )}

      {splitTags(note.tags).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {splitTags(note.tags).map((t) => (
            <span
              key={t}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ color: tone("violet"), background: toneSoft("violet") }}
            >
              {t}
            </span>
          ))}
          {!showTags && <button onClick={() => setOpenedTags(true)} className="ops-tap p-1.5 rounded-lg text-xs" style={{color:C.muted}}>ویرایش برچسب‌ها</button>}
        </div>
      )}
      {showTags && <button onClick={() => setOpenedTags(false)} className="ops-tap p-1.5 rounded-lg text-xs flex items-center gap-1" style={{color:C.muted}}><ChevronDown size={12}/>بستن برچسب‌ها</button>}
      </div>

      {slot && <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>{slot}</div>}
    </article>
  );
}
