"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme, tone, toneSoft } from "@/lib/theme";
import { Layers, Mail, CheckCircle2, Sun, Moon } from "lucide-react";
import GuideHelp from "@/components/GuideHelp";

export default function LoginPage() {
  const { theme, toggleTheme, mounted, C } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Magic-link is both sign-in and sign-up. Supabase creates a user on
        // the first request and returns the existing user on later requests.
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (authError) {
      setError("ارسال لینک ورود با خطا مواجه شد. دوباره تلاش کن.");
      return;
    }
    setSent(true);
  };

  return (
    <div
      dir="rtl"
      lang="fa"
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.bg, color: C.text }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <Layers size={17} style={{ color: tone("jade") }} />
            <span className="mono text-[11px] tracking-[0.2em]" style={{ color: C.muted }}>DADASH//</span>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
            className="p-1.5 -ml-1.5 rounded-lg ops-tap"
            style={{ color: C.muted }}
          >
            <span className="block w-4 h-4">
              {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
            </span>
            <span className="sr-only">تغییر حالت روشن/تیره</span>
          </button>
        </div>
        <h1 className="text-lg font-bold mb-2">ورود یا ساخت حساب</h1>
        <p className="text-xs leading-6 mb-6" style={{ color: C.muted }}>
          ایمیلت را وارد کن؛ اگر حسابی نداشته باشی، فضای کاری شخصی و جداگانه‌ات ساخته می‌شود.
        </p>

        {sent ? (
          <div
            className="flex items-start gap-2 text-sm p-3 rounded-lg leading-relaxed"
            style={{ background: toneSoft("jade"), color: tone("jade") }}
          >
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>
              لینک امن به {email} ارسال شد. با بازکردن لینک وارد می‌شوی و اگر کاربر جدید باشی، حسابت همان لحظه ساخته می‌شود.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: C.muted }}>
              ایمیل
            </label>
            <div className="relative mb-3">
              <Mail
                size={15}
                className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none"
                style={{ color: C.faint }}
              />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-sm pr-9 pl-3 py-2.5 rounded-lg outline-none ops-input"
              />
            </div>
            {error && (
              <p className="text-xs mb-3" style={{ color: tone("red") }} role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm py-2.5 rounded-lg font-medium ops-primary"
            >
              {loading ? "در حال ارسال..." : "ادامه با ایمیل"}
            </button>
            <p className="text-[11px] leading-5 mt-3 text-center" style={{ color: C.faint }}>
              پروژه‌ها، یادداشت‌ها و کارهای هر حساب با سیاست‌های دسترسی دیتابیس از سایر کاربران جدا هستند.
            </p>
          </form>
        )}
        <div className="mt-4 text-center"><GuideHelp section="login-help">برای ورود کمک می‌خواهی؟</GuideHelp></div>
      </div>
    </div>
  );
}
