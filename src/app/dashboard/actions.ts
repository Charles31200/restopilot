"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRestaurantId } from "@/lib/supabase/restaurant";

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const restaurantName = String(formData.get("restaurant_name") ?? "").trim();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ first_name: firstName || null, last_name: lastName || null })
    .eq("id", user.id);

  if (profileError) throw new Error(profileError.message);

  const restaurantId = await getRestaurantId(supabase, user.id);
  if (restaurantId && restaurantName) {
    const { error: restaurantError } = await supabase
      .from("restaurants")
      .update({ name: restaurantName })
      .eq("id", restaurantId);

    if (restaurantError) throw new Error(restaurantError.message);
  }

  revalidatePath("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/connexion?toast=logout");
}
