import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Learn how shoppers, buyers, sellers, and Caribbean organizations use Caribbean Star Store TT.",
};

const steps = [
  {
    number: "01",
    title: "Find products",
    description: "Use product search and categories to explore the marketplace. Product listings and checkout are being prepared for launch.",
    href: "/marketplace",
    link: "Browse products",
  },
  {
    number: "02",
    title: "Discover businesses",
    description: "Browse public profiles and services shared by Caribbean businesses and organizations.",
    href: "/businesses",
    link: "Explore businesses",
  },
  {
    number: "03",
    title: "Look for opportunities",
    description: "See published job openings and real-estate listings posted by organizations.",
    href: "/opportunities",
    link: "View opportunities",
  },
  {
    number: "04",
    title: "Tell us what you need",
    description: "Sign in to save a private Build-A-Buy request for a product, service, job, property, or combination.",
    href: "/build-a-buy",
    link: "Create a buying request",
  },
  {
    number: "05",
    title: "Join as a seller or business",
    description: "Create an account to apply as a seller or set up an organization workspace. Workspace owners can draft and publish business profiles and opportunity listings.",
    href: "/sell",
    link: "Start seller onboarding",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="identity-page directory-page">
        <header className="directory-hero">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · GETTING STARTED</span>
          <h1>One marketplace for the Caribbean community.</h1>
          <p>Explore the marketplace, discover local businesses and opportunities, or create an account to take part in the community.</p>
          <div className="directory-hero-actions">
            <Link className="identity-submit" href="/marketplace">Explore the marketplace</Link>
            <Link className="directory-secondary" href="/sign-up">Create an account</Link>
          </div>
        </header>

        <section className="directory-results" aria-label="How to use the marketplace">
          <div className="directory-results-heading">
            <div><span className="identity-eyebrow">GET STARTED</span><h2>Choose what you want to do</h2></div>
            <span>Products · People · Opportunities</span>
          </div>
          <div className="directory-grid">
            {steps.map((step) => (
              <article className="directory-card" key={step.number}>
                <div className="directory-card-meta"><span>STEP {step.number}</span></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <Link className="directory-card-link" href={step.href}>{step.link} →</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
