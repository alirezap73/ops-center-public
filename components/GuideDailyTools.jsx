import { Armchair, Play, Pause, RotateCcw, Sun, Search, Repeat2, Archive, Keyboard } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";

const TIMER_STATES = [
  { title: "آماده شروع", time: "00:00", action: "شروع", color: "slate", icon: Play, text: "تا وقتی «شروع» را نزنی زمان شمرده نمی‌شود." },
  { title: "در حال شمارش", time: "18:24", action: "توقف", color: "jade", icon: Pause, text: "عدد سبز یعنی شمارش فعال است. برای شروع استراحت، «توقف» را بزن." },
  { title: "متوقف‌شده", time: "18:24", action: "ادامه", color: "slate", icon: Play, text: "زمان قبلی حفظ می‌شود. «ادامه» شمارش را از همان عدد دنبال می‌کند." },
  { title: "رسیدن به حد یادآوری", time: "45:00", action: "توقف", color: "red", icon: Pause, text: "در مثال با حد ۴۵ دقیقه، عدد قرمز می‌شود و پیام بلندشدن دیده می‌شود. شمارش خودکار متوقف نمی‌شود." },
];

const TIPS = [
  [Sun, "حالت روشن و تیره", "با آیکون خورشید یا ماه، ظاهر پنل را تغییر بده. انتخابت برای همین مرورگر حفظ می‌شود و در صفحه‌های دیگر پنل هم اعمال می‌شود."],
  [Search, "جست‌وجو در هر بخش", "کادر جست‌وجوی بالای پنل، محتوای تب فعلی را فیلتر می‌کند. اگر موردی را نمی‌بینی، متن جست‌وجو را پاک کن یا تب مربوط به آن را باز کن. در صفحه یادداشت‌های روزانه، فیلتر برچسب هم داری؛ یادداشت‌های پروژه فقط داخل همان پروژه دیده می‌شوند."],
  [Archive, "آرشیو و حذف", "آیکون آرشیو کنار پروژه، آن را از فهرست فعال خارج می‌کند. برای برگرداندن، «پروژه‌های آرشیو» را باز کن و روی بازگرداندن بزن. دکمه‌های حذف دومرحله‌ای‌اند: وقتی «مطمئنی؟» دیده شد، کلیک دوم حذف را تأیید می‌کند؛ با خروج از دکمه یا گذشت سه ثانیه تأیید لغو می‌شود."],
  [Keyboard, "کار با صفحه‌کلید", "با Tab بین کنترل‌ها حرکت کن. وقتی روی یکی از تب‌های پروژه هستی، فلش چپ به تب بعدی و فلش راست به تب قبلی می‌رود؛ Home و End اولین و آخرین تب را انتخاب می‌کنند. Escape جست‌وجوی داشبورد را پاک می‌کند؛ پنجره تصویر راهنما را هم می‌توانی با همین کلید ببندی."],
];

function Steps({ items }) {
  return <ol className="space-y-3 list-decimal pr-5 text-sm leading-7" style={{ color: C.muted }}>{items.map(text => <li key={text}>{text}</li>)}</ol>;
}

