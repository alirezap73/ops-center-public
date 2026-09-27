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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
