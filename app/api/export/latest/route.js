import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_backups")
    .select("snapshot, backed_up_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "خواندن بکاپ خودکار ناموفق بود." }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "هنوز بکاپ خودکاری ساخته نشده است." }, { status: 404 });
  }

  const stamp = new Date(data.backed_up_at).toISOString().slice(0, 19).replace(/[:T]/g, "-");

  return new Response(JSON.stringify(data.snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dadash-latest-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
      "X-Backup-At": data.backed_up_at,
    },
  });
}
