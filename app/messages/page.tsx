import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { signInUrl } from "../../lib/auth/return-path";
import { replyToSellerConversation } from "./actions";

export const metadata: Metadata = {
  title: "Messages",
  description: "Messages between customers and Caribbean Star Store sellers.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ error?: string; notice?: string; page?: string }> };

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

const PAGE_SIZE = 25;

export default async function MessagesPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/messages"));

  const params = await searchParams;
  const isPlatformAdmin = user.app_metadata?.platform_role === "admin";
  const requestedPage = Number.parseInt(params.page || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const start = (page - 1) * PAGE_SIZE;
  const threadResult = await supabase.from("seller_conversations")
    .select("id, buyer_user_id, seller_organization_id, inventory_item_id, created_at, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false }).range(start, start + PAGE_SIZE - 1);
  const threads = threadResult.data || [];
  const ids = threads.map((thread) => thread.id);
  const [messageResult, organizationResult] = await Promise.all([
    ids.length ? supabase.from("seller_messages")
      .select("id, conversation_id, sender_user_id, body, created_at")
      .in("conversation_id", ids).order("created_at", { ascending: true }).limit(1000)
      : Promise.resolve({ data: [], error: null }),
    threads.length ? supabase.from("organizations")
      .select("id, name").in("id", [...new Set(threads.map((thread) => thread.seller_organization_id))])
      : Promise.resolve({ data: [], error: null }),
  ]);
  const messagesByThread = new Map<string, MessageRow[]>();
  const conversationMessages = (messageResult.data || []) as MessageRow[];
  for (const message of conversationMessages) {
    const current = messagesByThread.get(message.conversation_id) || [];
    current.push(message);
    messagesByThread.set(message.conversation_id, current);
  }
  const organizationNames = new Map((organizationResult.data || []).map((org) => [org.id, org.name]));
  const totalPages = Math.max(1, Math.ceil((threadResult.count || 0) / PAGE_SIZE));

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">{isPlatformAdmin ? "PLATFORM-WIDE MESSAGE REVIEW" : "CUSTOMER & SELLER MESSAGES"}</span>
            <h1>{isPlatformAdmin ? "All marketplace messages" : "Your messages"}</h1>
            <p>{isPlatformAdmin
              ? "Read-only view of customer and seller conversations across the platform."
              : "Contact a seller about a listing and continue the conversation here."}</p>
          </div>
          <Link className="identity-secondary" href={isPlatformAdmin ? "/admin" : "/marketplace"}>{isPlatformAdmin ? "Platform administration" : "Browse products"}</Link>
        </header>
        {params.notice === "sent" && <p className="identity-message" role="status">Your message was sent.</p>}
        {params.notice === "offer-sent" && <p className="identity-message" role="status">Your offer was sent to the seller. Check this conversation for their reply.</p>}
        {params.error && <p className="identity-message identity-error" role="alert">We couldn’t send that message. Refresh and try again.</p>}
        {threadResult.error || messageResult.error || organizationResult.error ? (
          <p className="identity-message identity-error" role="alert">{isPlatformAdmin ? "Messages could not be loaded. Confirm administrator access and refresh." : "Your conversations could not be loaded."}</p>
        ) : threads.length ? (
          <>
            {totalPages > 1 && <nav className="account-activity-list" aria-label="Message pages">
              <article><div><strong>Page {page} of {totalPages}</strong></div>
                {page > 1 && <Link className="identity-secondary" href={`/messages?page=${page - 1}`}>Newer conversations</Link>}
                {page < totalPages && <Link className="identity-secondary" href={`/messages?page=${page + 1}`}>Older conversations</Link>}
              </article>
            </nav>}
            <div className="seller-app-list">
              {threads.map((thread) => (
                <section className="identity-panel" key={thread.id}>
                  <span className="identity-eyebrow">{thread.buyer_user_id === user.id ? "YOUR SELLER INQUIRY" : isPlatformAdmin ? "CUSTOMER INQUIRY" : "CUSTOMER INQUIRY"}</span>
                  <h2>{organizationNames.get(thread.seller_organization_id) || "Seller"}</h2>
                  {thread.inventory_item_id && <p>Product listing reference: {thread.inventory_item_id}</p>}
                  <div className="account-activity-list">
                    {(messagesByThread.get(thread.id) || []).map((message) => (
                      <article key={message.id}><div><strong>{message.sender_user_id === thread.buyer_user_id ? "Customer" : "Seller"}</strong><span>{new Date(message.created_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</span><p style={{ whiteSpace: "pre-wrap" }}>{message.body}</p></div></article>
                    ))}
                  </div>
                  {!isPlatformAdmin && <form action={replyToSellerConversation} className="identity-form">
                    <input type="hidden" name="conversationId" value={thread.id} />
                    <label>Reply<textarea name="body" rows={3} minLength={1} maxLength={4000} required /></label>
                    <button className="identity-submit" type="submit">Send message</button>
                  </form>}
                </section>
              ))}
            </div>
            {totalPages > 1 && <nav className="account-activity-list" aria-label="Message pages">
              <article><div><strong>Page {page} of {totalPages}</strong></div>
                {page > 1 && <Link className="identity-secondary" href={`/messages?page=${page - 1}`}>Newer conversations</Link>}
                {page < totalPages && <Link className="identity-secondary" href={`/messages?page=${page + 1}`}>Older conversations</Link>}
              </article>
            </nav>}
          </>
        ) : (
          <section className="identity-panel"><h2>No conversations yet</h2><p>{isPlatformAdmin ? "No customer and seller conversations have been started." : "Open a product listing and use “Message seller” to ask a question."}{messageResult.data?.length === 0 && !isPlatformAdmin ? "" : ""}</p>{!isPlatformAdmin && <Link className="identity-submit" href="/marketplace">Browse the marketplace</Link>}</section>
        )}
      </main>
    </>
  );
}
