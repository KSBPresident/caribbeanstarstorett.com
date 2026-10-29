import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { CheckoutForm } from "../../components/checkout-form";
import { createClient } from "../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Secure checkout",
  description: "Review your Caribbean Star Store order and pay securely by card.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ payment?: string; order?: string }> };

const paymentReferencePattern = /^CSS[A-Za-z0-9_-]{10,13}$/;

const cardCheckoutConfigured =
  /^\\d{6,20}$/.test(process.env.WIPAY_ACCOUNT_NUMBER || "") &&
  Boolean(process.env.WIPAY_API_KEY?.trim()) &&
  process.env.WIPAY_ENVIRONMENT === "live" &&
  process.env.WIPAY_FEE_STRUCTURE === "customer_pay";

export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedStatus = ["success", "failed", "pending"].includes(params.payment || "")
    ? params.payment
    : undefined;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (requestedStatus) {
    const returnPath = `/checkout?payment=${encodeURIComponent(requestedStatus)}&order=${encodeURIComponent(params.order || "")}`;
    if (!user) redirect(`/sign-in?notice=signin&next=${encodeURIComponent(returnPath)}`);

    let paymentStatus = "unverified";
    if (params.order && paymentReferencePattern.test(params.order)) {
      const { data: order, error } = await supabase.from("checkout_orders")
        .select("status")
        .eq("payment_reference", params.order)
        .eq("buyer_user_id", user.id)
        .maybeSingle();

      if (!error && order) {
        paymentStatus = order.status === "paid"
          ? "success"
          : order.status === "payment_failed" || order.status === "expired"
            ? "failed"
            : "pending";
      }
    }

    return (
      <>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="identity-page">
          <CheckoutForm paymentStatus={paymentStatus} checkoutConfigured={cardCheckoutConfigured} />
        </main>
      </>
    );
  }

  if (!user) redirect("/sign-in?notice=signin&next=%2Fcheckout");

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <CheckoutForm checkoutConfigured={cardCheckoutConfigured} />
      </main>
    </>
  );
}
