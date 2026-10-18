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

type PageProps = { searchParams: Promise<{ payment?: string }> };

export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const paymentStatus = ["success", "failed", "pending"].includes(params.payment || "") ? params.payment : undefined;
  if (!paymentStatus) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in?notice=signin&next=%2Fcheckout");
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <CheckoutForm paymentStatus={paymentStatus} />
      </main>
    </>
  );
}
