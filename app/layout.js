import "./globals.css";

export const metadata = {
  title: "داداش | مدیریت پروژه‌ها",
  description: "پیگیری، مستندسازی و بررسی ماژولار پروژه‌ها",
};

/**
 * پیش از رنگ‌آمیزی صفحه اجرا می‌شود تا اگر کاربر حالت روشن را انتخاب کرده،
 * یک فریم پس‌زمینه‌ی تیره فلش نزند.
 */
const noFlashTheme = `
(function () {
  try {
    var t = localStorage.getItem('ops-theme');
    document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        <link rel="preload" href="/fonts/Vazirmatn-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
