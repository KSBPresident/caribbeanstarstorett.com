import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Checkout is being prepared for Caribbean Star Store.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <section className="identity-panel" aria-labelledby="checkout-status-title">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · CHECKOUT</span>
          <h1 id="checkout-status-title">Checkout is being prepared</h1>
          <p>
            You can review items saved in your cart, but order placement, payment,
            delivery estimates, and order tracking are not active yet.
          </p>
          <p className="identity-note">
            Your cart stays saved in this browser. Caribbean Star Store will not
            ask you for payment details or place an order until checkout is enabled.
          </p>
          <div className="cart-empty-actions">
            <Link className="identity-submit" href="/cart">Return to your cart</Link>
            <Link className="identity-secondary" href="/marketplace">Explore the marketplace</Link>
            <Link className="identity-secondary" href="/help">Read help &amp; information</Link>
          </div>
        </section>
      </main>
    </>
  );
}
