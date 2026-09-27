"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GuideScreenshot from "@/components/GuideScreenshot";
import GuideDailyTools from "@/components/GuideDailyTools";
import { BeginnerWalkthrough, GuideOrientation, GuideTroubleshooting, GuideRestore } from "@/components/GuideBeginner";
import {
  ArrowLeft, BarChart3, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Database, Download, FileText, FolderKanban,
  Layers, Lightbulb, Link2, ListChecks, ListTodo, Megaphone, Moon, Search, X,
  NotebookPen, RefreshCw, ShieldCheck, Sparkles, StickyNote, Sun, Swords,
} from "lucide-react";
import { C, tone, toneSoft, useTheme } from "@/lib/theme";

const QUICK_STEPS = [
  ["۱", "ورود با ایمیل", "در صفحه ورود ایمیلت را بنویس و لینک ارسال‌شده را باز کن. برای ساخت حساب جدید هم همین مسیر استفاده می‌شود."],
  ["۲", "ساخت اولین پروژه", "از سایدبار «پروژه جدید» را بزن، یک نام و توضیح کوتاه وارد کن و روی «افزودن» بزن."],
  ["۳", "اضافه‌کردن جزئیات", "پروژه را باز کن و ماژول‌ها، محتوا، آپدیت‌ها، تبلیغات، یادداشت‌ها و رقبا را کم‌کم اضافه کن."],
];

