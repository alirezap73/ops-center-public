"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, NotebookPen, Lightbulb, ListTodo } from "lucide-react";
import { C, tone, toneSoft } from "@/lib/theme";

const items = [
  ["/dashboard", "پروژه‌ها", LayoutGrid],
  ["/tasks", "کارهای روزانه", ListTodo],
  ["/notes", "یادداشت‌ها", NotebookPen],
  ["/ideas", "ایده‌ها", Lightbulb],
];

export default function WorkspaceNav({ compact = false }) {
  const pathname = usePathname();
  return <nav aria-label="ابزارهای اصلی" className={compact ? "grid grid-cols-2 gap-1" : "flex flex-wrap gap-1"}>
    {items.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
      className="ops-tap flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
      style={{ background: pathname === href ? toneSoft("jade") : C.panelAlt, color: pathname === href ? tone("jade") : C.muted }}>
      <Icon size={15} className="shrink-0" />{label}
    </Link>)}
  </nav>;
}
