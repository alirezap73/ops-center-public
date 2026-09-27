"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ListTodo, ChevronUp, ChevronDown,
  CalendarDays, CalendarClock, Inbox, AlertTriangle, Archive, Check, Repeat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme, tone, toneSoft } from "@/lib/theme";
import { PRIORITY, PRIORITY_ORDER } from "@/lib/priority";
import ConfirmDelete from "@/components/ConfirmDelete";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { useFlash } from "@/lib/useFlash";

/** کلید تاریخ محلی — toISOString() چند ساعت جابه‌جا می‌کند و «امروز» را خراب می‌کند */
function dateKey(d = new Date()) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

const faLong = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long", day: "numeric", month: "long",
});
const faShort = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" });

function labelFor(iso) {
  if (!iso) return "بی‌تاریخ";
  if (iso === dateKey()) return "امروز";
  if (iso === shiftDays(1)) return "فردا";
  if (iso === shiftDays(-1)) return "دیروز";
  const [y, m, d] = iso.split("-").map(Number);
  return faShort.format(new Date(y, m - 1, d));
}

const GROUPS = [
  { key: "overdue", label: "از قبل مانده", icon: AlertTriangle, tone: "red" },
  { key: "today", label: "امروز", icon: CalendarDays, tone: "jade" },
  { key: "upcoming", label: "آینده", icon: CalendarClock, tone: "blue" },
  { key: "undated", label: "بی‌تاریخ", icon: Inbox, tone: "slate" },
];

const isTemplate = (t) => t.repeat_mode === "daily";

// آرشیو با کارهای تکرارشونده هر روز یک ردیف رشد می‌کند، پس رندرش سقف دارد
const ARCHIVE_LIMIT = 30;

function groupKeyOf(task, today) {
  if (!task.task_date) return "undated";
  if (task.task_date === today) return "today";
  if (task.task_date < today) {
    // کار تکرارشونده‌ی روز گذشته «عقب‌افتاده» نیست — کار همان روز بود و گذشت.
    // نمونه‌ی امروزش جداگانه ساخته می‌شود، پس نباید در «از قبل مانده» تلنبار شود.
    if (task.template_id) return "archive";
    return task.done ? "archive" : "overdue";
  }
  return "upcoming";
}

