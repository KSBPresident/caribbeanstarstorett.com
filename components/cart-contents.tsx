"use client";

import Link from "next/link";
import { money } from "../lib/store-data";
import { useCart } from "./cart-provider";

export function CartContents() {
  const { items, ready, syncStatus, setQuantity, removeItem } = useCart();
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
        <span className="cart-empty-icon" aria-hidden="true">🛒</span>
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

  const subtotals = new Map<string, { amount: number; minorUnit: number }>();
  for (const line of items) {
    const key = line.product.currency;
    const current = subtotals.get(key) || { amount: 0, minorUnit: line.product.currencyMinorUnit };
    current.amount += line.product.price * line.quantity;
    current.minorUnit = Math.max(current.minorUnit, line.product.currencyMinorUnit);
    subtotals.set(key, current);
  }

  return (
    <>
    {syncNoticeElement}
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
                <div className="shopping-cart-controls" aria-label={`Quantity for ${product.name}`}>
                  <button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => setQuantity(product.slug, quantity - 1)}>−</button>
                  <span>{quantity}</span>
                  <button type="button" aria-label={`Increase ${product.name} quantity`} disabled={quantity >= Math.min(99, product.quantityAvailable ?? 99)} onClick={() => setQuantity(product.slug, quantity + 1)}>+</button>
                  <button type="button" aria-label={`Remove ${product.name} from cart`} onClick={() => removeItem(product.slug)}>Remove</button>
                </div>
              </div>
              <strong className="shopping-cart-line-total">{money(product.price * quantity, product.currency, product.currencyMinorUnit)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <aside className="identity-panel shopping-cart-summary">
        <h2>Order summary</h2>
        {[...subtotals.entries()].map(([currency, total]) => (
          <div className="shopping-cart-total-row" key={currency}>
            <span>Subtotal ({currency})</span>
            <strong>{money(total.amount, currency, total.minorUnit)}</strong>
          </div>
        ))}
        <button className="identity-submit" type="button" disabled>Checkout will be available after launch</button>
        <p className="catalog-meta">Prices and availability will be confirmed again when checkout is connected.</p>
      </aside>
    </div>
    </>
  );
}
