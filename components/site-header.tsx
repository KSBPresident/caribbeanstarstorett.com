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
        <a className="store-brand" href="/" aria-label="Caribbean Star Store TT home">
          <img className="company-logo" src="/caribbean-star-store-logo.svg" alt="Caribbean Star Store — Connecting The Community" />
          <span><b>CARIBBEAN STAR STORE</b><small>TRINIDAD &amp; TOBAGO MARKETPLACE</small></span>
        </a>
        <form action="/search" className="header-search" role="search" aria-label="Search the marketplace">
          <input name="q" placeholder="Search products, services, businesses..." aria-label="Search products, services, businesses" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
        <div className="header-actions">
          <a href="/sell">Sell</a>
          {user ? <a href="/dashboard">My Account</a> : <a href="/sign-in">Sign In</a>}
          {isPlatformAdmin && <a href="/admin">Platform Admin</a>}
          <a href="/cart" aria-label="Shopping cart">Cart</a>
        </div>
      </div>
      <nav className="store-nav" aria-label="Main navigation">
        <a href="/marketplace">Products</a>
        <a href="/businesses?category=professional">Services</a>
        <a href="/businesses">Businesses</a>
        <a href="/opportunities?type=jobs">Jobs</a>
        <a href="/opportunities?type=real-estate">Real Estate</a>
        <a href="/build-a-buy">Build-A-Buy</a>
      </nav>
    </header>
  );
}