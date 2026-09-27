import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OpsCenter from "@/components/OpsCenter";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    projectsRes, modulesRes, checklistRes, contentRes, updatesRes,
    adsRes, linksRes, notesRes, competitorsRes, backupRes,
  ] = await Promise.all([
    supabase.from("projects").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("modules").select("*").order("created_at", { ascending: true }),
    supabase.from("checklist_items").select("*").order("created_at", { ascending: true }),
    supabase.from("content_items").select("*").order("publish_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }),
    supabase.from("update_items").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("ad_items").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("project_links").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("notes").select("*").not("project_id", "is", null).order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("competitor_items").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("user_backups").select("backed_up_at").eq("user_id", user.id).maybeSingle(),
  ]);

  const loadError = [
    projectsRes, modulesRes, checklistRes, contentRes, updatesRes,
    adsRes, linksRes, notesRes, competitorsRes,
  ].find((result) => result.error)?.error?.message || null;

  const modulesByProject = new Map();
  for (const module of modulesRes.data || []) {
    if (!modulesByProject.has(module.project_id)) modulesByProject.set(module.project_id, []);
    modulesByProject.get(module.project_id).push(module);
  }

  const checklistByModule = new Map();
  for (const item of checklistRes.data || []) {
    if (!checklistByModule.has(item.module_id)) checklistByModule.set(item.module_id, []);
    checklistByModule.get(item.module_id).push(item);
  }

  const initialProjects = (projectsRes.data || []).map((project) => ({
    ...project,
    modules: (modulesByProject.get(project.id) || []).map((module) => ({
      ...module,
      checklist: checklistByModule.get(module.id) || [],
    })),
  }));

  const autoBackupLabel = backupRes.data?.backed_up_at
    ? new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Dubai",
      }).format(new Date(backupRes.data.backed_up_at))
    : null;

  return (
    <OpsCenter
      initialProjects={initialProjects}
      initialContentItems={contentRes.data || []}
      initialUpdateItems={updatesRes.data || []}
      initialAdItems={adsRes.data || []}
      initialProjectLinks={linksRes.data || []}
      initialNotes={notesRes.data || []}
      initialCompetitorItems={competitorsRes.data || []}
      userEmail={user.email}
      loadError={loadError}
      autoBackupLabel={autoBackupLabel}
    />
  );
}
