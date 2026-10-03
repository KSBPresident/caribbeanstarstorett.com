import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Caribbean Star Store and our mission to connect shoppers, sellers, and businesses around the world.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store",
    title: "About Caribbean Star Store",
    description:
      "Learn about Caribbean Star Store and our mission to connect shoppers, sellers, and businesses around the world.",
  
    images: [{ url: "/opengraph-image", alt: "Caribbean Star Store — Connecting communities worldwide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Caribbean Star Store",
    description:
      "Learn about Caribbean Star Store and our mission to connect shoppers, sellers, and businesses around the world.",
  
    images: ["/twitter-image"],
  },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">GET TO KNOW US</span>
            <h1>Connecting communities worldwide through a shared marketplace.</h1>
            <p>Caribbean Star Store brings customers, independent sellers, and businesses together to discover products, services, and opportunities.</p>
            <div className="directory-hero-actions">
              <Link className="identity-submit" href="/businesses">Explore businesses</Link>
              <Link className="directory-secondary" href="/sell">Grow with Caribbean Star Store</Link>
            </div>
          </div>
        </header>
        <div className="build-request-grid">
          <section className="identity-panel">
            <h2>About Caribbean Star Store</h2>
            <p>Caribbean Star Store is a retail marketplace where business owners can offer new and used products, alongside services and other opportunities.</p>
            <p>Our customers come first. We are a team of passionate builders working to bring useful, high-quality products and services to customers around the world.</p>
          </section>
          <section className="identity-panel">
            <h2>Supporting businesses</h2>
            <p>We aim to help businesses of every size reach new customers through one shared marketplace. Businesses can present their products and services, build visibility, and compete alongside established brands.</p>
            <p>For shoppers, that means more choice, distinctive products, competitive prices, and the convenience of browsing from home.</p>
          </section>
          <section className="identity-panel">
            <h2>Growing together</h2>
            <p>Caribbean Star Store and participating businesses can bring together a broad range of products and services for customers worldwide.</p>
            <p>We appreciate every business that chooses to grow with the marketplace and contribute to its community.</p>
            <p>Businesses interested in opening a store can apply for a seller workspace. Community and nonprofit groups can create their own organization workspace.</p>
            <p><Link className="identity-inline-link" href="/sell">Apply to sell on Caribbean Star Store →</Link></p>
            <p><Link className="identity-inline-link" href="/business">Create a community or nonprofit workspace →</Link></p>
          </section>
          <section className="identity-panel">
            <h2>Careers</h2>
            <p>We do not have company career opportunities to share on this page right now. We will add information here when opportunities become available.</p>
          </section>
        </div>
      </main>
    </>
  );
}
