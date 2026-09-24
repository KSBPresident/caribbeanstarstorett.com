import Link from "next/link";
import type { CSSProperties } from "react";
import { SiteHeader } from "../../components/site-header";

const cardStyle: CSSProperties = {
  padding: "22px",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  background: "#fff",
  boxShadow: "0 8px 24px #12304b08",
};

const linkStyle: CSSProperties = {
  display: "inline-block",
  marginTop: "10px",
  color: "#0877df",
  fontSize: "13px",
  fontWeight: 800,
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: "1160px", margin: "0 auto", padding: "38px 3% 64px" }}>
        <header style={{ padding: "38px clamp(22px, 5vw, 56px)", borderRadius: "18px", background: "linear-gradient(115deg,#092d50,#0d6193)", color: "#fff" }}>
          <span style={{ color: "#9bd9ff", fontSize: "10px", fontWeight: 900, letterSpacing: ".12em" }}>CARIBBEAN STAR STORE · GETTING STARTED</span>
          <h1 style={{ maxWidth: "720px", margin: "12px 0", fontSize: "clamp(32px,5vw,54px)", lineHeight: 1.05 }}>One marketplace for the Caribbean community.</h1>
          <p style={{ maxWidth: "680px", color: "#dcecf7", fontSize: "14px", lineHeight: 1.7 }}>Browse the store, ask for what you need, or join as a seller and grow your business with the community.</p>
          <Link href="/marketplace" style={{ display: "inline-block", marginTop: "12px", borderRadius: "7px", background: "#0877df", color: "#fff", padding: "12px 17px", fontSize: "12px", fontWeight: 800 }}>Explore the marketplace</Link>
        </header>

        <section aria-label="How to use the marketplace" style={{ marginTop: "30px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "22px" }}>Choose what you want to do</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "14px" }}>
            <article style={cardStyle}>
              <span style={{ color: "#0877df", fontSize: "11px", fontWeight: 900 }}>01 · SHOP</span>
              <h3 style={{ margin: "10px 0 6px", fontSize: "17px" }}>Find products</h3>
              <p style={{ color: "#526071", fontSize: "13px", lineHeight: 1.6 }}>Search product categories and browse available items. Product details, stock, and checkout are handled by the existing store.</p>
              <Link href="/marketplace" style={linkStyle}>Browse products →</Link>
            </article>
            <article style={cardStyle}>
              <span style={{ color: "#0877df", fontSize: "11px", fontWeight: 900 }}>02 · REQUEST</span>
              <h3 style={{ margin: "10px 0 6px", fontSize: "17px" }}>Tell us what you need</h3>
              <p style={{ color: "#526071", fontSize: "13px", lineHeight: 1.6 }}>Sign in to save a private Build-A-Buy request for an item or service you are looking for.</p>
              <Link href="/build-a-buy" style={linkStyle}>Start a buying request →</Link>
            </article>
            <article style={cardStyle}>
              <span style={{ color: "#0877df", fontSize: "11px", fontWeight: 900 }}>03 · SELL</span>
              <h3 style={{ margin: "10px 0 6px", fontSize: "17px" }}>Join as a seller</h3>
              <p style={{ color: "#526071", fontSize: "13px", lineHeight: 1.6 }}>Create an account and begin seller onboarding to apply to sell through the marketplace.</p>
              <Link href="/sell" style={linkStyle}>Start seller onboarding →</Link>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