function TaskRow({ task, C, today, isFirst, isLast, onPatch, onDelete, onMove, onRepeat, onStopRepeat }) {
  const [text, setText] = useState(task.text);
  const [editing, setEditing] = useState(false);
  const p = PRIORITY[task.priority] || PRIORITY.medium;

  const commit = () => {
    setEditing(false);
    const next = text.trim();
    if (!next) return setText(task.text); // متن خالی ذخیره نمی‌شود
    if (next !== task.text) onPatch(task.id, { text: next });
  };

  return (
    <li
      className="flex items-start gap-2.5 pr-3 pl-3 py-2.5 rounded-lg ops-card"
      style={{
        background: task.done ? C.panel : toneSoft(p.tone),
        border: `1px solid ${C.border}`,
        borderRight: `3px solid ${task.done ? C.border : tone(p.tone)}`,
      }}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onPatch(task.id, { done: !task.done })}
        className="mt-0.5 w-4 h-4 shrink-0"
        style={{ accentColor: "var(--jade)" }}
        title={task.done ? "برگرداندن به انجام‌نشده" : "انجام شد"}
      />

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setText(task.text);
                setEditing(false);
              }
            }}
            className="w-full text-sm px-2 py-1 rounded-md outline-none ops-input"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="block w-full text-right text-sm leading-relaxed"
            title="کلیک برای ویرایش"
            style={{
              color: task.done ? C.faint : C.text,
              textDecoration: task.done ? "line-through" : "none",
            }}
          >
            {task.text}
          </button>
        )}

        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
          {task.template_id && (
            <button
              onClick={() => onStopRepeat(task.template_id)}
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md ops-tap"
              style={{ color: tone("violet"), background: toneSoft("violet") }}
              title="تکرارشونده — کلیک کن تا دیگر هر روز ساخته نشود"
            >
              <Repeat size={10} className="shrink-0" />
              تکرارشونده
              <span style={{ opacity: 0.7 }}>· توقف</span>
            </button>
          )}
          <button
            onClick={() =>
              onPatch(task.id, {
                priority:
                  PRIORITY_ORDER[
                    (PRIORITY_ORDER.indexOf(task.priority) + 1) % PRIORITY_ORDER.length
                  ],
              })
            }
            title="کلیک برای تغییر اولویت"
            className="flex items-center gap-1 text-xs px-1.5 py-0.5 -mr-1.5 rounded-md ops-tap"
            style={{ color: tone(p.tone) }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(p.tone) }} />
            {p.label}
          </button>

          <label
            className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md cursor-pointer ops-tap"
            style={{ color: C.faint }}
            title="تغییر تاریخ"
          >
            <CalendarDays size={11} className="shrink-0" />
            {labelFor(task.task_date)}
            <input
              type="date"
              value={task.task_date || ""}
              onChange={(e) => onPatch(task.id, { task_date: e.target.value || null })}
              className="sr-only"
            />
          </label>

          {task.task_date !== today && (
            <button
              onClick={() => onPatch(task.id, { task_date: today })}
              className="text-xs px-1.5 py-0.5 rounded-md ops-tap"
              style={{ color: C.faint }}
            >
              ← امروز
            </button>
          )}
          {task.task_date && (
            <button
              onClick={() => onPatch(task.id, { task_date: null })}
              className="text-xs px-1.5 py-0.5 rounded-md ops-tap"
              style={{ color: C.faint }}
              title="برداشتن تاریخ"
            >
              بی‌تاریخ
            </button>
          )}

          {/* نمونه‌های ساخته‌شده از یک الگو خودشان تکرارشونده‌اند */}
          {!task.template_id && (
            <button
              onClick={() => onRepeat(task)}
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md ops-tap"
              style={{ color: tone("violet") }}
              title="از این به بعد هر روز خودش ساخته شود"
            >
              <Repeat size={10} className="shrink-0" />
              هر روز
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center shrink-0">
        <button
          onClick={() => onMove(task, -1)}
          disabled={isFirst}
          className="p-0.5 rounded disabled:opacity-25 ops-tap"
          style={{ color: C.faint }}
          title="بالا"
        >
          <ChevronUp size={14} />
          <span className="sr-only">انتقال به بالا</span>
        </button>
        <button
          onClick={() => onMove(task, 1)}
          disabled={isLast}
          className="p-0.5 rounded disabled:opacity-25 ops-tap"
          style={{ color: C.faint }}
          title="پایین"
        >
          <ChevronDown size={14} />
          <span className="sr-only">انتقال به پایین</span>
        </button>
      </div>

      <ConfirmDelete onConfirm={() => onDelete(task.id)} />
    </li>
  );
}

/** ردیف الگو — خودش کار نیست، پس نه تیک دارد نه تاریخ */
function TemplateRow({ task, C, onPatch, onDelete, onStop }) {
  const [text, setText] = useState(task.text);
  const [editing, setEditing] = useState(false);
  const p = PRIORITY[task.priority] || PRIORITY.medium;

  const commit = () => {
    setEditing(false);
    const next = text.trim();
    if (!next) return setText(task.text);
    if (next !== task.text) onPatch(task.id, { text: next });
  };

  // عمداً کارت نیست و کم‌رنگ‌تر از کارهاست: این فقط تعریف تکرار است،
  // وگرنه کنار کارِ امروزِ همان الگو، تکراری و گیج‌کننده به‌نظر می‌رسید.
  return (
    <li
      className="flex items-center gap-2 pr-2.5 pl-2 py-1.5 rounded-lg"
      style={{ border: `1px dashed ${C.border}` }}
    >
      <Repeat size={12} className="shrink-0" style={{ color: tone("violet") }} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setText(task.text);
                setEditing(false);
              }
            }}
            className="w-full text-xs px-2 py-1 rounded-md outline-none ops-input"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="block w-full text-right text-xs truncate"
            title={`${task.text} — کلیک برای ویرایش`}
            style={{ color: C.muted }}
          >
            {task.text}
          </button>
        )}
      </div>

      <button
        onClick={() =>
          onPatch(task.id, {
            priority:
              PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(task.priority) + 1) % PRIORITY_ORDER.length],
          })
        }
        title="کلیک برای تغییر اولویت"
        className="shrink-0 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md ops-tap"
        style={{ color: tone(p.tone) }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(p.tone) }} />
        {p.label}
      </button>

      <button
        onClick={() => onStop(task.id)}
        className="shrink-0 text-xs px-1.5 py-0.5 rounded-md ops-tap"
        style={{ color: C.faint }}
        title="دیگر هر روز ساخته نشود — کارهای ساخته‌شده دست‌نخورده می‌مانند"
      >
        توقف تکرار
      </button>

      <ConfirmDelete onConfirm={() => onDelete(task.id)} title="حذف الگو" />
    </li>
  );
}

