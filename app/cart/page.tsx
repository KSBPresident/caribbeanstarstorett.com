import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getOriginalStoreUrl } from "../../lib/wordpress-store";

export const metadata: Metadata = {
  title: "Store Cart",
  description: "Continue to the Caribbean Star Store cart and checkout.",
  robots: { index: false, follow: true },
};

export default function Cart() {
  const storeUrl = getOriginalStoreUrl();

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">CARIBBEAN STAR STORE</span>
            <h1>Your store cart</h1>
            <p>Product details, checkout, purchases, and order history are managed by the original store.</p>
          </div>
        </header>
        <section className="identity-panel cart-empty-state">
          <span className="cart-empty-icon" aria-hidden="true">🛒</span>
          <h2>Continue to your store cart</h2>
          <p>Open the original store to review your cart, complete checkout, or browse its current product listings.</p>
          <div className="cart-empty-actions">
            <a className="identity-submit" href={`${storeUrl}/cart/`} target="_blank" rel="noopener noreferrer">Open store cart</a>
            <a className="identity-secondary" href={`${storeUrl}/shop/`} target="_blank" rel="noopener noreferrer">Browse store products</a>
            <Link className="identity-secondary" href="/businesses">Discover businesses</Link>
            <Link className="identity-secondary" href="/opportunities">View jobs &amp; real estate</Link>
          </div>
        </section>
      </main>
    </>
  );
}