const PROJECT_SECTIONS = [
  {
    id: "projects",
    icon: FolderKanban,
    color: "jade",
    title: "پروژه‌ها و نمای کلی",
    intro: "هر کسب‌وکار، سایت یا محصول را به‌صورت یک پروژه جدا بساز. نمای «همه پروژه‌ها» وضعیت کل کارها را یک‌جا خلاصه می‌کند.",
    steps: [
      "برای ساخت پروژه از «پروژه جدید» در سایدبار استفاده کن.",
      "با فلش‌های کنار پروژه، ترتیب نمایش را تغییر بده.",
      "پروژه‌ای که فعلاً لازم نیست را آرشیو کن؛ بعداً می‌توانی آن را برگردانی.",
      "حلقه کنار نام پروژه، درصد ماژول‌های انجام‌شده را نشان می‌دهد.",
    ],
    tip: "برای نام پروژه از یک عنوان کوتاه و مشخص مثل نام دامنه یا محصول استفاده کن.",
  },
  {
    id: "modules",
    icon: ListChecks,
    color: "blue",
    title: "ماژول‌ها",
    intro: "کارهای بزرگ هر پروژه را به ماژول‌های قابل پیگیری تقسیم کن؛ مثلاً «صفحه پرداخت»، «نسخه موبایل» یا «تست نهایی».",
    steps: [
      "برای هر ماژول عنوان، وضعیت و اولویت مشخص کن.",
      "وضعیت‌ها به‌ترتیب: شروع نشده، در حال انجام، نیاز به بررسی، مسدود و انجام‌شده هستند.",
      "داخل هر ماژول یادداشت اجرایی بنویس و چک‌لیست بررسی بساز.",
      "با کلیک روی وضعیت یا اولویت، آن را به مرحله بعد تغییر بده.",
    ],
    tip: "اگر کاری چند خروجی مستقل دارد، به‌جای یک ماژول خیلی بزرگ چند ماژول کوچک بساز.",
  },
  {
    id: "content",
    icon: CalendarDays,
    color: "violet",
    title: "تقویم محتوا",
    intro: "محتوای وب‌سایت، تلگرام و اینستاگرام را از مرحله ایده تا انتشار برای همان پروژه دنبال کن.",
    steps: [
      "عنوان یا متن محتوا و پلتفرم مقصد را وارد کن.",
      "وضعیت را بین ایده، پیش‌نویس، زمان‌بندی‌شده و منتشرشده جابه‌جا کن.",
      "برای محتوای زمان‌بندی‌شده تاریخ انتشار بگذار.",
      "تعداد آیتم‌های منتشرشده در نوار آمار تقویم محتوا دیده می‌شود؛ انتشار در شبکه‌ها را خودت انجام بده.",
    ],
    tip: "هر ایده را همان لحظه ثبت کن؛ متن کامل را بعداً در مرحله پیش‌نویس بنویس.",
  },
  {
    id: "updates",
    icon: RefreshCw,
    color: "amber",
    title: "آپدیت‌ها",
    intro: "تغییرات فنی و نسخه‌های بعدی پروژه را روی یک برد سه‌مرحله‌ای نگه دار.",
    steps: [
      "کارت را در ستون مورد نیاز، در حال انجام یا انجام‌شده بساز.",
      "عنوان، توضیح و در صورت نیاز شماره نسخه را وارد کن.",
      "با فلش‌های روی کارت آن را بین ستون‌ها جابه‌جا کن.",
      "برای تشخیص سریع‌تر موضوع‌ها، رنگ کارت را تغییر بده.",
    ],
    tip: "شماره نسخه را فقط برای تغییراتی بنویس که قرار است در انتشار مشخصی ارائه شوند.",
  },
  {
    id: "ads",
    icon: Megaphone,
    color: "red",
    title: "تبلیغات",
    intro: "کمپین‌ها و کارهای تبلیغاتی هر پروژه را با همان جریان سه‌مرحله‌ای مدیریت کن.",
    steps: [
      "پلتفرم را از بین اینستاگرام، تلگرام، ردیت، توییتر، ریپورتاژ، گوگل ادز، یوتیوب یا سایر انتخاب کن.",
      "برای هر تبلیغ اولویت کم، متوسط، بالا یا بحرانی بگذار.",
      "کارت‌ها داخل هر ستون بر اساس اولویت مرتب می‌شوند.",
      "بعد از پایان کمپین، کارت را به انجام‌شده منتقل کن.",
    ],
    tip: "نتیجه یا عدد مهم هر کمپین را در توضیح همان کارت ثبت کن تا سابقه‌اش باقی بماند.",
  },
  {
    id: "project-notes",
    icon: StickyNote,
    color: "slate",
    title: "یادداشت‌های پروژه",
    intro: "تصمیم‌ها، اطلاعات فنی و نکته‌هایی را که فقط به یک پروژه مربوط‌اند کنار همان پروژه ثبت کن.",
    steps: [
      "برای موضوع‌های متفاوت یادداشت‌های جدا بساز.",
      "یادداشت مهم را سنجاق کن تا بالاتر دیده شود.",
      "با برچسب و اولویت، پیدا کردن اطلاعات را آسان‌تر کن.",
      "برای اطلاعات عمومی‌تر از صفحه مستقل یادداشت‌ها استفاده کن.",
    ],
    tip: "رمز عبور، کلید خصوصی و اطلاعات بانکی را داخل یادداشت‌ها ذخیره نکن.",
  },
  {
    id: "links-competitors",
    icon: Link2,
    color: "jade",
    title: "لینک‌ها و رقبا",
    intro: "لینک‌های پرکاربرد پروژه و بررسی رقیب‌ها را جایی نگه دار که همیشه با یک کلیک در دسترس باشند.",
    steps: [
      "برای سایت، cPanel، آنالیتیکس، سرچ کنسول، ریپو و دیتابیس لینک بساز.",
      "در تب رقبا نام، آدرس، بازدید تقریبی، مزیت و یادداشت را ثبت کن.",
      "نتیجه بررسی هر رقیب را خنثی، خوب، مشکل‌دار یا زیر نظر علامت بزن.",
      "قبل از باز کردن، دامنه نمایش‌داده‌شده کنار لینک را بررسی کن.",
    ],
    tip: "اینجا فقط آدرس سرویس‌ها را نگه دار؛ نام کاربری و رمز را در مدیر رمز عبور ذخیره کن.",
  },
];

const INDEPENDENT_SECTIONS = [
  [NotebookPen, "violet", "یادداشت‌های روزانه", "برای یادداشت‌های شخصی و مستقل از پروژه‌ها. آن‌ها را برچسب‌گذاری، اولویت‌بندی و سنجاق کن. یادداشت‌های پروژه در این صفحه نمایش داده نمی‌شوند و فقط در تب یادداشت‌های همان پروژه هستند."],
  [Lightbulb, "amber", "ایده‌های کسب‌وکار", "ایده‌های آینده را ثبت و مرتب کن. جایگاه هر ایده کمک می‌کند تصمیم بگیری کدام مورد زودتر بررسی شود."],
  [ListTodo, "blue", "کارهای روزانه", "کارها را با تاریخ و اولویت بساز. پنل آن‌ها را به عقب‌افتاده، امروز، آینده و بی‌تاریخ تقسیم می‌کند و کار تکرارشونده هم پشتیبانی می‌شود."],
  [BarChart3, "jade", "رودمپ", "تاریخچه تغییرات داداش و نسخه فعلی پنل را ببین. هر قابلیت تازه یا اصلاح مهم در این صفحه ثبت می‌شود."],
];

