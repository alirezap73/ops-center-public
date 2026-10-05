"use client";
import { useState } from "react";
import SectionToolbar from "@/components/SectionToolbar";
import EmptyState from "@/components/EmptyState";

import { Sparkles, Wrench, Zap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { CHANGELOG, computeVersion, computeVersions } from "@/lib/changelog";
import { useTheme, tone, toneSoft } from "@/lib/theme";
import { faNum } from "@/lib/format";

const SIZE = {
  large: { label: "بزرگ", icon: Sparkles },
  medium: { label: "متوسط", icon: Zap },
  small: { label: "کوچک", icon: Wrench },
};

// رنگ هر ویرایش از روی شماره‌اش می‌آید تا ردیف‌های پشت‌سرهم هم‌رنگ نشوند.
// فقط همان شش تُن مجاز پروژه — رنگ ثابت hex اینجا اضافه نمی‌شود.
const TONES = ["jade", "blue", "violet", "amber", "red", "slate"];
const toneOf = (index) => TONES[index % TONES.length];

export default function Roadmap() {
  const { theme, toggleTheme, mounted, C } = useTheme();
  const version = computeVersion(CHANGELOG);
  const versions = computeVersions(CHANGELOG);
  const [search, setSearch] = useState("");
  const [size, setSize] = useState("all");
  const [limit, setLimit] = useState(16);
  // جدیدترین بالا، ولی شماره و نسخه‌ی هر ردیف همان چیزی می‌ماند که در ترتیب واقعی داشت
  const entries = CHANGELOG.map((entry, i) => ({ ...entry, no: i + 1, version: versions[i] })).reverse();
  const matching = entries.filter((entry) => (size === "all" || entry.size === size) &&
    [entry.title, entry.detail, entry.version, entry.date].some((text) => (text || "").toLowerCase().includes(search.trim().toLowerCase())));

  return (
    <div className="workspace-page" dir="rtl" lang="fa" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader theme={theme} toggleTheme={toggleTheme} mounted={mounted} />

        <div className="flex items-center gap-2 mb-1">
          <span className="mono text-xs tracking-widest" style={{ color: C.muted }}>DADASH//</span>
        </div>
        <h1 className="text-xl font-bold mb-1">رودمپ و تاریخچه ویرایش‌ها</h1>
        <p className="text-sm mb-8" style={{ color: C.muted }}>
          هر ویرایشی که روی این پلتفرم انجام بشه، اینجا ثبت می‌شه.
        </p>

        <div className="rounded-xl p-4 mb-5 flex items-center justify-between gap-3" style={{background:toneSoft("jade"),border:`1px solid ${C.border}`}}>
          <span className="text-sm">نسخه فعلی</span><span dir="ltr" className="mono text-xl font-bold" style={{color:tone("jade")}}>v{version}</span>
        </div>
        <SectionToolbar value={search} onChange={(value) => { setSearch(value); setLimit(16); }} placeholder="جستجوی نسخه یا تغییرات" count={matching.length}
          filters={[{key:"all",label:"همه تغییرات"},...Object.entries(SIZE).map(([key,meta]) => ({key,label:meta.label}))]}
          selected={size} onFilter={(value) => { setSize(value); setLimit(16); }} />
        {!matching.length && <EmptyState icon={Wrench} dashed>تغییری با این جستجو پیدا نشد.</EmptyState>}
        <div className="relative">
          <div className="absolute top-0 bottom-0 right-[7px] w-px" style={{ background: C.border }} />
          <div className="flex flex-col gap-5">
            {matching.slice(0,limit).map((entry) => {
              const meta = SIZE[entry.size] || SIZE.small;
              const Icon = meta.icon;
              const t = toneOf(entry.no - 1);
              return (
                <div key={entry.no} className="relative pr-6">
                  <span
                    className="absolute right-0 top-1 rounded-full"
                    style={{ width: 15, height: 15, background: C.bg, border: `2px solid ${tone(t)}` }}
                  />
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: toneSoft(t),
                      border: `1px solid ${C.border}`,
                      borderRight: `3px solid ${tone(t)}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className="mono tnum shrink-0 text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ color: tone(t), background: toneSoft(t), border: `1px solid ${tone(t)}` }}
                        >
                          {faNum(entry.no)}
                        </span>
                        <span className="text-sm font-medium leading-6">{entry.title}</span>
                      </div>
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: tone(t), background: toneSoft(t) }}
                      >
                        <Icon size={11} />
                        {meta.label}
                      </span>
                    </div>
                    {entry.detail && (
                      <p className="text-xs leading-relaxed mb-2" style={{ color: C.muted }}>{entry.detail}</p>
                    )}
                    <div className="flex items-center gap-2 mono text-xs" style={{ color: C.faint }}>
                      <span className="tnum" style={{ color: tone(t) }}>v{entry.version}</span>
                      <span aria-hidden>·</span>
                      <span className="tnum">{entry.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {matching.length > limit && <button type="button" onClick={() => setLimit((n) => n + 16)}
          className="ops-tap w-full rounded-xl p-3 mt-5 text-sm" style={{background:C.panelAlt,color:tone("blue")}}>نمایش تغییرات قدیمی‌تر · {faNum(matching.length - limit)} مورد دیگر</button>}

        <div className="mt-10 text-center">
          <div className="inline-block px-4 py-2 rounded-full mono text-sm mb-3" style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: tone("jade") }}>
            نسخه فعلی: v{version}
          </div>
          <p className="text-xs" style={{ color: C.faint }}>ساخته شده با ❤️</p>
        </div>
      </div>
    </div>
  );
}
