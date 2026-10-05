"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Plus, X, Search, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme, tone, toneSoft } from "@/lib/theme";
import NoteCard, { splitTags } from "@/components/NoteCard";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { useFlash } from "@/lib/useFlash";

export default function Notes({ initialNotes, loadError }) {
  const { theme, toggleTheme, mounted, C } = useTheme();
  const [notes, setNotes] = useState(() => (initialNotes || []).filter((note) => note.project_id == null));
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ title: "", url: "", body: "", tags: "" });
  const [errorMsg, flash] = useFlash();
  const supabase = createClient();

  const allTags = useMemo(() => {
    const set = new Set();
    for (const n of notes) splitTags(n.tags).forEach((t) => set.add(t));
    return [...set].sort((a, b) => a.localeCompare(b, "fa"));
  }, [notes]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => (activeTag ? splitTags(n.tags).includes(activeTag) : true))
      .filter((n) =>
        !q
          ? true
          : [n.title, n.body, n.url, n.tags].some((f) => (f || "").toLowerCase().includes(q))
      )
      .slice()
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          String(b.updated_at).localeCompare(String(a.updated_at))
      );
  }, [notes, search, activeTag]);

  const addNote = async () => {
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title && !body) return flash("حداقل عنوان یا محتوا را بنویس.");
    const { data, error } = await supabase
      .from("notes")
      .insert({
        project_id: null,
        title: title || "بدون عنوان",
        url: draft.url.trim(),
        body,
        tags: splitTags(draft.tags).join(", "),
      })
      .select()
      .single();
    if (error) return flash("خطا در ساخت یادداشت: " + error.message);
    setNotes((prev) => [data, ...prev]);
    setDraft({ title: "", url: "", body: "", tags: "" });
    setShowAdd(false);
  };

  // تغییر خوش‌بینانه است، ولی اگر ذخیره نشد به حالت قبل برمی‌گردیم
  const patchNote = async (id, patch) => {
    const snapshot = notes;
    setNotes((p) =>
      p.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n))
    );
    const { error } = await supabase.from("notes").update(patch).eq("id", id).is("project_id", null);
    if (error) {
      setNotes(snapshot);
      flash("خطا در ذخیره تغییرات: " + error.message);
      return false;
    }
    return true;
  };

  const deleteNote = async (id) => {
    const snapshot = notes;
    setNotes((p) => p.filter((n) => n.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id).is("project_id", null);
    if (error) {
      setNotes(snapshot);
      flash("خطا در حذف: " + error.message);
    }
  };

  return (
    <div dir="rtl" lang="fa" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader theme={theme} toggleTheme={toggleTheme} mounted={mounted} />

        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <NotebookPen size={16} style={{ color: tone("violet") }} />
              <span className="mono text-xs tracking-[0.2em]" style={{ color: C.muted }}>DADASH//</span>
            </div>
            <h1 className="text-xl font-bold">یادداشت‌های روزانه</h1>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium ops-primary shrink-0"
          >
            <Plus size={13} className="shrink-0" /> یادداشت جدید
          </button>
        </div>
        <p className="text-sm mt-1 mb-4" style={{ color: C.muted }}>
          یادداشت‌های شخصی و روزانه، مستقل از پروژه‌ها. یادداشت‌های هر پروژه را داخل همان پروژه، در تب «یادداشت‌ها» ببین.
        </p>

        {/* هشدار امنیتی: این متن عمداً همیشه دیده می‌شود */}
        <div
          className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
          style={{ background: toneSoft("amber"), color: tone("amber") }}
        >
          <ShieldAlert size={14} className="shrink-0 mt-px" />
          <span>
            محتوای یادداشت‌ها <strong>رمزنگاری نشده</strong> و به‌صورت متن ساده در دیتابیس ذخیره می‌شود.
            رمز عبور واقعی اینجا ننویس — در password manager نگه‌دار و اینجا فقط ارجاع بگذار.
          </span>
        </div>

        {loadError && (
          <div
            className="mb-4 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
            style={{ background: toneSoft("red"), color: tone("red") }}
            role="alert"
          >
            خواندن یادداشت‌ها با خطا مواجه شد: {loadError}
            <br />
            اگر جدول <span className="mono">notes</span> را نساخته‌ای، اسکریپت SQL را اجرا کن.
          </div>
        )}

        {errorMsg && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-xs"
            style={{ background: toneSoft("red"), color: tone("red") }}
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        {showAdd && (
          <div className="mb-5 p-3 rounded-xl" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="عنوان"
              className="w-full text-sm px-3 py-2 rounded-lg mb-2 outline-none ops-input"
            />
            <input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="لینک (اختیاری)"
              dir="ltr"
              className="w-full mono text-xs px-3 py-2 rounded-lg mb-2 outline-none ops-input"
            />
            <label htmlFor="new-note-body" className="block text-xs font-medium mb-2" style={{ color: C.muted }}>متن یادداشت</label>
            <textarea
              id="new-note-body"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="جزئیات، ایده‌ها و نکات یادداشت را اینجا بنویس…"
              rows={6}
              className="w-full text-sm leading-relaxed px-3 py-2 rounded-lg mb-2 outline-none resize-y ops-input"
            />
            <input
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              placeholder="برچسب‌ها با کاما: کاری، ایده"
              className="w-full text-xs px-3 py-2 rounded-lg mb-2 outline-none ops-input"
            />
            <div className="flex gap-2">
              <button onClick={addNote} className="flex-1 text-xs py-2 rounded-lg font-medium ops-primary">
                افزودن
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 rounded-lg text-xs ops-tap"
                style={{ color: C.muted }}
              >
                انصراف
              </button>
            </div>
          </div>
        )}

        {/* جستجو + برچسب‌ها */}
        {notes.length > 0 && (
          <div className="mb-5">
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none"
                style={{ color: C.faint }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearch("")}
                placeholder="جستجو در عنوان، محتوا، لینک و برچسب..."
                className={`w-full text-sm pr-8 py-2 rounded-lg outline-none ops-input ${
                  search ? "pl-9" : "pl-3"
                }`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  title="پاک کردن جستجو (Esc)"
                  className="absolute top-1/2 -translate-y-1/2 left-2 p-1 rounded-md ops-tap"
                  style={{ color: C.faint }}
                >
                  <X size={13} />
                  <span className="sr-only">پاک کردن جستجو</span>
                </button>
              )}
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {allTags.map((t) => {
                  const on = activeTag === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTag(on ? null : t)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full ops-tap"
                      style={{
                        color: on ? tone("violet") : C.faint,
                        background: on ? toneSoft("violet") : "transparent",
                        border: `1px solid ${on ? "transparent" : C.border}`,
                      }}
                    >
                      {on && <X size={10} className="shrink-0" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {notes.length === 0 && !showAdd && (
          <EmptyState icon={NotebookPen} dashed>هنوز یادداشت روزانه‌ای ثبت نشده. یادداشت‌های پروژه‌ها داخل خودشان هستند.</EmptyState>
        )}

        {notes.length > 0 && visible.length === 0 && (
          <EmptyState icon={Search} dashed>یادداشتی با این فیلتر پیدا نشد.</EmptyState>
        )}

        {/* A stable reading order and enough room for writing long notes. */}
        <div className="flex flex-col gap-3">
          {visible.map((n) => (
            <div key={n.id}>
            <NoteCard
              note={n}
              onPatch={patchNote}
              onDelete={deleteNote}
            />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