export default function GuideDailyTools() {
  return (
    <>
      <section id="sit-timer" className="py-12 sm:py-16 scroll-mt-20" style={{ background: C.panelAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-8">
            <Armchair size={26} className="mb-3" style={{ color: tone("jade") }} />
            <h2 className="text-2xl sm:text-3xl font-bold">تایمر زمان پشت لپ‌تاپ</h2>
            <p className="text-sm leading-8 mt-4" style={{ color: C.muted }}>این ابزار زمان نشستن را از صفر رو به بالا می‌شمارد. نسخه کامل در سایدبار داشبورد، زیر پروژه‌هاست؛ نسخه کوچک در بالای صفحه‌های یادداشت‌ها، ایده‌ها، کارهای روزانه و رودمپ قرار دارد.</p>
            <p className="text-xs leading-6 mt-2" style={{ color: tone("jade") }}>کارت‌های زیر نمونه آموزشی حالت‌ها هستند؛ دکمه‌های واقعی تایمر در پنل قرار دارند.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIMER_STATES.map(({ title, time, action, color, icon: Icon, text }) => (
              <article key={title} className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <h3 className="text-sm font-bold mb-4">{title}</h3>
                <div className="rounded-xl p-3" style={{ background: toneSoft(color) }}>
                  <div className="flex justify-between gap-2 text-xs" style={{ color: C.muted }}><span>زمان پشت لپ‌تاپ</span><span>حد ۴۵′</span></div>
                  <p className="mono text-3xl font-bold my-3" dir="ltr" style={{ color: tone(color) }}>{time}</p>
                  {color === "red" && <p className="text-xs leading-6 mb-2" style={{ color: tone("red") }}>وقت بلندشدن و تحرک — بعدش صفرش کن.</p>}
                  <div className="flex items-center gap-2 text-xs" style={{ color: tone(color) }}><Icon size={14} /><span>{action}</span><RotateCcw size={14} className="mr-auto" /></div>
                </div>
                <p className="text-sm leading-7 mt-4" style={{ color: C.muted }}>{text}</p>
              </article>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-5 mt-5">
            <article className="rounded-2xl p-5 sm:p-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="font-bold mb-4">تنظیم و استفاده، قدم‌به‌قدم</h3>
              <Steps items={[
                "در نسخه کامل، روی «حد ۴۵′» بزن. هر کلیک حد را به گزینه بعدی می‌برد: ۳۰، ۴۵، ۶۰، ۹۰ دقیقه و دوباره ۳۰. پیش‌فرض ۴۵ دقیقه است.",
                "برای شروع کار «شروع» را بزن. زمان به‌صورت دقیقه و ثانیه نمایش داده می‌شود؛ بعد از یک ساعت، ساعت هم به عدد اضافه می‌شود.",
                "وقتی از پشت لپ‌تاپ بلند می‌شوی، «توقف» را بزن تا زمان استراحت به شمارش اضافه نشود.",
                "پس از استراحت، اگر می‌خواهی یک دوره تازه شروع کنی، «صفر کردن» و سپس «شروع» را بزن. برای حفظ زمان قبلی فقط «ادامه» را بزن.",
              ]} />
            </article>
            <article className="rounded-2xl p-5 sm:p-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="font-bold mb-4">تفاوت توقف، صفر کردن و نمای کوچک</h3>
              <div className="space-y-3 text-sm leading-7" style={{ color: C.muted }}>
                <p><strong style={{ color: C.text }}>توقف:</strong> فقط شمارش را نگه می‌دارد و زمان سپری‌شده پاک نمی‌شود.</p>
                <p><strong style={{ color: C.text }}>صفر کردن:</strong> زمان را صفر می‌کند؛ اگر تایمر روشن باشد، فوراً از صفر به شمارش ادامه می‌دهد. اگر متوقف باشد، متوقف می‌ماند.</p>
                <p><strong style={{ color: C.text }}>نمای کوچک:</strong> روی عدد کنار علامت پخش یا توقف بزن تا شمارش شروع یا متوقف شود. وقتی زمان از صفر بیشتر باشد، دکمه صفر کردن هم دیده می‌شود. تغییر حد یادآوری در نسخه کامل داشبورد است.</p>
                <p><strong style={{ color: C.text }}>یادآوری:</strong> با رسیدن به حد، عدد قرمز می‌شود و در نسخه کامل پیام نمایش داده می‌شود. در نسخه فعلی صدای هشدار، اعلان سیستم یا شمارش‌گر جداگانه استراحت وجود ندارد.</p>
              </div>
            </article>
          </div>
          <p className="rounded-xl p-4 text-sm leading-7 mt-5" style={{ background: toneSoft("blue"), color: C.muted }}>زمان و حد یادآوری در همان مرورگر ذخیره می‌شوند. با رفرش یا رفتن به صفحه دیگر پنل حفظ می‌شوند؛ اگر تایمر را متوقف نکرده باشی، زمان بسته‌بودن صفحه هم هنگام برگشت در شمارش حساب می‌شود. این وضعیت بین دستگاه‌ها همگام نمی‌شود و با پاک‌کردن داده‌های مرورگر از بین می‌رود.</p>
        </div>
      </section>

      <section id="daily-workflow" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
        <Repeat2 size={25} className="mb-3" style={{ color: tone("violet") }} />
        <h2 className="text-2xl sm:text-3xl font-bold mb-7">کارهای روزانه و تکرارشونده، با جزئیات</h2>
        <div className="grid lg:grid-cols-2 gap-5">
          <article className="rounded-2xl p-5 sm:p-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="font-bold mb-4">برنامه امروز را بچین</h3>
            <Steps items={[
              "متن کار را بنویس و امروز، فردا، بی‌تاریخ یا تاریخ دلخواه را انتخاب کن؛ سپس «افزودن» یا Enter را بزن.",
              "کارهای قبلی را در «از قبل مانده» مرور کن و در صورت نیاز با دکمه «امروز» به امروز منتقل کن.",
              "با کلیک روی اولویت، اهمیت کار را تغییر بده. با فلش‌ها ترتیب کارها را در گروه مربوط تنظیم کن و با کلیک روی متن، آن را ویرایش کن.",
              "پس از انجام کار، تیک بزن. نوار پیشرفت فقط کارهای گروه امروز را حساب می‌کند. کارهای انجام‌شده روزهای گذشته در بخش آرشیو قابل مرورند.",
            ]} />
          </article>
          <article className="rounded-2xl p-5 sm:p-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="font-bold mb-4">یک کار را هرروزه کن</h3>
            <Steps items={[
              "برای کاری مثل «بررسی پیام‌ها»، هنگام افزودن گزینه «هر روز» را فعال کن. کار موجود هم با گزینه «هر روز» قابل تبدیل است.",
              "هر روز که صفحه کارهای روزانه را باز کنی، از الگوی تکرار یک کار برای همان روز ساخته می‌شود؛ روزهایی که صفحه را باز نکرده‌ای عقب‌گرد و پر نمی‌شوند.",
              "تیک امروز فقط همان نوبت را انجام‌شده می‌کند و تکرار روزهای بعد را متوقف نمی‌کند.",
              "برای پایان تکرار، از کنترل توقف تکرار روی کار یا بخش الگوهای تکرارشونده استفاده کن. کارهایی که قبلاً ساخته شده‌اند باقی می‌مانند.",
            ]} />
          </article>
        </div>
      </section>

      <section id="panel-tips" className="py-12 sm:py-16 scroll-mt-20" style={{ background: C.panelAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-7">ریزکارهای کاربردی پنل</h2>
          <div className="grid sm:grid-cols-2 gap-4">{TIPS.map(([Icon, title, text]) => <article key={title} className="rounded-2xl p-5 sm:p-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}><Icon size={21} className="mb-3" style={{ color: tone("jade") }} /><h3 className="font-bold mb-2">{title}</h3><p className="text-sm leading-7" style={{ color: C.muted }}>{text}</p></article>)}</div>
        </div>
      </section>
    </>
  );
}
