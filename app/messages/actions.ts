"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { signInUrl } from "../../lib/auth/return-path";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function startSellerConversation(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const organizationId = String(formData.get("organizationId") || "");
  const productId = String(formData.get("productId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!uuidPattern.test(organizationId) || (productId && !uuidPattern.test(productId)) || body.length < 1 || body.length > 4000) {
    redirect("/marketplace?error=message");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/marketplace"));
  if (productId) {
    const { data: listing, error: listingError } = await supabase.from("inventory_items")
      .select("id, organization_id")
      .eq("id", productId)
      .eq("organization_id", organizationId)
      .eq("status", "published")
      .maybeSingle();
    if (listingError || !listing) redirect("/marketplace?error=message");
  } else {
    const { data: store, error: storeError } = await supabase.from("organization_public_profiles")
      .select("organization_id")
      .eq("organization_id", organizationId)
      .eq("is_published", true)
      .maybeSingle();
    if (storeError || !store) redirect("/businesses?error=message");
  }

  const baseConversationQuery = supabase.from("seller_conversations")
    .select("id")
    .eq("buyer_user_id", user.id)
    .eq("seller_organization_id", organizationId);
  const conversationQuery = productId
    ? baseConversationQuery.eq("inventory_item_id", productId)
    : baseConversationQuery.is("inventory_item_id", null);
  const { data: existingConversation, error: lookupError } = await conversationQuery
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError) redirect("/marketplace?error=message");

  let conversationId = existingConversation?.id;
  if (!conversationId) {
    const { data: conversation, error } = await supabase.from("seller_conversations")
      .insert({ buyer_user_id: user.id, seller_organization_id: organizationId, inventory_item_id: productId || null })
      .select("id").single();
    if (error || !conversation) redirect("/marketplace?error=message");
    conversationId = conversation.id;
  }

  const { error: messageError } = await supabase.from("seller_messages")
    .insert({ conversation_id: conversationId, sender_user_id: user.id, body });
  redirect(messageError ? "/messages?error=send" : "/messages?notice=sent");
}

export async function replyToSellerConversation(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const conversationId = String(formData.get("conversationId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!uuidPattern.test(conversationId) || body.length < 1 || body.length > 4000) redirect("/messages?error=invalid");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/messages"));
  const { error } = await supabase.from("seller_messages")
    .insert({ conversation_id: conversationId, sender_user_id: user.id, body });
  redirect(error ? "/messages?error=send" : "/messages?notice=sent");
}
