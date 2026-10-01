import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Privacy Information",
  description: "Interim information about data submitted through Caribbean Star Store.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <section className="identity-panel" aria-labelledby="privacy-title">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · PRIVACY</span>
          <h1 id="privacy-title">Privacy information</h1>
          <p><strong>Interim notice.</strong> The complete privacy notice is still being prepared. This summary describes the information requested by features currently available on the site.</p>

          <h2>Information you may submit</h2>
          <ul>
            <li>Account registration asks for your display name, email address and password. Profile settings may include a display name.</li>
            <li>A seller application asks for a store or seller name, seller type, category, contact email and description. Phone and website details are optional.</li>
            <li>A Build-A-Buy request asks for information about the item or service you need, such as its title, category, details (which may include preferences or timing), and optional budget.</li>
            <li>Organization owners may add business profile and listing details, including public contact information, and choose whether a profile or listing is published.</li>
          </ul>

          <h2>How the information is used</h2>
          <p>The site uses submitted information to provide account access, save account activity, review seller applications, operate organization workspaces, and display business profiles or opportunity listings when their owners publish them.</p>

          <h2>Information visible to visitors</h2>
          <p>Published business profiles and opportunity listings are intended to be public. Only include contact details in published content that you want visitors to see. Use forms only for information they request.</p>

          <h2>Orders and payment details</h2>
          <p>Checkout and payment processing are not currently available through this site. Do not send payment card details through a site form or by email.</p>

          <h2>Questions or requests</h2>
          <p>For a privacy question or a request to correct or remove information, email <a href="mailto:caribbeanstarstore@gmail.com">caribbeanstarstore@gmail.com</a>. The completed notice will explain the site&apos;s data handling and request procedures in more detail.</p>

          <p className="identity-note" role="note">This interim summary does not replace the complete privacy notice. Please provide only the information needed for the feature you choose to use.</p>
          <div className="cart-empty-actions">
            <Link className="identity-secondary" href="/help">Read help &amp; information</Link>
          </div>
        </section>
      </main>
    </>
  );
}
