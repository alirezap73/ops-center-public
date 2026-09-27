"use client";

import { useEffect, useState } from "react";

export const STORAGE_KEY = "ops-theme";

/**
 * رنگ‌ها به CSS variable اشاره می‌کنند (تعریف در app/globals.css).
 * مزیتش: تغییر تم فقط یک attribute روی <html> است، پس نه پرش رنگ داریم
 * نه لازم است هر کامپوننت مقدار hex را خودش حساب کند.
 */
export const C = {
  bg: "var(--bg)",
  panel: "var(--panel)",
  panelAlt: "var(--panel-alt)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",
  text: "var(--text)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  onSticky: "var(--on-sticky)",
};

/** رنگ اصلی یک تُن — مثلا tone("jade") */
export const tone = (t) => `var(--${t})`;

/** نسخه‌ی کم‌رنگ همان تُن، برای پس‌زمینه‌ی بج‌ها */
export const toneSoft = (t) => `var(--${t}-soft)`;

function readTheme() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function useTheme() {
  // اسکریپت داخل <head> پیش از رنگ‌آمیزی صفحه data-theme را ست کرده،
  // پس اینجا فقط با DOM هم‌گام می‌شویم. mounted جلوی ناهمخوانی hydration را می‌گیرد.
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    // بدون این، ترنزیشن هر عنصر باعث می‌شود کل صفحه محو‌شونده رنگ عوض کند
    // و تعویض تم کند و کثیف به‌نظر برسد. یک فریم بعد برداشته می‌شود.
    root.dataset.themeSwitching = "";
    root.dataset.theme = next;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => delete root.dataset.themeSwitching);
    });

    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  return { theme, toggleTheme, mounted, C };
}
