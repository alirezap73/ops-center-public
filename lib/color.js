/**
 * رنگ accent هر پروژه در دیتابیس به‌صورت hex ذخیره می‌شود (داده است، نه استایل ثابت).
 * برای استفاده به‌عنوان پس‌زمینه یا حاشیه باید کم‌رنگ شود تا در هر دو تم خوانا بماند.
 */
export function withAlpha(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return "transparent";
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
