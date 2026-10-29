"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { money } from "../lib/store-data";
import { useCart } from "./cart-provider";

const DESTINATION_STORAGE_KEY = "caribbean-star-store-delivery-country-v1";
const countryCodes = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = countryCodes
  .map((code) => ({ code, name: countryNames.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function CartContents() {
  const { items, ready, syncStatus, setQuantity, removeItem } = useCart();
  const [destinationCountry, setDestinationCountry] = useState("TT");
  const cartBusy = syncStatus === "syncing";
  const isLocalDelivery = destinationCountry === "TT";

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DESTINATION_STORAGE_KEY);
      if (stored && countryCodes.includes(stored)) setDestinationCountry(stored);
    } catch {
      // Keep Trinidad & Tobago as the default when browser storage is unavailable.
    }
  }, []);

  function updateDestination(countryCode: string) {
    setDestinationCountry(countryCode);
    try {
      window.localStorage.setItem(DESTINATION_STORAGE_KEY, countryCode);
    } catch {
      // The selected destination still applies for this visit.
    }
  }

  const countryLabel = useMemo(
    () => countries.find((country) => country.code === destinationCountry)?.name || "Trinidad & Tobago",
    [destinationCountry],
  );
  const deliveryType = isLocalDelivery ? "Local delivery" : "International delivery";

  const syncNotice = syncStatus === "syncing"
    ? "Syncing your signed-in cart…"
    : syncStatus === "synced"
      ? "Your cart is saved to your account."
      : syncStatus === "unavailable"
        ? "Account sync is unavailable. Your cart remains saved on this device."
        : null;
  const syncNoticeElement = syncNotice
    ? <p className={syncStatus === "unavailable" ? "identity-message identity-error" : "identity-message"} role="status">{syncNotice}</p>
    : null;

  if (!ready) {
    return <section className="identity-panel cart-empty-state" role="status">Loading your cart…</section>;
  }

  if (!items.length) {
    return (
      <>
      {syncNoticeElement}
      <section className="identity-panel cart-empty-state">
        <span className="cart-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg></span>
        <h2>Your cart is empty</h2>
        <p>When products are available, add the items you want and review them here.</p>
        <div className="cart-empty-actions">
          <Link className="identity-submit" href="/marketplace">Explore the marketplace</Link>
          <Link className="identity-secondary" href="/businesses">Discover businesses</Link>
        </div>
      </section>
      </>
    );
  }

  const shippedItemCount = items.reduce((count, line) => count + line.quantity, 0);
  const cssShippingCharge = shippedItemCount * 5;
  const subtotals = new Map<string, { amount: number; sellerShipping: number; minorUnit: number }>();
  for (const line of items) {
    const key = line.product.currency;
    const current = subtotals.get(key) || { amount: 0, sellerShipping: 0, minorUnit: line.product.currencyMinorUnit };
    current.amount += line.product.price * line.quantity;
    const sellerFee = isLocalDelivery ? (line.product.sellerShippingFee || 0) : (line.product.sellerInternationalShippingFee ?? line.product.sellerShippingFee ?? 0);
    current.sellerShipping += sellerFee * line.quantity;
    current.minorUnit = Math.max(current.minorUnit, line.product.currencyMinorUnit);
    subtotals.set(key, current);
  }
  const itemSubtotal = [...subtotals.values()].reduce((sum, value) => sum + value.amount, 0);
  const sellerShippingTotal = [...subtotals.values()].reduce((sum, value) => sum + value.sellerShipping, 0);
  const allPricesUsd = [...subtotals.keys()].every((currency) => currency === "USD");
  const estimatedTotalUsd = allPricesUsd ? itemSubtotal + sellerShippingTotal + cssShippingCharge : null;

  return (
    <>
    {syncNoticeElement}
    <section className="identity-panel cart-shipping-section" aria-labelledby="delivery-heading">
      <span className="identity-eyebrow">SHIPPING & DELIVERY</span>
      <h2 id="delivery-heading">Choose your delivery destination</h2>
      <p>Delivery is local in Trinidad & Tobago. Every other country is treated as an international delivery destination.</p>
      <label htmlFor="delivery-country">Country of delivery</label>
      <select id="delivery-country" name="deliveryCountry" value={destinationCountry} onChange={(event) => updateDestination(event.target.value)}>
        <option value="TT">Trinidad & Tobago</option>
        {countries.filter((country) => country.code !== "TT").map((country) => (
          <option key={country.code} value={country.code}>{country.name}</option>
        ))}
      </select>
      <p className="catalog-meta" role="status">Selected: {deliveryType} to {countryLabel}.</p>
    </section>
    <div className="shopping-cart-layout">
      <section className="identity-panel" aria-label="Items in your cart">
        <ul className="shopping-cart-list">
          {items.map(({ product, quantity }) => (
            <li className="shopping-cart-line" key={product.slug}>
              <Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
                <img className="shopping-cart-image" src={product.image} alt="" />
              </Link>
              <div className="shopping-cart-product">
                <Link href={`/product/${product.slug}`}><strong>{product.name}</strong></Link>
                <span>{product.category}</span>
                <small>{money(product.price, product.currency, product.currencyMinorUnit)} each</small>
                <small>{deliveryType} shipping per item: seller-chosen {money(isLocalDelivery ? product.sellerShippingFee || 0 : product.sellerInternationalShippingFee ?? product.sellerShippingFee ?? 0, product.currency, product.currencyMinorUnit)} + Caribbean Star Store {money(5, "USD", 2)}</small>
                <div className="shopping-cart-controls" aria-label={`Quantity for ${product.name}`}>
                  <button type="button" disabled={cartBusy} aria-label={`Decrease ${product.name} quantity`} onClick={() => setQuantity(product.slug, quantity - 1)}>−</button>
                  <span>{quantity}</span>
                  <button type="button" disabled={cartBusy || quantity >= Math.min(99, product.quantityAvailable ?? 99)} aria-label={`Increase ${product.name} quantity`} onClick={() => setQuantity(product.slug, quantity + 1)}>+</button>
                  <button type="button" disabled={cartBusy} aria-label={`Remove ${product.name} from cart`} onClick={() => removeItem(product.slug)}>Remove</button>
                </div>
              </div>
              <strong className="shopping-cart-line-total">{money(product.price * quantity, product.currency, product.currencyMinorUnit)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <aside className="identity-panel shopping-cart-summary">
        <h2>Order summary</h2>
        <p className="catalog-meta">{deliveryType} to {countryLabel}</p>
        {[...subtotals.entries()].map(([currency, total]) => (
          <div key={currency}>
            <div className="shopping-cart-total-row">
              <span>Subtotal ({currency})</span>
              <strong>{money(total.amount, currency, total.minorUnit)}</strong>
            </div>
            <div className="shopping-cart-total-row">
              <span>Seller-chosen delivery ({currency})</span>
              <strong>{money(total.sellerShipping, currency, total.minorUnit)}</strong>
            </div>
          </div>
        ))}
        <div className="shopping-cart-total-row">
          <span>Caribbean Star Store shipping ($5 × {shippedItemCount} shipped {shippedItemCount === 1 ? "item" : "items"})</span>
          <strong>{money(cssShippingCharge, "USD", 2)}</strong>
        </div>
        {estimatedTotalUsd !== null && <div className="shopping-cart-total-row">
          <span>Estimated total (USD)</span>
          <strong>{money(estimatedTotalUsd, "USD", 2)}</strong>
        </div>}
        <p className="catalog-meta">{isLocalDelivery
          ? "The seller-entered delivery fee plus the $5 Caribbean Star Store charge is shown per shipped item."
          : "The seller-entered international delivery fee plus the $5 Caribbean Star Store charge is shown per shipped item. Final international delivery cost and availability must be confirmed before payment."}</p>
        {allPricesUsd ? <Link className="identity-submit" href="/checkout">Continue to card checkout</Link> : <p className="identity-message">Online card checkout currently supports USD listings.</p>}
        <p className="catalog-meta">Your stock, prices, and delivery charges are checked again before payment. Card details are entered on WiPay’s secure checkout page.</p>
      </aside>
    </div>
    </>
  );
}

