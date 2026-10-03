import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <section className="site-footer-about" aria-label="About Caribbean Star Store">
            <Link className="site-footer-brand" href="/" aria-label="Caribbean Star Store home">
              <img src="/caribbean-star-store-logo.svg" alt="" />
              <span><strong>CARIBBEAN STAR STORE</strong><span>Connecting The Communities</span></span>
            </Link>
            <p>An international marketplace bringing products, services, businesses, job opportunities, and real estate together in one place.</p>
            <p className="site-footer-contact">Need help? <a href="tel:+13472018734">+1 (347) 201-8734</a><br /><a href="mailto:caribbeanstarstore@gmail.com">caribbeanstarstore@gmail.com</a></p>
          </section>
          <section className="site-footer-group">
            <h2>Explore</h2>
            <nav aria-label="Explore marketplace">
              <Link href="/how-it-works">How it works</Link>
              <Link href="/marketplace">Products</Link>
              <Link href="/auctions">Auctions</Link>
              <Link href="/businesses">Businesses &amp; services</Link>
              <Link href="/opportunities">Jobs &amp; real estate</Link>
              <Link href="/search">Search the marketplace</Link>
              <Link href="/help">Help &amp; information</Link>
              <Link href="/about">About us</Link>
              <Link href="/help#full-terms">Terms &amp; conditions</Link>
              <Link href="/privacy">Privacy notice</Link>
            </nav>
          </section>
          <section className="site-footer-group">
            <h2>Join the marketplace</h2>
            <nav aria-label="Join Caribbean Star Store">
              <Link href="/create">Create a post</Link>
              <Link href="/sell">Become a seller</Link>
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
          <span>© {new Date().getFullYear()} Caribbean Star Store</span>
          <span>Connecting The Communities</span>
          <span className="site-footer-credit">Website Designed &amp; Developed by <strong>Nebula Interstellar Networking Economy LLC.</strong></span>
        </div>
      </div>
    </footer>
  );
}
