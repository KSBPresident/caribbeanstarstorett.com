import Link from "next/link";
import { SiteHeader } from "../components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <section className="identity-panel catalog-unavailable">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · 404</span>
          <h1>We couldn’t find that page</h1>
          <p>The address may have changed, or the listing may no longer be available. You can continue exploring the Caribbean marketplace.</p>
          <div className="cart-empty-actions">
            <Link className="identity-submit" href="/">Go to the marketplace</Link>
            <Link className="identity-secondary" href="/businesses">Explore businesses</Link>
            <Link className="identity-secondary" href="/opportunities">Jobs &amp; real estate</Link>
          </div>
        </section>
      </main>
    </>
  );
}
