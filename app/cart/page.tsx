import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review items selected from the Caribbean Star Store marketplace.",
  robots: { index: false, follow: true },
};

export default function Cart() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">CARIBBEAN STAR STORE</span>
            <h1>Your cart</h1>
            <p>Your shopping cart and checkout will be available here when product listings are launched.</p>
          </div>
        </header>
        <section className="identity-panel cart-empty-state">
          <span className="cart-empty-icon" aria-hidden="true">🛒</span>
          <h2>Your cart is ready for your finds</h2>
          <p>We are preparing the product catalog and checkout for Caribbean Star Store.</p>
          <div className="cart-empty-actions">
            <Link className="identity-submit" href="/marketplace">Explore the marketplace</Link>
            <Link className="identity-secondary" href="/businesses">Discover businesses</Link>
            <Link className="identity-secondary" href="/opportunities">View jobs &amp; real estate</Link>
          </div>
        </section>
      </main>
    </>
  );
}
