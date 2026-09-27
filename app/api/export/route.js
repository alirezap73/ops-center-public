import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * ترتیب مهم است: جدول‌های وابسته بعد از مرجع‌شان می‌آیند تا فایل SQL
 * بدون خطای foreign key قابل اجرا باشد.
 */
const TABLES = [
  "projects",
  "modules",
  "checklist_items",
  "content_items",
  "update_items",
  "ad_items",
  "project_links",
  "notes",
  "competitor_items",
  "business_ideas",
  "daily_tasks",
];

/**
 * user_id عمداً از خروجی SQL حذف می‌شود: در بازیابی روی یک حساب جدید،
 * مقدار قدیمی بی‌معنا است و default auth.uid() خودش درست پر می‌کند.
 */
const SKIP_ON_RESTORE = new Set(["user_id"]);

function sqlLiteral(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function toSql(dump) {
  const out = [
    "-- ============================================================",
    "-- OPS CENTER — بکاپ داده",
    `-- ساخته‌شده: ${dump.meta.exported_at}`,
    `-- حساب: ${dump.meta.user_email}`,
    "--",
    "-- بازیابی:",
    "--   این فایل فقط داده‌هاست؛ بازیابی باید توسط مسئول فنی انجام شود.",
    "--   ساختار سازگار جدول‌ها، حساب مقصد و وابستگی ردیف‌ها را بررسی کنید.",
    "--   ابتدا در محیط جدا آزمایش کنید و از وضعیت فعلی نسخه بگیرید.",
    "--",
    "-- ستون user_id حذف شده است؛ هویت حساب مقصد باید صریحاً تعیین شود.",
    "-- ورود به سایت، auth.uid() را در SQL Editor تنظیم نمی‌کند.",
    "-- ترتیب الگوها و نمونه‌های daily_tasks را پیش از اجرا بررسی کنید.",
    "--",
    "-- توجه: idها حفظ شده‌اند تا ارتباط بین جدول‌ها نشکند. پس این فایل فقط",
    "-- روی دیتابیس خالی اجرا می‌شود؛ روی دیتابیسی که همین ردیف‌ها را دارد",
    "-- خطای duplicate key می‌دهد (و این عمدی است — بی‌صدا ادغام نمی‌کند).",
    "-- ============================================================",
    "",
    "begin;",
    "",
  ];

  for (const table of TABLES) {
    const rows = dump.data[table] || [];
    out.push(`-- ${table} (${rows.length} ردیف)`);
    if (!rows.length) {
      out.push("");
      continue;
    }
    const cols = Object.keys(rows[0]).filter((c) => !SKIP_ON_RESTORE.has(c));
    for (const row of rows) {
      const vals = cols.map((c) => sqlLiteral(row[c])).join(", ");
      out.push(`insert into public.${table} (${cols.join(", ")}) values (${vals});`);
    }
    out.push("");
  }

  out.push("commit;");
  return out.join("\n");
}

export async function GET(request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format") === "sql" ? "sql" : "json";

  const dump = {
    meta: {
      app: "ops-center",
      exported_at: new Date().toISOString(),
      user_email: user.email,
      tables: TABLES,
    },
    data: {},
  };

  const failed = [];
  for (const table of TABLES) {
    // RLS فعال است، پس فقط ردیف‌های همین کاربر برمی‌گردد
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      failed.push({ table, message: error.message });
      dump.data[table] = [];
    } else {
      dump.data[table] = data || [];
    }
  }

  // اگر خواندنی شکست خورد، بکاپ ناقص است — نباید بی‌صدا تحویل داده شود
  if (failed.length) {
    dump.meta.incomplete = true;
    dump.meta.failed = failed;
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const total = Object.values(dump.data).reduce((n, rows) => n + rows.length, 0);

  const body = format === "sql" ? toSql(dump) : JSON.stringify(dump, null, 2);
  const ext = format === "sql" ? "sql" : "json";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":
        format === "sql" ? "application/sql; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ops-center-backup-${stamp}.${ext}"`,
      "Cache-Control": "no-store",
      "X-Row-Count": String(total),
      "X-Incomplete": failed.length ? "1" : "0",
    },
  });
}
