import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Check, Github, Layers, Server, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "راه‌اندازی شخصی | داداش",
  description: "آموزش نصب داداش روی هاست Node.js شخصی با Supabase و دامنه اختصاصی.",
};

const repo = "https://github.com/alirezap73/ops-center-public";

function Step({ number, title, children }) {
  return <section className="rounded-2xl p-5 sm:p-7" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
    <div className="flex items-center gap-3 mb-4"><span className="mono flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold" style={{ background: "var(--jade-soft)", color: "var(--jade)" }}>{number}</span><h2 className="text-lg sm:text-xl font-bold">{title}</h2></div>
    <div className="text-sm leading-8 space-y-3" style={{ color: "var(--muted)" }}>{children}</div>
  </section>;
}

function Code({ children }) {
  return <pre dir="ltr" className="overflow-x-auto rounded-xl p-4 text-xs sm:text-sm leading-7 text-left" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}><code>{children}</code></pre>;
}

export default function SelfHostPage() {
  return <main dir="rtl" lang="fa" className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
    <header style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold"><Layers size={20} style={{ color: "var(--jade)" }} /><span className="mono text-sm">DADASH//</span></Link>
        <Link href="/" className="inline-flex items-center gap-2 text-sm ops-tap" style={{ color: "var(--muted)" }}>بازگشت به صفحه اصلی <ArrowLeft size={16} /></Link>
      </div>
    </header>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-3xl mb-9">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-4" style={{ background: "var(--jade-soft)", color: "var(--jade)" }}><Server size={14} /> راه‌اندازی روی هاست خودت</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">نسخه شخصی داداش را اجرا کن</h1>
        <p className="leading-8 mt-4" style={{ color: "var(--muted)" }}>برای اجرای این پروژه به هاست دارای پشتیبانی از Node.js و یک پروژه Supabase نیاز داری. Vercel اجباری نیست؛ هاست PHP یا فضای استاتیک به‌تنهایی کافی نیست.</p>
        <div className="flex flex-wrap gap-3 mt-5">
          <a href={repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ops-primary text-sm font-semibold"><Github size={17} />مشاهده سورس در GitHub <ArrowUpLeft size={15} /></a>
          <Link href="/guide" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border-strong)" }}>راهنمای کار با پنل</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-8 text-sm">
        {[[Server, "هاست Node.js", "دسترسی SSH یا امکان اجرای اپ Node.js در پنل هاست"], [ShieldCheck, "Supabase مستقل", "پروژه جدا برای ورود کاربران و داده‌های نصب تو"], [Check, "دامنه و HTTPS", "دامنه متصل به اپ و گواهی SSL فعال"]].map(([Icon, title, detail]) => <div key={title} className="rounded-xl p-4" style={{ background: "var(--panel-alt)", border: "1px solid var(--border)" }}><Icon size={19} className="mb-3" style={{ color: "var(--jade)" }} /><strong>{title}</strong><p className="text-xs leading-6 mt-1" style={{ color: "var(--muted)" }}>{detail}</p></div>)}
      </div>

      <div className="space-y-4">
        <Step number="۱" title="یک پروژه Supabase برای خودت بساز">
          <p>در <a className="underline" href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase</a> پروژه جدید بساز. فایل <code dir="ltr">supabase/schema.sql</code> مخزن را در SQL Editor اجرا کن؛ این فایل جدول‌ها، سیاست‌های جداسازی داده و زمان‌بندی بکاپ روزانه را تعریف می‌کند. سپس در Authentication، ورود با ایمیل و ساخت کاربر جدید را فعال نگه دار.</p>
          <p>در Authentication → URL Configuration، آدرس نهایی سایت را Site URL قرار بده و <code dir="ltr">https://YOUR-DOMAIN/auth/callback</code> را به Redirect URLs اضافه کن. ایمیل ورود باید از طرف Supabase به کاربران برسد؛ برای استفاده عمومی، تنظیمات و محدودیت‌های ارسال ایمیل پروژه‌ات را هم بررسی کن.</p>
        </Step>

        <Step number="۲" title="سورس را روی هاست بگیر و تنظیم کن">
          <p>روی هاستی که Node.js و ترمینال دارد، نسخهٔ عمومی مخزن را دریافت کن. این نسخه داده‌ها و تنظیمات خصوصی نصب‌های دیگر را ندارد.</p>
          <Code>{`git clone ${repo}.git\ncd ops-center-public\nnpm ci`}</Code>
          <p>از فایل <code dir="ltr">.env.local.example</code> یک <code dir="ltr">.env.local</code> بساز و دو مقدار مربوط به پروژه Supabase خودت را وارد کن:</p>
          <Code>{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY`}</Code>
          <p>این کلید عمومی است؛ کلید <code dir="ltr">service_role</code> یا رمز دیتابیس را در این متغیرها قرار نده. این دو مقدار باید <strong>پیش از build</strong> تنظیم شده باشند.</p>
        </Step>

        <Step number="۳" title="بساز، اجرا کن و دامنه را وصل کن">
          <Code>{`npm run build\nnpm run start`}</Code>
          <p>فرمان start اپ را روی پورت ۳۰۰۰ اجرا می‌کند؛ در صورت نیاز با متغیر <code dir="ltr">PORT</code> آن را تغییر بده. در محیط واقعی، یک مدیر پردازش برای روشن‌ماندن اپ و یک reverse proxy برای اتصال دامنه و HTTPS تنظیم کن.</p>
          <p>اگر cPanel داری، اول از پشتیبانی هاست بپرس قابلیت اجرای Node.js و دسترسی لازم برای build و اجرای دائم اپ فعال است یا نه. نام و امکانات این بخش در هاست‌ها متفاوت است؛ صرف داشتن cPanel کافی نیست.</p>
        </Step>

        <Step number="۴" title="نصب را امتحان کن">
          <p>صفحه اصلی را باز کن، با ایمیل وارد شو، یک پروژه آزمایشی بساز و بعد از خروج دوباره وارد شو. اگر لینک ورود به آدرس اشتباه می‌رود، Site URL و Redirect URLs را در Supabase بازبینی کن. برای انتشار عمومی، ارسال ایمیل، SSL و بکاپ روزانه را هم در همان پروژه بررسی کن.</p>
          <p>هر نصب می‌تواند چند کاربر داشته باشد. اطلاعات آن‌ها در یک دیتابیس Supabase ذخیره می‌شود، ولی با سیاست‌های دسترسی از هم جداست؛ نصب روی هاست خودت به معنی میزبانی خودکار دیتابیس روی همان هاست نیست.</p>
        </Step>
      </div>

      <p className="text-xs leading-7 mt-7" style={{ color: "var(--muted)" }}>منابع فنی: <a className="underline" href="https://nextjs.org/docs/14/app/building-your-application/deploying" target="_blank" rel="noopener noreferrer">راهنمای رسمی نصب Next.js 14</a> · <a className="underline" href="https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/" target="_blank" rel="noopener noreferrer">راهنمای رسمی cPanel برای Node.js</a></p>
    </div>
  </main>;
}
