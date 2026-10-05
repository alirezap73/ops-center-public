"use client";

import Link from "next/link";
import Image from "next/image";
import LandingDemo from "@/components/LandingDemo";
import {
  ArrowLeft, BarChart3, CalendarDays, Check, CheckSquare2, FileText,
  Layers, Lightbulb, Link2, LockKeyhole, Moon, ShieldCheck, Sparkles, Sun, Armchair, Database,
  Github, Server, History,
} from "lucide-react";
import { C, tone, toneSoft, useTheme } from "@/lib/theme";
import { CHANGELOG, computeVersion, computeVersions } from "@/lib/changelog";

const FEATURE_ANCHORS = ["projects", "content", "daily-workflow", "tool-notes", "updates", "links-competitors"];

const FEATURES = [
  [Layers, "jade", "مدیریت چند پروژه", "پروژه‌ها، ماژول‌ها، وضعیت پیشرفت و چک‌لیست هر بخش را یک‌جا نگه دار."],
  [CalendarDays, "blue", "تقویم محتوا", "ایده، پیش‌نویس، زمان‌بندی و انتشار محتوا را برای هر پروژه دنبال کن."],
  [CheckSquare2, "violet", "برنامه روزانه", "کارهای امروز، عقب‌افتاده و تکرارشونده را با اولویت و تاریخ مدیریت کن."],
  [FileText, "amber", "یادداشت‌های منظم", "یادداشت روزانه برای خودت؛ یادداشت‌های هر پروژه هم در فضای همان پروژه، جدا و مرتب."],
  [BarChart3, "red", "برد آپدیت و تبلیغات", "کارها را بین مراحل جابه‌جا کن و تصویر روشنی از جریان اجرا داشته باش."],
  [Link2, "slate", "لینک‌ها و رقبا", "ابزارها و لینک‌های مهم هر پروژه را کنار بررسی رقبا همیشه دم دست نگه دار."],
];

const VERSION_TYPES = { large: "انتشار اصلی", medium: "قابلیت جدید", small: "بهبود جزئی" };
const versions = computeVersions();
const latestUpdates = CHANGELOG.slice(-3).reverse().map((entry, index) => ({
  ...entry,
  version: versions[versions.length - 1 - index],
}));
const currentVersion = computeVersion();

