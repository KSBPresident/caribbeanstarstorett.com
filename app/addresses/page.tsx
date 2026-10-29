import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { AddressBook } from "../../components/address-book";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { signInUrl } from "../../lib/auth/return-path";

export const metadata: Metadata = {
  title: "Delivery addresses",
  description: "Manage the delivery addresses saved to your Caribbean Star Store account.",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/addresses"));

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <p className="workspace-back"><Link href="/dashboard">← My account</Link></p>
        <header className="identity-heading">
          <div><span className="identity-eyebrow">ACCOUNT SETTINGS</span><h1>Delivery addresses</h1><p>Save, update, and choose the address you want to use for future orders.</p></div>
        </header>
        <p className="identity-note">Addresses are private to your account and are used for delivery. Sellers and other shoppers cannot view them.</p>
        <AddressBook />
      </main>
    </>
  );
}
