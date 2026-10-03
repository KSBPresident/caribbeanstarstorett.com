import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Create a post",
  description: "Choose the right place to list a product, grow a business, post an opportunity, or share a buying request on Caribbean Star Store.",
};

const postTypes = [
  { eyebrow: "FOR SELLERS", title: "Product listing", text: "List a product with its category, accurate details, price, available quantity, and a clear photo.", href: "/seller/inventory", action: "Manage product listings" },
  { eyebrow: "FOR BUSINESSES", title: "Business or service profile", text: "Set up your organization profile so customers can discover your business and the services you offer.", href: "/business", action: "Open business workspace" },
  { eyebrow: "FOR EMPLOYERS", title: "Job opportunity", text: "Publish a clear role with its location, work arrangement, requirements, and application contact.", href: "/business", action: "Post from a workspace" },
  { eyebrow: "FOR PROPERTY OWNERS", title: "Property listing", text: "Share a property with its location, price or rent, key features, and accurate availability.", href: "/business", action: "Post from a workspace" },
  { eyebrow: "FOR BUYERS", title: "Buying request", text: "Tell sellers what you are looking for and the category that best matches your request.", href: "/build-a-buy", action: "Create a buying request" },
];

export default function CreatePostPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page directory-page">
        <header className="directory-hero">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · MARKETPLACE</span>
          <h1>What would you like to post?</h1>
          <p>Choose a post type and we’ll take you to the right workspace. Clear categories and complete details help customers find and compare what they need.</p>
          <div className="directory-hero-actions">
            <Link className="identity-submit" href="/sell">Become a seller</Link>
            <Link className="directory-secondary" href="/how-it-works">How it works</Link>
          </div>
        </header>
        <section className="create-post-grid" aria-label="Choose what to post">
          {postTypes.map((type) => (
            <article className="create-post-card" key={type.title}>
              <span className="identity-eyebrow">{type.eyebrow}</span>
              <h2>{type.title}</h2>
              <p>{type.text}</p>
              <Link className="identity-submit" href={type.href}>{type.action}</Link>
            </article>
          ))}
        </section>
        <aside className="create-post-note">
          Product, business, job, and property publishing requires an account and the appropriate approved workspace access. Start with a seller application if you do not yet have a seller workspace. You can save eligible product listings as drafts before publishing.
        </aside>
      </main>
    </>
  );
}
