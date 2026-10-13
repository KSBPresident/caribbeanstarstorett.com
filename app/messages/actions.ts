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
  const { data: conversation, error } = await supabase.from("seller_conversations")
    .insert({ buyer_user_id: user.id, seller_organization_id: organizationId, inventory_item_id: productId || null })
    .select("id").single();
  if (error || !conversation) redirect("/marketplace?error=message");

  const { error: messageError } = await supabase.from("seller_messages")
    .insert({ conversation_id: conversation.id, sender_user_id: user.id, body });
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
