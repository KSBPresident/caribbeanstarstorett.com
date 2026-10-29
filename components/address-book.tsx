"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const countryCodes = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CL CM CN CO CR CU CV CW CY CZ DE DK DM DO DZ EC EE ES FI FJ FR GB GD GE GH GI GM GN GP GR GT GY HK HN HR HT HU ID IE IL IM IN IO IQ IS IT JM JP KE KG KH KN KR KY LC LK LR LS LT LU LV LY MA MC MD ME MF MK ML MM MN MO MR MS MT MU MW MX MY MZ NA NC NE NG NI NL NO NP NZ OM PA PE PF PG PH PK PL PM PR PT PW PY QA RO RS RW SA SC SE SG SI SK SL SM SN SR SV TC TD TF TG TH TL TN TO TR TT TV TZ UA UG US UY VC VE VG VN WS ZA ZW".split(" ");
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = countryCodes
  .map((code) => ({ code, name: displayNames.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name));

type Address = {
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
type Draft = Omit<Address, "id" | "is_default"> & { is_default: boolean };

const emptyDraft = (): Draft => ({
  label: "Home",
  recipient: "",
  phone: "",
  country_code: "TT",
  address_line1: "",
  address_line2: "",
  city: "",
  parish_or_county: "",
  landmarks: "",
  postal_code: "",
  is_default: false,
});

export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function reload(preferredId?: string) {
    const response = await fetch("/api/account/addresses", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "We could not load your saved addresses.");
    const rows = Array.isArray(result.addresses) ? result.addresses as Address[] : [];
    setAddresses(rows);
    const selected = rows.find((row) => row.id === preferredId)
      || rows.find((row) => row.is_default)
      || rows[0];
    if (selected) {
      setSelectedId(selected.id);
      setDraft({
        ...selected,
        address_line2: selected.address_line2 || "",
        landmarks: selected.landmarks || "",
        postal_code: selected.postal_code || "",
      });
    } else {
      setSelectedId("");
      setDraft(emptyDraft());
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/account/addresses", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "We could not load your saved addresses.");
        return Array.isArray(result.addresses) ? result.addresses as Address[] : [];
      })
      .then((rows) => {
        if (!active) return;
        setAddresses(rows);
        const selected = rows.find((row) => row.is_default) || rows[0];
        if (selected) {
          setSelectedId(selected.id);
          setDraft({ ...selected, address_line2: selected.address_line2 || "", landmarks: selected.landmarks || "", postal_code: selected.postal_code || "" });
        }
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "We could not load your addresses."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function choose(id: string) {
    setSelectedId(id);
    setNotice("");
    setError("");
    const selected = addresses.find((row) => row.id === id);
    if (!selected) { setDraft(emptyDraft()); return; }
    setDraft({ ...selected, address_line2: selected.address_line2 || "", landmarks: selected.landmarks || "", postal_code: selected.postal_code || "" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const editing = Boolean(selectedId);
      const response = await fetch("/api/account/addresses", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ...(editing ? { id: selectedId } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.address) throw new Error(result.error || "We could not save your address.");
      await reload(result.address.id);
      setNotice(editing ? "Your delivery address was updated." : "Your delivery address was saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not save your address.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selectedId) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/account/addresses?id=${encodeURIComponent(selectedId)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not remove your address.");
      await reload();
      setNotice("Your delivery address was removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not remove your address.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="address-book-layout">
      <section className="identity-panel" aria-labelledby="saved-address-heading">
        <div className="account-panel-title">
          <div><span className="identity-eyebrow">YOUR ADDRESSES</span><h2 id="saved-address-heading">Saved delivery addresses</h2></div>
          <button type="button" className="identity-secondary" onClick={() => choose("")}>Add new address</button>
        </div>
        {loading ? <p role="status">Loading your addresses…</p> : addresses.length ? (
          <div className="account-activity-list">
            {addresses.map((item) => (
              <article key={item.id}>
                <div><strong>{item.label}{item.is_default ? " · Default" : ""}</strong><span>{item.recipient} · {item.phone}</span><span>{item.address_line1}{item.address_line2 ? `, ${item.address_line2}` : ""}, {item.city}, {item.parish_or_county}, {item.country_code}{item.postal_code ? ` ${item.postal_code}` : ""}</span></div>
                <button type="button" className="identity-secondary" aria-pressed={selectedId === item.id} onClick={() => choose(item.id)}>{selectedId === item.id ? "Selected" : "Edit"}</button>
              </article>
            ))}
          </div>
        ) : <p className="organization-empty">No delivery addresses saved yet. Add one to speed up future checkouts.</p>}
      </section>

      <form className="identity-panel identity-form address-book-form" onSubmit={save}>
        <span className="identity-eyebrow">{selectedId ? "EDIT ADDRESS" : "NEW ADDRESS"}</span>
        <h2>{selectedId ? "Update delivery address" : "Add a delivery address"}</h2>
        <label>Address nickname<input value={draft.label} onChange={(event) => update("label", event.target.value)} maxLength={60} placeholder="Home, Work, etc." required /></label>
        <label>Recipient name<input value={draft.recipient} onChange={(event) => update("recipient", event.target.value)} autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label>Phone number<input value={draft.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" type="tel" maxLength={30} required /></label>
        <label>Country<select value={draft.country_code} onChange={(event) => update("country_code", event.target.value)} required>{countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label>Address line 1<input value={draft.address_line1} onChange={(event) => update("address_line1", event.target.value)} autoComplete="address-line1" maxLength={160} required /></label>
        <label>Address line 2 (optional)<input value={draft.address_line2 || ""} onChange={(event) => update("address_line2", event.target.value)} autoComplete="address-line2" maxLength={160} /></label>
        <div className="seller-form-row">
          <label>City / town<input value={draft.city} onChange={(event) => update("city", event.target.value)} autoComplete="address-level2" maxLength={100} required /></label>
          <label>Parish / county / region<input value={draft.parish_or_county} onChange={(event) => update("parish_or_county", event.target.value)} autoComplete="address-level1" maxLength={100} required /></label>
        </div>
        <label>Nearby landmark (optional)<input value={draft.landmarks || ""} onChange={(event) => update("landmarks", event.target.value)} maxLength={240} placeholder="A nearby landmark to help the courier" /></label>
        <label>Postal code (optional)<input value={draft.postal_code || ""} onChange={(event) => update("postal_code", event.target.value)} autoComplete="postal-code" maxLength={24} /></label>
        <label><input type="checkbox" checked={draft.is_default} onChange={(event) => update("is_default", event.target.checked)} /> Make this my default delivery address</label>
        {notice && <p className="identity-message" role="status">{notice}</p>}
        {error && <p className="identity-message identity-error" role="alert">{error}</p>}
        <div className="cart-empty-actions">
          <button className="identity-submit" type="submit" disabled={busy || loading}>{busy ? "Saving…" : selectedId ? "Update address" : "Save address"}</button>
          {selectedId && <button type="button" className="identity-secondary" onClick={() => void remove()} disabled={busy}>Remove address</button>}
        </div>
      </form>
    </div>
  );
}
