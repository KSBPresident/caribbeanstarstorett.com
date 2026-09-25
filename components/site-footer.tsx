import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <section className="site-footer-about" aria-label="About Caribbean Star Store">
            <Link className="site-footer-brand" href="/" aria-label="Caribbean Star Store TT home">
              <img src="/caribbean-star-store-logo.svg" alt="" />
              <span><strong>CARIBBEAN STAR STORE TT</strong><span>Connecting the community</span></span>
            </Link>
            <p>A Caribbean marketplace bringing products, local services, businesses, job opportunities, and real estate together in one place.</p>
          </section>
          <section className="site-footer-group">
            <h2>Explore</h2>
            <nav aria-label="Explore marketplace">
              <Link href="/how-it-works">How it works</Link>
              <Link href="/marketplace">Products</Link>
              <Link href="/businesses">Businesses &amp; services</Link>
              <Link href="/opportunities">Jobs &amp; real estate</Link>
              <Link href="/search">Search the marketplace</Link>
            </nav>
          </section>
          <section className="site-footer-group">
            <h2>Join the marketplace</h2>
            <nav aria-label="Join Caribbean Star Store">
              <Link href="/sell">Sell products</Link>
              <Link href="/business">Build your business</Link>
              <Link href="/build-a-buy">Post a buying request</Link>
              <Link href="/sign-up">Create an account</Link>
            </nav>
          </section>
          <section className="site-footer-group">
            <h2>Your account</h2>
            <nav aria-label="Account links">
              <Link href="/sign-in">Sign in</Link>
              <Link href="/dashboard">Account activity</Link>
            </nav>
          </section>
        </div>
        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} Caribbean Star Store TT</span>
          <span>Product listings will appear here when the catalog is ready.</span>
        </div>
      </div>
    </footer>
  );
}
