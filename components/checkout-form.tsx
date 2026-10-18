"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { money } from "../lib/store-data";
import { useCart } from "./cart-provider";

const countryCodes = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = countryCodes.map((code) => ({ code, name: displayNames.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name));
const countryStorageKey = "caribbean-star-store-delivery-country-v1";

export function CheckoutForm({ paymentStatus }: { paymentStatus?: string }) {
  const { items, ready, clearCart } = useCart();
  const [country, setCountry] = useState("TT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(countryStorageKey);
      if (saved && countryCodes.includes(saved)) setCountry(saved);
    } catch {}
  }, []);
  useEffect(() => {
    if (paymentStatus === "success") clearCart();
  }, [paymentStatus, clearCart]);

  const subtotal = useMemo(() => items.reduce((sum, line) => sum + line.product.price * line.quantity, 0), [items]);
  const platformShipping = useMemo(() => items.reduce((sum, line) => sum + 5 * line.quantity, 0), [items]);
  const sellerShipping = useMemo(() => items.reduce((sum, line) => {
    const fee = country === "TT"
      ? line.product.sellerShippingFee || 0
      : line.product.sellerInternationalShippingFee ?? line.product.sellerShippingFee ?? 0;
    return sum + fee * line.quantity;
  }, 0), [country, items]);

  async function startPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = {
      country,
      couponCode: String(data.get("couponCode") || "").trim().toUpperCase(),
      address: {
        recipient: data.get("recipient"),
        phone: data.get("phone"),
        addressLine1: data.get("addressLine1"),
        addressLine2: data.get("addressLine2"),
        city: data.get("city"),
        parishOrCounty: data.get("parishOrCounty"),
        landmarks: data.get("landmarks"),
        postalCode: data.get("postalCode"),
      },
      items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
    };
    try {
      const response = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || typeof result.checkoutUrl !== "string") {
        if (response.status === 401) {
          window.location.assign("/sign-in?next=%2Fcheckout");
          return;
        }
        throw new Error(result.error || "We could not start your payment. Please try again.");
      }
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not start your payment. Please try again.");
      setBusy(false);
    }
  }

  if (!ready) return <section className="identity-panel" role="status">Loading your cart…</section>;
  if (paymentStatus === "success") return <section className="identity-panel" role="status"><span className="identity-eyebrow">PAYMENT CONFIRMED</span><h1>Thank you for your order</h1><p>WiPay confirmed your card payment. Your order is recorded and the seller will prepare your items.</p><Link className="identity-submit" href="/orders">View order history</Link></section>;
  if (paymentStatus === "failed") return <section className="identity-panel" role="alert"><span className="identity-eyebrow">PAYMENT NOT COMPLETED</span><h1>Your order was not paid</h1><p>Your items were released back to inventory. Review your cart and try again.</p><Link className="identity-submit" href="/cart">Return to cart</Link></section>;
  if (paymentStatus === "pending") return <section className="identity-panel" role="status"><span className="identity-eyebrow">PAYMENT PROCESSING</span><h1>Payment is still processing</h1><p>We have not marked this order as paid. Please check your account before trying again.</p><Link className="identity-submit" href="/dashboard">View your account</Link></section>;
  if (paymentStatus === "unverified") return <section className="identity-panel" role="alert"><span className="identity-eyebrow">PAYMENT NOT VERIFIED</span><h1>We could not verify this payment yet</h1><p>We have not confirmed an order as paid. Check your account or contact support before trying again.</p><Link className="identity-submit" href="/dashboard">View your account</Link><Link className="identity-secondary" href="/help#contact">Contact support</Link></section>;
  if (!items.length) return <section className="identity-panel"><h1>Your cart is empty</h1><p>Add products before checking out.</p><Link className="identity-submit" href="/marketplace">Explore products</Link></section>;

  return (
    <form className="identity-panel identity-form seller-form checkout-form" onSubmit={startPayment}>
      <span className="identity-eyebrow">DELIVERY DETAILS</span>
      <h1>Review and pay</h1>
      <p>Pay securely by card on WiPay’s hosted checkout. Your card details never pass through this site.</p>
      {error && <p className="identity-message identity-error" role="alert">{error}</p>}
      <label>Recipient name<input name="recipient" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label>Phone number<input name="phone" autoComplete="tel" type="tel" maxLength={30} required /></label>
      <label>Delivery country<select value={country} onChange={(event) => { setCountry(event.target.value); try { localStorage.setItem(countryStorageKey, event.target.value); } catch {} }} required>
        {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select></label>
      <label>Address line 1<input name="addressLine1" autoComplete="address-line1" maxLength={160} required /></label>
      <label>Address line 2 (optional)<input name="addressLine2" autoComplete="address-line2" maxLength={160} /></label>
      <div className="seller-form-row">
        <label>City / town<input name="city" autoComplete="address-level2" maxLength={100} required /></label>
        <label>Parish / county / region<input name="parishOrCounty" autoComplete="address-level1" maxLength={100} required /></label>
      </div>
      <label>Nearby landmark (optional)<input name="landmarks" maxLength={240} placeholder="A nearby landmark to help the courier" /></label>
      <label>Postal code (optional)<input name="postalCode" autoComplete="postal-code" maxLength={24} /></label>
      <section className="checkout-order-summary" aria-label="Order total">
        <h2>Order summary</h2>
        <label>Seller coupon code (optional)<input name="couponCode" maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,39}" autoCapitalize="characters" placeholder="WELCOME10" /></label>
        <p className="catalog-meta">Each seller code discounts eligible items from that seller only. Shipping is unchanged. <Link href="/coupons">Browse seller offers</Link></p>
        <div className="shopping-cart-total-row"><span>Products</span><strong>{money(subtotal)}</strong></div>
        <div className="shopping-cart-total-row"><span>Seller shipping</span><strong>{money(sellerShipping)}</strong></div>
        <div className="shopping-cart-total-row"><span>Caribbean Star Store shipping ($5 × {items.reduce((sum, line) => sum + line.quantity, 0)} items)</span><strong>{money(platformShipping)}</strong></div>
        <div className="shopping-cart-total-row"><span>Estimated total before coupon (USD)</span><strong>{money(subtotal + sellerShipping + platformShipping)}</strong></div>
        <p className="catalog-meta">Any eligible coupon is applied before payment. WiPay shows the discounted order total and any card-processing fee before you confirm.</p>
      </section>
      <button className="identity-submit" type="submit" disabled={busy}>{busy ? "Connecting to secure card checkout…" : "Continue to card payment"}</button>
      <Link className="identity-secondary" href="/cart">Return to cart</Link>
    </form>
  );
}
