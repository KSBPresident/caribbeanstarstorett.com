import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { getOriginalStoreUrl } from "../../lib/wordpress-store";

export default function Cart() {
  const storeUrl = getOriginalStoreUrl();
  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <header className="identity-heading"><div><span className="identity-eyebrow">CARIBBEAN STAR STORE</span><h1>Your cart</h1><p>Cart contents and secure checkout are managed by the original WooCommerce store.</p></div></header>
        <section className="identity-panel cart-empty-state">
          <span className="cart-empty-icon" aria-hidden="true">🛒</span>
          <h2>Continue in the original store</h2>
          <p>To keep product availability, delivery, and payment details together, add items and complete checkout in the original store.</p>
          <div className="cart-empty-actions"><Link className="identity-submit" href="/marketplace">Browse products</Link><a className="identity-secondary" href={`${storeUrl}/cart/`}>Open store cart</a></div>
        </section>
      </main>
    </>
  );
}
