import Link from "next/link";

export default function Loading() {
  return (
    <>
      <header className="store-header">
        <div className="store-top">
          <Link className="store-brand" href="/" aria-label="Caribbean Star Store TT home">
            <img className="company-logo" src="/caribbean-star-store-logo.svg" alt="" />
            <span><b>CARIBBEAN STAR STORE</b><small>TRINIDAD &amp; TOBAGO MARKETPLACE</small></span>
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="identity-page marketplace-loading" aria-busy="true">
        <section className="identity-panel loading-card" role="status" aria-live="polite">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · MARKETPLACE</span>
          <h1>Loading the marketplace</h1>
          <p>Gathering current marketplace information. Please wait a moment.</p>
          <div className="marketplace-loading-bar" aria-hidden="true"><span /></div>
        </section>
      </main>
    </>
  );
}
