"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lightbulb, Plus, ChevronUp, ChevronDown } from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { useTheme, tone, toneSoft } from "@/lib/theme";
import { faNum } from "@/lib/format";
import { useFlash } from "@/lib/useFlash";
import { autoGrow } from "@/lib/autoGrow";

/**
 * رتبه‌ی ۱ برجسته، ۲ و ۳ نیمه‌برجسته، بقیه خنثی ولی همچنان رنگ‌دار —
 * قبلا از رتبه‌ی ۴ به بعد null برمی‌گشت و آن کارت‌ها کاملا بی‌رنگ می‌شدند،
 * یعنی لیست بلند دو نیمه‌ی ناهمخوان داشت.
 */
function rankTone(rank) {
  if (rank === 1) return "amber";
  if (rank <= 3) return "blue";
  return "slate";
}

function IdeaCard({ idea, rank, total, C, onSaveField, onDelete, onMove }) {
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description);
  const areaRef = useRef(null);

  useEffect(() => autoGrow(areaRef.current), [description]);

  const t = rankTone(rank);
  const isFirst = rank === 1;
  const isLast = rank === total;

  return (
    <li
      className="flex items-start gap-3 rounded-xl p-3.5 ops-card"
      style={{
        background: toneSoft(t),
        border: `1px solid ${C.border}`,
        borderRight: `3px solid ${tone(t)}`,
      }}
    >
      {/* رتبه */}
      <div
        className="shrink-0 flex items-center justify-center rounded-lg font-bold tnum"
        style={{
          width: 34,
          height: 34,
          fontSize: rank > 99 ? 13 : 15,
          color: tone(t),
          // پس‌زمینه‌ی توپر تا روی کارتِ تیره‌رنگ‌شده هم جدا دیده شود
          background: C.panel,
          border: `1px solid ${tone(t)}`,
        }}
        title={`رتبه ${rank} از ${total}`}
      >
        {faNum(rank)}
      </div>

      <div className="flex-1 min-w-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onSaveField(idea.id, "title", title)}
          placeholder="عنوان ایده"
          className="w-full text-sm font-semibold bg-transparent outline-none mb-1"
          style={{ color: C.text }}
        />
        <textarea
          ref={areaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => onSaveField(idea.id, "description", description)}
          rows={1}
          placeholder="توضیحات ایده..."
          className="w-full text-sm leading-relaxed bg-transparent outline-none resize-none overflow-hidden"
          style={{ color: C.muted }}
        />
      </div>

      <div className="shrink-0 flex flex-col items-center gap-0.5">
        <button
          onClick={() => onMove(rank - 1, rank - 2)}
          disabled={isFirst}
          className="p-1 rounded-md disabled:opacity-25 ops-tap"
          style={{ color: C.faint }}
          title="یک رتبه بالاتر"
        >
          <ChevronUp size={15} />
          <span className="sr-only">یک رتبه بالاتر</span>
        </button>
        <button
          onClick={() => onMove(rank - 1, rank)}
          disabled={isLast}
          className="p-1 rounded-md disabled:opacity-25 ops-tap"
          style={{ color: C.faint }}
          title="یک رتبه پایین‌تر"
        >
          <ChevronDown size={15} />
          <span className="sr-only">یک رتبه پایین‌تر</span>
        </button>
      </div>

      <ConfirmDelete onConfirm={() => onDelete(idea.id)} />
    </li>
  );
}

