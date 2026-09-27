"use client";

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
  // جدیدترین بالا، ولی شماره و نسخه‌ی هر ردیف همان چیزی می‌ماند که در ترتیب واقعی داشت
  const entries = CHANGELOG.map((entry, i) => ({ ...entry, no: i + 1, version: versions[i] })).reverse();

  return (
    <div dir="rtl" lang="fa" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader theme={theme} toggleTheme={toggleTheme} mounted={mounted} />

        <div className="flex items-center gap-2 mb-1">
          <span className="mono text-xs tracking-widest" style={{ color: C.muted }}>DADASH//</span>
        </div>
        <h1 className="text-xl font-bold mb-1">رودمپ و تاریخچه ویرایش‌ها</h1>
        <p className="text-sm mb-8" style={{ color: C.muted }}>
          هر ویرایشی که روی این پلتفرم انجام بشه، اینجا ثبت می‌شه.
        </p>

        <div className="relative">
          <div className="absolute top-0 bottom-0 right-[7px] w-px" style={{ background: C.border }} />
          <div className="flex flex-col gap-5">
            {entries.map((entry) => {
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
