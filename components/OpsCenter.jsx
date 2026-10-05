"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTheme, C, tone, toneSoft } from "@/lib/theme";
import {
  ChevronDown, ChevronUp, ChevronLeft, Plus, X, Search, CheckCircle2, Circle,
  Archive, ArchiveRestore,
  Clock, Eye, Ban, LayoutGrid, Layers, LogOut, Sun, Moon,
  Globe, Send, Instagram, ListChecks, CalendarDays, Map as MapIcon, StickyNote,
  ArrowRight, ArrowLeft, Megaphone, Lightbulb, ListTodo, NotebookPen,
  Link2, Server, BarChart3, Database, Github, Gauge, Pencil, ExternalLink, Download,
  Twitter, Youtube, Newspaper, MessageCircle, MoreHorizontal, Swords, BookOpen, Menu, Filter
} from "lucide-react";
import { safeHref, hostOf } from "@/lib/url";
import NoteCard from "@/components/NoteCard";
import NoteContentEditor from "@/components/ContentEditor";
import WorkspaceNav from "@/components/WorkspaceNav";
import ConfirmDelete from "@/components/ConfirmDelete";
import EmptyState from "@/components/EmptyState";
import SitTimer from "@/components/SitTimer";
import GuideHelp from "@/components/GuideHelp";
import { PRIORITY, PRIORITY_ORDER } from "@/lib/priority";
import { useFlash } from "@/lib/useFlash";
import { computeVersion } from "@/lib/changelog";
import { withAlpha } from "@/lib/color";
import { faNum } from "@/lib/format";

// وضعیت‌ها به‌جای hex یک «تُن» دارند تا رنگ‌شان در تم روشن و تیره جدا تنظیم شود
// (پالت قبلی فقط برای تیره ساخته شده بود و در روشن خوانا نبود).
const STATUS = {
  not_started: { label: "شروع نشده", tone: "slate" },
  in_progress: { label: "در حال انجام", tone: "amber" },
  needs_review: { label: "نیاز به بررسی", tone: "violet" },
  blocked: { label: "مسدود", tone: "red" },
  done: { label: "انجام‌شده", tone: "jade" },
};
const STATUS_ORDER = ["not_started", "in_progress", "needs_review", "blocked", "done"];

const AD_PLATFORM = {
  instagram: { label: "اینستاگرام", icon: Instagram },
  telegram: { label: "تلگرام", icon: Send },
  reddit: { label: "ردیت", icon: MessageCircle },
  twitter: { label: "توییتر", icon: Twitter },
  reportage: { label: "ریپورتاژ", icon: Newspaper },
  google_ads: { label: "گوگل ادز", icon: Search },
  youtube: { label: "یوتیوب", icon: Youtube },
  other: { label: "سایر", icon: MoreHorizontal },
};
const AD_PLATFORM_ORDER = ["instagram", "telegram", "reddit", "twitter", "reportage", "google_ads", "youtube", "other"];

const STATUS_ICON = {
  not_started: Circle,
  in_progress: Clock,
  needs_review: Eye,
  blocked: Ban,
  done: CheckCircle2,
};

const PALETTE = ["#2DD4A7", "#8B7CF6", "#E8B34A", "#FF5D73", "#4CA3FF", "#22D3EE"];

const CONTENT_STATUS = {
  idea: { label: "ایده", tone: "slate" },
  draft: { label: "پیش‌نویس", tone: "blue" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "amber" },
  published: { label: "منتشر شده", tone: "jade" },
};
const CONTENT_STATUS_ORDER = ["idea", "draft", "scheduled", "published"];

const CONTENT_PLATFORM = {
  website: { label: "وبسایت", icon: Globe },
  telegram: { label: "تلگرام", icon: Send },
  instagram: { label: "اینستاگرام", icon: Instagram },
};
const CONTENT_PLATFORM_ORDER = ["website", "telegram", "instagram"];

const UPDATE_STATUS = {
  needed: { label: "مورد نیاز", tone: "red" },
  in_progress: { label: "در حال انجام", tone: "amber" },
  done: { label: "انجام‌شده", tone: "jade" },
};
const UPDATE_STATUS_ORDER = ["needed", "in_progress", "done"];
const UPDATE_COLORS = ["#F6A9B8", "#9DC8F0", "#F5DA7A", "#A8E0B8", "#C9B6F2"];

/** آیکون لینک از روی برچسب/دامنه حدس زده می‌شود — فقط برای اسکن سریع‌تر چشم */
const LINK_ICONS = [
  [/cpanel|هاست|host|whm|plesk|ftp/i, Server],
  [/analytic|آنالیتیک|ga4|matomo|plausible|clarity/i, BarChart3],
  [/console|سرچ|search|webmaster|bing/i, Gauge],
  [/github|gitlab|repo|ریپو|git\b/i, Github],
  [/supabase|database|دیتابیس|db\b|sql|phpmyadmin/i, Database],
];

function linkIconFor(label, url) {
  const hay = `${label} ${url}`;
  for (const [re, Icon] of LINK_ICONS) if (re.test(hay)) return Icon;
  return Globe;
}

/** پیش‌نهادهای آماده تا راه‌اندازی اولیه سریع باشد */
const LINK_PRESETS = ["سایت", "cPanel", "آنالیتیکس", "سرچ کنسول", "ریپو"];

const NOTE_STATS = {
  all: { label: "یادداشت", tone: "violet" },
  pinned: { label: "سنجاق‌شده", tone: "amber" },
};
const NOTE_STATS_ORDER = ["all", "pinned"];

// هر تب تُن خودش را دارد تا در یک نگاه از هم تفکیک شوند — همان شش تُن مجاز پروژه
const TABS = [
  { key: "modules", icon: ListChecks, label: "ماژول‌ها", tone: "jade" },
  { key: "content", icon: CalendarDays, label: "تقویم محتوا", tone: "blue" },
  { key: "updates", icon: StickyNote, label: "آپدیت‌ها", tone: "amber" },
  { key: "ads", icon: Megaphone, label: "تبلیغات", tone: "violet" },
  { key: "notes", icon: NotebookPen, label: "یادداشت‌ها", tone: "slate" },
  { key: "competitors", icon: Swords, label: "رقبا", tone: "red" },
];

const COMPETITOR_VERDICT = {
  neutral: { label: "خنثی", tone: "slate" },
  good: { label: "خوب", tone: "jade" },
  bad: { label: "مشکل‌دار", tone: "red" },
  watch: { label: "زیر نظر", tone: "blue" },
};
const COMPETITOR_VERDICT_ORDER = ["neutral", "good", "bad", "watch"];

// نسخه از خود changelog حساب می‌شود، پس هیچ‌وقت با رودمپ ناهماهنگ نمی‌شود
const version = computeVersion();

const SEARCH_PLACEHOLDER = {
  modules: "جستجوی ماژول...",
  content: "جستجوی محتوا...",
  updates: "جستجوی آپدیت...",
  ads: "جستجوی تبلیغ...",
  notes: "جستجوی یادداشت...",
  competitors: "جستجوی رقیب...",
};


// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
  const s = STATUS[status];
  return (
    <span
      className="text-xs font-medium leading-none px-2 py-1 rounded border whitespace-nowrap"
      style={{ color: tone(s.tone), borderColor: tone(s.tone), background: toneSoft(s.tone) }}
    >
      {s.label}
    </span>
  );
}

function PriorityDot({ priority }) {
  const p = PRIORITY[priority];
  return (
    <span
      className="inline-flex items-center shrink-0"
      style={{ color: tone(p.tone) }}
      title={`اولویت: ${p.label}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: tone(p.tone) }} />
      <span className="sr-only">اولویت: {p.label}</span>
    </span>
  );
}

/** بج وضعیت برای نماهای کانبان و تقویم محتوا */
function TonePill({ toneKey, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${className}`}
      style={{ color: tone(toneKey), background: toneSoft(toneKey) }}
    >
      {children}
    </span>
  );
}

/**
 * نمای فشرده‌ی برد برای حالت «همه پروژه‌ها».
 * پیش از این در آن حالت، برد کامل هر پروژه رندر می‌شد (۴ پروژه = ۱۲ ستون عمودی)
 * که هیچ دکمه‌ی افزودنی هم نداشت. اینجا فقط موارد قابل‌اقدام را خلاصه نشان می‌دهیم
 * و برد کامل وقتی باز می‌شود که پروژه انتخاب شده باشد.
 */
const SUMMARY_LIMIT = 4;

/**
 * یک ردیف در نماهای خلاصه. قبلاً هر سه خلاصه ردیف‌هایشان را جدا و بدون هیچ
 * جداکننده‌ای می‌ساختند، پس متن‌ها پشت سر هم می‌چسبیدند و خواندنشان سخت بود.
 * حالا هر ردیف ظرف خودش را دارد و برچسبش قرص رنگی است نه متن لخت.
 */
function SummaryRow({ statusTone, statusLabel, badge, badgeTone, title, meta }) {
  return (
    <li
      className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg min-w-0"
      style={{ background: C.panelAlt }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: tone(statusTone) }}
        title={statusLabel}
      />
      {badge && (
        <span
          className="shrink-0 px-1.5 py-0.5 rounded-md font-medium"
          style={{ color: tone(badgeTone), background: toneSoft(badgeTone) }}
        >
          {badge}
        </span>
      )}
      {/* عنوان عنصر اصلی این ردیف است، پس رنگ متن اصلی می‌گیرد نه خاکستری */}
      <span className="flex-1 truncate" style={{ color: C.text }}>{title}</span>
      {meta && (
        <span className="mono tnum shrink-0" style={{ color: C.faint }}>{meta}</span>
      )}
    </li>
  );
}

function BoardSummary({ items, kind, onOpen, showAll = false }) {
  const actionable = items
    .filter((i) => showAll || i.status !== "done")
    .slice()
    .sort((a, b) => {
      const byStatus =
        UPDATE_STATUS_ORDER.indexOf(a.status) - UPDATE_STATUS_ORDER.indexOf(b.status);
      if (byStatus !== 0) return byStatus;
      return kind === "ads"
        ? PRIORITY_ORDER.indexOf(b.priority) - PRIORITY_ORDER.indexOf(a.priority)
        : 0;
    });

  const shown = actionable.slice(0, SUMMARY_LIMIT);
  const rest = actionable.length - shown.length;

  return (
    <div className="px-4 py-3">
      {items.length === 0 ? (
        <EmptyState icon={kind === "ads" ? Megaphone : StickyNote} compact>
          موردی ثبت نشده.
        </EmptyState>
      ) : actionable.length === 0 ? (
        <p className="flex items-center gap-1.5 text-xs mb-3" style={{ color: tone("jade") }}>
          <CheckCircle2 size={14} className="shrink-0" />
          همه‌ی {items.length} مورد انجام شده.
        </p>
      ) : (
        <>
          <ul className="space-y-1.5 mb-2">
            {shown.map((i) => (
              <SummaryRow
                key={i.id}
                statusTone={UPDATE_STATUS[i.status].tone}
                statusLabel={UPDATE_STATUS[i.status].label}
                badge={kind === "ads" ? PRIORITY[i.priority].label : i.version ? `v${i.version}` : null}
                badgeTone={kind === "ads" ? PRIORITY[i.priority].tone : "slate"}
                title={i.text}
                meta={
                  kind === "ads"
                    ? AD_PLATFORM[i.platform]?.label || AD_PLATFORM.other.label
                    : null
                }
              />
            ))}
          </ul>
          {rest > 0 && (
            <p className="text-xs mb-3 mono tnum" style={{ color: C.faint }}>
              + {rest} مورد دیگر
            </p>
          )}
        </>
      )}

      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
        style={{ border: `1px solid ${C.border}`, color: C.muted }}
      >
        باز کردن برد کامل
        <ArrowLeft size={13} className="shrink-0" />
      </button>
    </div>
  );
}

/**
 * همان منطق BoardSummary، ولی برای ماژول‌ها — چون در حالت «همه پروژه‌ها»
 * لیست آکاردئونی هر چهار پروژه پشت سر هم می‌آمد و صفحه بی‌اندازه بلند می‌شد.
 */
function ModulesSummary({ modules, onOpen, showAll = false }) {
  const actionable = modules
    .filter((m) => showAll || m.status !== "done")
    .slice()
    .sort(
      (a, b) =>
        PRIORITY_ORDER.indexOf(b.priority) - PRIORITY_ORDER.indexOf(a.priority) ||
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    );

  const shown = actionable.slice(0, SUMMARY_LIMIT);
  const rest = actionable.length - shown.length;

  return (
    <div className="px-4 py-3">
      {modules.length === 0 ? (
        <EmptyState icon={ListChecks} compact>هنوز ماژولی ثبت نشده.</EmptyState>
      ) : actionable.length === 0 ? (
        <p className="flex items-center gap-1.5 text-xs mb-3" style={{ color: tone("jade") }}>
          <CheckCircle2 size={14} className="shrink-0" />
          همه‌ی {modules.length} ماژول انجام شده.
        </p>
      ) : (
        <>
          <ul className="space-y-1.5 mb-2">
            {shown.map((m) => {
              const doneCount = m.checklist.filter((c) => c.done).length;
              return (
                <SummaryRow
                  key={m.id}
                  statusTone={STATUS[m.status].tone}
                  statusLabel={STATUS[m.status].label}
                  badge={PRIORITY[m.priority].label}
                  badgeTone={PRIORITY[m.priority].tone}
                  title={m.title}
                  meta={m.checklist.length > 0 ? `${doneCount}/${m.checklist.length}` : null}
                />
              );
            })}
          </ul>
          {rest > 0 && (
            <p className="text-xs mb-3 mono tnum" style={{ color: C.faint }}>
              + {rest} ماژول دیگر
            </p>
          )}
        </>
      )}

      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
        style={{ border: `1px solid ${C.border}`, color: C.muted }}
      >
        باز کردن لیست کامل
        <ArrowLeft size={13} className="shrink-0" />
      </button>
    </div>
  );
}

