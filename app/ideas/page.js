import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessIdeas from "@/components/BusinessIdeas";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // sort_order = رتبه (۰ بالاترین). ترتیب نهایی در کلاینت هم اعمال می‌شود.
  const { data: ideas, error } = await supabase
    .from("business_ideas")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <BusinessIdeas initialIdeas={ideas || []} loadError={error?.message || null} />;
}
