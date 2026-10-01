import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Auctions",
  description:
    "Discover product auctions on Caribbean Star Store and learn how bidding works for buyers and sellers.",
  alternates: { canonical: "/auctions" },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store",
    title: "Auctions | Caribbean Star Store",
    description:
      "Explore product auctions and bidding guidance from Caribbean Star Store.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auctions | Caribbean Star Store",
    description:
      "Explore product auctions and bidding guidance from Caribbean Star Store.",
  },
};

export default function AuctionsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page directory-page">
        <header className="directory-hero">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · AUCTIONS</span>
          <h1>Find a great deal through bidding.</h1>
          <p>Explore seller-submitted product auctions and review each listing carefully before placing a bid.</p>
          <div className="directory-hero-actions">
            <a className="identity-submit" href="#active-auctions">View active auctions</a>
            <Link className="directory-secondary" href="/help#bidding">How bidding works</Link>
          </div>
        </header>

        <section id="active-auctions" className="directory-results" aria-labelledby="auction-list-title">
          <div className="directory-results-heading">
            <div>
              <span className="identity-eyebrow">PRODUCT BIDDING</span>
              <h2 id="auction-list-title">Active auctions</h2>
            </div>
            <span>Listings appear after seller review</span>
          </div>
          <section className="identity-panel catalog-empty" role="status">
            <span className="identity-eyebrow">NO ACTIVE AUCTIONS YET</span>
            <h3>Auction listings are being prepared.</h3>
            <p>There are no published auction items to browse right now. Check back when reviewed seller listings become available.</p>
            <Link className="identity-secondary" href="/marketplace">Explore marketplace products</Link>
          </section>
        </section>

        <section className="directory-results" aria-labelledby="bidding-steps-title">
          <div className="directory-results-heading">
            <div>
              <span className="identity-eyebrow">FOR BUYERS</span>
              <h2 id="bidding-steps-title">Before you place a bid</h2>
            </div>
          </div>
          <div className="directory-grid">
            <article className="directory-card">
              <div className="directory-card-meta"><span>STEP 01</span></div>
              <h3>Review the listing</h3>
              <p>Check the starting price, item description, condition, and every term shown by the seller.</p>
            </article>
            <article className="directory-card">
              <div className="directory-card-meta"><span>STEP 02</span></div>
              <h3>Bid only when ready</h3>
              <p>A bid is a commitment to purchase if you win. Place a bid only when you are prepared to complete the purchase under the listing terms.</p>
            </article>
            <article className="directory-card">
              <div className="directory-card-meta"><span>STEP 03</span></div>
              <h3>Confirm payment and delivery</h3>
              <p>Review the seller’s payment, delivery, and return information before taking part in an auction.</p>
            </article>
          </div>
        </section>

        <section className="identity-panel identity-wide">
          <span className="identity-eyebrow">FOR SELLERS</span>
          <h2>Request an auction listing</h2>
          <p>Auction listings are for sellers and vendors with a store on Caribbean Star Store. Send CSS the product details to request review; listing availability is subject to platform review.</p>
          <div className="directory-hero-actions">
            <Link className="identity-submit" href="/sell">Learn about selling</Link>
            <a className="directory-secondary" href="mailto:caribbeanstarstore@gmail.com?subject=Auction%20listing%20request">Email CSS about a product</a>
          </div>
        </section>
      </main>
    </>
  );
}
