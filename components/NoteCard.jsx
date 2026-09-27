"use client";

import { useState } from "react";
import {
  Pin, PinOff, Copy, Check, ExternalLink, Tag, Link2, AlignLeft, ChevronDown, ChevronUp,
} from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import { autoGrow } from "@/lib/autoGrow";
import { C, tone, toneSoft } from "@/lib/theme";
import { safeHref, hostOf } from "@/lib/url";
import { PRIORITY, PRIORITY_ORDER } from "@/lib/priority";

export const splitTags = (s) =>
  (s || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * «باز کردن یک بخشِ خالی» — فقط آیکون، داخل نوار بالای کارت.
 * عمداً ردیف جدا نمی‌گیرد تا یادداشت‌های کوتاه کوتاه بمانند.
 */
function AddFieldButton({ icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="shrink-0 p-1.5 rounded-lg ops-tap"
      style={{ color: C.faint }}
    >
      {icon}
      <span className="sr-only">{title}</span>
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
  const [body, setBody] = useState(note.body);
  const [tags, setTags] = useState(note.tags);
  const [editUrl, setEditUrl] = useState(false);
  // بخش‌های خالی رندر نمی‌شوند تا یادداشتِ «فقط عنوان و لینک» جای زیادی نگیرد.
  // openedX یعنی همین حالا با دکمه باز شد → فقط در آن حالت autoFocus بدهیم.
  const [openedBody, setOpenedBody] = useState(false);
  const [openedTags, setOpenedTags] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [expandedBody, setExpandedBody] = useState(false);
  const showBody = openedBody || Boolean(note.body?.trim());
  const showTags = openedTags || Boolean(note.tags?.trim());
  // تقریبِ تعداد خط برای تصمیم به نمایش دکمه‌ی «نمایش کامل»
  const bodyLines = (note.body || "")
    .split("\n")
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 42)), 0);

  const href = safeHref(note.url);
  const p = PRIORITY[note.priority] || PRIORITY.medium;
  const save = (field, value, current) => {
    if (value !== current) onPatch(note.id, { [field]: value });
  };

  return (
    <article
      className="rounded-xl p-4 ops-card"
      style={{
        background: toneSoft(p.tone),
        border: `1px solid ${C.border}`,
        borderRight: `3px solid ${tone(p.tone)}`,
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <button
          onClick={() =>
            onPatch(note.id, {
              priority: PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(note.priority) + 1) % PRIORITY_ORDER.length],
            })
          }
          title="کلیک برای تغییر اهمیت"
          className="flex items-center gap-1 text-xs font-medium px-1.5 py-1 -mr-1.5 rounded-md ops-tap shrink-0"
          style={{ color: tone(p.tone) }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(p.tone) }} />
          {p.label}
        </button>
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
          className="flex-1 min-w-0 text-sm font-semibold leading-snug bg-transparent outline-none resize-none overflow-hidden"
          style={{ color: C.text }}
        />
        <button
          onClick={() => onPatch(note.id, { pinned: !note.pinned })}
          title={note.pinned ? "برداشتن سنجاق" : "سنجاق به بالا"}
          className="shrink-0 p-1.5 rounded-lg ops-tap"
          style={{ color: note.pinned ? tone("amber") : C.faint }}
        >
          {note.pinned ? <Pin size={13} /> : <PinOff size={13} />}
          <span className="sr-only">{note.pinned ? "برداشتن سنجاق" : "سنجاق"}</span>
        </button>
        <CopyButton text={note.body} />
        {!href && !url.trim() && (
          <AddFieldButton
            icon={<Link2 size={13} />}
            title="افزودن لینک"
            onClick={() => setEditUrl(true)}
          />
        )}
        {!showBody && (
          <AddFieldButton
            icon={<AlignLeft size={13} />}
            title="افزودن محتوا"
            onClick={() => setOpenedBody(true)}
          />
        )}
        {!showTags && (
          <AddFieldButton
            icon={<Tag size={13} />}
            title="افزودن برچسب"
            onClick={() => setOpenedTags(true)}
          />
        )}
        <ConfirmDelete onConfirm={() => onDelete(note.id)} />
      </div>

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

      {/* متن تا سه خط بریده می‌شود و فقط موقع ویرایش کامل باز می‌شود —
          وگرنه یک یادداشت بلند کل ستون را می‌گرفت */}
      {showBody && (editingBody ? (
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => {
            save("body", body, note.body);
            setEditingBody(false);
          }}
          rows={Math.min(14, Math.max(3, body.split("\n").length))}
          placeholder="محتوا، یوزرنیم، اسنیپت، یادداشت فنی..."
          className="w-full text-sm leading-relaxed px-2 py-1.5 rounded-md outline-none resize-y ops-input mb-2 last:mb-0"
        />
      ) : (
        <button
          onClick={() => setEditingBody(true)}
          title="کلیک برای ویرایش"
          className={`block w-full text-right text-sm leading-relaxed px-2 py-1.5 rounded-md whitespace-pre-wrap break-words ops-tap mb-2 last:mb-0 ${
            expandedBody ? "" : "line-clamp-3"
          }`}
          style={{ color: note.body?.trim() ? C.text : C.faint }}
        >
          {note.body?.trim() || "محتوا، یوزرنیم، اسنیپت، یادداشت فنی..."}
        </button>
      ))}

      {showBody && !editingBody && bodyLines > 3 && (
        <button
          onClick={() => setExpandedBody((v) => !v)}
          className="flex items-center gap-1 text-xs px-1.5 py-0.5 -mr-1.5 rounded-md ops-tap mb-2"
          style={{ color: tone("blue") }}
        >
          {expandedBody ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expandedBody ? "بستن" : "نمایش کامل"}
        </button>
      )}

      {showTags && (
        <div className="flex items-center gap-1.5 min-w-0">
          <Tag size={11} className="shrink-0" style={{ color: C.faint }} />
          <input
            autoFocus={openedTags}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onBlur={() => save("tags", tags, note.tags)}
            placeholder="برچسب‌ها با کاما: فروشگاه, هاست"
            className="flex-1 min-w-0 text-xs bg-transparent outline-none"
            style={{ color: C.muted }}
          />
        </div>
      )}

      {splitTags(note.tags).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {splitTags(note.tags).map((t) => (
            <span
              key={t}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ color: tone("violet"), background: toneSoft("violet") }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {slot && <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>{slot}</div>}
    </article>
  );
}