/**
 * پاورقی گرید کارت‌ها در حالت «همه پروژه‌ها» — کارت‌ها بریده شده‌اند،
 * پس باید هم تعداد باقی‌مانده معلوم باشد هم راه دیدن کاملش.
 */
function MoreLine({ rest, onOpen }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {rest > 0 && (
        <span className="text-xs mono tnum" style={{ color: C.faint }}>
          + {rest} مورد دیگر
        </span>
      )}
      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
        style={{ border: `1px solid ${C.border}`, color: C.muted }}
      >
        باز کردن لیست کامل
        <ArrowLeft size={13} className="shrink-0" />
      </button>
    </div>
  );
}

/** همان الگو برای تقویم محتوا — «منتشر شده» کار تمام‌شده حساب می‌شود */
function ContentSummary({ items, onOpen, showAll = false }) {
  const actionable = items
    .filter((i) => showAll || i.status !== "published")
    .slice()
    .sort(
      (a, b) =>
        CONTENT_STATUS_ORDER.indexOf(b.status) - CONTENT_STATUS_ORDER.indexOf(a.status) ||
        String(a.publish_date || "9999").localeCompare(String(b.publish_date || "9999"))
    );

  const shown = actionable.slice(0, SUMMARY_LIMIT);
  const rest = actionable.length - shown.length;

  return (
    <div className="px-4 py-3">
      {items.length === 0 ? (
        <EmptyState icon={CalendarDays} compact>هنوز محتوایی ثبت نشده.</EmptyState>
      ) : actionable.length === 0 ? (
        <p className="flex items-center gap-1.5 text-xs mb-3" style={{ color: tone("jade") }}>
          <CheckCircle2 size={14} className="shrink-0" />
          هر {items.length} محتوا منتشر شده.
        </p>
      ) : (
        <>
          <ul className="space-y-1.5 mb-2">
            {shown.map((i) => (
              <SummaryRow
                key={i.id}
                statusTone={CONTENT_STATUS[i.status].tone}
                statusLabel={CONTENT_STATUS[i.status].label}
                badge={CONTENT_PLATFORM[i.platform]?.label || CONTENT_PLATFORM.website.label}
                badgeTone={CONTENT_STATUS[i.status].tone}
                title={i.title}
                meta={i.publish_date || null}
              />
            ))}
          </ul>
          {rest > 0 && (
            <p className="text-xs mb-3 mono tnum" style={{ color: C.faint }}>
              + {rest} محتوای دیگر
            </p>
          )}
        </>
      )}

      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
        style={{ border: `1px solid ${C.border}`, color: C.muted }}
      >
        باز کردن لیست کامل
        <ArrowLeft size={13} className="shrink-0" />
      </button>
    </div>
  );
}

/**
 * نوار لینک‌های ثابت پروژه. همیشه دیده می‌شود (مستقل از تب انتخاب‌شده)
 * چون کارکردش صرفه‌جویی در باز کردن روزانه‌ی همین چند آدرس است.
 */
function ProjectLinks({ links, canEdit, editing, onToggleEdit, onAdd, onPatch, onDelete }) {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftUrl, setDraftUrl] = useState("");

  const submit = () => {
    if (!draftUrl.trim()) return;
    onAdd(draftLabel.trim() || hostOf(safeHref(draftUrl) || draftUrl), draftUrl.trim());
    setDraftLabel("");
    setDraftUrl("");
  };

  if (!links.length && !canEdit) return null;

  return (
    <div
      className="px-4 py-2 flex flex-wrap items-center gap-1.5"
      style={{ borderBottom: `1px solid ${C.border}`, background: C.panelAlt }}
    >
      {links.map((l) => {
        const href = safeHref(l.url);
        const Icon = linkIconFor(l.label, l.url);
        const text = l.label || (href ? hostOf(href) : l.url);
        // لینک نامعتبر (مثلا javascript:) به‌عنوان متن نشان داده می‌شود، نه <a>
        return href ? (
          <a
            key={l.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={href}
            className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ops-tap"
            style={{ color: C.muted, border: `1px solid ${C.border}`, background: C.panel }}
          >
            <Icon size={12} className="shrink-0" />
            {text}
            <ExternalLink size={9} className="shrink-0 opacity-60" />
          </a>
        ) : (
          <span
            key={l.id}
            title="لینک نامعتبر — باید با http:// یا https:// باشد"
            className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
            style={{ color: tone("red"), background: toneSoft("red") }}
          >
            <Link2 size={12} className="shrink-0" />
            {text}
          </span>
        );
      })}

      {canEdit && (
        <button
          onClick={onToggleEdit}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ops-tap"
          style={{ color: C.faint, border: `1px dashed ${C.border}` }}
          title={editing ? "بستن ویرایش لینک‌ها" : "ویرایش لینک‌ها"}
        >
          {editing ? <X size={11} /> : <Pencil size={11} />}
          {links.length ? "لینک‌ها" : "افزودن لینک"}
        </button>
      )}

      {editing && canEdit && (
        <div className="w-full mt-2 p-2 rounded-lg" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          {links.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-2 mb-2">
              <input
                defaultValue={l.label}
                onBlur={(e) => e.target.value !== l.label && onPatch(l.id, { label: e.target.value })}
                placeholder="برچسب"
                className="text-xs px-2 py-1.5 rounded-md outline-none ops-input w-28"
              />
              <input
                defaultValue={l.url}
                onBlur={(e) => e.target.value !== l.url && onPatch(l.id, { url: e.target.value })}
                placeholder="https://..."
                dir="ltr"
                className="mono text-xs px-2 py-1.5 rounded-md outline-none ops-input flex-1 min-w-[180px]"
              />
              <ConfirmDelete onConfirm={() => onDelete(l.id)} size={12} title="حذف لینک" />
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="برچسب"
              className="text-xs px-2 py-1.5 rounded-md outline-none ops-input w-28"
            />
            <input
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="https://..."
              dir="ltr"
              className="mono text-xs px-2 py-1.5 rounded-md outline-none ops-input flex-1 min-w-[180px]"
            />
            <button onClick={submit} className="text-xs px-3 py-1.5 rounded-md font-medium ops-primary shrink-0">
              افزودن
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-2">
            {LINK_PRESETS.filter((x) => !links.some((l) => l.label === x)).map((x) => (
              <button
                key={x}
                onClick={() => setDraftLabel(x)}
                className="text-xs px-1.5 py-0.5 rounded ops-tap"
                style={{ color: C.faint, border: `1px solid ${C.border}` }}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * کارت رقیب با خلاصهٔ تحلیل و دکمهٔ مشخص برای بازکردن جزئیات.
 * ویرایشگرها هنگام جمع‌شدن کارت mounted می‌مانند تا پیش‌نویس حفظ شود.
 */
export function CompetitorCard({ item, onPatch, onDelete }) {
  const [name, setName] = useState(item.name);
  const [url, setUrl] = useState(item.url);
  const [visits, setVisits] = useState(item.monthly_visits);
  const [editUrl, setEditUrl] = useState(false);
  const [open, setOpen] = useState(false);

  const href = safeHref(item.url);
  const v = COMPETITOR_VERDICT[item.verdict] || COMPETITOR_VERDICT.neutral;
  const save = (field, value, current) => {
    if (value !== current) onPatch(item.id, { [field]: value });
  };
  const hasDetail = Boolean(item.note?.trim() || item.advantage?.trim());

  return (
    <div
      className="rounded-xl ops-card"
      style={{
        background: item.verdict === "neutral" ? C.panel : toneSoft(v.tone),
        border: `1px solid ${C.border}`,
        borderRight: `3px solid ${item.verdict === "neutral" ? C.borderStrong : tone(v.tone)}`,
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 p-0.5 rounded ops-tap"
          style={{ color: hasDetail ? tone("blue") : C.faint }}
          title={open ? "بستن" : hasDetail ? "باز کردن — نکته و نقطه‌قوت دارد" : "باز کردن"}
        >
          {open ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
          <span className="sr-only">{open ? "بستن" : "باز کردن"}</span>
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => save("name", name, item.name)}
          placeholder="اسم رقیب"
          className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none"
          style={{ color: C.text }}
        />

        {!open && href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            dir="ltr"
            className="mono text-xs truncate max-w-[10rem] hidden sm:block underline decoration-dotted underline-offset-2 shrink-0"
            style={{ color: tone("blue") }}
            title={href}
          >
            {hostOf(href)}
          </a>
        )}
        {!open && item.monthly_visits?.trim() && (
          <span className="mono tnum text-xs shrink-0" style={{ color: C.faint }} title="بازدید ماهانه">
            {item.monthly_visits}
          </span>
        )}

        <button
          onClick={() =>
            onPatch(item.id, {
              verdict:
                COMPETITOR_VERDICT_ORDER[
                  (COMPETITOR_VERDICT_ORDER.indexOf(item.verdict) + 1) % COMPETITOR_VERDICT_ORDER.length
                ],
            })
          }
          title="کلیک برای تغییر برچسب"
          className="shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ops-tap"
          style={{ color: tone(v.tone), background: toneSoft(v.tone) }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(v.tone) }} />
          {v.label}
        </button>
        <ConfirmDelete onConfirm={() => onDelete(item.id)} />
      </div>

      {open && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {editUrl || !href ? (
              <input
                autoFocus={editUrl}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => {
                  save("url", url, item.url);
                  setEditUrl(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                placeholder="لینک سایت (اختیاری)"
                dir="ltr"
                className="flex-1 min-w-[140px] mono text-xs px-2 py-1.5 rounded-md outline-none ops-input"
              />
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
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
                  className="text-xs px-1 rounded ops-tap shrink-0"
                  style={{ color: C.faint }}
                >
                  ویرایش
                </button>
              </div>
            )}
            <input
              value={visits}
              onChange={(e) => setVisits(e.target.value)}
              onBlur={() => save("monthly_visits", visits, item.monthly_visits)}
              placeholder="بازدید ماهانه: 1m، 624k..."
              className="mono w-40 text-xs px-2 py-1.5 rounded-md outline-none ops-input shrink-0"
            />
          </div>

        </div>
      )}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {!open && <p className="text-xs truncate min-w-0 flex-1" style={{ color: C.muted }}>
            {hasDetail ? (item.note?.trim() || item.advantage?.trim()) : "تحلیل، نکات و نقاط قوت این رقیب را ثبت کنید."}
          </p>}
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
            className="ops-tap text-xs rounded-md px-2 py-2 flex items-center gap-1" style={{ color: tone("blue") }}>
            <NotebookPen size={14} />{open ? "بستن جزئیات" : hasDetail ? "مشاهده و ویرایش تحلیل" : "افزودن تحلیل"}
          </button>
        </div>
        <div className={open ? "" : "hidden"}>
          <NoteContentEditor value={item.note} label="نکته‌ها و مشکلات" placeholder="مشاهدات، مشکلات و محدودیت‌های این رقیب…"
            onSave={(note) => onPatch(item.id, { note })} />
          <NoteContentEditor value={item.advantage} label="نقاط قوت" placeholder="چه ویژگی‌هایی این رقیب را متمایز می‌کند؟"
            onSave={(advantage) => onPatch(item.id, { advantage })} />
        </div>
      </div>
    </div>
  );
}

function Ring({ pct, color, trackColor, size = 40 }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} strokeLinecap="round"
      />
    </svg>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: C.faint }}>
      {children}
    </label>
  );
}

function ChecklistAdder({ onAdd }) {
  const [val, setVal] = useState("");
  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && val.trim()) {
          onAdd(val.trim());
          setVal("");
        }
      }}
      placeholder="مورد جدید چک‌لیست + Enter"
      className="w-full text-sm px-3 py-2 rounded-lg outline-none ops-input"
    />
  );
}

function NotesBox({ moduleId, initialValue, onSave }) {
  return <NoteContentEditor value={initialValue} label="یادداشت و راهنمای ماژول"
    onSave={(value) => onSave(moduleId, value)} />;
}

function PlatformBadge({ platform }) {
  const p = CONTENT_PLATFORM[platform];
  const Icon = p.icon;
  return (
    <span className="inline-flex items-center shrink-0" title={p.label} style={{ color: C.muted }}>
      <Icon size={14} />
      <span className="sr-only">{p.label}</span>
    </span>
  );
}

function ContentEditor({ item, onSaveField }) {
  const [title, setTitle] = useState(item.title);
  const [date, setDate] = useState(item.publish_date || "");

  return (
    <div>
      <FieldLabel>عنوان</FieldLabel>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== item.title && onSaveField(item.id, "title", title)}
        className="w-full text-sm px-3 py-2 rounded-lg outline-none ops-input mb-4"
      />

      <NoteContentEditor value={item.body} label="متن و کپشن محتوا" placeholder="متن پست، کپشن یا خلاصه محتوا…"
        onSave={(value) => onSaveField(item.id, "body", value)} />

      <FieldLabel>تاریخ انتشار</FieldLabel>
      <input
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          onSaveField(item.id, "publish_date", e.target.value || null);
        }}
        className="mono text-sm px-3 py-2 rounded-lg outline-none ops-input"
      />
    </div>
  );
}


