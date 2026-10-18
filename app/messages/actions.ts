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
  const offerAmountRaw = String(formData.get("offerAmount") || "").trim();
  const offerNote = String(formData.get("offerNote") || "").trim();
  const isOffer = offerAmountRaw.length > 0;
  if (!uuidPattern.test(organizationId) || (productId && !uuidPattern.test(productId))) {
    redirect("/marketplace?error=message");
  }

  const supabase = await createClient();
  let listing: { id: string; organization_id: string; slug: string; name: string; currency: string } | null = null;
  let targetPath = "/marketplace";
  if (productId) {
    const { data, error } = await supabase.from("inventory_items")
      .select("id, organization_id, slug, name, currency")
      .eq("id", productId)
      .eq("organization_id", organizationId)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) redirect("/marketplace?error=message");
    listing = data;
    targetPath = `/product/${encodeURIComponent(data.slug)}`;
  } else {
    const { data: store, error: storeError } = await supabase.from("organization_public_profiles")
      .select("organization_id, slug")
      .eq("organization_id", organizationId)
      .eq("is_published", true)
      .maybeSingle();
    if (storeError || !store) redirect("/businesses?error=message");
    targetPath = `/businesses/${encodeURIComponent(store.slug)}`;
  }

  let messageBody = body;
  if (isOffer) {
    const validAmount = /^\d{1,9}(?:\.\d{1,2})?$/.test(offerAmountRaw);
    const amount = Number(offerAmountRaw);
    const currency = listing?.currency.toUpperCase() || "";
    if (!listing || !validAmount || !Number.isFinite(amount) || amount <= 0 || offerNote.length > 1000 || !/^[A-Z]{3}$/.test(currency)) {
      redirect(`${targetPath}?error=offer`);
    }
    messageBody = `BUYER OFFER: ${amount.toFixed(2)} ${currency} for ${listing.name}.${offerNote ? ` Note: ${offerNote}` : ""} The seller can accept, decline, or reply with a counteroffer. This message does not place an order or payment.`;
  } else if (body.length < 1 || body.length > 4000) {
    redirect(`${targetPath}?error=message`);
  }
  if (messageBody.length > 4000) redirect(`${targetPath}?error=offer`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl(targetPath));

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
  if (lookupError) redirect(`${targetPath}?error=message`);

  let conversationId = existingConversation?.id;
  if (!conversationId) {
    const { data: conversation, error } = await supabase.from("seller_conversations")
      .insert({ buyer_user_id: user.id, seller_organization_id: organizationId, inventory_item_id: productId || null })
      .select("id").single();
    if (error || !conversation) redirect(`${targetPath}?error=message`);
    conversationId = conversation.id;
  }

  const { error: messageError } = await supabase.from("seller_messages")
    .insert({ conversation_id: conversationId, sender_user_id: user.id, body: messageBody });
  const notice = isOffer ? "offer-sent" : "sent";
  redirect(messageError ? "/messages?error=send" : `/messages?notice=${notice}`);
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