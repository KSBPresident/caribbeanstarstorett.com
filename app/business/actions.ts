"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

const organizationTypes = new Set(["business", "individual", "nonprofit", "community"]);

function makeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function createOrganization(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in?notice=setup");
  }

  const name = String(formData.get("name") || "").trim();
  const organizationType = String(formData.get("organizationType") || "business");
  const slug = makeSlug(name);

  if (
    name.length < 2 ||
    name.length > 80 ||
    slug.length < 2 ||
    !organizationTypes.has(organizationType)
  ) {
    redirect("/business?error=invalid");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?notice=signin");
  }

  const { error } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      organization_type: organizationType,
      created_by: user.id,
    });

  redirect(error ? "/business?error=create" : "/business?notice=created");
}
