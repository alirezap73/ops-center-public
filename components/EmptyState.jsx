"use client";

import { Inbox } from "lucide-react";
import { C } from "@/lib/theme";

/**
 * حالت خالی یکسان برای همه‌ی نماها. `dashed` برای حالت‌های خالیِ سطح صفحه است
 * (که قبلاً در سه صفحه‌ی مستقل جدا نوشته شده بود) و بدون آن برای داخل کارت‌ها.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  children,
  compact = false,
  dashed = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center rounded-xl ${
        compact ? "py-6 px-3" : "py-10 px-4"
      }`}
      style={{ color: C.faint, border: dashed ? `1px dashed ${C.border}` : undefined }}
    >
      <Icon size={compact ? 18 : 24} strokeWidth={1.5} />
      <p className="text-xs leading-relaxed max-w-[30ch]">{children}</p>
    </div>
  );
}
