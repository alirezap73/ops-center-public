import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Notes from "@/components/Notes";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // یادداشت‌های روزانه مستقل‌اند؛ یادداشت پروژه فقط داخل همان پروژه خوانده می‌شود.
  const notesRes = await supabase
      .from("notes")
      .select("*")
      .is("project_id", null)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

  return (
    <Notes
      initialNotes={notesRes.data || []}
      loadError={notesRes.error?.message || null}
    />
  );
}
