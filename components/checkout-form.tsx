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

type SavedAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  country_code: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  parish_or_county: string;
  landmarks: string | null;
  postal_code: string | null;
  is_default: boolean;
};

type AddressDraft = Omit<SavedAddress, "id" | "is_default"> & { is_default: boolean };

const emptyAddress = (countryCode = "TT"): AddressDraft => ({
  label: "Home",
  recipient: "",
  phone: "",
  country_code: countryCode,
  address_line1: "",
  address_line2: "",
  city: "",
  parish_or_county: "",
  landmarks: "",
  postal_code: "",
  is_default: false,
});


export function CheckoutForm({ paymentStatus, checkoutConfigured = false }: { paymentStatus?: string; checkoutConfigured?: boolean }) {
  const { items, ready, clearCart } = useCart();
  const [country, setCountry] = useState("TT");
  const [address, setAddress] = useState<AddressDraft>(() => emptyAddress());
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const savedCountry = localStorage.getItem(countryStorageKey);
      if (savedCountry && countryCodes.includes(savedCountry)) {
        setCountry(savedCountry);
        setAddress((current) => ({ ...current, country_code: savedCountry }));
      }
    } catch {}
    let active = true;
    fetch("/api/account/addresses", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return [];
        const result = await response.json();
        return Array.isArray(result.addresses) ? result.addresses as SavedAddress[] : [];
      })
      .then((rows: SavedAddress[]) => {
        if (!active) return;
        setSavedAddresses(rows);
        const preferred = rows.find((row) => row.is_default) || rows[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setAddress({ ...preferred, address_line2: preferred.address_line2 || "", landmarks: preferred.landmarks || "", postal_code: preferred.postal_code || "" });
          setCountry(preferred.country_code);
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setAddressesLoaded(true); });
    return () => { active = false; };
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

  function chooseAddress(id: string) {
    setSelectedAddressId(id);
    setAddressMessage("");
    if (!id) {
      setAddress(emptyAddress(country));
      return;
    }
    const selected = savedAddresses.find((item) => item.id === id);
    if (!selected) return;
    setAddress({
      ...selected,
      address_line2: selected.address_line2 || "",
      landmarks: selected.landmarks || "",
      postal_code: selected.postal_code || "",
    });
    setCountry(selected.country_code);
  }

  function updateAddress<K extends keyof AddressDraft>(key: K, value: AddressDraft[K]) {
    setAddress((current) => ({ ...current, [key]: value }));
    if (key === "country_code" && typeof value === "string") {
      setCountry(value);
      try { localStorage.setItem(countryStorageKey, value); } catch {}
    }
  }

  async function saveAddress(asNew: boolean) {
    setAddressBusy(true);
    setAddressMessage("");
    try {
      const response = await fetch("/api/account/addresses", {
        method: asNew || !selectedAddressId ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...address, ...(!asNew && selectedAddressId ? { id: selectedAddressId } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.address) throw new Error(result.error || "We could not save that address.");
      const saved = result.address as SavedAddress;
      setSavedAddresses((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id).map((item) => saved.is_default ? { ...item, is_default: false } : item),
      ]);
      setSelectedAddressId(saved.id);
      setAddress({ ...saved, address_line2: saved.address_line2 || "", landmarks: saved.landmarks || "", postal_code: saved.postal_code || "" });
      setCountry(saved.country_code);
      setAddressMessage(asNew ? "Address saved to your account." : "Address updated.");
    } catch (cause) {
      setAddressMessage(cause instanceof Error ? cause.message : "We could not save that address.");
    } finally {
      setAddressBusy(false);
    }
  }

  async function removeAddress() {
    if (!selectedAddressId) return;
    setAddressBusy(true);
    setAddressMessage("");
    try {
      const response = await fetch(`/api/account/addresses?id=${encodeURIComponent(selectedAddressId)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not remove that address.");
      const remaining = savedAddresses.filter((item) => item.id !== selectedAddressId);
      setSavedAddresses(remaining);
      const preferred = remaining.find((item) => item.is_default) || remaining[0];
      chooseAddress(preferred?.id || "");
      setAddressMessage("Address removed.");
    } catch (cause) {
      setAddressMessage(cause instanceof Error ? cause.message : "We could not remove that address.");
    } finally {
      setAddressBusy(false);
    }
  }

  async function startPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = {
      country,
      couponCode: String(data.get("couponCode") || "").trim().toUpperCase(),
      address: {
        recipient: address.recipient,
        phone: address.phone,
        addressLine1: address.address_line1,
        addressLine2: address.address_line2,
        city: address.city,
        parishOrCounty: address.parish_or_county,
        landmarks: address.landmarks,
        postalCode: address.postal_code,
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
      {!checkoutConfigured && <p className="identity-message" role="status">Card checkout is being set up. Your card will only be charged through WiPay after checkout is ready.</p>}
      <section className="checkout-saved-addresses" aria-labelledby="delivery-address-heading">
        <div className="account-panel-title"><div><span className="identity-eyebrow">DELIVERY ADDRESS</span><h2 id="delivery-address-heading">Where should we send your order?</h2></div></div>
        {addressesLoaded && savedAddresses.length > 0 && <label>Choose a saved address<select value={selectedAddressId} onChange={(event) => chooseAddress(event.target.value)}>
          <option value="">Enter a new delivery address</option>
          {savedAddresses.map((item) => <option key={item.id} value={item.id}>{item.label}{item.is_default ? " · Default" : ""} — {item.address_line1}, {item.city}, {item.country_code}</option>)}
        </select></label>}
        <label>Address nickname<input value={address.label} onChange={(event) => updateAddress("label", event.target.value)} maxLength={60} placeholder="Home, Work, etc." required /></label>
        <label>Recipient name<input value={address.recipient} onChange={(event) => updateAddress("recipient", event.target.value)} autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label>Phone number<input value={address.phone} onChange={(event) => updateAddress("phone", event.target.value)} autoComplete="tel" type="tel" maxLength={30} required /></label>
        <label>Delivery country<select value={country} onChange={(event) => updateAddress("country_code", event.target.value)} required>
          {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select></label>
        <label>Address line 1<input value={address.address_line1} onChange={(event) => updateAddress("address_line1", event.target.value)} autoComplete="address-line1" maxLength={160} required /></label>
        <label>Address line 2 (optional)<input value={address.address_line2 || ""} onChange={(event) => updateAddress("address_line2", event.target.value)} autoComplete="address-line2" maxLength={160} /></label>
        <div className="seller-form-row">
          <label>City / town<input value={address.city} onChange={(event) => updateAddress("city", event.target.value)} autoComplete="address-level2" maxLength={100} required /></label>
          <label>Parish / county / region<input value={address.parish_or_county} onChange={(event) => updateAddress("parish_or_county", event.target.value)} autoComplete="address-level1" maxLength={100} required /></label>
        </div>
        <label>Nearby landmark (optional)<input value={address.landmarks || ""} onChange={(event) => updateAddress("landmarks", event.target.value)} maxLength={240} placeholder="A nearby landmark to help the courier" /></label>
        <label>Postal code (optional)<input value={address.postal_code || ""} onChange={(event) => updateAddress("postal_code", event.target.value)} autoComplete="postal-code" maxLength={24} /></label>
        <label className="checkbox-label"><input type="checkbox" checked={address.is_default} onChange={(event) => updateAddress("is_default", event.target.checked)} />Make this my default delivery address</label>
        <div className="cart-empty-actions">
          <button className="identity-secondary" type="button" disabled={addressBusy} onClick={() => void saveAddress(!selectedAddressId)}> {addressBusy ? "Saving…" : selectedAddressId ? "Update saved address" : "Save this address"} </button>
          {selectedAddressId && <button className="identity-secondary" type="button" disabled={addressBusy} onClick={() => void saveAddress(true)}>Save as a new address</button>}
          {selectedAddressId && <button className="identity-secondary" type="button" disabled={addressBusy} onClick={() => void removeAddress()}>Remove address</button>}
        </div>
        {addressMessage && <p className="identity-message" role="status">{addressMessage}</p>}
      </section>
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
      <button className="identity-submit" type="submit" disabled={busy || !checkoutConfigured}>{!checkoutConfigured ? "Card checkout is being set up" : busy ? "Connecting to secure card checkout…" : "Continue to card payment"}</button>
      <Link className="identity-secondary" href="/cart">Return to cart</Link>
    </form>
  );
}
