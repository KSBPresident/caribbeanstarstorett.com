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
            For shipped orders, Caribbean Star Store adds $5 per item, plus any seller-set shipping charge. The final amount will be shown before payment when checkout is enabled.
          </p>
          <p className="identity-note">
            Your cart stays saved in this browser. Caribbean Star Store will not
            ask you for payment details or place an order until checkout is enabled.
          </p>
          <p className="identity-note">
            You can save and manage your delivery addresses in your account so they are ready when checkout opens.
          </p>
          <div className="cart-empty-actions">
            <Link className="identity-submit" href="/addresses">Manage delivery addresses</Link>
          </div>
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