export default function BusinessIdeas({ initialIdeas, loadError }) {
  const { theme, toggleTheme, mounted, C } = useTheme();
  const [ideas, setIdeas] = useState(initialIdeas || []);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [errorMsg, flash] = useFlash();
  const supabase = createClient();

  const ordered = useMemo(
    () =>
      [...ideas].sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          String(a.created_at).localeCompare(String(b.created_at))
      ),
    [ideas]
  );

  const addIdea = async () => {
    const title = newTitle.trim();
    if (!title) return;
    // ایده‌ی تازه به انتهای رتبه‌بندی می‌رود؛ «جدید» به‌معنای «بهتر» نیست
    const maxOrder = ideas.reduce((m, i) => Math.max(m, i.sort_order ?? 0), 0);
    const { data, error } = await supabase
      .from("business_ideas")
      .insert({ title, description: newDescription.trim(), sort_order: maxOrder + 1 })
      .select()
      .single();
    if (error) return flash("خطا در ساخت ایده: " + error.message);
    setIdeas((prev) => [...prev, data]);
    setNewTitle("");
    setNewDescription("");
    setShowAdd(false);
  };

  const saveField = async (id, field, value) => {
    const current = ideas.find((i) => i.id === id);
    if (!current || current[field] === value) return;
    const snapshot = ideas;
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    const { error } = await supabase.from("business_ideas").update({ [field]: value }).eq("id", id);
    if (error) {
      setIdeas(snapshot);
      flash("خطا در ذخیره تغییرات: " + error.message);
    }
  };

  const deleteIdea = async (id) => {
    const snapshot = ideas;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from("business_ideas").delete().eq("id", id);
    if (error) {
      setIdeas(snapshot);
      flash("خطا در حذف ایده: " + error.message);
    }
  };

  /**
   * جابه‌جایی رتبه. ردیف‌های موجود همه sort_order = 0 دارند (این ستون تا حالا
   * استفاده نشده بود)، پس «تعویض با همسایه» بی‌اثر می‌شد — به‌جایش کل لیست را
   * بازشماری می‌کنیم و فقط ردیف‌هایی که مقدارشان عوض شده به دیتابیس می‌روند.
   */
  const moveIdea = async (from, to) => {
    if (to < 0 || to >= ordered.length || from === to) return;

    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const changed = next
      .map((idea, index) => ({ idea, index }))
      .filter(({ idea, index }) => (idea.sort_order ?? 0) !== index);
    if (!changed.length) return;

    const snapshot = ideas;
    const orderById = new Map(next.map((idea, index) => [idea.id, index]));
    setIdeas((prev) =>
      prev.map((i) => (orderById.has(i.id) ? { ...i, sort_order: orderById.get(i.id) } : i))
    );

    const results = await Promise.all(
      changed.map(({ idea, index }) =>
        supabase.from("business_ideas").update({ sort_order: index }).eq("id", idea.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed) {
      setIdeas(snapshot);
      flash("خطا در جابه‌جایی رتبه: " + failed.error.message);
    }
  };

  return (
    <div dir="rtl" lang="fa" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader theme={theme} toggleTheme={toggleTheme} mounted={mounted} />

        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Lightbulb size={16} style={{ color: tone("amber") }} />
              <span className="mono text-xs tracking-[0.2em]" style={{ color: C.muted }}>DADASH//</span>
            </div>
            <h1 className="text-xl font-bold">
              ایده‌های کسب‌وکار
              {ordered.length > 0 && (
                <span className="mono tnum text-sm font-normal mr-2" style={{ color: C.faint }}>
                  {ordered.length}
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium ops-primary shrink-0"
          >
            <Plus size={13} className="shrink-0" /> ایده جدید
          </button>
        </div>
        <p className="text-sm mt-1 mb-5 leading-relaxed" style={{ color: C.muted }}>
          از بهترین (رتبه ۱) تا کم‌اهمیت‌ترین. با فلش‌های کنار هر ایده رتبه‌اش را جابه‌جا کن.
        </p>

        {loadError && (
          <div
            className="mb-4 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
            style={{ background: toneSoft("red"), color: tone("red") }}
            role="alert"
          >
            خواندن ایده‌ها با خطا مواجه شد: {loadError}
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
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIdea()}
              placeholder="عنوان ایده"
              className="w-full text-sm px-3 py-2 rounded-lg mb-2 outline-none ops-input"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="توضیحات..."
              rows={3}
              className="w-full text-sm leading-relaxed px-3 py-2 rounded-lg mb-2 outline-none resize-y ops-input"
            />
            <div className="flex gap-2">
              <button onClick={addIdea} className="flex-1 text-xs py-2 rounded-lg font-medium ops-primary">
                افزودن به انتهای لیست
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

        {ordered.length === 0 && !showAdd && (
          <EmptyState icon={Lightbulb} dashed>هنوز ایده‌ای ثبت نشده.</EmptyState>
        )}

        <ul className="space-y-2">
          {ordered.map((idea, index) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              rank={index + 1}
              total={ordered.length}
              C={C}
              onSaveField={saveField}
              onDelete={deleteIdea}
              onMove={moveIdea}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
