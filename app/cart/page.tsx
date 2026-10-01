import type { Metadata } from "next";
import { SiteHeader } from "../../components/site-header";
import { CartContents } from "../../components/cart-contents";

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
            <p>Review the items you have added to your marketplace cart.</p>
          </div>
        </header>
        <CartContents />
      </main>
    </>
  );
}
