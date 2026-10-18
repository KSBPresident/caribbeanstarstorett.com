import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export const runtime = "nodejs";

function redirectStatus(request: NextRequest, status: "success" | "failed" | "pending") {
  const target = new URL("/checkout", request.url);
  target.searchParams.set("payment", status);
  return NextResponse.redirect(target, 303);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const reference = params.get("order_id") || "";
  const transactionId = params.get("transaction_id") || "";
  const status = (params.get("status") || "").toLowerCase();
  if (!/^CSS[A-Za-z0-9_-]{10,13}$/.test(reference) || !transactionId || transactionId.length > 120) {
    return redirectStatus(request, "failed");
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin.from("checkout_orders")
    .select("id, total, status, wipay_transaction_id, payment_reference")
    .eq("payment_reference", reference)
    .maybeSingle();
  if (error || !order || order.wipay_transaction_id !== transactionId) {
    return redirectStatus(request, "failed");
  }

  if (status === "success") {
    const apiKey = process.env.WIPAY_API_KEY;
    const suppliedHash = params.get("hash") || "";
    if (!apiKey || !/^[a-f0-9]{32}$/i.test(suppliedHash)) return redirectStatus(request, "pending");
    const expectedHash = createHash("md5")
      .update(transactionId + Number(order.total).toFixed(2) + apiKey, "utf8")
      .digest();
    const supplied = Buffer.from(suppliedHash, "hex");
    if (supplied.length !== expectedHash.length || !timingSafeEqual(supplied, expectedHash)) {
      return redirectStatus(request, "pending");
    }
    const { data: completed, error: completeError } = await admin.rpc("complete_checkout_order", {
      p_order_id: order.id,
      p_transaction_id: transactionId,
      p_verified_total: Number(order.total),
    });
    return !completeError && completed === true
      ? redirectStatus(request, "success")
      : redirectStatus(request, order.status === "paid" ? "success" : "pending");
  }

  if ((status === "failed" || status === "error") && order.status === "pending_payment") {
    await admin.rpc("release_checkout_order", { p_order_id: order.id, p_failed: true });
    return redirectStatus(request, "failed");
  }
  return redirectStatus(request, status === "pending" ? "pending" : "failed");
}
