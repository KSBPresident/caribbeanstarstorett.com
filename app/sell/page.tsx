import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { submitSellerApplication } from "./actions";

type SearchParams = Promise<{ error?: string; notice?: string }>;

const statusCopy: Record<string, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  approved: "Approved",
  declined: "Needs an update",
};

export default async function SellPage({ searchParams }: { searchParams: SearchParams }) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  const { data } = await supabase
    .from("seller_applications")
    .select("id, seller_name, category_key, status, created_at")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const message = params.notice === "submitted"
    ? "Your seller application has been submitted."
    : params.error === "invalid"
      ? "Please check each field. The website must be a valid HTTPS address and the description must be at least 30 characters."
      : params.error === "submit"
        ? "We couldn’t submit your application. Please try again."
        : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-page seller-onboarding">
        <div className="seller-intro">
          <div>
            <span className="identity-eyebrow">SELL ON CARIBBEAN STAR STORE</span>
            <h1>Bring your business to the Caribbean marketplace.</h1>
            <p>Tell us what you want to offer. Your application stays connected to your account while seller tools are prepared.</p>
          </div>
          <div className="seller-steps" aria-label="Seller onboarding steps">
            <div><span>1</span><b>Apply</b><small>Share your details</small></div>
            <div><span>2</span><b>Review</b><small>We check your request</small></div>
            <div><span>3</span><b>Set up</b><small>Prepare your storefront</small></div>
          </div>
        </div>

        {message && <p className={params.error ? "identity-message identity-error" : "identity-message"} role={params.error ? "alert" : "status"}>{message}</p>}

        <div className="seller-layout">
          <section className="identity-panel">
            <span className="identity-eyebrow">SELLER APPLICATION</span>
            <h2>Tell us about your store</h2>
            <p>Use accurate contact details. Submitting an application does not publish products or charge you.</p>
            <form action={submitSellerApplication} className="identity-form seller-form">
              <label>Store or seller name<input name="sellerName" autoComplete="organization" minLength={2} maxLength={100} required /></label>
              <div className="seller-form-row">
                <label>Seller type<select name="sellerType" defaultValue="individual" required><option value="individual">Individual seller</option><option value="business">Registered business</option><option value="nonprofit">Nonprofit</option><option value="community">Community group</option></select></label>
                <label>What do you offer?<select name="category" defaultValue="products" required><option value="products">Products</option><option value="services">Services</option><option value="businesses">Business listing</option><option value="jobs">Jobs</option><option value="real-estate">Real estate</option><option value="other">Other</option></select></label>
              </div>
              <label>Contact email<input name="email" type="email" autoComplete="email" defaultValue={user.email || ""} maxLength={254} required /></label>
              <div className="seller-form-row">
                <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
                <label>Website (optional)<input name="website" type="url" placeholder="https://example.com" maxLength={300} /></label>
              </div>
              <label>What would you like to sell or offer?<textarea name="description" minLength={30} maxLength={2000} rows={5} placeholder="Describe your products or services, where you operate, and what customers can expect." required /></label>
              <button className="identity-submit" type="submit">Submit seller application</button>
            </form>
          </section>

          <aside className="seller-side">
            <section className="identity-panel">
              <span className="identity-eyebrow">YOUR APPLICATIONS</span>
              <h2>Application status</h2>
              {data?.length ? (
                <div className="seller-app-list">
                  {data.map((application) => (
                    <article className="seller-app-card" key={application.id}>
                      <div className="seller-app-heading"><strong>{application.seller_name}</strong><span className={`seller-status seller-status-${application.status}`}>{statusCopy[application.status] || "Submitted"}</span></div>
                      <p>{application.category_key.replaceAll("-", " ")} · Submitted {new Date(application.created_at).toLocaleDateString("en-TT", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="organization-empty">Your seller applications will appear here.</p>
              )}
            </section>
            <section className="seller-note"><strong>What happens next?</strong><p>We’ll review your details and contact you about next steps. Product publishing and payments will be enabled when the store connection is ready.</p><Link href="/business">View business workspaces →</Link></section>
          </aside>
        </div>
      </main>
    </>
  );
}
