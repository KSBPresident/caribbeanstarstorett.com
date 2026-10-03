import Link from "next/link";

export default function Loading() {
  return (
    <>
      <header className="store-header">
        <div className="store-top">
          <Link className="store-brand" href="/" aria-label="Caribbean Star Store home">
            <img className="company-logo" src="/caribbean-star-store-logo.svg" alt="" />
            <span><b>CARIBBEAN STAR STORE</b><small>INTERNATIONAL MARKETPLACE</small></span>
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="identity-page marketplace-loading" aria-busy="true">
        <section className="identity-panel loading-card" role="status" aria-live="polite">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE</span>
          <p className="loading-heading">Loading page content</p>
          <p>Please wait a moment.</p>
          <div className="marketplace-loading-bar" aria-hidden="true"><span /></div>
        </section>
      </main>
    </>
  );
}
