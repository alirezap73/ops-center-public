/**
 * فقط http/https را به لینک قابل‌کلیک تبدیل می‌کنیم.
 * هدف: جلوگیری از ورود javascript: و data: به href — حتی وقتی داده مال خود کاربر است،
 * چون یک لینک اشتباه در یک صفحه‌ی احرازهویت‌شده می‌تواند نشست را در معرض خطر بگذارد.
 * اگر ورودی معتبر نباشد null برمی‌گردد و باید به‌عنوان متن ساده نمایش داده شود.
 */
export function safeHref(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/** دامنه‌ی لینک برای نمایش کوتاه */
export function hostOf(href) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}
