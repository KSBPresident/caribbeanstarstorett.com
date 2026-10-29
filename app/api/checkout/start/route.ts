import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isSupabaseConfigured } from "../../../../lib/supabase/configured";

export const runtime = "nodejs";

const allowedFees = new Set(["customer_pay", "merchant_absorb", "split"]);
const validCountry = /^[A-Z]{2}$/;
const validProductId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function checkoutError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return checkoutError("Checkout is temporarily unavailable.", 503);
  const account = await createClient();
  const { data: { user }, error: authError } = await account.auth.getUser();
  if (authError || !user?.id || !user.email) return checkoutError("Sign in before placing an order.", 401);

  const accountNumber = process.env.WIPAY_ACCOUNT_NUMBER;
  const apiKey = process.env.WIPAY_API_KEY;
  const environment = process.env.WIPAY_ENVIRONMENT;
  const feeStructure = process.env.WIPAY_FEE_STRUCTURE;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.caribbeanstarstorett.com";

  if (!accountNumber || !/^\d{6,20}$/.test(accountNumber) || !apiKey ||
      !["live", "sandbox"].includes(environment || "") || !allowedFees.has(feeStructure || "")) {
    return checkoutError("Card checkout is not configured yet. Please try again later.", 503);
  }

  let body: { country?: unknown; address?: unknown; items?: unknown; couponCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return checkoutError("Please review your delivery details and try again.", 400);
  }
  const country = text(body.country, 2).toUpperCase();
  const couponCode = text(body.couponCode, 40).toUpperCase();
  if (couponCode && !/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(couponCode)) {
    return checkoutError("Enter a valid seller coupon code.", 400);
  }
  if (user.email.length > 50) return checkoutError("Your account email is too long for WiPay checkout. Update it and try again.", 400);
  const rawAddress = body.address && typeof body.address === "object" && !Array.isArray(body.address)
    ? body.address as Record<string, unknown>
    : {};
  const address = {
    recipient: text(rawAddress.recipient, 100),
    phone: text(rawAddress.phone, 30),
    addressLine1: text(rawAddress.addressLine1, 160),
    addressLine2: text(rawAddress.addressLine2, 160),
    city: text(rawAddress.city, 100),
    parishOrCounty: text(rawAddress.parishOrCounty, 100),
    landmarks: text(rawAddress.landmarks, 240),
    postalCode: text(rawAddress.postalCode, 24),
  };
  if (!validCountry.test(country) || !address.recipient || !address.phone || !address.addressLine1 ||
      !address.city || !address.parishOrCounty || !Array.isArray(body.items) ||
      body.items.length < 1 || body.items.length > 50) {
    return checkoutError("Complete the required delivery details and check your cart.", 400);
  }

  const items: Array<{ product_id: string; quantity: number }> = [];
  for (const entry of body.items) {
    if (!entry || typeof entry !== "object") return checkoutError("A cart item is invalid.", 400);
    const candidate = entry as Record<string, unknown>;
    const productId = text(candidate.productId, 36);
    const quantity = Number(candidate.quantity);
    if (!validProductId.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return checkoutError("A cart item is invalid.", 400);
    }
    items.push({ product_id: productId, quantity });
  }
  if (new Set(items.map((item) => item.product_id)).size !== items.length) {
    return checkoutError("Your cart contains duplicate items. Refresh it and try again.", 400);
  }

  items.sort((a, b) => a.product_id.localeCompare(b.product_id));
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.rpc("create_checkout_order", {
    p_buyer_user_id: user.id,
    p_buyer_email: user.email,
    p_destination_country: country,
    p_shipping_address: address,
    p_items: items,
    p_coupon_code: couponCode || null,
  });
  const order = Array.isArray(created) ? created[0] : null;
  if (createError || !order?.order_id || !order?.payment_reference || !Number.isFinite(Number(order?.order_total))) {
    return checkoutError(couponCode
      ? "We could not reserve your items or apply that coupon. Check the code, seller eligibility, and stock, then try again."
      : "We could not reserve your items. Refresh your cart and try again.", 409);
  }

  const reference = String(order.payment_reference);
  const base = environment === "live" ? "https://tt.wipayfinancial.com" : "https://ttsb.wipayfinancial.com";
  const callback = new URL("/api/payments/wipay/callback", siteUrl);
  const paymentRequest = {
    account_number: Number(accountNumber),
    country_code: "TT",
    currency: "USD",
    environment,
    fee_structure: feeStructure,
    method: "credit_card_co",
    order_id: reference,
    origin: "CaribbeanStarStore",
    response_url: callback.toString(),
    total: Number(order.order_total),
    email: user.email,
    name: address.recipient.slice(0, 60),
    addr1: address.addressLine1.slice(0, 50),
    city: address.city.slice(0, 30),
    country,
    ...( /^\\+[1-9]\\d{1,14}$/.test(address.phone.replace(/[^+\\d]/g, "")) ? { phone: address.phone.replace(/[^+\\d]/g, "") } : {}),
    data: JSON.stringify({ orderId: order.order_id }),
  };

  try {
    const response = await fetch(`${base}/plugins/payments/request`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(Object.entries(paymentRequest).map(([key, value]) => [key, String(value)] as [string, string])),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json() as { url?: unknown; transaction_id?: unknown; message?: unknown };
    const checkoutUrl = typeof result.url === "string" ? new URL(result.url) : null;
    const expectedHost = environment === "live" ? "tt.wipayfinancial.com" : "ttsb.wipayfinancial.com";
    const transactionId = typeof result.transaction_id === "string" ? result.transaction_id : "";
    if (response.status === 400 && !transactionId) {
      await admin.rpc("release_checkout_order", { p_order_id: order.order_id, p_failed: true });
      return checkoutError("WiPay rejected the payment request. Your items have been released; review your details and try again.", 400);
    }
    if (!response.ok || !checkoutUrl || checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== expectedHost ||
        !transactionId || transactionId.length > 120) {
      await admin.rpc("mark_checkout_order_for_review", { p_order_id: order.order_id });
      return checkoutError("We could not confirm WiPay’s response. Your items are being held while the payment status is checked. Please do not retry yet.", 502);
    }

    const { error: updateError } = await admin.from("checkout_orders")
      .update({ wipay_transaction_id: result.transaction_id })
      .eq("id", order.order_id)
      .eq("status", "pending_payment");
    if (updateError) {
      await admin.rpc("mark_checkout_order_for_review", { p_order_id: order.order_id });
      return checkoutError("WiPay started a payment attempt, but we could not save its reference. Your items are held for reconciliation; please do not retry yet.", 502);
    }

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await admin.rpc("mark_checkout_order_for_review", { p_order_id: order.order_id });
    return checkoutError("We could not confirm WiPay’s response. Your items are being held while the payment status is checked. Please do not retry yet.", 502);
  }
}
