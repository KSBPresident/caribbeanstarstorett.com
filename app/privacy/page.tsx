import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "Privacy information for Caribbean Star Store.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <section className="identity-panel" aria-labelledby="privacy-title">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · PRIVACY</span>
          <h1 id="privacy-title">Privacy Notice</h1>
          <p>
            Caribbean Star Store&apos;s full privacy notice has not been published yet.
            We are preparing information about how data submitted through the site is
            handled.
          </p>
          <p className="identity-note" role="note">
            Until the full notice is available, please do not submit personal,
            payment, or other sensitive information through the site.
          </p>
          <div className="cart-empty-actions">
            <a className="identity-submit" href="mailto:caribbeanstarstore@gmail.com">Contact Caribbean Star Store</a>
            <Link className="identity-secondary" href="/help">Read help &amp; information</Link>
          </div>
        </section>
      </main>
    </>
  );
}
