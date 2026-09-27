import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Roadmap from "@/components/Roadmap";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <Roadmap />;
}
