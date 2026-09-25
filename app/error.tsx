"use client";

import Link from "next/link";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  void error;

  return (
    <main id="main-content" tabIndex={-1} className="identity-page">
      <section className="identity-panel catalog-unavailable" role="alert" aria-labelledby="site-error-title">
        <span className="identity-eyebrow">CARIBBEAN STAR STORE · TEMPORARY ERROR</span>
        <h1 id="site-error-title">We couldn’t load this page</h1>
        <p>Something interrupted this page. Try again, or continue exploring the marketplace.</p>
        <div className="cart-empty-actions">
          <button className="identity-submit" type="button" onClick={reset}>Try again</button>
          <Link className="identity-secondary" href="/">Go to the marketplace</Link>
          <Link className="identity-secondary" href="/businesses">Explore businesses</Link>
          <Link className="identity-secondary" href="/opportunities">View opportunities</Link>
        </div>
      </section>
    </main>
  );
}
