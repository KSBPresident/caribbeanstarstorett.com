import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/sign-in");
  return <>
    <SiteHeader />
    <main className="page">
      <section className="page-hero">
        <span className="eyebrow">MIDDLE OS / IDENTITY</span>
        <h1>Your Caribbean Star Store account.</h1>
        <p>Your identity is the entry point for organizations, roles, marketplace activity and trust.</p>
        <form action="/auth/sign-out" method="post"><button className="button primary" type="submit">Sign out</button></form>
      </section>
      <section className="content"><div className="feature-grid">
        <article className="card"><span>01</span><h2>Identity</h2><p>Authenticated account identity is established through Supabase Auth.</p></article>
        <article className="card"><span>02</span><h2>Organizations</h2><p>Business and individual organization membership is the next layer.</p></article>
        <article className="card"><span>03</span><h2>Roles & Trust</h2><p>Authorization and trust controls will be applied before commerce actions.</p></article>
      </div></section>
    </main>
  </>;
}