export default function DailyTasks({ initialTasks, loadError }) {
  const { theme, toggleTheme, mounted, C } = useTheme();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [newText, setNewText] = useState("");
  const [errorMsg, flash] = useFlash();
  const [showArchive, setShowArchive] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newRepeat, setNewRepeat] = useState(false);
  const supabase = createClient();

  // «امروز» فقط در مرورگر معتبر است: منطقه‌ی زمانی سرور می‌تواند متفاوت باشد و
  // اگر در رندر سمت سرور استفاده شود، گروه‌بندی با کلاینت ناهمخوان می‌شود.
  const [today, setToday] = useState(null);
  const [newDate, setNewDate] = useState("");
  useEffect(() => {
    const t = dateKey();
    setToday(t);
    setNewDate(t);
  }, []);

  const templates = useMemo(() => tasks.filter(isTemplate), [tasks]);

  const groups = useMemo(() => {
    const g = { overdue: [], today: [], upcoming: [], undated: [], archive: [] };
    if (!today) return g;
    // الگوها خودشان کار نیستند و در گروه‌های تاریخ‌دار نمی‌آیند
    for (const t of tasks) if (!isTemplate(t)) g[groupKeyOf(t, today)].push(t);

    const byOrder = (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      String(a.created_at).localeCompare(String(b.created_at));
    const doneLast = (a, b) => Number(a.done) - Number(b.done) || byOrder(a, b);

    g.overdue.sort((a, b) => String(a.task_date).localeCompare(String(b.task_date)) || byOrder(a, b));
    g.today.sort(doneLast);
    g.upcoming.sort((a, b) => String(a.task_date).localeCompare(String(b.task_date)) || byOrder(a, b));
    g.undated.sort(doneLast);
    g.archive.sort((a, b) => String(b.task_date).localeCompare(String(a.task_date)));
    return g;
  }, [tasks, today]);

  const todayDone = groups.today.filter((t) => t.done).length;
  const todayTotal = groups.today.length;
  const todayPct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;
  const doneCount = tasks.filter((t) => t.done).length;

  const addTask = async () => {
    const text = newText.trim();
    if (!text) return;
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.sort_order ?? 0), 0);
    // الگو تاریخ ندارد؛ نمونه‌ی امروزش را همین پایین می‌سازیم
    const row = newRepeat
      ? { text, repeat_mode: "daily", task_date: null, sort_order: maxOrder + 1 }
      : { text, task_date: newDate || null, sort_order: maxOrder + 1 };

    const { data, error } = await supabase.from("daily_tasks").insert(row).select().single();
    if (error) return flash("خطا در ساخت کار: " + error.message);
    setTasks((prev) => [...prev, data]);
    setNewText("");
    if (newRepeat) await spawnFor([data]);
  };

  /**
   * از روی هر الگو، کار امروز را می‌سازد. last_spawn جلوی ساخت دوباره را می‌گیرد —
   * پس اگر کار امروز را حذف یا پاک‌سازی کنی، با رفرش دوباره برنمی‌گردد.
   */
  const spawnFor = async (list) => {
    const due = list.filter((t) => isTemplate(t) && t.last_spawn !== today);
    if (!due.length || !today) return;

    const rows = due.map((t) => ({
      text: t.text,
      priority: t.priority,
      task_date: today,
      template_id: t.id,
      sort_order: t.sort_order ?? 0,
    }));

    const { data, error } = await supabase.from("daily_tasks").insert(rows).select();
    if (error) {
      // خطای unique یعنی تب دیگری زودتر ساخته — سکوت درست‌ترین رفتار است
      if (error.code !== "23505") flash("خطا در ساخت کارهای تکرارشونده: " + error.message);
      return;
    }

    const ids = due.map((t) => t.id);
    await supabase.from("daily_tasks").update({ last_spawn: today }).in("id", ids);
    setTasks((prev) => [
      ...prev.map((t) => (ids.includes(t.id) ? { ...t, last_spawn: today } : t)),
      ...data,
    ]);
  };

  /**
   * یک کار موجود را همیشگی می‌کند. عمداً خودِ ردیف را الگو نمی‌کند (که تیک و
   * تاریخش را خراب می‌کرد) بلکه یک الگوی جدا می‌سازد و همین کار را به‌عنوان
   * نمونه‌ی امروز به آن وصل می‌کند — پس ردیف سر جایش با همان وضعیت می‌ماند.
   */
  const makeRecurring = async (task) => {
    // کارِ تاریخ‌دارِ روز دیگر را جابه‌جا نمی‌کنیم؛ فقط الگو ساخته می‌شود
    const linkAsToday = !task.task_date || task.task_date === today;
    const snapshot = tasks;

    const { data: tpl, error } = await supabase
      .from("daily_tasks")
      .insert({
        text: task.text,
        priority: task.priority,
        repeat_mode: "daily",
        task_date: null,
        last_spawn: linkAsToday ? today : null,
        sort_order: task.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) return flash("خطا در ساخت الگوی تکرار: " + error.message);

    if (!linkAsToday) return setTasks((p) => [...p, tpl]);

    const patch = { template_id: tpl.id, task_date: today };
    setTasks((p) => [...p.map((t) => (t.id === task.id ? { ...t, ...patch } : t)), tpl]);
    const { error: linkErr } = await supabase.from("daily_tasks").update(patch).eq("id", task.id);
    if (linkErr) {
      setTasks(snapshot);
      await supabase.from("daily_tasks").delete().eq("id", tpl.id);
      flash("خطا در تبدیل به کار همیشگی: " + linkErr.message);
    }
  };

  /**
   * تکرار را کامل متوقف می‌کند: الگو حذف می‌شود و نشان «تکرارشونده» از همه‌ی
   * کارهای ساخته‌شده برداشته می‌شود (متن‌شان دست‌نخورده می‌ماند).
   */
  const stopRecurring = async (templateId) => {
    const instances = tasks.filter((t) => t.template_id === templateId);
    // اگر هیچ کاری از این الگو ساخته نشده، حذفش یعنی گم‌شدن متن — پس فقط عادی‌اش می‌کنیم
    if (!instances.length) {
      return patchTask(templateId, { repeat_mode: "none", task_date: today });
    }

    const snapshot = tasks;
    setTasks((p) =>
      p
        .filter((t) => t.id !== templateId)
        .map((t) => (t.template_id === templateId ? { ...t, template_id: null } : t))
    );

    const { error } = await supabase
      .from("daily_tasks")
      .update({ template_id: null })
      .eq("template_id", templateId);
    if (error) {
      setTasks(snapshot);
      return flash("خطا در توقف تکرار: " + error.message);
    }
    const { error: delErr } = await supabase.from("daily_tasks").delete().eq("id", templateId);
    if (delErr) {
      setTasks(snapshot);
      flash("خطا در حذف الگو: " + delErr.message);
    }
  };

  // یک بار در روز، وقتی «امروز» در مرورگر مشخص شد
  useEffect(() => {
    if (today) spawnFor(tasks);
    // فقط به today وابسته است: با هر تغییر tasks نباید دوباره اجرا شود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // تغییرات خوش‌بینانه‌اند، ولی اگر ذخیره شکست خورد به حالت قبل برمی‌گردیم
  // تا رابط چیزی را نشان ندهد که در دیتابیس ذخیره نشده.
  const patchTask = async (id, patch) => {
    const snapshot = tasks;
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const { error } = await supabase.from("daily_tasks").update(patch).eq("id", id);
    if (error) {
      setTasks(snapshot);
      flash("خطا در ذخیره تغییرات: " + error.message);
    }
  };

  const deleteTask = async (id) => {
    const snapshot = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from("daily_tasks").delete().eq("id", id);
    if (error) {
      setTasks(snapshot);
      flash("خطا در حذف: " + error.message);
    }
  };

  /** جابه‌جایی با همسایه در همان گروه: sort_order دو تسک با هم عوض می‌شود */
  const moveTask = async (task, dir) => {
    const list = groups[groupKeyOf(task, today)];
    const i = list.findIndex((t) => t.id === task.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;

    const a = list[i];
    const b = list[j];
    const aOrder = a.sort_order ?? 0;
    const bOrder = b.sort_order ?? 0;
    // اگر هر دو یکسان باشند، تعویض ساده بی‌اثر است؛ پس فاصله می‌سازیم
    const [newA, newB] = aOrder === bOrder ? [bOrder + dir, bOrder] : [bOrder, aOrder];

    const snapshot = tasks;
    setTasks((p) =>
      p.map((t) =>
        t.id === a.id ? { ...t, sort_order: newA } : t.id === b.id ? { ...t, sort_order: newB } : t
      )
    );
    const [r1, r2] = await Promise.all([
      supabase.from("daily_tasks").update({ sort_order: newA }).eq("id", a.id),
      supabase.from("daily_tasks").update({ sort_order: newB }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) {
      setTasks(snapshot);
      flash("خطا در جابه‌جایی: " + (r1.error || r2.error).message);
    }
  };

  const clearDone = async () => {
    const ids = tasks.filter((t) => t.done).map((t) => t.id);
    if (!ids.length) return;
    const snapshot = tasks;
    setTasks((p) => p.filter((t) => !t.done));
    const { error } = await supabase.from("daily_tasks").delete().in("id", ids);
    if (error) {
      setTasks(snapshot);
      flash("خطا در پاک‌کردن: " + error.message);
    }
  };

  return (
    <div dir="rtl" lang="fa" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader theme={theme} toggleTheme={toggleTheme} mounted={mounted} />

        <div className="flex items-center gap-2 mb-1.5">
          <ListTodo size={16} style={{ color: tone("blue") }} />
          <span className="mono text-xs tracking-[0.2em]" style={{ color: C.muted }}>DADASH//</span>
        </div>
        <h1 className="text-xl font-bold">کارهای روزانه</h1>
        <p className="text-sm mt-1 mb-5" style={{ color: C.muted }}>
          {today ? faLong.format(new Date()) : " "}
        </p>

        {todayTotal > 0 && (
          <div className="mb-5 p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: C.muted }}>پیشرفت امروز</span>
              <span className="mono tnum font-semibold" style={{ color: tone("jade") }}>
                {todayDone}/{todayTotal} · {todayPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.borderStrong }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${todayPct}%`, background: tone("jade") }}
              />
            </div>
          </div>
        )}

        {loadError && (
          <div
            className="mb-4 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
            style={{ background: toneSoft("red"), color: tone("red") }}
            role="alert"
          >
            خواندن کارها از دیتابیس با خطا مواجه شد: {loadError}
            <br />
            اگر تازه ستون‌های <span className="mono">task_date</span> و{" "}
            <span className="mono">priority</span> را اضافه نکرده‌ای، اسکریپت SQL را اجرا کن.
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

        <div className="mb-6 p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="flex gap-2 mb-2">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="کار جدید + Enter"
              className="flex-1 text-sm px-3 py-2.5 rounded-lg outline-none ops-input"
            />
            <button onClick={addTask} className="text-xs px-4 py-2.5 rounded-lg font-medium ops-primary">
              افزودن
            </button>
          </div>
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => setNewRepeat((v) => !v)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md ops-tap"
              style={{
                color: newRepeat ? tone("violet") : C.faint,
                background: newRepeat ? toneSoft("violet") : "transparent",
                border: `1px solid ${newRepeat ? "transparent" : C.border}`,
              }}
              title="هر روز خودش ساخته می‌شود"
            >
              <Repeat size={10} className="shrink-0" />
              هر روز
            </button>

            {/* الگو تاریخ نمی‌گیرد، پس انتخاب تاریخ در حالت تکرار بی‌معناست */}
            {!newRepeat && (
              <>
                {[
                  { label: "امروز", value: today },
                  { label: "فردا", value: shiftDays(1) },
                  { label: "بی‌تاریخ", value: "" },
                ].map(({ label, value }) => {
                  const on = newDate === value;
                  return (
                    <button
                      key={label}
                      onClick={() => setNewDate(value)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md ops-tap"
                      style={{
                        color: on ? tone("jade") : C.faint,
                        background: on ? toneSoft("jade") : "transparent",
                        border: `1px solid ${on ? "transparent" : C.border}`,
                      }}
                    >
                      {on && <Check size={10} className="shrink-0" />}
                      {label}
                    </button>
                  );
                })}
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mono text-xs px-2 py-1 rounded-md outline-none ops-input"
                  title="تاریخ دلخواه"
                />
              </>
            )}
          </div>
        </div>

        {today && tasks.length === 0 && (
          <EmptyState icon={ListTodo} dashed>هنوز کاری ثبت نشده. اولین کار امروزت رو بنویس.</EmptyState>
        )}

        {/* اسکلت تا لحظه‌ای که «امروز» در مرورگر مشخص شود */}
        {!today && tasks.length > 0 && (
          <ul className="space-y-1.5" aria-hidden="true">
            {tasks.slice(0, 4).map((t) => (
              <li
                key={t.id}
                className="h-14 rounded-lg animate-pulse"
                style={{ background: C.panel, border: `1px solid ${C.border}` }}
              />
            ))}
          </ul>
        )}

        {/* تنظیمات تکرار، نه کارِ امروز — پس پیش‌فرض جمع است تا با لیست کارها اشتباه نشود */}
        {today && templates.length > 0 && (
          <section className="mb-6">
            <button
              onClick={() => setShowTemplates((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-2 py-1 -mr-2 rounded-lg ops-tap"
              style={{ color: C.faint }}
              aria-expanded={showTemplates}
            >
              {showTemplates ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <Repeat size={12} className="shrink-0" style={{ color: tone("violet") }} />
              الگوهای تکرار روزانه
              <span className="mono tnum">({templates.length})</span>
            </button>
            {showTemplates && (
              <>
                <ul className="space-y-1.5 mt-2">
                  {templates.map((t) => (
                    <TemplateRow
                      key={t.id}
                      task={t}
                      C={C}
                      onPatch={patchTask}
                      onDelete={deleteTask}
                      onStop={stopRecurring}
                    />
                  ))}
                </ul>
                <p className="text-xs mt-2" style={{ color: C.faint }}>
                  این‌ها خودشان کار نیستند؛ هر روز که این صفحه را باز کنی، از رویشان کار آن روز
                  در فهرست «امروز» ساخته می‌شود.
                </p>
              </>
            )}
          </section>
        )}

        {today && GROUPS.map(({ key, label, icon: Icon, tone: toneKey }) => {
          const list = groups[key];
          if (!list.length) return null;
          const undone = list.filter((t) => !t.done).length;
          return (
            <section key={key} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: tone(toneKey), background: toneSoft(toneKey) }}
                >
                  <Icon size={12} className="shrink-0" />
                  {label}
                </span>
                <span className="mono tnum text-xs" style={{ color: C.faint }}>
                  {undone > 0 ? `${undone} مانده` : "تمام شد"}
                </span>
              </div>
              <ul className="space-y-1.5">
                {list.map((t, i) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    C={C}
                    today={today}
                    isFirst={i === 0}
                    isLast={i === list.length - 1}
                    onPatch={patchTask}
                    onDelete={deleteTask}
                    onMove={moveTask}
                    onRepeat={makeRecurring}
                    onStopRepeat={stopRecurring}
                  />
                ))}
              </ul>
            </section>
          );
        })}

        {groups.archive.length > 0 && (
          <section className="mb-6">
            <button
              onClick={() => setShowArchive((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-2 py-1 -mr-2 rounded-lg ops-tap"
              style={{ color: C.faint }}
              aria-expanded={showArchive}
            >
              {showArchive ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <Archive size={12} className="shrink-0" />
              روزهای گذشته
              <span className="mono tnum">({groups.archive.length})</span>
            </button>
            {showArchive && (
              <ul className="space-y-1.5 mt-2">
                {groups.archive.slice(0, ARCHIVE_LIMIT).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => patchTask(t.id, { done: !t.done })}
                      className="w-4 h-4 shrink-0"
                      style={{ accentColor: "var(--jade)" }}
                      title={t.done ? "برگرداندن به انجام‌نشده" : "انجام شد"}
                    />
                    <span
                      className="flex-1 text-sm truncate"
                      style={{
                        color: C.faint,
                        textDecoration: t.done ? "line-through" : "none",
                      }}
                    >
                      {t.text}
                    </span>
                    {t.template_id && (
                      <Repeat size={11} className="shrink-0" style={{ color: tone("violet") }} />
                    )}
                    {!t.done && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ color: tone("slate"), background: toneSoft("slate") }}
                      >
                        انجام نشد
                      </span>
                    )}
                    <span className="text-xs shrink-0" style={{ color: C.faint }}>
                      {labelFor(t.task_date)}
                    </span>
                    <ConfirmDelete onConfirm={() => deleteTask(t.id)} />
                  </li>
                ))}
                {groups.archive.length > ARCHIVE_LIMIT && (
                  <li className="text-xs mono tnum px-3 py-1" style={{ color: C.faint }}>
                    + {groups.archive.length - ARCHIVE_LIMIT} مورد قدیمی‌تر
                  </li>
                )}
              </ul>
            )}
          </section>
        )}

        {/* حذف گروهی — پرخطرترین عمل این صفحه، پس تأیید دومرحله‌ای دارد */}
        {doneCount > 0 && (
          <ConfirmDelete
            onConfirm={clearDone}
            size={13}
            className="text-xs px-3 py-2"
            title={`پاک‌کردن ${doneCount} کار انجام‌شده`}
          >
            پاک‌کردن {doneCount} کار انجام‌شده
          </ConfirmDelete>
        )}
      </div>
    </div>
  );
}
