import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { PrivacyStatusNote } from "../../components/privacy-status-note";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { submitSellerApplication } from "./actions";
import { signInUrl } from "../../lib/auth/return-path";

export const metadata: Metadata = {
  title: "Sell,
  description:
    "Open your Caribbean Star Store presence, showcase your brand and products, and reach shoppers across the Caribbean.",
  alternates: { canonical: "/sell" },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store",
    title: "Sell on Caribbean Star Store",
    description:
      "Showcase your brand and products and reach shoppers across the Caribbean with Caribbean Star Store.",
  
    images: [{ url: "/opengraph-image", alt: "Caribbean Star Store — Connecting the community across the Caribbean" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sell on Caribbean Star Store",
    description:
      "Showcase your brand and products and reach shoppers across the Caribbean with Caribbean Star Store.",
  
    images: ["/twitter-image"],
  },
};

type SearchParams = Promise<{ error?: string; notice?: string }>;

const statusCopy: Record<string, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  approved: "Approved",
  declined: "Needs an update",
};

export default async function SellPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const accountServicesReady = isSupabaseConfigured();
  const supabase = accountServicesReady ? await createClient() : null;
  const auth = supabase ? await supabase.auth.getUser() : null;
  const user = auth?.data.user ?? null;
  if (!user) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="identity-page seller-onboarding">
          <div className="seller-intro">
            <div>
              <span className="identity-eyebrow">MAKE MONEY WITH US</span>
              <h1>Sell and advertise on Caribbean Star Store.</h1>
              <p>Introduce your business and products to shoppers across the Caribbean marketplace.</p>
              {!accountServicesReady && <p className="identity-message" role="status">Seller information is available now. Account registration and applications will open after account services are configured.</p>}
              <div className="directory-hero-actions">
                <Link className="identity-submit" href="/sign-up?next=%2Fsell">Start your seller application</Link>
                <Link className="directory-secondary" href={signInUrl("/sell")}>Already have an account? Sign in</Link>
              </div>
            </div>
            <div className="seller-steps" aria-label="Seller onboarding steps">
              <div><span>1</span><b>Apply</b><small>Share your details</small></div>
              <div><span>2</span><b>Review</b><small>We check your request</small></div>
              <div><span>3</span><b>Set up</b><small>Prepare your storefront</small></div>
            </div>
          </div>
          <div className="seller-layout">
            <section className="identity-panel">
              <span className="identity-eyebrow">GROW YOUR BUSINESS</span>
              <h2>Reach more clients</h2>
              <p>Introduce your business and products to shoppers using Caribbean Star Store.</p>
              <h2>Focus on your business</h2>
              <p>Sellers manage their products, packing, shipping, customer service and returns.</p>
              <h2>Get your products seen</h2>
              <p>Relevant product titles and keywords help shoppers find your listings. Advertising can help increase your reach.</p>
            </section>
            <aside className="seller-side">
              <section className="identity-panel">
                <span className="identity-eyebrow">YOUR BRAND</span>
                <h2>Build a store customers remember</h2>
                <p>Present your business in one place, customize your store page and logo, and organize your inventory for shoppers.</p>
                <h2>Promote individual products</h2>
                <p>Clear product information and useful keywords help shoppers discover your listings in search.</p>
                <p className="catalog-meta">{accountServicesReady ? "Seller registration and store access are subject to CSS review and platform availability." : "Account registration and seller applications will open after account services are configured."}</p>
                <Link className="identity-submit" href="/sign-up?next=%2Fsell">Create an account to apply</Link>
              </section>
              <section className="seller-note"><strong>How it works</strong><p>After approval, your account gets a private workspace to manage your public profile and listings. Product publishing and payments will be enabled when the store connection is ready.</p><Link href="/help#sell">Read seller help →</Link></section>
            </aside>
          </div>
        </main>
      </>
    );
  }

  if (!supabase) redirect("/sign-in?notice=setup");

  const { data: applications, error: applicationsError } = await supabase
    .from("seller_applications")
    .select("id, seller_name, category_key, status, created_at, organization_id")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const organizationIds = [...new Set((applications || [])
    .map((application) => application.organization_id)
    .filter((id): id is string => Boolean(id)))];
  const workspaceResult = organizationIds.length
    ? await supabase.from("organizations").select("id, slug").in("id", organizationIds)
    : { data: [], error: null };
  const workspaceLoadError = Boolean(workspaceResult.error);
  const workspaceSlugs = new Map(
    (workspaceResult.data || []).map((workspace) => [workspace.id, workspace.slug]),
  );

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
      <main id="main-content" tabIndex={-1} className="identity-page seller-onboarding">
        <div className="seller-intro">
          <div>
            <span className="identity-eyebrow">SELL ON CARIBBEAN STAR STORE</span>
            <h1>Bring your business to the Caribbean marketplace.</h1>
            <p>Tell us what you want to offer. After approval, your account gets a private workspace to manage its public profile and listings.</p>
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
            <PrivacyStatusNote submittedData="This form sends your store details, contact information, and description to account services for seller review." />
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
              {applicationsError ? (
                <p className="organization-empty identity-error" role="alert">Your seller applications could not be loaded. Refresh the page to try again.</p>
              ) : applications?.length ? (
                <div className="seller-app-list">
                  {applications.map((application) => {
                    const workspaceSlug = application.organization_id
                      ? workspaceSlugs.get(application.organization_id)
                      : null;

                    return (
                      <article className="seller-app-card" key={application.id}>
                        <div className="seller-app-heading"><strong>{application.seller_name}</strong><span className={`seller-status seller-status-${application.status}`}>{statusCopy[application.status] || "Submitted"}</span></div>
                        <p>{application.category_key.replaceAll("-", " ")} · Submitted {new Date(application.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</p>
                        {workspaceSlug && (
                          <>
                            <p className="catalog-meta">Your private workspace is ready. It stays private until you publish a business profile.</p>
                            <Link className="directory-card-link" href={`/business/${workspaceSlug}`}>Open your workspace →</Link>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="organization-empty">Your seller applications will appear here.</p>
              )}
              {workspaceLoadError && <p className="organization-empty identity-error" role="alert">Your private workspace links could not be loaded. Refresh the page to try again.</p>}
            </section>
            <section className="seller-note"><strong>What happens next?</strong><p>We’ll review your details and contact you about next steps. If approved, you can set up a private workspace, then publish your business profile when you’re ready. Product publishing and payments will be enabled when the store connection is ready.</p><Link href="/business">View business workspaces →</Link></section>
          </aside>
        </div>
      </main>
    </>
  );
}
