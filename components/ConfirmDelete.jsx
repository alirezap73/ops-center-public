"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Check } from "lucide-react";
import { tone, toneSoft } from "@/lib/theme";

/**
 * دکمه‌ی حذف دومرحله‌ای — کلیک اول فقط «مسلح» می‌کند، کلیک دوم واقعاً حذف می‌کند.
 * عمداً به‌جای window.confirm است: هم با ظاهر و RTL برنامه هم‌خوان است،
 * هم اگر کاربر رهایش کند خودش بعد از ۳ ثانیه به حالت عادی برمی‌گردد.
 */
export default function ConfirmDelete({
  onConfirm,
  size = 13,
  className = "p-1.5",
  title = "حذف",
  children = null,
  /** روی کارت‌های رنگی (آپدیت/تبلیغ) که جوهر ثابت --on-sticky دارند */
  onSticky = false,
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    onConfirm();
  };

  return (
    <button
      onClick={handleClick}
      onBlur={() => {
        clearTimeout(timer.current);
        setArmed(false);
      }}
      title={armed ? "برای حذف دوباره کلیک کن" : title}
      className={`shrink-0 rounded-lg flex items-center gap-1 ${
        onSticky && !armed ? "opacity-45 hover:opacity-100 ops-tap" : "ops-danger"
      } ${className}`}
      style={armed ? { color: tone("red"), background: toneSoft("red") } : undefined}
    >
      {armed ? <Check size={size} /> : <Trash2 size={size} />}
      {armed ? <span className="text-xs">مطمئنی؟</span> : children}
      <span className="sr-only">{armed ? "تأیید حذف" : title}</span>
    </button>
  );
}
