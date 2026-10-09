"use client";

import Link from "next/link";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { C } from "@/lib/theme";
import SitTimer from "@/components/SitTimer";
import GuideHelp from "@/components/GuideHelp";
import WorkspaceNav from "@/components/WorkspaceNav";
import IranClock from "@/components/IranClock";
import { usePathname } from "next/navigation";

/**
 * سربرگ مشترک صفحه‌های مستقل (رودمپ، یادداشت‌ها، ایده‌ها، کارهای روزانه):
 * لینک بازگشت + کلید تم. قبلاً در هر چهار فایل عیناً تکرار شده بود.
 */
export default function PageHeader({ theme, toggleTheme, mounted }) {
  const pathname = usePathname();
  const guideSection = { "/tasks": "daily-workflow", "/notes": "tool-notes", "/ideas": "tool-ideas", "/roadmap": "tool-roadmap" }[pathname] || "find-your-way";
  return (
    <div className="mb-6 space-y-3">
    <div className="flex flex-wrap gap-2 items-center justify-between">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 -mr-2 rounded-lg ops-tap"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} />
        بازگشت به مرکز عملیات
      </Link>
      <div className="flex items-center gap-1">
        <GuideHelp section={guideSection}>راهنما</GuideHelp>
        {/* همان شمارنده‌ی سایدبار (وضعیت مشترک در localStorage)، فقط فشرده */}
        <SitTimer compact />
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
          className="p-2 rounded-lg ops-tap"
          style={{ color: C.muted }}
        >
          <span className="block w-4 h-4">
            {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
          </span>
          <span className="sr-only">تغییر حالت روشن/تیره</span>
        </button>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <WorkspaceNav />
      <IranClock />
    </div>
    </div>
  );
}