const NAV_GROUPS = [
  ["از اینجا شروع کن", [["اولین پروژه من", "first-project"], ["نقشه پنل", "find-your-way"], ["شروع سریع", "quick-start"]]],
  ["داخل پروژه", [["بخش‌های پروژه", "project-sections"], ...PROJECT_SECTIONS.map(({ title, id }) => [title, id])]],
  ["ابزارهای روزمره", [["ابزارهای مستقل", "independent"], ["یادداشت‌های روزانه", "tool-notes"], ["ایده‌های کسب‌وکار", "tool-ideas"], ["کارهای روزانه", "tool-tasks"], ["رودمپ", "tool-roadmap"], ["تایمر نشستن", "sit-timer"], ["کارهای تکرارشونده", "daily-workflow"], ["نکته‌های پنل", "panel-tips"]]],
  ["اطلاعات و کمک", [["بکاپ و امنیت", "backup"], ["بازیابی بکاپ", "restore"], ["رفع مشکل", "login-help"], ["سؤال‌های رایج", "faq"]]],
];
const NAV_ITEMS = NAV_GROUPS.flatMap(([, items]) => items);
const MAIN_IDS = ["first-project", "find-your-way", "quick-start", "project-sections", "independent", "sit-timer", "daily-workflow", "panel-tips", "backup", "restore", "login-help", "faq"];
const GUIDE_POSITION_KEY = "dadash-guide-last-section";
const normalizeSearch = (value) => value.normalize("NFKC").replace(/[يى]/g, "ی").replace(/ك/g, "ک").trim().toLocaleLowerCase("fa");

const SCREENSHOT_CAPTIONS = {
  projects: "۱. پروژه را از ستون راست انتخاب کن. ۲. وضعیت کلی را در کارت پروژه ببین. ۳. برای افزودن پروژه از دکمه «پروژه جدید» استفاده کن.",
  modules: "روی عنوان ماژول بزن تا جزئیات باز شود. وضعیت و اولویت بالای یادداشت‌اند؛ چک‌لیست و کادر افزودن مورد جدید پایین آن قرار دارند.",
  content: "تب «تقویم محتوا» را انتخاب کن و یک محتوا را باز کن. وضعیت، پلتفرم، متن و تاریخ انتشار در همین قسمت ویرایش می‌شوند.",
  updates: "سه ستون مراحل کار را نشان می‌دهند. دکمه + بالای هر ستون کارت جدید می‌سازد؛ فلش‌های پایین کارت آن را به مرحله قبل یا بعد می‌برند.",
  ads: "پلتفرم و اولویت در بالای هر کارت قرار دارند. فلش‌های پایین کارت، مرحله اجرای تبلیغ را تغییر می‌دهند.",
  "project-notes": "از «یادداشت جدید» شروع کن. آیکون سنجاق برای نگه‌داشتن یادداشت مهم در بالا و برچسب‌ها برای دسته‌بندی‌اند.",
  "links-competitors": "لینک‌های پروژه زیر نام آن هستند. در تب «رقبا»، فلش کنار رقیب را بزن تا بازدید، نکته‌ها و نقطه‌قوت قابل مشاهده شوند.",
};

const INDEPENDENT_SCREENSHOTS = [
  ["notes", "بالای صفحه جست‌وجو و فیلتر برچسب را داری. «یادداشت جدید» یک یادداشت روزانه مستقل می‌سازد."],
  ["ideas", "رتبه کنار هر ایده مشخص است. با فلش‌های بالا و پایین، ترتیب اولویت ایده‌ها را تغییر بده."],
  ["tasks", "متن کار را در کادر بالا بنویس، تاریخ را انتخاب کن و «افزودن» را بزن. تیک کنار هر ردیف برای انجام‌شدن کار است."],
  ["roadmap", "جدیدترین تغییرات بالاتر نمایش داده می‌شوند. زیر هر تغییر، تاریخ و شماره نسخه آن را می‌بینی."],
];

function ThemeButton({ theme, toggleTheme, mounted }) {
  return (
    <button onClick={toggleTheme} title="تغییر حالت نمایش" className="p-2.5 rounded-xl ops-tap" style={{ color: C.muted, border: `1px solid ${C.border}` }}>
      <span className="block w-4 h-4">{mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}</span>
      <span className="sr-only">تغییر حالت روشن و تیره</span>
    </button>
  );
}

