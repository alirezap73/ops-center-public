import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DailyTasks from "@/components/DailyTasks";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // گروه‌بندی و ترتیب نهایی در کلاینت انجام می‌شود (وابسته به «امروز» در منطقه‌ی زمانی کاربر)
  const { data: tasks, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <DailyTasks initialTasks={tasks || []} loadError={error?.message || null} />;
}