function UpdateCard({
  item, rank, isFirst, isLast, onSaveText, onSaveVersion, onSetColor, onMove, onReorder, onDelete,
}) {
  const [version, setVersion] = useState(item.version || "");
  const idx = UPDATE_STATUS_ORDER.indexOf(item.status);

  return (
    <div
      className="group rounded-xl p-3 ops-card"
      style={{ background: item.color, color: C.onSticky, border: "1px solid transparent" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="mono tnum shrink-0 text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center"
          style={{ color: C.onSticky, border: `1px solid ${C.onSticky}`, opacity: 0.55 }}
          title={`ترتیب ${rank} در این ستون`}
        >
          {faNum(rank)}
        </span>
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          onBlur={() => version !== (item.version || "") && onSaveVersion(item.id, version)}
          placeholder="ورژن"
          className="mono text-xs font-semibold bg-transparent outline-none flex-1 min-w-0 placeholder:opacity-45"
          style={{ color: C.onSticky }}
        />
        <ConfirmDelete onConfirm={() => onDelete(item.id)} size={13} className="p-1" onSticky />
      </div>
      <div className="mb-3"><NoteContentEditor value={item.text} label="متن آپدیت"
        onSave={(value) => onSaveText(item.id, value)} /></div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {UPDATE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onSetColor(item.id, c)}
              title="تغییر رنگ کارت"
              className="rounded-full shrink-0 transition-transform hover:scale-125"
              style={{
                width: 12,
                height: 12,
                background: c,
                boxShadow: c === item.color ? `0 0 0 2px ${C.onSticky}` : "0 0 0 1px rgba(0,0,0,.18)",
              }}
            >
              <span className="sr-only">رنگ</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          {/* بالا/پایین = ترتیب داخل همین ستون، راست/چپ = جابه‌جایی بین ستون‌ها */}
          <button
            disabled={isFirst}
            onClick={() => onReorder(-1)}
            className="p-1 rounded-md disabled:opacity-25 ops-tap"
            title="بالاتر در همین ستون"
          >
            <ChevronUp size={14} />
            <span className="sr-only">بالاتر</span>
          </button>
          <button
            disabled={isLast}
            onClick={() => onReorder(1)}
            className="p-1 rounded-md disabled:opacity-25 ops-tap"
            title="پایین‌تر در همین ستون"
          >
            <ChevronDown size={14} />
            <span className="sr-only">پایین‌تر</span>
          </button>
          <span className="w-px h-4 mx-0.5 opacity-25" style={{ background: C.onSticky }} />
          <button
            disabled={idx === 0}
            onClick={() => onMove(item.id, UPDATE_STATUS_ORDER[idx - 1])}
            className="p-1 rounded-md disabled:opacity-25 ops-tap"
            title="مرحله قبل"
          >
            <ArrowRight size={14} />
            <span className="sr-only">مرحله قبل</span>
          </button>
          <button
            disabled={idx === UPDATE_STATUS_ORDER.length - 1}
            onClick={() => onMove(item.id, UPDATE_STATUS_ORDER[idx + 1])}
            className="p-1 rounded-md disabled:opacity-25 ops-tap"
            title="مرحله بعد"
          >
            <ArrowLeft size={14} />
            <span className="sr-only">مرحله بعد</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AdCard({ item, onSaveText, onCyclePriority, onCyclePlatform, onSetColor, onMove, onDelete }) {
  const idx = UPDATE_STATUS_ORDER.indexOf(item.status);

  const p = PRIORITY[item.priority];
  const plat = AD_PLATFORM[item.platform] || AD_PLATFORM.other;
  const PlatIcon = plat.icon;

  // رنگ کارت مثل تب آپدیت‌ها؛ جوهر ثابت --on-sticky چون پس‌زمینه در هر دو تم روشن است
  const bg = item.color || UPDATE_COLORS[0];

  return (
    <div
      className="rounded-xl p-3 ops-card"
      style={{ background: bg, color: C.onSticky, border: "1px solid transparent" }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => onCyclePlatform(item.id, item.platform)}
            title="کلیک برای تغییر نوع تبلیغ"
            className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 -mr-1 rounded-md opacity-70 hover:opacity-100 ops-tap"
            style={{ color: C.onSticky }}
          >
            <PlatIcon size={11} className="shrink-0" />
            {plat.label}
          </button>
          <button
            onClick={() => onCyclePriority(item.id, item.priority)}
            title="کلیک برای تغییر اولویت"
            className="flex items-center gap-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ops-tap"
            style={{ color: C.onSticky }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ background: tone(p.tone), boxShadow: `0 0 0 1.5px ${C.onSticky}` }}
            />
            {p.label}
          </button>
        </div>
        <ConfirmDelete onConfirm={() => onDelete(item.id)} size={13} className="p-1" onSticky />
      </div>
      <div className="mb-3"><NoteContentEditor value={item.text} label="متن تبلیغ"
        onSave={(value) => onSaveText(item.id, value)} /></div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {UPDATE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onSetColor(item.id, c)}
              title="تغییر رنگ کارت"
              className="rounded-full shrink-0 transition-transform hover:scale-125"
              style={{
                width: 12,
                height: 12,
                background: c,
                boxShadow: c === bg ? `0 0 0 2px ${C.onSticky}` : "0 0 0 1px rgba(0,0,0,.18)",
              }}
            >
              <span className="sr-only">رنگ</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            disabled={idx === 0}
            onClick={() => onMove(item.id, UPDATE_STATUS_ORDER[idx - 1])}
            className="p-1 rounded-md disabled:opacity-25 ops-tap"
            title="مرحله قبل"
          >
            <ArrowRight size={14} />
            <span className="sr-only">مرحله قبل</span>
          </button>
          <button
            disabled={idx === UPDATE_STATUS_ORDER.length - 1}
            onClick={() => onMove(item.id, UPDATE_STATUS_ORDER[idx + 1])}
            className="p-1 rounded-md disabled:opacity-25 ops-tap"
            title="مرحله بعد"
          >
            <ArrowLeft size={14} />
            <span className="sr-only">مرحله بعد</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OpsCenter({
  initialProjects, initialContentItems, initialUpdateItems, initialAdItems,
  initialProjectLinks, initialNotes, initialCompetitorItems, userEmail,
  loadError = null, autoBackupLabel = null,
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [projects, setProjects] = useState(initialProjects || []);
  const [contentItems, setContentItems] = useState(initialContentItems || []);
  const [updateItems, setUpdateItems] = useState(initialUpdateItems || []);
  const [adItems, setAdItems] = useState(initialAdItems || []);
  const [projectLinks, setProjectLinks] = useState(initialProjectLinks || []);
  const [editingLinksFor, setEditingLinksFor] = useState(null);
  const [notes, setNotes] = useState(initialNotes || []);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [competitorItems, setCompetitorItems] = useState(initialCompetitorItems || []);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [view, setViewState] = useState("modules");
  const [showAddUpdate, setShowAddUpdate] = useState(null); // status key or null
  const [newUpdateText, setNewUpdateText] = useState("");
  const [newUpdateVersion, setNewUpdateVersion] = useState("");
  const [showAddAd, setShowAddAd] = useState(null); // status key or null
  const [newAdText, setNewAdText] = useState("");
  const [newAdPlatform, setNewAdPlatform] = useState("instagram");
  const [activeId, setActiveId] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [expandedContent, setExpandedContent] = useState(null);
  const [search, setSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const searchRef = useRef(null);
  const projectNameRef = useRef(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModTitle, setNewModTitle] = useState("");
  const [newModCategory, setNewModCategory] = useState("");
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState("");
  const [newContentPlatform, setNewContentPlatform] = useState("website");
  const [showAddProject, setShowAddProject] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const tabRefs = useRef({});
  const [newProjName, setNewProjName] = useState("");
  const [newProjTag, setNewProjTag] = useState("");
  const [errorMsg, flash] = useFlash(4000);
  const { theme, toggleTheme, mounted } = useTheme();

  const setView = (next) => {
    setViewState(next);
    setStatusFilter(null);
    setSearch("");
  };

  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const selectProject = (id) => {
    setActiveId(id);
    setMobileNavOpen(false);
    setStatusFilter(null);
    setSearch("");
  };

  useEffect(() => {
    if (showAddProject) projectNameRef.current?.focus();
  }, [showAddProject, mobileNavOpen]);

  const updateProjectLocal = (pid, fn) =>
    setProjects((prev) => prev.map((p) => (p.id === pid ? fn(p) : p)));

  const updateModuleLocal = (pid, mid, fn) =>
    updateProjectLocal(pid, (p) => ({ ...p, modules: p.modules.map((mm) => (mm.id === mid ? fn(mm) : mm)) }));

  // --- mutations -----------------------------------------------------------
  const addProject = async () => {
    if (!newProjName.trim()) return;
    const accent = PALETTE[projects.length % PALETTE.length];
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newProjName.trim(), tagline: newProjTag.trim(), accent, sort_order: projects.length })
      .select()
      .single();
    if (error) return flash("خطا در ساخت پروژه: " + error.message);
    setProjects((prev) => [...prev, { ...data, modules: [] }]);
    setNewProjName("");
    setNewProjTag("");
    setShowAddProject(false);
  };

  const addModule = async () => {
    if (!newModTitle.trim() || activeId === "all") return;
    const { data, error } = await supabase
      .from("modules")
      .insert({
        project_id: activeId,
        title: newModTitle.trim(),
        category: newModCategory.trim() || "عمومی",
        status: "not_started",
        priority: "medium",
      })
      .select()
      .single();
    if (error) return flash("خطا در ساخت ماژول: " + error.message);
    updateProjectLocal(activeId, (p) => ({ ...p, modules: [...p.modules, { ...data, checklist: [] }] }));
    setNewModTitle("");
    setNewModCategory("");
    setShowAddModule(false);
  };

  const deleteModule = async (pid, mid) => {
    const { error } = await supabase.from("modules").delete().eq("id", mid);
    if (error) return flash("خطا در حذف ماژول: " + error.message);
    updateProjectLocal(pid, (p) => ({ ...p, modules: p.modules.filter((mm) => mm.id !== mid) }));
  };

  const setModuleStatus = async (pid, mid, current, next) => {
    updateModuleLocal(pid, mid, (mm) => ({ ...mm, status: next }));
    const { error } = await supabase.from("modules").update({ status: next }).eq("id", mid);
    if (error) {
      updateModuleLocal(pid, mid, (mm) => mm.status === next ? { ...mm, status: current } : mm);
      flash("خطا در ذخیره وضعیت: " + error.message);
    }
  };

  const setModulePriority = async (pid, mid, current, next) => {
    updateModuleLocal(pid, mid, (mm) => ({ ...mm, priority: next }));
    const { error } = await supabase.from("modules").update({ priority: next }).eq("id", mid);
    if (error) {
      updateModuleLocal(pid, mid, (mm) => mm.priority === next ? { ...mm, priority: current } : mm);
      flash("خطا در ذخیره اولویت: " + error.message);
    }
  };

  const saveNotes = async (mid, notes) => {
    let pid = null;
    projects.forEach((p) => p.modules.forEach((mm) => { if (mm.id === mid) pid = p.id; }));
    const previous = projects.find((p) => p.id === pid)?.modules.find((mm) => mm.id === mid)?.notes;
    if (pid) updateModuleLocal(pid, mid, (mm) => ({ ...mm, notes }));
    const { error } = await supabase.from("modules").update({ notes }).eq("id", mid);
    if (error) {
      if (pid) updateModuleLocal(pid, mid, (mm) => mm.notes === notes ? { ...mm, notes: previous } : mm);
      flash("خطا در ذخیره یادداشت: " + error.message);
      return false;
    }
    return true;
  };

  const toggleChecklist = async (pid, mid, cid, currentDone) => {
    updateModuleLocal(pid, mid, (mm) => ({
      ...mm,
      checklist: mm.checklist.map((c) => (c.id === cid ? { ...c, done: !currentDone } : c)),
    }));
    const { error } = await supabase.from("checklist_items").update({ done: !currentDone }).eq("id", cid);
    if (error) flash("خطا در ذخیره چک‌لیست: " + error.message);
  };

  const addChecklistItem = async (pid, mid, text) => {
    const { data, error } = await supabase
      .from("checklist_items")
      .insert({ module_id: mid, text })
      .select()
      .single();
    if (error) return flash("خطا در افزودن مورد: " + error.message);
    updateModuleLocal(pid, mid, (mm) => ({ ...mm, checklist: [...mm.checklist, data] }));
  };

  // --- content calendar mutations -------------------------------------------
  const addContentItem = async () => {
    if (!newContentTitle.trim() || activeId === "all") return;
    const { data, error } = await supabase
      .from("content_items")
      .insert({
        project_id: activeId,
        title: newContentTitle.trim(),
        platform: newContentPlatform,
        status: "idea",
      })
      .select()
      .single();
    if (error) return flash("خطا در ساخت محتوا: " + error.message);
    setContentItems((prev) => [...prev, data]);
    setNewContentTitle("");
    setNewContentPlatform("website");
    setShowAddContent(false);
  };

  const updateContentField = async (cid, field, value) => {
    const previous = contentItems.find((ci) => ci.id === cid)?.[field];
    setContentItems((prev) => prev.map((ci) => (ci.id === cid ? { ...ci, [field]: value } : ci)));
    const { error } = await supabase.from("content_items").update({ [field]: value }).eq("id", cid);
    if (error) {
      setContentItems((prev) => prev.map((ci) => ci.id === cid && ci[field] === value ? { ...ci, [field]: previous } : ci));
      flash("خطا در ذخیره تغییرات محتوا: " + error.message);
      return false;
    }
    return true;
  };

  const cycleContentStatus = async (cid, current) => {
    const idx = CONTENT_STATUS_ORDER.indexOf(current);
    const next = CONTENT_STATUS_ORDER[(idx + 1) % CONTENT_STATUS_ORDER.length];
    updateContentField(cid, "status", next);
  };

  const cycleContentPlatform = async (cid, current) => {
    const idx = CONTENT_PLATFORM_ORDER.indexOf(current);
    const next = CONTENT_PLATFORM_ORDER[(idx + 1) % CONTENT_PLATFORM_ORDER.length];
    updateContentField(cid, "platform", next);
  };

  const deleteContentItem = async (cid) => {
    const { error } = await supabase.from("content_items").delete().eq("id", cid);
    if (error) return flash("خطا در حذف محتوا: " + error.message);
    setContentItems((prev) => prev.filter((ci) => ci.id !== cid));
  };

  // --- updates board mutations -----------------------------------------------
  const addUpdateItem = async (pid, status) => {
    if (!newUpdateText.trim()) return;
    const color = UPDATE_COLORS[updateItems.filter((u) => u.project_id === pid).length % UPDATE_COLORS.length];
    const { data, error } = await supabase
      .from("update_items")
      .insert({
        project_id: pid,
        text: newUpdateText.trim(),
        version: newUpdateVersion.trim(),
        status,
        color,
      })
      .select()
      .single();
    if (error) return flash("خطا در ساخت آپدیت: " + error.message);
    setUpdateItems((prev) => [...prev, data]);
    setNewUpdateText("");
    setNewUpdateVersion("");
    setShowAddUpdate(null);
  };

  const updateUpdateField = async (uid, field, value) => {
    const previous = updateItems.find((item) => item.id === uid)?.[field];
    setUpdateItems((prev) => prev.map((u) => (u.id === uid ? { ...u, [field]: value } : u)));
    const { error } = await supabase.from("update_items").update({ [field]: value }).eq("id", uid);
    if (error) {
      setUpdateItems((prev) => prev.map((item) => item.id === uid && item[field] === value ? { ...item, [field]: previous } : item));
      flash("خطا در ذخیره تغییرات: " + error.message);
      return false;
    }
    return true;
  };

  /**
   * جابه‌جایی آپدیت داخل ستون خودش. مثل بقیه‌ی جاها کل ستون بازشماری می‌شود،
   * چون sort_order آیتم‌های موجود می‌تواند تکراری یا صفر باشد.
   */
  const reorderUpdateItem = async (list, from, dir) => {
    const to = from + dir;
    if (to < 0 || to >= list.length) return;

    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const changed = next
      .map((u, index) => ({ u, index }))
      .filter(({ u, index }) => (u.sort_order ?? 0) !== index);
    if (!changed.length) return;

    const snapshot = updateItems;
    const orderById = new Map(next.map((u, index) => [u.id, index]));
    setUpdateItems((prev) =>
      prev.map((u) => (orderById.has(u.id) ? { ...u, sort_order: orderById.get(u.id) } : u))
    );

    const results = await Promise.all(
      changed.map(({ u, index }) =>
        supabase.from("update_items").update({ sort_order: index }).eq("id", u.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed) {
      setUpdateItems(snapshot);
      const e = failed.error;
      flash(
        `خطا در جابه‌جایی آپدیت: ${e.message}` +
          (e.code ? ` [${e.code}]` : "") +
          (e.details ? ` — ${e.details}` : "")
      );
    }
  };

  const deleteUpdateItem = async (uid) => {
    const { error } = await supabase.from("update_items").delete().eq("id", uid);
    if (error) return flash("خطا در حذف آپدیت: " + error.message);
    setUpdateItems((prev) => prev.filter((u) => u.id !== uid));
  };

  // --- ads board mutations ---------------------------------------------------
  const addAdItem = async (pid, status) => {
    if (!newAdText.trim()) return;
    // رنگ‌ها به‌ترتیب چرخشی داده می‌شوند تا کارت‌های یک پروژه یکدست نشوند
    const color = UPDATE_COLORS[adItems.filter((a) => a.project_id === pid).length % UPDATE_COLORS.length];
    const { data, error } = await supabase
      .from("ad_items")
      .insert({
        project_id: pid,
        text: newAdText.trim(),
        status,
        priority: "medium",
        platform: newAdPlatform,
        color,
      })
      .select()
      .single();
    if (error) return flash("خطا در ساخت تبلیغ: " + error.message);
    setAdItems((prev) => [...prev, data]);
    setNewAdText("");
    setShowAddAd(null);
  };

  const updateAdField = async (aid, field, value) => {
    const previous = adItems.find((item) => item.id === aid)?.[field];
    setAdItems((prev) => prev.map((a) => (a.id === aid ? { ...a, [field]: value } : a)));
    const { error } = await supabase.from("ad_items").update({ [field]: value }).eq("id", aid);
    if (error) {
      setAdItems((prev) => prev.map((item) => item.id === aid && item[field] === value ? { ...item, [field]: previous } : item));
      flash("خطا در ذخیره تغییرات تبلیغ: " + error.message);
      return false;
    }
    return true;
  };

  const cycleAdPriority = async (aid, current) => {
    const idx = PRIORITY_ORDER.indexOf(current);
    const next = PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length];
    updateAdField(aid, "priority", next);
  };

  const cycleAdPlatform = async (aid, current) => {
    const idx = AD_PLATFORM_ORDER.indexOf(current);
    const next = AD_PLATFORM_ORDER[(idx + 1) % AD_PLATFORM_ORDER.length];
    updateAdField(aid, "platform", next);
  };

  const deleteAdItem = async (aid) => {
    const { error } = await supabase.from("ad_items").delete().eq("id", aid);
    if (error) return flash("خطا در حذف تبلیغ: " + error.message);
    setAdItems((prev) => prev.filter((a) => a.id !== aid));
  };

  // --- project notes mutations ----------------------------------------------
  const addNote = async (pid) => {
    const title = newNoteTitle.trim();
    if (!title) return;
    const { data, error } = await supabase
      .from("notes")
      .insert({ project_id: pid, title })
      .select()
      .single();
    if (error) return flash("خطا در ساخت یادداشت: " + error.message);
    setNotes((prev) => [data, ...prev]);
    setNewNoteTitle("");
    setShowAddNote(false);
  };

  const patchNote = async (id, patch) => {
    const snapshot = notes;
    setNotes((p) =>
      p.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n))
    );
    const { error } = await supabase.from("notes").update(patch).eq("id", id);
    if (error) {
      setNotes(snapshot);
      flash("خطا در ذخیره یادداشت: " + error.message);
      return false;
    }
    return true;
  };

  const deleteNote = async (id) => {
    const snapshot = notes;
    setNotes((p) => p.filter((n) => n.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      setNotes(snapshot);
      flash("خطا در حذف یادداشت: " + error.message);
    }
  };

  // --- competitor mutations ---------------------------------------------------
  const addCompetitor = async (pid) => {
    const name = newCompetitorName.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from("competitor_items")
      .insert({ project_id: pid, name })
      .select()
      .single();
    if (error) return flash("خطا در ساخت رقیب: " + error.message);
    setCompetitorItems((prev) => [...prev, data]);
    setNewCompetitorName("");
    setShowAddCompetitor(false);
  };

  const patchCompetitor = async (id, patch) => {
    const snapshot = competitorItems;
    setCompetitorItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("competitor_items").update(patch).eq("id", id);
    if (error) {
      setCompetitorItems(snapshot);
      flash("خطا در ذخیره اطلاعات رقیب: " + error.message);
      return false;
    }
    return true;
  };

  const deleteCompetitor = async (id) => {
    const snapshot = competitorItems;
    setCompetitorItems((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from("competitor_items").delete().eq("id", id);
    if (error) {
      setCompetitorItems(snapshot);
      flash("خطا در حذف رقیب: " + error.message);
    }
  };

  // --- project links mutations ----------------------------------------------
  const addProjectLink = async (pid, label, url) => {
    const order = projectLinks.filter((l) => l.project_id === pid).length;
    const { data, error } = await supabase
      .from("project_links")
      .insert({ project_id: pid, label, url, sort_order: order })
      .select()
      .single();
    if (error) return flash("خطا در افزودن لینک: " + error.message);
    setProjectLinks((prev) => [...prev, data]);
  };

  const patchProjectLink = async (lid, patch) => {
    const snapshot = projectLinks;
    setProjectLinks((prev) => prev.map((l) => (l.id === lid ? { ...l, ...patch } : l)));
    const { error } = await supabase.from("project_links").update(patch).eq("id", lid);
    if (error) {
      setProjectLinks(snapshot);
      flash("خطا در ذخیره لینک: " + error.message);
    }
  };

  const deleteProjectLink = async (lid) => {
    const snapshot = projectLinks;
    setProjectLinks((prev) => prev.filter((l) => l.id !== lid));
    const { error } = await supabase.from("project_links").delete().eq("id", lid);
    if (error) {
      setProjectLinks(snapshot);
      flash("خطا در حذف لینک: " + error.message);
    }
  };

  /**
   * جابه‌جایی پروژه در سایدبار. کل لیست بازشماری می‌شود نه تعویض با همسایه —
   * چون sort_order پروژه‌های موجود می‌تواند تکراری یا صفر باشد و آن‌وقت
   * تعویض ساده هیچ اثری نمی‌گذاشت.
   */
  /** آرشیو یا بازگرداندن پروژه — داده‌اش دست‌نخورده می‌ماند */
  const setArchived = async (pid, archived) => {
    const snapshot = projects;
    setProjects((prev) => prev.map((p) => (p.id === pid ? { ...p, archived } : p)));
    // اگر پروژه‌ی باز همین بود، بعد از آرشیو روی نمای کلی برگرد
    if (archived && activeId === pid) setActiveId("all");

    const { error } = await supabase.from("projects").update({ archived }).eq("id", pid);
    if (error) {
      setProjects(snapshot);
      flash((archived ? "خطا در آرشیو پروژه: " : "خطا در بازگرداندن پروژه: ") + error.message);
    }
  };

  const moveProject = async (from, dir) => {
    // ترتیب فقط بین پروژه‌های فعال معنا دارد
    const list = projects.filter((p) => !p.archived);
    const to = from + dir;
    if (to < 0 || to >= list.length) return;

    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const changed = next
      .map((p, index) => ({ p, index }))
      .filter(({ p, index }) => (p.sort_order ?? 0) !== index);
    if (!changed.length) return;

    const snapshot = projects;
    // فقط sort_order پروژه‌های فعال به‌روز می‌شود؛ آرشیوی‌ها باید در state بمانند
    const orderById = new Map(next.map((p, index) => [p.id, index]));
    setProjects((prev) =>
      prev
        .map((p) => (orderById.has(p.id) ? { ...p, sort_order: orderById.get(p.id) } : p))
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    );

    const results = await Promise.all(
      changed.map(({ p, index }) =>
        supabase.from("projects").update({ sort_order: index }).eq("id", p.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed) {
      setProjects(snapshot);
      flash("خطا در جابه‌جایی پروژه: " + failed.error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // --- derived state ---------------------------------------------------------
  // پروژه‌ی آرشیوشده در لیست‌ها و آمار نمی‌آید، ولی اگر مستقیم انتخابش کنی دیده می‌شود
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const visibleProjects =
    activeId === "all" ? activeProjects : projects.filter((p) => p.id === activeId);
  const scopedIds = new Set(visibleProjects.map((p) => p.id));
  const notArchived = (x) => scopedIds.has(x.project_id);

  const allModulesFlat = visibleProjects.flatMap((p) => p.modules.map((mm) => ({ ...mm, projectId: p.id })));
  const stats = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = allModulesFlat.filter((mm) => mm.status === s).length;
    return acc;
  }, {});
  const contentStats = CONTENT_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = contentItems.filter((ci) => notArchived(ci) && ci.status === s).length;
    return acc;
  }, {});
  const updateStats = UPDATE_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = updateItems.filter((u) => notArchived(u) && u.status === s).length;
    return acc;
  }, {});
  const adStats = UPDATE_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = adItems.filter((a) => notArchived(a) && a.status === s).length;
    return acc;
  }, {});
  const liveNotes = notes.filter(notArchived);
  const noteStats = { all: liveNotes.length, pinned: liveNotes.filter((n) => n.pinned).length };
  const competitorStats = COMPETITOR_VERDICT_ORDER.reduce((acc, s) => {
    acc[s] = competitorItems.filter((c) => notArchived(c) && c.verdict === s).length;
    return acc;
  }, {});

  // تعداد آیتم‌های هر تب برای همان چیزی که الان نمایش داده می‌شود
  // (همه‌ی پروژه‌ها یا فقط پروژه‌ی انتخاب‌شده)
  const visibleIds = new Set(visibleProjects.map((p) => p.id));
  const countIn = (arr) => arr.filter((x) => visibleIds.has(x.project_id)).length;
  const TAB_COUNT = {
    modules: visibleProjects.reduce((n, p) => n + p.modules.length, 0),
    content: countIn(contentItems),
    updates: countIn(updateItems),
    ads: countIn(adItems),
    notes: countIn(notes),
    competitors: countIn(competitorItems),
  };

  // ناوبری تب‌ها با کیبورد (الگوی ARIA). چون صفحه RTL است، فلش چپ «بعدی» است
  // و فلش راست «قبلی» — یعنی جهت حرکت با چیزی که کاربر می‌بیند یکی می‌شود.
  const onTabKeyDown = (e) => {
    const keys = TABS.map((t) => t.key);
    const i = keys.indexOf(view);
    let next = null;
    if (e.key === "ArrowLeft") next = keys[(i + 1) % keys.length];
    else if (e.key === "ArrowRight") next = keys[(i - 1 + keys.length) % keys.length];
    else if (e.key === "Home") next = keys[0];
    else if (e.key === "End") next = keys[keys.length - 1];
    if (!next) return;
    e.preventDefault();
    setView(next);
    tabRefs.current[next]?.focus();
  };

  const q = search.trim().toLowerCase();
  const matchesStatus = (item) => !statusFilter || (view === "notes"
    ? statusFilter === "all" || item.pinned
    : (view === "competitors" ? item.verdict : item.status) === statusFilter);
  const matchesSearch = (mm) =>
    matchesStatus(mm) && (!q || [mm.title, mm.category, mm.notes].some((f) => (f || "").toLowerCase().includes(q)));
  const matchesSearchContent = (ci) => matchesStatus(ci) && (!q || [ci.title, ci.body].some((f) => (f || "").toLowerCase().includes(q)));
  // نماهای کانبان هم جستجو می‌شوند تا کادر جستجو در همه‌ی تب‌ها یکسان عمل کند
  const matchesSearchUpdate = (u) =>
    matchesStatus(u) && (!q || u.text.toLowerCase().includes(q) || (u.version || "").toLowerCase().includes(q));
  const matchesSearchAd = (a) => matchesStatus(a) && (!q || a.text.toLowerCase().includes(q));
  const matchesSearchNote = (n) =>
    matchesStatus(n) && (!q || [n.title, n.body, n.url, n.tags].some((f) => (f || "").toLowerCase().includes(q)));
  const matchesSearchCompetitor = (c) =>
    matchesStatus(c) && (!q || [c.name, c.url, c.note, c.advantage].some((f) => (f || "").toLowerCase().includes(q)));

  // نوار آمار بالای صفحه برای هر تب داده‌ی خودش را می‌گیرد
  const activeStats = {
    modules: { order: STATUS_ORDER, map: STATUS, counts: stats },
    content: { order: CONTENT_STATUS_ORDER, map: CONTENT_STATUS, counts: contentStats },
    updates: { order: UPDATE_STATUS_ORDER, map: UPDATE_STATUS, counts: updateStats },
    ads: { order: UPDATE_STATUS_ORDER, map: UPDATE_STATUS, counts: adStats },
    notes: { order: NOTE_STATS_ORDER, map: NOTE_STATS, counts: noteStats },
    competitors: { order: COMPETITOR_VERDICT_ORDER, map: COMPETITOR_VERDICT, counts: competitorStats },
  }[view];

  const scopedItems = {
    modules: allModulesFlat,
    content: contentItems.filter(notArchived),
    updates: updateItems.filter(notArchived),
    ads: adItems.filter(notArchived),
    notes: liveNotes,
    competitors: competitorItems.filter(notArchived),
  }[view];
  const matchItem = { modules: matchesSearch, content: matchesSearchContent, updates: matchesSearchUpdate,
    ads: matchesSearchAd, notes: matchesSearchNote, competitors: matchesSearchCompetitor }[view];
  const filteredItems = scopedItems.filter(matchItem);
  const matchingProjectIds = new Set(filteredItems.map((item) => item.projectId || item.project_id));
  const displayedProjects = search.trim() || statusFilter
    ? visibleProjects.filter((project) => matchingProjectIds.has(project.id)) : visibleProjects;

  return (
    <div className="workspace-page" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <a href="#workspace-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 ops-primary rounded-lg px-4 py-2 text-sm">رفتن به محتوای پنل</a>
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside
          className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-l lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
          style={{ borderColor: C.border, background: C.panel }}
        >
          <div className="px-4 py-4 border-b flex items-start justify-between gap-2" style={{ borderColor: C.border }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Layers size={17} style={{ color: tone("jade") }} />
                <span className="mono text-xs tracking-[0.2em]" style={{ color: C.muted }}>DADASH//</span>
              </div>
              <h1 className="text-base font-bold mt-1.5 leading-snug">مدیریت پروژه‌ها</h1>
              <Link
                href="/roadmap"
                title="تاریخچه‌ی ویرایش‌ها"
                className="inline-flex items-center gap-1 mono tnum text-xs mt-1 px-1.5 py-0.5 rounded-md ops-tap"
                style={{ color: tone("jade"), background: toneSoft("jade") }}
              >
                v{version}
              </Link>
              <p className="text-xs mt-1 truncate" style={{ color: C.faint }}>{userEmail}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={toggleTheme}
                title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
                className="p-2 rounded-lg ops-tap"
                style={{ color: C.muted }}
              >
                {/* تا mount نشده آیکون را نمی‌کشیم که با سرور ناهمخوان نشود */}
                <span className="block w-4 h-4">
                  {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
                </span>
                <span className="sr-only">تغییر حالت روشن/تیره</span>
              </button>
              <button
                onClick={handleSignOut}
                title="خروج"
                className="p-2 rounded-lg ops-tap"
                style={{ color: C.muted }}
              >
                <LogOut size={16} />
                <span className="sr-only">خروج</span>
              </button>
            </div>
          </div>

          <button type="button" onClick={() => setMobileNavOpen((v) => !v)} aria-expanded={mobileNavOpen} aria-controls="workspace-sidebar"
            className="lg:hidden flex items-center justify-between w-full px-4 py-3 text-sm ops-tap" style={{ color: C.text }}>
            <span className="flex items-center gap-2"><Menu size={18} />پروژه‌ها و ابزارها</span>
            <span className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>{activeId === "all" ? "همه پروژه‌ها" : visibleProjects[0]?.name}{mobileNavOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
          </button>
          <nav id="workspace-sidebar" aria-label="ناوبری پنل" className={`${mobileNavOpen ? "block" : "hidden"} lg:block p-3 pb-6`}>
            <WorkspaceNav compact />
            <button
              onClick={() => selectProject("all")}
              aria-pressed={activeId === "all"}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ops-tap mt-3"
              style={{
                background: activeId === "all" ? C.panelAlt : "transparent",
                color: activeId === "all" ? C.text : C.muted,
                fontWeight: activeId === "all" ? 600 : 400,
              }}
            >
              <LayoutGrid size={15} className="shrink-0" />
              همه پروژه‌ها
            </button>

            <p className="px-3 pt-5 pb-1.5 text-xs font-medium" style={{ color: C.faint }}>
              پروژه‌ها · {faNum(activeProjects.length)}
            </p>

            <div className="relative mb-3">
              <Search size={14} className="absolute right-3 top-3" style={{ color: C.faint }} />
              <input aria-label="پیدا کردن پروژه" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="پیدا کردن پروژه…" className="ops-input w-full rounded-lg pr-9 pl-8 py-2 text-xs" />
              {projectSearch && <button type="button" aria-label="پاک کردن جستجوی پروژه" onClick={() => setProjectSearch("")}
                className="absolute left-1 top-1 p-2 rounded ops-tap"><X size={13} /></button>}
            </div>
            {projectSearch && !activeProjects.some((p) => [p.name, p.tagline].some((f) => (f || "").toLowerCase().includes(projectSearch.toLowerCase().trim()))) &&
              <p className="text-xs px-3 py-2" style={{ color: C.muted }}>پروژه‌ای پیدا نشد.</p>}

            {activeProjects.map((p, i) => {
              if (projectSearch.trim() && ![p.name, p.tagline].some((f) => (f || "").toLowerCase().includes(projectSearch.toLowerCase().trim()))) return null;
              const total = p.modules.length;
              const done = p.modules.filter((mm) => mm.status === "done").length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const isActive = activeId === p.id;
              return (
                // ردیف عمداً div است نه button: دکمه‌های جابه‌جایی نمی‌توانند داخل button باشند
                <div
                  key={p.id}
                  className="relative flex items-center rounded-lg mb-1.5 ops-card"
                  style={{
                    // رنگ خود پروژه، کم‌رنگ — تا کادرها در هر دو تم از هم تفکیک شوند
                    background: withAlpha(p.accent, isActive ? 0.18 : 0.08),
                    border: `1px solid ${withAlpha(p.accent, isActive ? 0.55 : 0.22)}`,
                    borderRight: `3px solid ${isActive ? p.accent : withAlpha(p.accent, 0.45)}`,
                  }}
                >
                  <button
                    onClick={() => selectProject(p.id)}
                    aria-pressed={isActive}
                    className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-right ops-tap"
                  >
                    <span className="relative shrink-0" style={{ width: 22, height: 22 }}>
                      <Ring pct={pct} color={p.accent} trackColor={C.borderStrong} size={22} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className="block truncate"
                        style={{ color: isActive ? C.text : C.muted, fontWeight: isActive ? 600 : 400 }}
                      >
                        {p.name}
                      </span>
                      <span className="block text-xs mono tnum" style={{ color: C.faint }}>
                        {done}/{total} · {pct}%
                      </span>
                    </span>
                  </button>

                  {activeProjects.length > 1 && (
                    <div className="flex flex-col shrink-0 pl-1">
                      <button
                        onClick={() => moveProject(i, -1)}
                        disabled={i === 0}
                        className="p-0.5 rounded disabled:opacity-25 ops-tap"
                        style={{ color: C.faint }}
                        title="بالا"
                      >
                        <ChevronUp size={13} />
                        <span className="sr-only">انتقال به بالا</span>
                      </button>
                      <button
                        onClick={() => moveProject(i, 1)}
                        disabled={i === activeProjects.length - 1}
                        className="p-0.5 rounded disabled:opacity-25 ops-tap"
                        style={{ color: C.faint }}
                        title="پایین"
                      >
                        <ChevronDown size={13} />
                        <span className="sr-only">انتقال به پایین</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setArchived(p.id, true)}
                    className="shrink-0 p-1.5 ml-1 rounded-lg ops-tap"
                    style={{ color: C.faint }}
                    title="آرشیو کردن پروژه"
                  >
                    <Archive size={13} />
                    <span className="sr-only">آرشیو کردن پروژه</span>
                  </button>
                </div>
              );
            })}

            {!showAddProject ? (
              <button
                onClick={() => setShowAddProject(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mt-2 ops-tap"
                style={{ color: C.muted, border: `1px dashed ${C.border}` }}
              >
                <Plus size={14} className="shrink-0" /> پروژه جدید
              </button>
            ) : (
              <div className="mt-2 p-2 rounded-lg" style={{ background: C.panelAlt }}>
                <input
                  ref={projectNameRef}
                  aria-label="نام پروژه جدید"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="نام پروژه (مثلا: yamix.io)"
                  className="w-full text-sm px-2.5 py-2 rounded-lg mb-2 outline-none ops-input"
                />
                <input
                  value={newProjTag}
                  onChange={(e) => setNewProjTag(e.target.value)}
                  placeholder="توضیح کوتاه"
                  className="w-full text-sm px-2.5 py-2 rounded-lg mb-2 outline-none ops-input"
                />
                <div className="flex gap-2">
                  <button onClick={addProject} className="flex-1 text-xs py-2 rounded-lg font-medium ops-primary">
                    افزودن
                  </button>
                  <button
                    onClick={() => setShowAddProject(false)}
                    className="px-2 rounded-lg ops-tap"
                    style={{ color: C.muted }}
                    title="انصراف"
                  >
                    <X size={14} />
                    <span className="sr-only">انصراف</span>
                  </button>
                </div>
              </div>
            )}

            {/* آرشیو — پیش‌فرض جمع است تا سایدبار شلوغ نشود */}
            {archivedProjects.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowArchivedProjects((v) => !v)}
                  aria-expanded={showArchivedProjects}
                  className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs ops-tap"
                  style={{ color: C.faint }}
                >
                  {showArchivedProjects ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  <Archive size={13} className="shrink-0" />
                  پروژه‌های آرشیو
                  <span className="mono tnum">({faNum(archivedProjects.length)})</span>
                </button>

                {showArchivedProjects &&
                  archivedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center rounded-lg mb-1 mt-1"
                      style={{
                        border: `1px dashed ${C.border}`,
                        background: activeId === p.id ? withAlpha(p.accent, 0.12) : "transparent",
                      }}
                    >
                      <button
                        onClick={() => selectProject(p.id)}
                        className="flex-1 min-w-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-right ops-tap"
                        title="دیدن این پروژه"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: withAlpha(p.accent, 0.6) }}
                        />
                        <span className="flex-1 min-w-0 truncate text-xs" style={{ color: C.muted }}>
                          {p.name}
                        </span>
                      </button>
                      <button
                        onClick={() => setArchived(p.id, false)}
                        className="shrink-0 p-1.5 rounded-lg ops-tap"
                        style={{ color: tone("jade") }}
                        title="بازگرداندن به لیست پروژه‌ها"
                      >
                        <ArchiveRestore size={13} />
                        <span className="sr-only">بازگرداندن پروژه</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="pt-4">
              <SitTimer />
              <GuideHelp section="sit-timer">آموزش تایمر</GuideHelp>
            </div>

            <p className="px-3 pt-6 pb-1.5 text-xs font-medium" style={{ color: C.faint }}>
              راهنما و تاریخچه
            </p>

            {[
              { href: "/guide", icon: BookOpen, label: "راهنمای استفاده" },
              { href: "/roadmap", icon: MapIcon, label: "رودمپ" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 ops-tap"
                style={{ color: C.muted }}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </Link>
            ))}

            <p className="px-3 pt-6 pb-1.5 text-xs font-medium" style={{ color: C.faint }}>
              بکاپ
            </p>
            <GuideHelp section="restore">نگهداری و بازیابی بکاپ</GuideHelp>

            {/* دانلود مستقیم از route؛ Content-Disposition اسم فایل را ست می‌کند */}
            {[
              {
                href: "/api/export/latest",
                label: "آخرین بکاپ خودکار",
                hint: autoBackupLabel ? `ساخته‌شده: ${autoBackupLabel}` : "هر روز ساعت ۶ صبح",
              },
              { href: "/api/export?format=sql", label: "خروجی SQL", hint: "برای بازیابی" },
              { href: "/api/export?format=json", label: "خروجی JSON", hint: "داده‌ی خام" },
            ].map(({ href, label, hint }) => (
              <a
                key={href}
                href={href}
                download
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 ops-tap"
                style={{ color: C.muted }}
              >
                <Download size={15} className="shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{label}</span>
                  <span className="block text-xs" style={{ color: C.faint }}>{hint}</span>
                </span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main id="workspace-main" tabIndex={-1} className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 py-5 flex items-start justify-between gap-3 border-b" style={{ borderColor: C.border }}>
            <div className="min-w-0">
              <p className="text-xs mb-1" style={{ color: C.faint }}>فضای کاری / {activeId === "all" ? "نمای کلی" : "پروژه"}</p>
              <h2 className="text-xl font-bold truncate">{activeId === "all" ? "همه پروژه‌ها" : visibleProjects[0]?.name || "پروژه"}</h2>
              <p className="text-xs mt-2 leading-6" style={{ color: C.muted }}>{faNum(visibleProjects.length)} پروژه · {faNum(allModulesFlat.length)} ماژول · {TABS.find((t) => t.key === view)?.label}</p>
            </div>
            <button type="button" onClick={() => { setShowAddProject(true); setMobileNavOpen(true); }}
              className="ops-primary shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold flex items-center gap-1"><Plus size={15} />پروژه جدید</button>
          </div>
          <div className="sticky top-0 z-20" style={{ background: C.bg }}>
            {loadError && (
              <div
                className="px-5 py-2.5 text-xs leading-relaxed"
                style={{ background: toneSoft("red"), color: tone("red") }}
                role="alert"
              >
                خواندن داده‌ها از دیتابیس با خطا مواجه شد: {loadError}
                <br />
                اگر تازه ستون یا جدولی اضافه شده، اسکریپت{" "}
                <span className="mono">supabase/schema.sql</span> را اجرا کن.
              </div>
            )}

            {errorMsg && (
              <div
                className="px-5 py-2.5 text-xs font-medium"
                style={{ background: toneSoft("red"), color: tone("red") }}
                role="alert"
              >
                {errorMsg}
              </div>
            )}

            {/* View tabs — الگوی W3C: ناوبری با کلید جهت‌دار و tabindex چرخشی */}
            <div
              className="px-3 sm:px-5 flex items-center gap-1 overflow-x-auto border-b"
              style={{ borderColor: C.border }}
              role="tablist"
              aria-label="نمای پروژه"
              onKeyDown={onTabKeyDown}
            >
              {TABS.map(({ key, icon: Icon, label, tone: toneKey }) => {
                const isActive = view === key;
                const count = TAB_COUNT[key];
                return (
                  <button
                    key={key}
                    id={`tab-${key}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${key}`}
                    // فقط تب فعال در نوبت Tab است؛ بین تب‌ها با فلش حرکت می‌شود
                    tabIndex={isActive ? 0 : -1}
                    ref={(el) => (tabRefs.current[key] = el)}
                    onClick={() => setView(key)}
                    className="relative flex items-center gap-1.5 text-sm px-3 pt-3 pb-2.5 mt-1 rounded-t-lg whitespace-nowrap ops-tap"
                    style={{
                      color: isActive ? tone(toneKey) : C.muted,
                      background: isActive ? toneSoft(toneKey) : "transparent",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <Icon
                      size={14}
                      className="shrink-0"
                      style={{ color: isActive ? tone(toneKey) : C.faint }}
                    />
                    {label}
                    {count > 0 && (
                      <span
                        className="mono tnum text-xs px-1 rounded"
                        style={{
                          color: isActive ? tone(toneKey) : C.faint,
                          background: isActive ? "transparent" : C.panelAlt,
                          opacity: isActive ? 0.75 : 1,
                        }}
                      >
                        {count}
                      </span>
                    )}
                    {isActive && (
                      <span
                        className="absolute inset-x-0 bottom-0 h-[2px]"
                        style={{ background: tone(toneKey) }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats + search — شروع پنلِ متناظر با تب فعال */}
            <div className="hidden lg:flex px-5 py-2 flex-wrap gap-2 items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="text-xs leading-6" style={{ color: C.muted }}>{activeId === "all" ? "برای افزودن یا ویرایش، ابتدا یک پروژه را از فهرست انتخاب کن." : "برای دیدن روش کار و توضیح کنترل‌ها، راهنمای همین بخش را باز کن."}</span>
              <GuideHelp section={view === "notes" ? "project-notes" : view === "competitors" ? "links-competitors" : view} />
            </div>
            <div
              role="region"
              aria-label="فیلترهای بخش فعلی"
              className="px-3 sm:px-5 py-3 border-b flex flex-wrap items-center gap-2"
              style={{ borderColor: C.border }}
            >
              {activeStats.order.map((s) => (
                // حاشیه‌ی این قرص‌ها روی پنلِ حاشیه‌دار فقط نویز بود؛ پس‌زمینه کافی است
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter((current) => current === s ? null : s)}
                  aria-pressed={statusFilter === s}
                  title={`فیلتر ${activeStats.map[s].label}`}
                  className="ops-tap flex items-center gap-1.5 px-2.5 py-2 rounded-lg"
                  style={{ background: statusFilter === s ? toneSoft(activeStats.map[s].tone) : C.panelAlt,
                    boxShadow: statusFilter === s ? `inset 0 0 0 1px ${tone(activeStats.map[s].tone)}` : undefined }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: tone(activeStats.map[s].tone) }}
                  />
                  <span className="text-xs" style={{ color: C.muted }}>{activeStats.map[s].label}</span>
                  <span className="mono tnum text-xs font-semibold">{faNum(activeStats.counts[s])}</span>
                </button>
              ))}
              <div className="flex-1 min-w-4" />
              <div className="relative w-full sm:w-auto">
                <Search
                  size={14}
                  className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none"
                  style={{ color: C.faint }}
                />
                <input
                  ref={searchRef}
                  aria-label="جستجو در بخش فعلی"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setSearch("")}
                  placeholder={SEARCH_PLACEHOLDER[view]}
                  className={`text-sm pr-8 py-2 rounded-lg outline-none w-full sm:w-60 ops-input ${
                    search ? "pl-8" : "pl-3"
                  }`}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    title="پاک کردن جستجو (Esc)"
                    className="absolute top-1/2 -translate-y-1/2 left-1.5 p-1 rounded-md ops-tap"
                    style={{ color: C.faint }}
                  >
                    <X size={13} />
                    <span className="sr-only">پاک کردن جستجو</span>
                  </button>
                )}
              </div>
              {(statusFilter || search) && <div className="flex items-center gap-2 w-full text-xs" role="status" style={{ color: C.muted }}>
                <Filter size={13} /><span>{faNum(filteredItems.length)} نتیجه · {statusFilter ? activeStats.map[statusFilter]?.label : "جستجو"}{search && ` · «${search}»`}</span>
                <button type="button" onClick={() => { setStatusFilter(null); setSearch(""); }} className="ops-tap rounded px-2 py-1" style={{ color: tone("blue") }}>پاک کردن فیلترها</button>
              </div>}
            </div>
          </div>

          <div id={`panel-${view}`} role="tabpanel" aria-labelledby={`tab-${view}`} className="p-3 sm:p-5 space-y-5">
            {view === "modules" && allModulesFlat.length > 0 && <section aria-label="خلاصه وضعیت پروژه‌ها">
              <button type="button" onClick={() => setShowOverview((v) => !v)} aria-expanded={showOverview} aria-controls="workspace-overview"
                className="lg:hidden ops-tap w-full flex items-center justify-between rounded-lg p-3 text-xs mb-2" style={{ background: C.panelAlt, color: C.muted }}>
                <span>خلاصه وضعیت · {faNum(Math.round((stats.done / allModulesFlat.length) * 100))}٪ انجام‌شده</span>
                {showOverview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              <div id="workspace-overview" className={`${showOverview ? "grid" : "hidden"} lg:grid grid-cols-2 xl:grid-cols-4 gap-3`}>
              {[
                ["پیشرفت ماژول‌ها", `${faNum(Math.round((stats.done / allModulesFlat.length) * 100))}٪`, "jade", null],
                ["در حال انجام", faNum(stats.in_progress), "amber", "in_progress"],
                ["نیاز به بررسی", faNum(stats.needs_review), "violet", "needs_review"],
                ["مسدود", faNum(stats.blocked), "red", "blocked"],
              ].map(([label, count, color, status]) => <button type="button" key={label}
                onClick={() => { setView("modules"); setSearch(""); setStatusFilter(status); }}
                className="ops-card text-right rounded-xl p-3 sm:p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <span className="block text-xs" style={{ color: C.muted }}>{label}</span>
                <span className="block text-2xl font-bold mt-2 tnum" style={{ color: tone(color) }}>{count}</span>
                <span className="block text-xs mt-2" style={{ color: C.faint }}>{status ? "مشاهده ماژول‌ها ←" : `${faNum(stats.done)} از ${faNum(allModulesFlat.length)} انجام‌شده`}</span>
              </button>)}
              </div>
            </section>}
            {projects.length === 0 && (
              <div className="rounded-xl" style={{ border: `1px dashed ${C.border}` }}>
                <EmptyState icon={LayoutGrid}>
                  <span>هنوز پروژه‌ای ثبت نشده. اولین پروژه‌ات را بساز و کارها را قدم‌به‌قدم جلو ببر.</span>
                  <button type="button" onClick={() => { setShowAddProject(true); setMobileNavOpen(true); }} className="ops-primary rounded-lg px-4 py-2 mt-3 text-xs">ساخت اولین پروژه</button>
                </EmptyState>
              </div>
            )}

            {(search.trim() || statusFilter) && filteredItems.length === 0 && <EmptyState icon={Search} dashed>
              موردی با این فیلترها پیدا نشد. وضعیت دیگری انتخاب کن یا فیلترها را پاک کن.
            </EmptyState>}

            {displayedProjects.map((p) => {
              const projStats = STATUS_ORDER.reduce((acc, s) => {
                acc[s] = p.modules.filter((mm) => mm.status === s).length;
                return acc;
              }, {});
              const projContent = contentItems.filter((ci) => ci.project_id === p.id);
              const projContentStats = CONTENT_STATUS_ORDER.reduce((acc, s) => {
                acc[s] = projContent.filter((ci) => ci.status === s).length;
                return acc;
              }, {});
              const projUpdates = updateItems.filter((u) => u.project_id === p.id);
              const projAds = adItems.filter((a) => a.project_id === p.id);
              const projNotes = notes.filter((n) => n.project_id === p.id);
              const projCompetitors = competitorItems.filter((c) => c.project_id === p.id);

              const projDone = projStats.done || 0;
              const projTotal = p.modules.length;
              const projPct = projTotal ? Math.round((projDone / projTotal) * 100) : 0;

              // بج‌های شمارش سربرگ کارت — برای هر تب داده‌ی خودش
              const badges = {
                modules: STATUS_ORDER.map((s) => [s, STATUS[s], projStats[s]]),
                content: CONTENT_STATUS_ORDER.map((s) => [s, CONTENT_STATUS[s], projContentStats[s]]),
                updates: UPDATE_STATUS_ORDER.map((s) => [
                  s, UPDATE_STATUS[s], projUpdates.filter((u) => u.status === s).length,
                ]),
                ads: UPDATE_STATUS_ORDER.map((s) => [
                  s, UPDATE_STATUS[s], projAds.filter((a) => a.status === s).length,
                ]),
                notes: [
                  ["all", NOTE_STATS.all, projNotes.length],
                  ["pinned", NOTE_STATS.pinned, projNotes.filter((n) => n.pinned).length],
                ],
                competitors: COMPETITOR_VERDICT_ORDER.map((s) => [
                  s, COMPETITOR_VERDICT[s], projCompetitors.filter((c) => c.verdict === s).length,
                ]),
              }[view].filter(([, , n]) => n > 0);

              return (
              <section
                key={p.id}
                className="rounded-xl overflow-hidden ops-panel"
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.panel,
                  // نوار باریک هم‌رنگ پروژه: ستون اصلی و سایدبار یک زبان بصری پیدا می‌کنند
                  borderTop: `2px solid ${withAlpha(p.accent, 0.75)}`,
                }}
              >
                <header
                  className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2"
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: withAlpha(p.accent, 0.05),
                  }}
                >
                  <span className="relative shrink-0" style={{ width: 26, height: 26 }} title={`${projPct}% تکمیل`}>
                    <Ring pct={projPct} color={p.accent} trackColor={C.borderStrong} size={26} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base leading-tight truncate">
                      {activeId === p.id ? p.name : <button type="button" onClick={() => selectProject(p.id)}
                        className="ops-tap rounded text-right" title="باز کردن پروژه">{p.name} <ArrowLeft size={13} className="inline-block mr-1" /></button>}
                    </h2>
                    {p.tagline && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>{p.tagline}</p>
                    )}
                  </div>

                  {/* پروژه‌ی آرشیوشده فقط وقتی مستقیم انتخاب شود دیده می‌شود؛
                      این نشان توضیح می‌دهد چرا در لیست سایدبار نیست */}
                  {p.archived && (
                    <button
                      onClick={() => setArchived(p.id, false)}
                      className="shrink-0 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ops-tap"
                      style={{ color: tone("slate"), background: toneSoft("slate") }}
                      title="بازگرداندن به لیست پروژه‌ها"
                    >
                      <ArchiveRestore size={12} className="shrink-0" />
                      آرشیوشده — بازگرداندن
                    </button>
                  )}

                  <div className="flex items-center gap-1 flex-wrap">
                    {badges.map(([s, meta, n]) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded"
                        style={{ color: tone(meta.tone), background: toneSoft(meta.tone) }}
                        title={meta.label}
                      >
                        <span>{meta.label}</span><span className="tnum" dir="ltr">{faNum(n)}</span>
                      </span>
                    ))}
                  </div>

                  {activeId === p.id && view === "modules" && (
                    <button
                      onClick={() => setShowAddModule((v) => !v)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
                      style={{ background: C.panelAlt, color: C.muted }}
                    >
                      <Plus size={13} className="shrink-0" /> ماژول جدید
                    </button>
                  )}
                  {activeId === p.id && view === "content" && (
                    <button
                      onClick={() => setShowAddContent((v) => !v)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
                      style={{ background: C.panelAlt, color: C.muted }}
                    >
                      <Plus size={13} className="shrink-0" /> محتوای جدید
                    </button>
                  )}
                  {activeId === p.id && view === "notes" && (
                    <button
                      onClick={() => setShowAddNote((v) => !v)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
                      style={{ background: C.panelAlt, color: C.muted }}
                    >
                      <Plus size={13} className="shrink-0" /> یادداشت جدید
                    </button>
                  )}
                  {activeId === p.id && view === "competitors" && (
                    <button
                      onClick={() => setShowAddCompetitor((v) => !v)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg ops-tap"
                      style={{ background: C.panelAlt, color: C.muted }}
                    >
                      <Plus size={13} className="shrink-0" /> رقیب جدید
                    </button>
                  )}
                </header>

                <ProjectLinks
                  links={projectLinks.filter((l) => l.project_id === p.id)}
                  canEdit={activeId === p.id}
                  editing={editingLinksFor === p.id}
                  onToggleEdit={() => setEditingLinksFor(editingLinksFor === p.id ? null : p.id)}
                  onAdd={(label, url) => addProjectLink(p.id, label, url)}
                  onPatch={patchProjectLink}
                  onDelete={deleteProjectLink}
                />

                {view === "modules" && showAddModule && activeId === p.id && (
                  <div className="px-4 py-3 flex flex-wrap gap-2" style={{ background: C.panelAlt, borderBottom: `1px solid ${C.border}` }}>
                    <input
                      value={newModTitle}
                      onChange={(e) => setNewModTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addModule()}
                      placeholder="عنوان ماژول"
                      className="text-sm px-3 py-2 rounded-lg outline-none flex-1 min-w-[160px] ops-input"
                    />
                    <input
                      value={newModCategory}
                      onChange={(e) => setNewModCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addModule()}
                      placeholder="دسته (SEO, Security, ...)"
                      className="text-sm px-3 py-2 rounded-lg outline-none w-44 ops-input"
                    />
                    <button onClick={addModule} className="text-xs px-4 py-2 rounded-lg font-medium ops-primary">
                      افزودن
                    </button>
                  </div>
                )}

                {view === "content" && showAddContent && activeId === p.id && (
                  <div className="px-4 py-3 flex flex-wrap gap-2" style={{ background: C.panelAlt, borderBottom: `1px solid ${C.border}` }}>
                    <input
                      value={newContentTitle}
                      onChange={(e) => setNewContentTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addContentItem()}
                      placeholder="عنوان محتوا"
                      className="text-sm px-3 py-2 rounded-lg outline-none flex-1 min-w-[160px] ops-input"
                    />
                    <select
                      value={newContentPlatform}
                      onChange={(e) => setNewContentPlatform(e.target.value)}
                      className="text-sm px-3 py-2 rounded-lg outline-none ops-input"
                    >
                      {CONTENT_PLATFORM_ORDER.map((pf) => (
                        <option key={pf} value={pf}>{CONTENT_PLATFORM[pf].label}</option>
                      ))}
                    </select>
                    <button onClick={addContentItem} className="text-xs px-4 py-2 rounded-lg font-medium ops-primary">
                      افزودن
                    </button>
                  </div>
                )}

                {view === "modules" && activeId !== p.id && (
                  <ModulesSummary
                    showAll={Boolean(q || statusFilter)}
                    modules={p.modules.filter(matchesSearch)}
                    onOpen={() => setActiveId(p.id)}
                  />
                )}

                {view === "modules" && activeId === p.id && p.modules.length === 0 && (
                  <EmptyState icon={ListChecks} compact>هنوز ماژولی ثبت نشده.</EmptyState>
                )}
                {view === "modules" && activeId === p.id && p.modules.length > 0 && p.modules.filter(matchesSearch).length === 0 && (
                  <EmptyState icon={Search} compact>ماژولی با «{search}» پیدا نشد.</EmptyState>
                )}

                {view === "content" && activeId !== p.id && (
                  <ContentSummary
                    showAll={Boolean(q || statusFilter)}
                    items={projContent.filter(matchesSearchContent)}
                    onOpen={() => setActiveId(p.id)}
                  />
                )}

                {view === "content" && activeId === p.id && projContent.length === 0 && (
                  <EmptyState icon={CalendarDays} compact>هنوز محتوایی ثبت نشده.</EmptyState>
                )}
                {view === "content" && activeId === p.id && projContent.length > 0 && projContent.filter(matchesSearchContent).length === 0 && (
                  <EmptyState icon={Search} compact>محتوایی با «{search}» پیدا نشد.</EmptyState>
                )}

                {view === "updates" && activeId !== p.id && (
                  <BoardSummary
                    showAll={Boolean(q || statusFilter)}
                    items={projUpdates.filter(matchesSearchUpdate)}
                    kind="updates"
                    onOpen={() => setActiveId(p.id)}
                  />
                )}

                {view === "updates" && activeId === p.id && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {UPDATE_STATUS_ORDER.map((s) => {
                      // ترتیب صریح بر اساس sort_order — آیتم تازه‌ساخته‌شده در state ته لیست است
                      const items = projUpdates
                        .filter((u) => u.status === s)
                        .filter(matchesSearchUpdate)
                        .slice()
                        .sort(
                          (a, b) =>
                            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
                            String(a.created_at).localeCompare(String(b.created_at))
                        );
                      return (
                      <div key={s} className="rounded-xl p-2" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between gap-2 mb-2 pr-1">
                          <TonePill toneKey={UPDATE_STATUS[s].tone}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(UPDATE_STATUS[s].tone) }} />
                            {UPDATE_STATUS[s].label}
                            <span className="mono tnum opacity-70">{items.length}</span>
                          </TonePill>
                          <button
                            onClick={() => setShowAddUpdate(showAddUpdate === s ? null : s)}
                            className="p-1.5 rounded-lg ops-tap shrink-0"
                            style={{ color: C.muted }}
                            title="افزودن آپدیت"
                          >
                            <Plus size={14} />
                            <span className="sr-only">افزودن آپدیت</span>
                          </button>
                        </div>

                        {showAddUpdate === s && (
                          <div className="mb-2 p-2 rounded-lg" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                            <textarea
                              value={newUpdateText}
                              onChange={(e) => setNewUpdateText(e.target.value)}
                              placeholder="متن آپدیت..."
                              rows={2}
                              autoFocus
                              className="w-full text-sm px-2.5 py-2 rounded-lg mb-2 outline-none resize-none ops-input"
                            />
                            <input
                              value={newUpdateVersion}
                              onChange={(e) => setNewUpdateVersion(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addUpdateItem(p.id, s)}
                              placeholder="ورژن (اختیاری)"
                              className="w-full text-xs px-2.5 py-2 rounded-lg mb-2 outline-none ops-input"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => addUpdateItem(p.id, s)}
                                className="flex-1 text-xs py-2 rounded-lg font-medium ops-primary"
                              >
                                افزودن
                              </button>
                              <button
                                onClick={() => setShowAddUpdate(null)}
                                className="px-2 rounded-lg ops-tap"
                                style={{ color: C.muted }}
                                title="انصراف"
                              >
                                <X size={14} />
                                <span className="sr-only">انصراف</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          {items.map((u, i) => (
                            <UpdateCard
                              key={u.id}
                              item={u}
                              rank={i + 1}
                              isFirst={i === 0}
                              isLast={i === items.length - 1}
                              onSaveText={(id, text) => updateUpdateField(id, "text", text)}
                              onSaveVersion={(id, version) => updateUpdateField(id, "version", version)}
                              onSetColor={(id, color) => updateUpdateField(id, "color", color)}
                              onMove={(id, status) => updateUpdateField(id, "status", status)}
                              onReorder={(dir) => reorderUpdateItem(items, i, dir)}
                              onDelete={deleteUpdateItem}
                            />
                          ))}
                          {items.length === 0 && showAddUpdate !== s && (
                            <EmptyState icon={q ? Search : StickyNote} compact>
                              {q ? "چیزی پیدا نشد" : "موردی نیست"}
                            </EmptyState>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {view === "ads" && activeId !== p.id && (
                  <BoardSummary
                    items={projAds.filter(matchesSearchAd)}
                    showAll={Boolean(q || statusFilter)}
                    kind="ads"
                    onOpen={() => setActiveId(p.id)}
                  />
                )}

                {view === "ads" && activeId === p.id && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {UPDATE_STATUS_ORDER.map((s) => {
                      const items = projAds
                        .filter((a) => a.status === s)
                        .filter(matchesSearchAd)
                        .slice()
                        .sort((a, b) => PRIORITY_ORDER.indexOf(b.priority) - PRIORITY_ORDER.indexOf(a.priority));
                      return (
                      <div key={s} className="rounded-xl p-2" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between gap-2 mb-2 pr-1">
                          <TonePill toneKey={UPDATE_STATUS[s].tone}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(UPDATE_STATUS[s].tone) }} />
                            {UPDATE_STATUS[s].label}
                            <span className="mono tnum opacity-70">{items.length}</span>
                          </TonePill>
                          <button
                            onClick={() => setShowAddAd(showAddAd === s ? null : s)}
                            className="p-1.5 rounded-lg ops-tap shrink-0"
                            style={{ color: C.muted }}
                            title="افزودن تبلیغ"
                          >
                            <Plus size={14} />
                            <span className="sr-only">افزودن تبلیغ</span>
                          </button>
                        </div>

                        {showAddAd === s && (
                          <div className="mb-2 p-2 rounded-lg" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                            <textarea
                              value={newAdText}
                              onChange={(e) => setNewAdText(e.target.value)}
                              placeholder="متن تبلیغ..."
                              rows={2}
                              autoFocus
                              className="w-full text-sm px-2.5 py-2 rounded-lg mb-2 outline-none resize-none ops-input"
                            />
                            <select
                              value={newAdPlatform}
                              onChange={(e) => setNewAdPlatform(e.target.value)}
                              className="w-full text-xs px-2.5 py-2 rounded-lg mb-2 outline-none ops-input"
                            >
                              {AD_PLATFORM_ORDER.map((pf) => (
                                <option key={pf} value={pf}>{AD_PLATFORM[pf].label}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addAdItem(p.id, s)}
                                className="flex-1 text-xs py-2 rounded-lg font-medium ops-primary"
                              >
                                افزودن
                              </button>
                              <button
                                onClick={() => setShowAddAd(null)}
                                className="px-2 rounded-lg ops-tap"
                                style={{ color: C.muted }}
                                title="انصراف"
                              >
                                <X size={14} />
                                <span className="sr-only">انصراف</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          {items.map((a) => (
                            <AdCard
                              key={a.id}
                              item={a}
                              onSaveText={(id, text) => updateAdField(id, "text", text)}
                              onCyclePriority={cycleAdPriority}
                              onCyclePlatform={cycleAdPlatform}
                              onSetColor={(id, color) => updateAdField(id, "color", color)}
                              onMove={(id, status) => updateAdField(id, "status", status)}
                              onDelete={deleteAdItem}
                            />
                          ))}
                          {items.length === 0 && showAddAd !== s && (
                            <EmptyState icon={q ? Search : Megaphone} compact>
                              {q ? "چیزی پیدا نشد" : "موردی نیست"}
                            </EmptyState>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {view === "notes" && (
                  <div className="p-4">
                    {showAddNote && activeId === p.id && (
                      <div
                        className="flex flex-wrap gap-2 mb-3 p-2 rounded-lg"
                        style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}
                      >
                        <input
                          autoFocus
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addNote(p.id)}
                          placeholder="عنوان یادداشت — بعدش محتوا را داخل کارت بنویس"
                          className="flex-1 min-w-[200px] text-sm px-3 py-2 rounded-lg outline-none ops-input"
                        />
                        <button
                          onClick={() => addNote(p.id)}
                          className="text-xs px-4 py-2 rounded-lg font-medium ops-primary"
                        >
                          افزودن
                        </button>
                        <button
                          onClick={() => setShowAddNote(false)}
                          className="px-2 rounded-lg ops-tap"
                          style={{ color: C.muted }}
                          title="انصراف"
                        >
                          <X size={14} />
                          <span className="sr-only">انصراف</span>
                        </button>
                      </div>
                    )}

                    {(() => {
                      const all = projNotes
                        .filter(matchesSearchNote)
                        .slice()
                        .sort(
                          (a, b) =>
                            Number(b.pinned) - Number(a.pinned) ||
                            String(b.updated_at).localeCompare(String(a.updated_at))
                        );
                      // در حالت «همه پروژه‌ها» فقط چند کارت اول، وگرنه صفحه بی‌انتها می‌شود
                      const isOpen = activeId === p.id;
                      const shown = isOpen ? all : all.slice(0, SUMMARY_LIMIT);
                      if (!projNotes.length) {
                        return (
                          <EmptyState icon={NotebookPen} compact>
                            {activeId === p.id
                              ? "یادداشتی برای این پروژه ثبت نشده."
                              : "یادداشتی ثبت نشده. برای افزودن، پروژه را انتخاب کن."}
                          </EmptyState>
                        );
                      }
                      if (!shown.length) {
                        return (
                          <EmptyState icon={Search} compact>
                            یادداشتی با «{search}» پیدا نشد.
                          </EmptyState>
                        );
                      }
                      return (
                        <>
                          <div className="notes-masonry" aria-label="یادداشت‌های پروژه">
                            {shown.map((n) => (
                              <div key={n.id} className="min-w-0">
                                <NoteCard
                                  note={n}
                                  onPatch={patchNote}
                                  onDelete={deleteNote}
                                />
                              </div>
                            ))}
                          </div>
                          {!isOpen && (
                            <MoreLine rest={all.length - shown.length} onOpen={() => setActiveId(p.id)} />
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {view === "competitors" && (
                  <div className="p-4">
                    {showAddCompetitor && activeId === p.id && (
                      <div
                        className="flex flex-wrap gap-2 mb-3 p-2 rounded-lg"
                        style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}
                      >
                        <input
                          autoFocus
                          value={newCompetitorName}
                          onChange={(e) => setNewCompetitorName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addCompetitor(p.id)}
                          placeholder="اسم رقیب — بقیه‌ی فیلدها را داخل کارت پر کن"
                          className="flex-1 min-w-[200px] text-sm px-3 py-2 rounded-lg outline-none ops-input"
                        />
                        <button
                          onClick={() => addCompetitor(p.id)}
                          className="text-xs px-4 py-2 rounded-lg font-medium ops-primary"
                        >
                          افزودن
                        </button>
                        <button
                          onClick={() => setShowAddCompetitor(false)}
                          className="px-2 rounded-lg ops-tap"
                          style={{ color: C.muted }}
                          title="انصراف"
                        >
                          <X size={14} />
                          <span className="sr-only">انصراف</span>
                        </button>
                      </div>
                    )}

                    {(() => {
                      const all = projCompetitors.filter(matchesSearchCompetitor);
                      const isOpen = activeId === p.id;
                      const shown = isOpen ? all : all.slice(0, SUMMARY_LIMIT);
                      if (!projCompetitors.length) {
                        return (
                          <EmptyState icon={Swords} compact>
                            {activeId === p.id
                              ? "رقیبی برای این پروژه ثبت نشده."
                              : "رقیبی ثبت نشده. برای افزودن، پروژه را انتخاب کن."}
                          </EmptyState>
                        );
                      }
                      if (!shown.length) {
                        return (
                          <EmptyState icon={Search} compact>
                            رقیبی با «{search}» پیدا نشد.
                          </EmptyState>
                        );
                      }
                      return (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                            {shown.map((c) => (
                              <CompetitorCard
                                key={c.id}
                                item={c}
                                onPatch={patchCompetitor}
                                onDelete={deleteCompetitor}
                              />
                            ))}
                          </div>
                          {!isOpen && (
                            <MoreLine rest={all.length - shown.length} onOpen={() => setActiveId(p.id)} />
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {view === "modules" && activeId === p.id && p.modules.filter(matchesSearch).map((mm) => {
                  const isOpen = expanded === mm.id;
                  const Icon = STATUS_ICON[mm.status];
                  return (
                    <div key={mm.id} className="border-b last:border-0" style={{ borderColor: C.border }}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : mm.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-right ops-row"
                        style={{ background: isOpen ? C.panelAlt : "transparent" }}
                      >
                        <span className="shrink-0" style={{ color: C.faint }}>
                          {isOpen ? <ChevronDown size={15} /> : <ChevronLeft size={15} />}
                        </span>
                        <Icon size={15} className="shrink-0" style={{ color: tone(STATUS[mm.status].tone) }} />
                        <StatusBadge status={mm.status} />
                        <span className="flex-1 text-sm font-medium truncate">{mm.title}</span>
                        <span className="mono text-xs hidden sm:inline shrink-0" style={{ color: C.faint }}>
                          {mm.category}
                        </span>
                        <PriorityDot priority={mm.priority} />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-3" style={{ background: C.panelAlt }}>
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <label className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>وضعیت
                              <select aria-label={`وضعیت ${mm.title}`} value={mm.status}
                                onChange={(e) => setModuleStatus(p.id, mm.id, mm.status, e.target.value)}
                                className="ops-input rounded-lg px-2.5 py-2" style={{ color: tone(STATUS[mm.status].tone) }}>
                                {STATUS_ORDER.map((key) => <option key={key} value={key}>{STATUS[key].label}</option>)}
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>اولویت
                              <select aria-label={`اولویت ${mm.title}`} value={mm.priority}
                                onChange={(e) => setModulePriority(p.id, mm.id, mm.priority, e.target.value)}
                                className="ops-input rounded-lg px-2.5 py-2" style={{ color: tone(PRIORITY[mm.priority].tone) }}>
                                {PRIORITY_ORDER.map((key) => <option key={key} value={key}>{PRIORITY[key].label}</option>)}
                              </select>
                            </label>
                            <ConfirmDelete
                              onConfirm={() => deleteModule(p.id, mm.id)}
                              size={12}
                              className="text-xs px-2.5 py-1.5 mr-auto"
                            >
                              حذف
                            </ConfirmDelete>
                          </div>

                          <FieldLabel>یادداشت / راهنما</FieldLabel>
                          <NotesBox moduleId={mm.id} initialValue={mm.notes} onSave={saveNotes} />

                          <FieldLabel>
                            چک‌لیست بررسی
                            {mm.checklist.length > 0 && (
                              <span className="mono tnum mr-1 opacity-80">
                                ({mm.checklist.filter((c) => c.done).length}/{mm.checklist.length})
                              </span>
                            )}
                          </FieldLabel>
                          <div className="space-y-0.5 mb-2">
                            {mm.checklist.map((c) => (
                              <label
                                key={c.id}
                                className="flex items-start gap-2.5 text-sm cursor-pointer rounded-lg px-2 py-1.5 -mx-2 ops-tap"
                              >
                                <input
                                  type="checkbox"
                                  checked={c.done}
                                  onChange={() => toggleChecklist(p.id, mm.id, c.id, c.done)}
                                  className="mt-0.5 shrink-0 w-4 h-4"
                                  style={{ accentColor: "var(--jade)" }}
                                />
                                <span
                                  className="leading-relaxed"
                                  style={{
                                    color: c.done ? C.faint : C.text,
                                    textDecoration: c.done ? "line-through" : "none",
                                  }}
                                >
                                  {c.text}
                                </span>
                              </label>
                            ))}
                          </div>
                          <ChecklistAdder onAdd={(text) => addChecklistItem(p.id, mm.id, text)} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {view === "content" && activeId === p.id && projContent.filter(matchesSearchContent).map((ci) => {
                  const isOpen = expandedContent === ci.id;
                  return (
                    <div key={ci.id} className="border-b last:border-0" style={{ borderColor: C.border }}>
                      <button
                        onClick={() => setExpandedContent(isOpen ? null : ci.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-right ops-row"
                        style={{ background: isOpen ? C.panelAlt : "transparent" }}
                      >
                        <span className="shrink-0" style={{ color: C.faint }}>
                          {isOpen ? <ChevronDown size={15} /> : <ChevronLeft size={15} />}
                        </span>
                        <span
                          className="text-xs font-medium leading-none px-2 py-1 rounded border whitespace-nowrap shrink-0"
                          style={{
                            color: tone(CONTENT_STATUS[ci.status].tone),
                            borderColor: tone(CONTENT_STATUS[ci.status].tone),
                            background: toneSoft(CONTENT_STATUS[ci.status].tone),
                          }}
                        >
                          {CONTENT_STATUS[ci.status].label}
                        </span>
                        <PlatformBadge platform={ci.platform} />
                        <span className="flex-1 text-sm font-medium truncate">{ci.title}</span>
                        {ci.publish_date && (
                          <span className="mono tnum text-xs hidden sm:inline shrink-0" style={{ color: C.faint }}>
                            {ci.publish_date}
                          </span>
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-3" style={{ background: C.panelAlt }}>
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <button
                              onClick={() => cycleContentStatus(ci.id, ci.status)}
                              className="text-xs px-2.5 py-1.5 rounded-lg ops-tap"
                              style={{ border: `1px solid ${C.border}`, color: tone(CONTENT_STATUS[ci.status].tone) }}
                              title="کلیک برای تغییر وضعیت"
                            >
                              وضعیت: {CONTENT_STATUS[ci.status].label}
                            </button>
                            <button
                              onClick={() => cycleContentPlatform(ci.id, ci.platform)}
                              className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ops-tap"
                              style={{ border: `1px solid ${C.border}`, color: C.muted }}
                              title="کلیک برای تغییر پلتفرم"
                            >
                              پلتفرم: {CONTENT_PLATFORM[ci.platform].label}
                            </button>
                            <ConfirmDelete
                              onConfirm={() => deleteContentItem(ci.id)}
                              size={12}
                              className="text-xs px-2.5 py-1.5 mr-auto"
                            >
                              حذف
                            </ConfirmDelete>
                          </div>
                          <ContentEditor item={ci} onSaveField={updateContentField} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
