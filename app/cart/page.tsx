import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Cart",
  description: "The Caribbean Star Store cart and checkout are being prepared for the marketplace.",
  robots: { index: false, follow: true },
};

export default function Cart() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading"><div><span className="identity-eyebrow">CARIBBEAN STAR STORE</span><h1>Your marketplace cart</h1><p>Cart and checkout are being prepared for the marketplace.</p></div></header>
        <section className="identity-panel cart-empty-state">
          <span className="cart-empty-icon" aria-hidden="true">🛒</span>
          <h2>Your cart is not open yet</h2>
          <p>We are preparing product listings and checkout. For now, explore local businesses and opportunities across the marketplace.</p>
          <div className="cart-empty-actions"><Link className="identity-submit" href="/marketplace">Explore products</Link><Link className="identity-secondary" href="/businesses">Discover businesses</Link><Link className="identity-secondary" href="/opportunities">View opportunities</Link></div>
        </section>
      </main>
    </>
  );
}
