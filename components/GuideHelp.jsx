import { BookOpen } from "lucide-react";
import { tone } from "@/lib/theme";

export default function GuideHelp({ section, children = "راهنمای این بخش" }) {
  return <a href={`/guide#${section}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5 ops-tap" style={{ color: tone("jade") }} title="راهنما در زبانه جدید باز می‌شود"><BookOpen size={14} className="shrink-0" />{children}<span className="sr-only"> (در زبانه جدید)</span></a>;
}
