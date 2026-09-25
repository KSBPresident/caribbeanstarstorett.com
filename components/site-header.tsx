import Link from "next/link";
import { createClient } from "../lib/supabase/server";
import { isSupabaseConfigured } from "../lib/supabase/configured";

export async function SiteHeader() {
  let user: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"] = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const result = await supabase.auth.getUser();
      user = result.data.user;
    } catch {
      // Keep public navigation available if the auth service is temporarily unreachable.
    }
  }

  const isPlatformAdmin = user?.app_metadata?.platform_role === "admin";

  return (
    <header className="store-header">
      <div className="store-top">
        <Link className="store-brand" href="/" aria-label="Caribbean Star Store TT home">
          <img className="company-logo" src="/caribbean-star-store-logo.svg" alt="Caribbean Star Store — Connecting The Community" />
          <span><b>CARIBBEAN STAR STORE</b><small>TRINIDAD &amp; TOBAGO MARKETPLACE</small></span>
        </Link>
        <form action="/search" className="header-search" role="search" aria-label="Search the marketplace">
          <input name="q" maxLength={80} placeholder="Search products, services, businesses..." aria-label="Search products, services, businesses" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
        <div className="header-actions">
          <Link href="/sell">Sell</Link>
          {user ? <Link href="/dashboard">My Account</Link> : <Link href="/sign-in">Sign In</Link>}
          {isPlatformAdmin && <Link href="/admin">Platform Admin</Link>}
          <Link href="/cart" aria-label="Shopping cart">Cart</Link>
        </div>
      </div>
      <nav className="store-nav" aria-label="Main navigation">
        <Link href="/marketplace">Products</Link>
        <Link href="/businesses?category=professional">Services</Link>
        <Link href="/businesses">Businesses</Link>
        <Link href="/opportunities?type=jobs">Jobs</Link>
        <Link href="/opportunities?type=real-estate">Real Estate</Link>
        <Link href="/build-a-buy">Build-A-Buy</Link>
      </nav>
    </header>
  );
}