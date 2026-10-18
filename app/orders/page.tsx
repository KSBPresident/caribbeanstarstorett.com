import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { signInUrl } from "../../lib/auth/return-path";

export const metadata: Metadata = {
  title: "Your orders",
  description: "Review your Caribbean Star Store order history.",
  robots: { index: false, follow: false },
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discounted_subtotal: number;
};

type OrderRow = {
  id: string;
  payment_reference: string;
  status: string;
  created_at: string;
  destination_country: string;
  currency: string;
  total: number;
  checkout_order_items: OrderItem[];
};

function statusLabel(status: string) {
  if (status === "paid") return "Paid";
  if (status === "payment_failed") return "Payment not completed";
  if (status === "expired") return "Expired";
  return "Payment processing";
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}

export default async function OrdersPage() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/orders"));

  const { data, error } = await supabase.from("checkout_orders")
    .select("id, payment_reference, status, created_at, destination_country, currency, total, checkout_order_items(id, product_name, quantity, unit_price, discounted_subtotal)")
    .eq("buyer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const orders = (data || []) as unknown as OrderRow[];

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading">
          <div><span className="identity-eyebrow">YOUR ACCOUNT</span><h1>Your orders</h1><p>Review card payment status and the items in your recent orders.</p></div>
          <Link className="identity-secondary" href="/dashboard">Back to My Account</Link>
        </header>
        {error ? (
          <p className="identity-message identity-error" role="alert">We couldn’t load your orders. Refresh and try again.</p>
        ) : orders.length ? (
          <div className="seller-app-list">
            {orders.map((order) => (
              <section className="identity-panel" key={order.id}>
                <div className="seller-app-heading"><strong>Order {order.payment_reference}</strong><span className={order.status === "paid" ? "seller-status seller-status-approved" : "seller-status"}>{statusLabel(order.status)}</span></div>
                <p>{new Date(order.created_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })} · Delivery to {order.destination_country}</p>
                <div className="account-activity-list">
                  {(order.checkout_order_items || []).map((item) => (
                    <article key={item.id}><div><strong>{item.product_name}</strong><span>Quantity {item.quantity} · {money(Number(item.discounted_subtotal), order.currency)}</span></div></article>
                  ))}
                </div>
                <p><strong>Order total: {money(Number(order.total), order.currency)}</strong></p>
                {order.status === "paid" ? <p className="catalog-meta">Payment is confirmed. Contact the seller for delivery updates.</p> : order.status === "pending_payment" ? <p className="catalog-meta">Payment has not been confirmed yet. Check again before placing another order.</p> : <p className="catalog-meta">This order was not completed. You can return to your cart to try again.</p>}
              </section>
            ))}
          </div>
        ) : (
          <section className="identity-panel"><h2>No orders yet</h2><p>Orders placed through Caribbean Star Store will appear here.</p><Link className="identity-submit" href="/marketplace">Browse products</Link></section>
        )}
      </main>
    </>
  );
}
