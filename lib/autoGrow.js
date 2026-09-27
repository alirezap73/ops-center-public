/**
 * ارتفاع یک textarea را با محتوایش هم‌اندازه می‌کند.
 * هم به‌عنوان ref callback کار می‌کند (autoGrow روی مونت)، هم داخل onInput/useEffect.
 */
export function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}
