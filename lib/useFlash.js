"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * پیام خطای موقت. قبلاً این منطق در چهار کامپوننت کپی شده بود و تایمر قبلی
 * را پاک نمی‌کرد؛ یعنی پیام دوم می‌توانست زودتر از موعد ناپدید شود (تایمرِ
 * پیام اول آن را خالی می‌کرد). اینجا هر پیام تازه تایمر قبلی را لغو می‌کند.
 */
export function useFlash(ms = 5000) {
  const [message, setMessage] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = useCallback(
    (msg) => {
      clearTimeout(timer.current);
      setMessage(msg);
      timer.current = setTimeout(() => setMessage(""), ms);
    },
    [ms]
  );

  return [message, flash];
}
