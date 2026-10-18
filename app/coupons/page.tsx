import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { CouponCode } from "../../components/coupon-code";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

export const metadata: Metadata = {
  title: "Seller coupons",
  description: "Browse active offers from Caribbean Star Store sellers.",
  alternates: { canonical: "/coupons" },
};

export default async function CouponsPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const couponsResult = supabase
    ? await supabase.from("seller_coupons")
        .select("id, organization_id, code, discount_type, discount_value, currency, expires_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [], error: null };
  const couponRows = couponsResult.data || [];
  const organizationIds = [...new Set(couponRows.map((coupon) => coupon.organization_id))];
  const sellerProfilesResult = supabase && organizationIds.length
    ? await supabase.from("organization_public_profiles")
        .select("organization_id, display_name, slug")
        .eq("is_published", true)
        .in("organization_id", organizationIds)
    : { data: [], error: null };
  const sellers = new Map((sellerProfilesResult.data || []).map((profile) => [profile.organization_id, profile]));

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">SELLER OFFERS</span>
            <h1>Coupons from our sellers</h1>
            <p>Browse current discount codes shared by participating stores.</p>
          </div>
          <Link className="identity-secondary" href="/marketplace">Shop products</Link>
        </header>
        <p className="identity-note">Online checkout is not available yet. These codes are published for shoppers to discover and will be redeemable when checkout is enabled.</p>
        {!configured ? (
          <section className="identity-panel"><h2>Offers are being prepared</h2><p>Seller coupons will appear here once account services are available.</p></section>
        ) : couponsResult.error || sellerProfilesResult.error ? (
          <section className="identity-panel" role="alert"><h2>Coupons are temporarily unavailable</h2><p>Please refresh the page later.</p></section>
        ) : couponRows.length ? (
          <section className="seller-app-list" aria-label="Active seller coupons">
            {couponRows.map((coupon) => (
              <article className="identity-panel coupon-card" key={coupon.id}>
                <span className="identity-eyebrow">{sellers.get(coupon.organization_id)
                  ? <Link href={`/businesses/${encodeURIComponent(sellers.get(coupon.organization_id)!.slug)}`}>{sellers.get(coupon.organization_id)!.display_name}</Link>
                  : "Caribbean Star Store seller"}</span>
                <h2>{coupon.discount_type === "percentage" ? `${Number(coupon.discount_value)}% off` : `${coupon.currency} ${Number(coupon.discount_value).toFixed(2)} off`}</h2>
                <p>{coupon.expires_at ? `Offer ends ${new Date(coupon.expires_at).toLocaleDateString("en", { dateStyle: "medium" })}.` : "No expiry date listed."}</p>
                <CouponCode code={coupon.code} />
              </article>
            ))}
          </section>
        ) : (
          <section className="identity-panel"><h2>No active coupons right now</h2><p>Check back for offers from participating sellers.</p><Link className="identity-submit" href="/marketplace">Browse the marketplace</Link></section>
        )}
      </main>
    </>
  );
}
