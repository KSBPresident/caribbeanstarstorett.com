import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { cancelPurchaseRequest, createPurchaseRequest } from "./actions";
import { signInUrl } from "../../lib/auth/return-path";

type PageProps = { searchParams: Promise<{ error?: string; notice?: string; category?: string }> };

const categoryLabels: Record<string, string> = {
  products: "Products",
  services: "Services",
  businesses: "Businesses",
  jobs: "Jobs",
  "real-estate": "Real Estate",
  "multi-item": "Build-A-Buy bundle",
};
const categoryKeys = new Set(Object.keys(categoryLabels));

export default async function BuildABuyPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: { user } } = await supabase.auth.getUser();
  const requestedCategory = params.category && categoryKeys.has(params.category) ? params.category : null;
  const nextPath = requestedCategory ? `/build-a-buy?category=${encodeURIComponent(requestedCategory)}` : "/build-a-buy";
  if (!user) redirect(signInUrl(nextPath));

  const selectedCategory = params.category && categoryKeys.has(params.category)
    ? params.category
    : "multi-item";

  const { data: requests } = await supabase
    .from("purchase_requests")
    .select("id,title,details,category_key,budget_amount,currency,status,created_at")
    .eq("requester_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const message = params.notice === "created"
    ? "Your request has been saved to your account."
    : params.notice === "cancelled"
      ? "Your open request was cancelled."
      : params.error === "invalid"
        ? "Check the request title, details, category, and budget."
        : params.error === "cancel"
          ? "This request could not be cancelled. It may already be closed."
          : params.error === "save"
            ? "We couldn’t save your request. Please try again."
            : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">CARIBBEAN STAR STORE · BUILD-A-BUY</span>
            <h1>Tell us what you need</h1>
            <p>Describe a product, service, or combination and save the request to your account.</p>
          </div>
        </header>
        {message && <p className={params.error ? "identity-message identity-error" : "identity-message"} role={params.error ? "alert" : "status"}>{message}</p>}
        <div className="build-request-grid">
          <section className="identity-panel">
            <h2>Create a request</h2>
            <p>Requests are private to your account. Seller matching and fulfillment are not connected yet.</p>
            <form action={createPurchaseRequest} className="identity-form">
              <label>What are you looking for?<input name="title" minLength={4} maxLength={100} placeholder="For example, catering for a family event" required /></label>
              <label>Section<select name="category" defaultValue={selectedCategory}><option value="products">Products</option><option value="services">Services</option><option value="businesses">Businesses</option><option value="jobs">Jobs</option><option value="real-estate">Real Estate</option><option value="multi-item">Build-A-Buy bundle</option></select></label>
              <label>Tell us more<textarea name="details" minLength={20} maxLength={3000} rows={6} placeholder="Add details, preferences, timing, or services you need." required /></label>
              <label>Budget in TTD (optional)<input name="budget" type="number" min="0.01" max="1000000000" step="0.01" inputMode="decimal" /></label>
              <button className="identity-submit" type="submit">Save request</button>
            </form>
            <p className="identity-note">Your saved request is visible only to your account until the matching workflow is connected.</p>
          </section>
          <section className="identity-panel">
            <div className="workspace-section-heading"><div><span className="identity-eyebrow">YOUR ACTIVITY</span><h2>Your requests</h2></div><span className="workspace-count">{requests?.length || 0} saved</span></div>
            {requests?.length ? <div className="purchase-request-list">{requests.map((request) => (
              <article className="purchase-request-card" key={request.id}>
                <div className="purchase-request-top"><span className={`request-status request-status-${request.status}`}>{request.status}</span><span className="catalog-meta">{new Date(request.created_at).toLocaleDateString("en-TT", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                <h3>{request.title}</h3><p className="request-category">{categoryLabels[request.category_key] || "Marketplace request"}</p><p>{request.details}</p>
                {request.budget_amount !== null && <strong className="request-budget">{new Intl.NumberFormat("en-TT", { style: "currency", currency: request.currency || "TTD" }).format(Number(request.budget_amount))}</strong>}
                {request.status === "open" && <form action={cancelPurchaseRequest} className="request-cancel-form"><input type="hidden" name="requestId" value={request.id} /><button className="workspace-remove" type="submit">Cancel request</button></form>}
              </article>
            ))}</div> : <p className="organization-empty">You haven’t saved a request yet.</p>}
            <p className="identity-note"><Link className="identity-inline-link" href="/marketplace">Browse available products →</Link></p>
          </section>
        </div>
      </main>
    </>
  );
}