function ThemeButton({ theme, toggleTheme, mounted }) {
  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
      className="p-2.5 rounded-xl ops-tap"
      style={{ color: C.muted, border: `1px solid ${C.border}` }}
    >
      <span className="block w-4 h-4">
        {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
      </span>
      <span className="sr-only">تغییر حالت روشن/تیره</span>
    </button>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme, mounted } = useTheme();
  const primaryHref = "/login";
  const primaryLabel = "ورود یا ساخت حساب";

  return (
    <main className="dadash-landing" dir="rtl" lang="fa" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <header className="sticky top-0 z-20" style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 rounded-lg">
            <Layers size={20} style={{ color: tone("jade") }} />
            <span className="mono text-sm font-semibold tracking-widest">DADASH//</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: C.muted }} aria-label="ناوبری اصلی">
            <a href="#features" className="rounded ops-tap">قابلیت‌ها</a>
            <a href="#try-it" className="rounded ops-tap">امتحان کن</a>
            <a href="#privacy" className="rounded ops-tap">حریم شخصی</a>
            <a href="#how-it-works" className="rounded ops-tap">نحوه شروع</a>
            <Link href="/guide" className="rounded ops-tap">راهنمای کامل</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeButton theme={theme} toggleTheme={toggleTheme} mounted={mounted} />
            <Link href={primaryHref} className="text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl ops-primary">{primaryLabel}</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden landing-hero">
        <div className="landing-orb landing-orb-one" aria-hidden="true" /><div className="landing-orb landing-orb-two" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid lg:grid-cols-[1fr_1fr] gap-7 lg:gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-4" style={{ color: tone("jade"), background: toneSoft("jade"), border: `1px solid ${C.border}` }}>
              <Sparkles size={14} /> فضای شخصی مدیریت پروژه‌ها
            </div>
            <h1 className="text-[28px] sm:text-[42px] xl:text-[48px] font-bold leading-[1.4]">
              پروژه‌هات را جلو ببر.<span className="block" style={{ color: tone("jade") }}>قدم بعدی را بدان.</span>
            </h1>
            <p className="text-sm sm:text-base leading-7 mt-4 max-w-xl" style={{ color: C.muted }}>
              در داداش، کارهای امروز را کنار پیشرفت پروژه‌ها ببین. یادداشت و برنامهٔ محتوای هر پروژه هم در فضای خودش باقی می‌ماند.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link href={primaryHref} className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl font-semibold ops-primary">شروع اولین پروژه<ArrowLeft size={18} /></Link>
              <a href="#try-it" className="inline-flex items-center justify-center px-4 py-3 text-sm rounded-xl font-medium ops-tap" style={{ border: `1px solid ${C.borderStrong}`, color: C.text }}>امتحان پنل</a>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs" style={{ color: C.muted }}>
              {["ورود با ایمیل", "داده‌های جدا برای هر حساب", "روی موبایل و دسکتاپ"].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check size={14} style={{ color: tone("jade") }} /> {item}</span>)}
            </div>
          </div>
          <div className="relative min-w-0 landing-art-shell">
            <div className="relative aspect-[16/9] sm:aspect-[3/2] overflow-hidden rounded-[24px]" style={{background:"#0b0e14",border:`1px solid ${C.borderStrong}`}}>
              <Image src="/images/hero-planning-v1.png" alt="تصویر هنری برنامه‌ریزی با کارت‌های کار، تیک انجام و تایمر" fill priority sizes="(max-width: 1023px) 100vw, 560px" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between gap-3" style={{background:"linear-gradient(transparent,rgba(11,14,20,.9))",color:"#fff"}}>
                <span className="text-sm font-medium">برای ایده‌هایی که می‌خواهی انجامشان بدهی</span><Layers size={20} className="shrink-0"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl p-4" style={{background:C.panel,border:`1px solid ${C.border}`}}>
          {[[Layers,"پروژه و چک‌لیست"],[FileText,"یادداشت‌های جدا"],[CalendarDays,"برنامه محتوا"],[Armchair,"تایمر استراحت"]].map(([Icon,text])=><span key={text} className="flex items-center gap-2 text-xs sm:text-sm"><Icon size={17} style={{color:tone("jade")}}/>{text}</span>)}
        </div>
      </div>

      <section id="features" className="py-8 sm:py-10 scroll-mt-16" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-6">
            <p className="text-xs font-semibold mb-3" style={{ color: tone("jade") }}>همه‌چیز در یک فضای منظم</p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">هر پروژه، با جزئیات خودش</h2>
            <p className="text-sm leading-7 mt-3" style={{ color: C.muted }}>کارهای روزانه را پیدا کن و برای بررسی جزئیات، وارد فضای همان پروژه شو.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(([Icon, color, title, text], index) => (
              <article key={title} className="relative overflow-hidden rounded-2xl p-5 sm:p-6 landing-feature" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <span className="absolute top-0 right-5 w-14 h-0.5 rounded-b-full" style={{ background: tone(color) }} aria-hidden="true" />
                <span className="mono absolute top-5 left-5 text-xs" style={{ color: C.faint }} aria-hidden="true">0{index + 1}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ color: tone(color), background: toneSoft(color) }}><Icon size={20} /></div>
                <h3 className="text-base font-bold mb-2">{title}</h3>
                <p className="text-sm leading-7" style={{ color: C.muted }}>{text}</p>
                <Link href={`/guide#${FEATURE_ANCHORS[index]}`} className="inline-flex items-center gap-2 text-xs mt-3" style={{ color: tone(color) }}>راهنمای این بخش <ArrowLeft size={14} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-12">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-6 lg:gap-10 items-center rounded-3xl p-4 sm:p-6" style={{background:C.panelAlt,border:`1px solid ${C.border}`}}>
          <div className="lg:px-3">
            <span className="text-xs font-medium" style={{color:tone("jade")}}>قبل از ساخت حساب</span>
            <h2 className="text-2xl sm:text-3xl leading-[1.5] font-bold mt-2">با پنل کار کن.<br/>همین‌جا امتحانش کن.</h2>
            <p className="text-sm leading-7 mt-3" style={{color:C.muted}}>روی کارها تیک بزن و پیشرفت را ببین. بین نمای پروژه، کارهای امروز و محتوا جابه‌جا شو.</p>
            <p className="text-xs leading-6 mt-3" style={{color:C.faint}}>این نمونه دادهٔ نمایشی دارد و در حساب ذخیره نمی‌شود.</p>
            <Link href={primaryHref} className="inline-flex items-center gap-2 text-sm font-medium mt-4" style={{color:tone("jade")}}>فضای خودت را بساز <ArrowLeft size={16}/></Link>
          </div>
          <LandingDemo />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-5">
          <article className="rounded-3xl p-6 sm:p-9" style={{ background: toneSoft("jade"), border: `1px solid ${C.border}` }}>
            <Armchair size={27} style={{ color: tone("jade") }} /><h2 className="text-2xl font-bold mt-5">حواست به خودت هم باشه.</h2>
            <p className="text-sm leading-8 mt-3" style={{ color: C.muted }}>وقتی غرق کار می‌شوی، تایمر نشستن زمان را نگه می‌دارد. حد یادآوری را تنظیم کن و با پیام داخل پنل، استراحت را به یاد بیاور.</p>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 mt-6" style={{ background: C.panel }}><div><p className="text-xs" style={{ color: C.muted }}>نمونه تایمر · حد ۴۵ دقیقه</p><p className="mono text-3xl font-bold mt-2" dir="ltr" style={{ color: tone("jade") }}>24:08</p></div><Link href="/guide#sit-timer" className="inline-flex items-center gap-2 text-xs" style={{ color: tone("jade") }}>آشنایی با تایمر <ArrowLeft size={14} /></Link></div>
          </article>
          <article className="rounded-3xl p-6 sm:p-9" style={{ background: toneSoft("blue"), border: `1px solid ${C.border}` }}>
            <Database size={27} style={{ color: tone("blue") }} /><h2 className="text-2xl font-bold mt-5">یک نسخه برای روز مبادا.</h2>
            <p className="text-sm leading-8 mt-3" style={{ color: C.muted }}>هر روز یک بکاپ تازه از داده‌های حسابت ساخته می‌شود و جای نسخه قبلی را می‌گیرد. هر زمان خواستی، خروجی دستی هم بگیر و پیش خودت نگه دار.</p>
            <div className="space-y-3 mt-6">{["بکاپ خودکار روزانه", "دانلود آخرین نسخه", "خروجی دستی JSON و SQL"].map(text => <p key={text} className="flex items-center gap-2 text-sm"><Check size={16} style={{ color: tone("blue") }} />{text}</p>)}</div><Link href="/guide#backup" className="inline-flex items-center gap-2 text-xs mt-5" style={{ color: tone("blue") }}>راهنمای بکاپ <ArrowLeft size={14} /></Link>
          </article>
        </div>
      </section>

      <section id="privacy" className="py-12 sm:py-16 scroll-mt-16" style={{ background: C.panelAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ color: tone("jade"), background: toneSoft("jade") }}><ShieldCheck size={25} /></div>
            <h2 className="text-2xl sm:text-4xl font-bold leading-tight">فضای هر کاربر، فقط برای خودش</h2>
            <p className="text-sm sm:text-base leading-8 mt-5" style={{ color: C.muted }}>هر شخص با ایمیل خودش وارد می‌شود و پروژه‌ها، یادداشت‌ها و کارهایش از کاربران دیگر جدا می‌ماند. سیاست‌های دسترسی دیتابیس اجازه نمی‌دهند حساب‌ها اطلاعات یکدیگر را ببینند.</p>
          </div>
          <div className="rounded-2xl p-5 sm:p-7" style={{ background: C.panel, border: `1px solid ${C.borderStrong}` }}>
            {[[LockKeyhole, "ورود بدون رمز عبور", "لینک امن ورود مستقیماً به ایمیل شما ارسال می‌شود."], [ShieldCheck, "جداسازی در سطح دیتابیس", "دسترسی هر درخواست بر اساس شناسه همان کاربر کنترل می‌شود."], [FileText, "خروجی گرفتن از اطلاعات", "در هر زمان می‌توانی از داده‌های حساب خودت بکاپ بگیری."]].map(([Icon, title, text], index) => (
              <div key={title} className={`flex gap-3 ${index ? "pt-5 mt-5" : ""}`} style={index ? { borderTop: `1px solid ${C.border}` } : undefined}>
                <Icon size={19} className="shrink-0 mt-0.5" style={{ color: tone("jade") }} />
                <div><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs leading-6 mt-1" style={{ color: C.muted }}>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-12 sm:py-16 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10"><Lightbulb size={24} className="mx-auto mb-4" style={{ color: tone("amber") }} /><h2 className="text-2xl sm:text-4xl font-bold">سه قدم تا شروع</h2></div>
          <div className="grid md:grid-cols-3 gap-4">
            {[["۱", "ایمیلت را وارد کن", "حساب جدید همان لحظه برایت آماده می‌شود."], ["۲", "لینک ورود را باز کن", "بدون ساختن یا حفظ‌کردن رمز عبور وارد شو."], ["۳", "اولین پروژه را بساز", "ماژول‌ها، کارها و محتوای پروژه را اضافه کن."]].map(([number, title, text]) => (
              <div key={number} className="rounded-2xl p-6 text-center" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <span className="mono inline-flex w-9 h-9 items-center justify-center rounded-full text-sm font-semibold mb-4" style={{ color: tone("jade"), background: toneSoft("jade") }}>{number}</span>
                <h3 className="font-bold mb-2">{title}</h3><p className="text-sm leading-7" style={{ color: C.muted }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <h2 className="text-2xl font-bold mb-6">قبل از شروع، شاید بپرسی…</h2>
        <div className="space-y-3">{[
          ["برای استفاده باید چیزی نصب کنم؟", "نه؛ داداش در مرورگر موبایل و دسکتاپ باز می‌شود. با ایمیلت وارد شو و کار را شروع کن."],
          ["این نمونه، اطلاعات واقعی کاربران است؟", "خیر. پیش‌نمایش بالای صفحه نمایشی است و تغییرات آن در حساب ذخیره نمی‌شوند. برای نگهداری کارها وارد پنل شو."],
          ["یادداشت روزانه و یادداشت پروژه فرق دارند؟", "بله. یادداشت‌های روزانه مستقل‌اند؛ یادداشت‌های هر پروژه در بخش همان پروژه قرار می‌گیرند."],
          ["از کجا یاد بگیرم؟", "راهنمای تصویری، آموزش همه بخش‌ها و یک تمرین قدم‌به‌قدم برای ساخت اولین پروژه دارد. از لینک راهنما شروع کن."],
        ].map(([question, answer]) => <details key={question} className="rounded-xl px-5 py-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}><summary className="cursor-pointer text-sm font-semibold leading-7">{question}</summary><p className="text-sm leading-8 mt-3" style={{ color: C.muted }}>{answer}</p></details>)}</div>
      </section>

      <section className="pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl px-6 py-10 sm:p-12 text-center" style={{ background: toneSoft("jade"), border: `1px solid ${C.borderStrong}` }}>
            <h2 className="text-2xl sm:text-4xl font-bold">کار بعدی‌ات چیه؟ از همین‌جا شروع کن.</h2>
            <p className="text-sm sm:text-base mt-4 mb-7" style={{ color: C.muted }}>با ایمیلت وارد شو و فضای شخصی خودت را بساز.</p>
            <Link href={primaryHref} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold ops-primary">{primaryLabel}<ArrowLeft size={18} /></Link>
          </div>
        </div>
      </section>

      <footer style={{ background: C.panel, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid md:grid-cols-[1.1fr_1fr_1.2fr] gap-9 md:gap-12 text-sm">
          <div>
            <div className="flex items-center gap-2 font-semibold"><Layers size={19} style={{ color: tone("jade") }} /><span className="mono">DADASH//</span></div>
            <p className="leading-7 mt-3 max-w-xs" style={{ color: C.muted }}>یک فضای مرتب برای پروژه‌ها، کارهای روزانه و ایده‌هایی که قرار است به نتیجه برسند.</p>
            <div className="inline-flex flex-wrap items-center gap-2 mt-5 px-3 py-2 rounded-xl text-xs" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <span className="mono" dir="ltr" style={{ color: tone("jade") }}>v{currentVersion}</span>
              <span style={{ color: C.borderStrong }}>•</span>
              <span>{VERSION_TYPES[latestUpdates[0].size]}</span>
              <span style={{ color: C.muted }}>· آخرین نسخه</span>
            </div>
          </div>
          <div>
            <h2 className="font-bold mb-4 flex items-center gap-2"><History size={17} style={{ color: tone("blue") }} />آخرین به‌روزرسانی‌ها</h2>
            <ol className="space-y-3">
              {latestUpdates.map((entry) => <li key={`${entry.date}-${entry.title}`} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: tone("jade") }} />
                <span className="leading-6">{entry.title}<span className="block text-xs" style={{ color: C.muted }}><span className="mono" dir="ltr">v{entry.version}</span> · {entry.date}</span></span>
              </li>)}
            </ol>
          </div>
          <div>
            <h2 className="font-bold mb-4 flex items-center gap-2"><Server size={17} style={{ color: tone("violet") }} />راه‌اندازی نسخه شخصی</h2>
            <p className="leading-7 mb-4" style={{ color: C.muted }}>سورس داداش در گیت‌هاب عمومی است. راهنمای نصب را بخوان و نسخهٔ شخصی را روی هاست خودت راه‌اندازی کن.</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://github.com/alirezap73/ops-center-public" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg ops-tap" style={{ border: `1px solid ${C.borderStrong}` }}><Github size={16} />مخزن GitHub</a>
              <Link href="/self-host" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg ops-tap" style={{ border: `1px solid ${C.borderStrong}` }}>آموزش نصب <ArrowLeft size={15} /></Link>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>
          <span>داداش · مدیریت پروژه‌ها، به سبک خودت</span>
          <Link href="/guide" className="ops-tap">راهنمای استفاده از پنل</Link>
        </div>
      </footer>
    </main>
  );
}