function GuideCard({ section, index, expanded, onToggle }) {
  const Icon = section.icon;
  return (
    <article id={section.id} className="scroll-mt-24 rounded-2xl p-5 sm:p-7 ops-card" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={`${section.id}-details`} className="w-full flex items-start gap-4 text-right ops-tap rounded-lg">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ color: tone(section.color), background: toneSoft(section.color) }}><Icon size={21} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs mb-1" style={{ color: tone(section.color) }}>بخش {index + 1}</p>
          <h3 className="text-lg sm:text-xl font-bold">{section.title}</h3>
        </div>
        <ChevronDown size={18} className={`shrink-0 mt-3 transition-transform ${expanded ? "rotate-180" : ""}`} style={{ color: C.muted }} />
      </button>
      <p className="text-sm leading-7 mt-3" style={{ color: C.muted }}>{section.intro}</p>
      <div id={`${section.id}-details`} hidden={!expanded}>
      {expanded && <>
        <GuideScreenshot name={section.id} title={section.title} caption={SCREENSHOT_CAPTIONS[section.id]} />
        <div className="mt-5 space-y-3">
          {section.steps.map((step) => (
            <div key={step} className="flex items-start gap-2.5 text-sm leading-7">
              <CheckCircle2 size={16} className="shrink-0 mt-1.5" style={{ color: tone(section.color) }} />
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl px-4 py-3 text-xs sm:text-sm leading-6" style={{ color: C.muted, background: toneSoft(section.color) }}>
          <strong style={{ color: tone(section.color) }}>پیشنهاد:</strong> {section.tip}
        </div>
      </>}
      </div>
    </article>
  );
}

function GuideNavLinks({ activeId, onNavigate, openGroup, setOpenGroup, search, setSearch, sidebar = false }) {
  const query = normalizeSearch(search);
  const groups = NAV_GROUPS.map(([group, items], index) => {
    const filtered = !query || normalizeSearch(group).includes(query) ? items : items.filter(([label]) => normalizeSearch(label).includes(query));
    return { group, items: filtered, index };
  }).filter(({ items }) => items.length);
  return <div>
    <div className="relative mb-4">
      <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
      <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="پیدا کردن یک بخش..." aria-label="جست‌وجو در فهرست آموزش" className="w-full rounded-xl py-2.5 pr-9 pl-8 text-sm" style={{ background: C.bg, color: C.text, border: `1px solid ${C.borderStrong}` }} />
      {search && <button type="button" onClick={() => setSearch("")} aria-label="پاک کردن جست‌وجوی فهرست" className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded ops-tap"><X size={14} /></button>}
    </div>
    {groups.length ? <div className="space-y-2">
      {groups.map(({ group, items, index }) => {
        const isOpen = Boolean(query) || openGroup === index;
        const containsActive = NAV_GROUPS[index][1].some(([, id]) => id === activeId);
        const panelId = `guide-group-${sidebar ? "side" : "mobile"}-${index}`;
        return <div key={group} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isOpen ? C.borderStrong : C.border}`, background: isOpen ? C.bg : "transparent" }}>
          <button type="button" disabled={Boolean(query)} onClick={() => setOpenGroup(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={panelId} className="w-full flex items-center gap-2 px-3 py-2.5 text-right text-sm font-semibold ops-tap disabled:cursor-default">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: containsActive ? tone("jade") : C.borderStrong }} />
            <span className="flex-1">{group}</span>
            <span className="text-xs font-normal" style={{ color: C.muted }}>{items.length.toLocaleString("fa-IR")}</span>
            {!query && <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: C.muted }} />}
          </button>
          <div id={panelId} hidden={!isOpen} className="px-1 pb-1">
            {items.map(([label, id], itemIndex) => <a key={id} data-nav-id={id} href={`#${id}`} onClick={() => onNavigate(id)} aria-current={id === activeId ? "location" : undefined} className={`block px-3 py-1.5 rounded-lg text-[13px] leading-6 ops-tap ${itemIndex > 0 && (index === 1 || index === 2) ? "mr-2" : ""}`} style={{ color: id === activeId ? tone("jade") : C.muted, background: id === activeId ? toneSoft("jade") : "transparent" }}>{label}</a>)}
          </div>
        </div>;
      })}
    </div> : <p className="px-2 py-4 text-sm" style={{ color: C.muted }}>بخشی با این نام پیدا نشد.</p>}
  </div>;
}

export default function GuidePage() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [activeId, setActiveId] = useState(MAIN_IDS[0]);
  const [activeSubId, setActiveSubId] = useState(null);
  const [lastId, setLastId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openProjectId, setOpenProjectId] = useState(null);
  const [openNavGroup, setOpenNavGroup] = useState(0);
  const [navSearch, setNavSearch] = useState("");
  const menuRef = useRef(null);
  const sidebarRef = useRef(null);
  const preferredSubId = useRef(null);
  const activeIndex = MAIN_IDS.indexOf(activeId);
  const highlightedId = activeSubId || activeId;
  const currentLabel = NAV_ITEMS.find(([, id]) => id === highlightedId)?.[0] || "اولین پروژه من";
  const activeGroupIndex = NAV_GROUPS.findIndex(([, items]) => items.some(([, id]) => id === highlightedId));

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(GUIDE_POSITION_KEY);
      if (NAV_ITEMS.some(([, id]) => id === saved)) setLastId(saved);
    } catch {}
    const openFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (PROJECT_SECTIONS.some((section) => section.id === hash)) {
        preferredSubId.current = hash;
        setOpenProjectId(hash);
      } else if (INDEPENDENT_SCREENSHOTS.some(([id]) => `tool-${id}` === hash)) {
        preferredSubId.current = hash;
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  useEffect(() => {
    let frame;
    const updateActive = () => {
      frame = 0;
      const threshold = 170;
      let current = MAIN_IDS[0];
      for (const id of MAIN_IDS) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= threshold) current = id;
      }
      setActiveId(current);
      const subIds = current === "project-sections"
        ? PROJECT_SECTIONS.map(({ id }) => id)
        : current === "independent" ? INDEPENDENT_SCREENSHOTS.map(([id]) => `tool-${id}`) : [];
      const visible = subIds.filter((id) => {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        return rect && rect.top <= threshold + 40 && rect.bottom > threshold + 20;
      });
      setActiveSubId(visible.includes(preferredSubId.current) ? preferredSubId.current : visible[0] || null);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(updateActive); };
    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [openProjectId]);

  useEffect(() => {
    if (highlightedId === MAIN_IDS[0]) return;
    try { window.localStorage.setItem(GUIDE_POSITION_KEY, highlightedId); } catch {}
  }, [highlightedId]);

  useEffect(() => {
    if (activeGroupIndex >= 0) setOpenNavGroup(activeGroupIndex);
  }, [activeGroupIndex]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event) => {
      if (event.key === "Escape" || (event.type === "pointerdown" && !menuRef.current?.contains(event.target))) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [menuOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const item = Array.from(sidebar?.querySelectorAll("[data-nav-id]") || []).find(link => link.dataset.navId === highlightedId);
    if (!sidebar || !item || !item.getClientRects().length) return;
    const outer = sidebar.getBoundingClientRect();
    const inner = item.getBoundingClientRect();
    if (inner.top < outer.top + 44) sidebar.scrollTop -= outer.top + 44 - inner.top;
    else if (inner.bottom > outer.bottom - 12) sidebar.scrollTop += inner.bottom - outer.bottom + 12;
  }, [highlightedId, openNavGroup, navSearch]);

  const navigateTo = (id) => {
    preferredSubId.current = id;
    if (PROJECT_SECTIONS.some((section) => section.id === id)) setOpenProjectId(id);
    setNavSearch("");
    setMenuOpen(false);
  };

  return (
    <main dir="rtl" lang="fa" className="guide-page" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <header className="sticky top-0 z-30" style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 rounded-lg">
            <Layers size={20} style={{ color: tone("jade") }} />
            <span className="mono text-sm font-semibold tracking-widest">DADASH//</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeButton theme={theme} toggleTheme={toggleTheme} mounted={mounted} />
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl ops-primary">رفتن به پنل <ArrowLeft size={15} /></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="absolute inset-0 pointer-events-none landing-glow" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-5" style={{ color: tone("jade"), background: toneSoft("jade"), border: `1px solid ${C.border}` }}><BookOpen size={14} /> راهنمای قدم‌به‌قدم</div>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">آموزش استفاده از <span style={{ color: tone("jade") }}>داداش</span></h1>
          <p className="text-sm sm:text-lg leading-8 mt-5 max-w-2xl mx-auto" style={{ color: C.muted }}>از ساخت اولین پروژه تا برنامه‌ریزی محتوا، کارهای روزانه و بکاپ؛ کاربرد هر بخش را اینجا ساده و عملی یاد می‌گیری.</p>
          <p className="text-xs leading-6 mt-4" style={{ color: tone("jade") }}>هر بخش را جدا باز کن؛ تصویرها با اطلاعات نمونه‌اند و برای دیدن جزئیات بزرگ می‌شوند.</p>
          {lastId && lastId !== MAIN_IDS[0] && <a href={`#${lastId}`} onClick={() => navigateTo(lastId)} className="inline-flex items-center gap-2 text-sm mt-5 px-4 py-2.5 rounded-xl ops-tap" style={{ background: C.panel, border: `1px solid ${C.borderStrong}` }}>ادامه از «{NAV_ITEMS.find(([, id]) => id === lastId)?.[0]}» <ArrowLeft size={15} /></a>}
        </div>
      </section>

      <nav ref={menuRef} className="sticky top-16 z-20 lg:hidden" aria-label="فهرست راهنما" style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2 sm:gap-4">
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="guide-menu" className="inline-flex items-center gap-2 min-w-0 max-w-[65%] sm:max-w-none px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold ops-tap" style={{ background: C.bg, border: `1px solid ${C.borderStrong}` }}><BookOpen size={16} className="shrink-0" style={{ color: tone("jade") }} /><span className="truncate">فهرست بخش‌ها · {currentLabel}</span><ChevronDown size={15} className={`shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} /></button>
          <span className="mr-auto text-xs whitespace-nowrap" style={{ color: C.muted }}>بخش {(activeIndex + 1).toLocaleString("fa-IR")}/{MAIN_IDS.length.toLocaleString("fa-IR")}</span>
          <div className="flex items-center gap-1">
            <a href={`#${MAIN_IDS[Math.max(0, activeIndex - 1)]}`} aria-label="بخش قبلی" aria-disabled={activeIndex === 0} tabIndex={activeIndex === 0 ? -1 : undefined} className={`p-2 rounded-lg ops-tap ${activeIndex === 0 ? "opacity-30 pointer-events-none" : ""}`}><ChevronRight size={17} /></a>
            <a href={`#${MAIN_IDS[Math.min(MAIN_IDS.length - 1, activeIndex + 1)]}`} aria-label="بخش بعدی" aria-disabled={activeIndex === MAIN_IDS.length - 1} tabIndex={activeIndex === MAIN_IDS.length - 1 ? -1 : undefined} className={`p-2 rounded-lg ops-tap ${activeIndex === MAIN_IDS.length - 1 ? "opacity-30 pointer-events-none" : ""}`}><ChevronLeft size={17} /></a>
          </div>
        </div>
        <div className="h-0.5" style={{ background: C.border }}><div className="h-full transition-[width]" style={{ width: `${(activeIndex + 1) / MAIN_IDS.length * 100}%`, background: tone("jade") }} /></div>
        {menuOpen && <div id="guide-menu" className="absolute top-full right-0 left-0 shadow-xl" style={{ background: C.panel, borderBottom: `1px solid ${C.borderStrong}` }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 max-h-[65vh] overflow-y-auto"><GuideNavLinks activeId={highlightedId} onNavigate={navigateTo} openGroup={openNavGroup} setOpenGroup={setOpenNavGroup} search={navSearch} setSearch={setNavSearch} /></div>
        </div>}
      </nav>

      <div className="max-w-[1440px] mx-auto lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-3">
        <aside ref={sidebarRef} className="hidden lg:block self-start sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto px-4 py-5" aria-label="فهرست بخش‌های آموزش" style={{ borderLeft: `1px solid ${C.border}` }}>
          <div className="px-3 mb-5"><p className="font-bold text-sm">فهرست آموزش</p><p className="text-xs mt-1" style={{ color: C.muted }}>بخش فعلی: {currentLabel}</p><div className="h-1 rounded-full mt-3 overflow-hidden" style={{ background: C.border }}><div className="h-full transition-[width]" style={{ width: `${(activeIndex + 1) / MAIN_IDS.length * 100}%`, background: tone("jade") }} /></div></div>
          <GuideNavLinks activeId={highlightedId} onNavigate={navigateTo} openGroup={openNavGroup} setOpenGroup={setOpenNavGroup} search={navSearch} setSearch={setNavSearch} sidebar />
        </aside>
        <div className="min-w-0">
      <BeginnerWalkthrough />
      <GuideOrientation />

      <section id="quick-start" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
        <div className="max-w-2xl mb-8"><p className="text-xs font-semibold mb-2" style={{ color: tone("jade") }}>شروع سریع</p><h2 className="text-2xl sm:text-3xl font-bold">در سه قدم آماده شو</h2></div>
        <div className="grid md:grid-cols-3 gap-4">
          {QUICK_STEPS.map(([number, title, text]) => (
            <article key={number} className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <span className="mono inline-flex w-9 h-9 items-center justify-center rounded-full text-sm font-semibold mb-4" style={{ color: tone("jade"), background: toneSoft("jade") }}>{number}</span>
              <h3 className="font-bold mb-2">{title}</h3><p className="text-sm leading-7" style={{ color: C.muted }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="project-sections" className="py-12 sm:py-16 scroll-mt-20" style={{ background: C.panelAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-8"><p className="text-xs font-semibold mb-2" style={{ color: tone("blue") }}>داخل هر پروژه</p><h2 className="text-2xl sm:text-3xl font-bold">بخش‌های اصلی پروژه</h2><p className="text-sm leading-7 mt-3" style={{ color: C.muted }}>هر پروژه یک فضای کامل دارد. لازم نیست از روز اول همه قسمت‌ها را پر کنی؛ از بخشی شروع کن که همین حالا به آن نیاز داری.</p></div>
          <div className="grid lg:grid-cols-2 gap-4 items-start">{PROJECT_SECTIONS.map((section, index) => <GuideCard key={section.id} section={section} index={index} expanded={openProjectId === section.id} onToggle={() => { preferredSubId.current = section.id; setOpenProjectId(current => current === section.id ? null : section.id); }} />)}</div>
        </div>
      </section>

      <section id="independent" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
        <div className="max-w-2xl mb-8"><p className="text-xs font-semibold mb-2" style={{ color: tone("violet") }}>مستقل از پروژه</p><h2 className="text-2xl sm:text-3xl font-bold">ابزارهای روزمره</h2><p className="text-sm leading-7 mt-3" style={{ color: C.muted }}>این چهار بخش به پروژه مشخصی وابسته نیستند و برای مدیریت کلی کارها و فکرها استفاده می‌شوند.</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          {INDEPENDENT_SECTIONS.map(([Icon, color, title, text], index) => (
            <article key={title} id={`tool-${INDEPENDENT_SCREENSHOTS[index][0]}`} className="scroll-mt-20 rounded-2xl p-5 sm:p-6 ops-card" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ color: tone(color), background: toneSoft(color) }}><Icon size={20} /></div>
              <h3 className="font-bold mb-2">{title}</h3><p className="text-sm leading-7" style={{ color: C.muted }}>{text}</p>
              <details className="mt-4 rounded-xl px-3 py-2" style={{ border: `1px solid ${C.borderStrong}` }}><summary className="cursor-pointer text-sm" style={{ color: tone(color) }}>نمای تصویری و توضیح این بخش</summary><GuideScreenshot name={INDEPENDENT_SCREENSHOTS[index][0]} title={title} caption={INDEPENDENT_SCREENSHOTS[index][1]} /></details>
            </article>
          ))}
        </div>
      </section>

      <GuideDailyTools />

      <section id="backup" className="py-12 sm:py-16 scroll-mt-20" style={{ background: C.panelAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-5">
          <div className="lg:col-span-2">
            <GuideScreenshot name="backup" title="دانلود بکاپ" caption="پایین ستون راست، بخش «بکاپ» قرار دارد: آخرین نسخه خودکار، خروجی SQL و خروجی JSON. زمان زیر گزینه اول، تاریخ ساخت آخرین نسخه خودکار است." />
          </div>
          <article className="rounded-2xl p-6 sm:p-8" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ color: tone("jade"), background: toneSoft("jade") }}><Database size={21} /></div>
            <h2 className="text-xl sm:text-2xl font-bold">بکاپ خودکار روزانه</h2>
            <p className="text-sm leading-8 mt-4" style={{ color: C.muted }}>هر روز ساعت ۶ صبح به وقت دبی، یک نسخه کامل JSON از اطلاعات حساب ساخته می‌شود. نسخه جدید جای نسخه قبلی را می‌گیرد و فقط متعلق به همان حساب است. از سایدبار روی «آخرین بکاپ خودکار» بزن تا آن را دانلود کنی.</p>
          </article>
          <article className="rounded-2xl p-6 sm:p-8" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ color: tone("blue"), background: toneSoft("blue") }}><Download size={21} /></div>
            <h2 className="text-xl sm:text-2xl font-bold">خروجی دستی SQL و JSON</h2>
            <p className="text-sm leading-8 mt-4" style={{ color: C.muted }}>«خروجی JSON» و «خروجی SQL» هر دو از داده‌های فعلی حساب فایل می‌سازند؛ JSON برای نگه‌داشتن نسخه داده‌ها و SQL برای کار فنی با دیتابیس است. دانلود فایل، اطلاعات حساب را تغییر نمی‌دهد. بازیابی در نسخه فعلی دکمه‌ای در پنل ندارد؛ <a href="#restore" className="underline" style={{ color: tone("jade") }}>مراحل نگهداری و بازیابی بکاپ</a> را ببین.</p>
          </article>
          <div className="lg:col-span-2 rounded-2xl p-5 flex items-start gap-3" style={{ background: toneSoft("amber"), border: `1px solid ${C.border}` }}>
            <ShieldCheck size={20} className="shrink-0 mt-1" style={{ color: tone("amber") }} />
            <p className="text-sm leading-7" style={{ color: C.muted }}><strong style={{ color: C.text }}>امنیت حساب:</strong> اطلاعات همه کاربران در یک دیتابیس نگهداری می‌شود، اما دسترسی هر ردیف با شناسه حساب محدود شده است؛ بنابراین هر کاربر فقط داده‌ها و بکاپ خودش را می‌بیند.</p>
          </div>
        </div>
      </section>

      <GuideRestore />
      <GuideTroubleshooting />

      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
        <div className="text-center mb-8"><CircleHelp size={25} className="mx-auto mb-3" style={{ color: tone("amber") }} /><h2 className="text-2xl sm:text-3xl font-bold">سؤال‌های رایج</h2></div>
        <div className="space-y-3">
          {[
            ["چرا تایمر بعد از برگشت به صفحه زمان بیشتری نشان می‌دهد؟", "اگر قبل از ترک صفحه توقف را نزنی، فاصله تا برگشت هم حساب می‌شود. برای استراحت یا پایان کار، اول تایمر را متوقف کن."],
            ["چرا بعد از صفر کردن، تایمر دوباره جلو می‌رود؟", "صفر کردن حالت فعال را عوض نمی‌کند. اگر می‌خواهی روی صفر بماند، ابتدا توقف و سپس صفر کردن را بزن."],
            ["آیا کارهای تکرارشونده بدون بازکردن پنل ساخته می‌شوند؟", "ساخت کار روز جاری هنگام بازکردن صفحه کارهای روزانه انجام می‌شود. تیک‌زدن کار امروز هم تکرار فردا را لغو نمی‌کند."],
            ["تغییرات خودکار ذخیره می‌شوند؟", "بله. بیشتر ویرایش‌های داخل کارت‌ها با تغییر فیلد یا خروج از آن مستقیماً در دیتابیس ذخیره می‌شوند."],
            ["کاربر دیگری اطلاعات من را می‌بیند؟", "خیر. پروژه‌ها، کارها، یادداشت‌ها و بکاپ هر حساب در سطح دیتابیس از حساب‌های دیگر جدا شده‌اند."],
            ["اگر پروژه‌ای تمام شد چه کنم؟", "آن را آرشیو کن. پروژه حذف نمی‌شود و هر زمان لازم بود می‌توانی از بخش آرشیو برگردانی."],
            ["از کدام بخش شروع کنم؟", "اول پروژه را بساز و فقط ماژول‌های اصلی‌اش را وارد کن. سپس کارهای امروز را در برنامه روزانه بگذار و بقیه بخش‌ها را به‌مرور کامل کن."],
          ].map(([question, answer]) => (
            <article key={question} className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}><h3 className="font-bold flex items-center gap-2"><Sparkles size={15} style={{ color: tone("jade") }} />{question}</h3><p className="text-sm leading-7 mt-2" style={{ color: C.muted }}>{answer}</p></article>
          ))}
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl px-6 py-10 sm:p-12 text-center" style={{ background: toneSoft("jade"), border: `1px solid ${C.borderStrong}` }}>
            <h2 className="text-2xl sm:text-3xl font-bold">حالا اولین پروژه‌ات را بساز</h2>
            <p className="text-sm mt-3 mb-6" style={{ color: C.muted }}>اگر حساب نداری، با همان دکمه ورود و ایمیلت حساب تازه ساخته می‌شود.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold ops-primary">باز کردن پنل <ChevronLeft size={18} /></Link>
          </div>
        </div>
      </section>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: C.muted }}><Link href="/" className="flex items-center gap-2"><Layers size={15} style={{ color: tone("jade") }} /><span className="mono">DADASH//</span></Link><Link href="/" className="inline-flex items-center gap-1 ops-tap">بازگشت به صفحه اصلی <ArrowLeft size={13} /></Link></div>
      </footer>
    </main>
  );
}
