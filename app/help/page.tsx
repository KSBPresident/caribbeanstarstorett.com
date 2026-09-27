import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Help & Information | Caribbean Star Store TT",
  description: "Learn about Caribbean Star Store TT, selling, bidding, payments, refunds, shipping, and store policies.",
};

const topics = [
  ["about", "About CSS"], ["sell", "Sell & advertise"], ["bidding", "Bidding"],
  ["payments", "Payments"], ["search", "Search tips"], ["refunds", "Refunds"],
  ["shipping", "Shipping"], ["orders", "Orders"], ["terms", "Terms & conditions"],
] as const;

export default function HelpPage() {
  return <>
    <SiteHeader />
    <style>{".help-page{max-width:1200px}.help-hero{margin-bottom:22px}.help-nav{position:sticky;top:0;z-index:10;display:flex;gap:8px;overflow-x:auto;padding:12px;margin:0 0 30px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffffef;backdrop-filter:blur(10px)}.help-nav a{flex:none;padding:9px 12px;border-radius:20px;background:#f3f7fb;color:#18549a;font-size:12px;font-weight:800}.help-section{scroll-margin-top:82px;margin:36px 0}.help-section>h2{margin:7px 0 15px;font-size:clamp(22px,3vw,30px);color:#132d47}.help-card{padding:22px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 8px 24px #12304b08;color:#526071;font-size:13px;line-height:1.75}.help-card p:first-child{margin-top:0}.help-card p:last-child{margin-bottom:0}.help-card h3{margin:18px 0 6px;color:#172033;font-size:16px}.help-card ul,.help-card ol{padding-left:22px}.help-grid{margin-top:14px}.help-grid .directory-card>p{min-height:0}.help-callout,.help-intro{color:#526071;font-size:13px;line-height:1.7}.help-callout{margin:18px 0;padding:15px 18px;border-radius:9px;background:#eaf4ff}.help-callout a{color:#0877df;font-weight:800}.help-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.help-terms{margin:10px 0}.help-terms summary{color:#172033;font-weight:800;cursor:pointer}.help-terms[open] summary{margin-bottom:12px}.help-contact{padding:26px;border-radius:14px;background:#eff6fc}.help-contact>p{color:#526071;font-size:13px;line-height:1.7}.help-contact .directory-secondary{border-color:#18549a;color:#18549a}@media(max-width:680px){.help-section{margin:28px 0}.help-card{padding:17px}.help-grid-two{grid-template-columns:1fr}.help-nav{margin-inline:-2%;border-radius:0}.help-contact .directory-hero-actions{flex-direction:column}.help-contact .directory-hero-actions>*{width:100%}}"}</style>
    <main id="main-content" tabIndex={-1} className="identity-page directory-page help-page">
      <section className="directory-hero help-hero">
        <span className="identity-eyebrow">CARIBBEAN STAR STORE TT</span>
        <h1>Here to help you shop, sell and grow.</h1>
        <p>Find answers about your account, orders, payments, shipping, bidding and building a business with Caribbean Star Store.</p>
        <div className="directory-hero-actions"><Link className="identity-submit" href="/marketplace">Explore the marketplace</Link><a className="directory-secondary" href="#contact">Contact CSS</a></div>
      </section>

      <nav className="help-nav" aria-label="Help topics">{topics.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>

      <section id="about" className="help-section">
        <span className="identity-eyebrow">GET TO KNOW US</span><h2>About Caribbean Star Store</h2>
        <div className="help-card"><p>Caribbean Star Store is a retail platform where business owners can sell a variety of new and used products. We strive to create a positive impact on customers, employees, small businesses and the communities where we operate. Our team of passionate builders shares a desire to offer customers quality and innovative products.</p><p>At Caribbean Star Store, our customers are our priority.</p></div>
        <div className="directory-grid help-grid">
          <article className="directory-card"><div className="directory-card-mark">✦</div><h3>Supporting businesses</h3><p>CSS helps businesses reach customers through the marketplace, giving them an opportunity to compete and showcase their products and services.</p></article>
          <article className="directory-card"><div className="directory-card-mark">↗</div><h3>Our impact</h3><p>We bring businesses and shoppers together around a variety of products, choice and convenient online discovery.</p></article>
          <article className="directory-card"><div className="directory-card-mark">★</div><h3>Careers</h3><p>We welcome people who share our commitment to customers, local businesses and building a better marketplace. Contact CSS to ask about opportunities.</p></article>
        </div>
      </section>

      <section id="sell" className="help-section">
        <span className="identity-eyebrow">MAKE MONEY WITH US</span><h2>Sell and advertise on CSS</h2>
        <div className="directory-grid help-grid">
          <article className="directory-card"><div className="directory-card-mark">◎</div><h3>Reach more clients</h3><p>Introduce your business and products to shoppers using Caribbean Star Store.</p></article>
          <article className="directory-card"><div className="directory-card-mark">▣</div><h3>Focus on your business</h3><p>Sellers manage their products, packing, shipping, customer service and returns.</p></article>
          <article className="directory-card"><div className="directory-card-mark">↗</div><h3>Get your products seen</h3><p>Use relevant product titles and keywords to improve visibility in search. Advertising can help increase product reach.</p></article>
          <article className="directory-card"><div className="directory-card-mark">⌂</div><h3>Your own store</h3><p>Build customer loyalty with a store on Caribbean Star Store and present your business in one place.</p></article>
          <article className="directory-card"><div className="directory-card-mark">✧</div><h3>Showcase your brand</h3><p>Customize your store page and logo, then organize your inventory for shoppers.</p></article>
          <article className="directory-card"><div className="directory-card-mark">⌕</div><h3>Promote products</h3><p>Clear product information and useful keywords help shoppers discover individual listings.</p></article>
        </div>
        <p className="help-callout">Seller registration and store access are subject to CSS review and platform availability. <Link href="/sell">Learn about selling</Link>.</p>
      </section>

      <section id="bidding" className="help-section">
        <span className="identity-eyebrow">MORE HELP</span><h2>How bidding works</h2>
        <div className="help-card"><p>In an auction, a seller sets a starting price and buyers place bids against one another. A bid is a commitment to purchase if you win, so review the listing and its terms before bidding.</p><h3>Getting a product listed</h3><p>Auction listings are available to sellers or vendors with a store on the platform. Sellers can contact Caribbean Star Store with information about their product to request an auction listing. Listings remain subject to platform review and availability.</p></div>
      </section>

      <section id="payments" className="help-section">
        <span className="identity-eyebrow">CHECKING OUT</span><h2>Payments</h2>
        <div className="help-card"><p>Payments on CSS are charged in U.S. dollars. Available payment methods may vary by country.</p><ul><li>PayPal</li><li>Credit card</li><li>WiPay</li><li>Direct bank transfer where offered</li></ul><p>Additional payment methods may become available. Confirm the methods and total displayed at checkout before placing an order.</p><p>Seller fees and payout timing are described in the seller terms below.</p></div>
      </section>

      <section id="search" className="help-section">
        <span className="identity-eyebrow">FIND WHAT YOU NEED</span><h2>Basic search tips</h2>
        <div className="help-card"><p>Search for products by entering a product name in the search bar at the top of the marketplace. Select a product name or image to view its details. Try a shorter phrase or another category if you do not find what you are looking for.</p><Link className="directory-card-link" href="/marketplace">Search the marketplace →</Link></div>
      </section>

      <section id="refunds" className="help-section">
        <span className="identity-eyebrow">PURCHASE PROTECTION</span><h2>Refunds & money-back guarantee</h2>
        <div className="help-grid-two">
          <article className="help-card"><h3>PayPal refunds</h3><p>Approved PayPal refunds are returned to the original PayPal account used for payment. CSS will send an email notification when the refund is processed. Bank clearance may take about 3–4 business days.</p><h3>Credit card refunds</h3><p>For an eligible refund on a credit-card purchase, contact CSS with the item number and account details. Once issued, your bank may take 3–4 business days to post it.</p></article>
          <article className="help-card"><h3>Money-back guarantee</h3><p>The supplied CSS policy says eligible purchases are covered without an extra fee. If an item has not arrived or is not as described, first contact the seller through your account and explain the issue.</p><p>If it remains unresolved after three business days, contact CSS. Any refund remains subject to the applicable order terms and eligibility.</p></article>
        </div>
      </section>

      <section id="shipping" className="help-section">
        <span className="identity-eyebrow">DELIVERY</span><h2>Shipping help</h2>
        <div className="help-card"><h3>Track a package</h3><ol><li>Sign in to your CSS account.</li><li>Open your order and select tracking.</li><li>Review the logistics information and tracking number.</li></ol><h3>How long does delivery take?</h3><p>Orders are generally expected to arrive within 5–10 working days. Delivery time can vary by seller and destination. If your order has not shipped by the agreed date, contact the seller or CSS for an update or to request help.</p></div>
      </section>

      <section id="orders" className="help-section">
        <span className="identity-eyebrow">YOUR ACCOUNT</span><h2>Ordering help</h2>
        <div className="help-grid-two">
          <article className="help-card"><h3>Confirm an order</h3><p>Sign in to your CSS account, open Orders, and select the item to view its details and status.</p></article>
          <article className="help-card"><h3>Cancel a paid order</h3><p>You may request cancellation before the seller ships the item. Open your order and use the cancellation option if available. Contact CSS with the item and purchase information so the request can be handled promptly. A cancellation is subject to the order status and seller processing.</p></article>
        </div>
      </section>

      <section id="terms" className="help-section">
        <span className="identity-eyebrow">SITE POLICIES</span><h2>Terms and conditions</h2>
        <p className="help-intro">These points organize the terms supplied for Caribbean Star Store. Review the full policies and applicable law before relying on them for a transaction.</p>
        <details className="help-card help-terms"><summary>Use of the site and accounts</summary><p>By using Caribbean Star Store, you agree to follow the site’s terms and policies. Keep your account credentials confidential and notify CSS if you suspect unauthorized use. Users must be old enough to use the service under applicable law; minors should use the site only with a parent or guardian where required.</p><p>Product information is provided by sellers. Review descriptions, condition, price, shipping and return details before purchasing. Site content, trademarks and other intellectual property remain protected. User-submitted comments and reviews must follow site rules and may be used to operate and display the service.</p></details>
        <details className="help-card help-terms"><summary>Orders, payments and delivery</summary><p>Payments are shown and processed in U.S. dollars using the methods available for the buyer’s country, including PayPal, credit cards and WiPay where supported. The supplied seller terms state a 15% selling fee and a 2% bank-transfer fee. They also describe seller payout in two parts: one half at order and the balance when the order is forwarded. Confirm current fees and payout details with CSS before selling.</p><p>Risk of loss and delivery responsibility follow the applicable order and shipping terms. Shipping estimates vary by destination and seller. Returns, cancellations and refunds are governed by the listing, order status and applicable CSS policies.</p></details>
        <details className="help-card help-terms"><summary>Seller tools, auctions and conduct</summary><p>Sellers may have access to coupons, vacation mode and reports, subject to platform availability and seller rules. Auction listings are for approved sellers with stores. A bid is a commitment to buy if the bidder wins. Sellers must provide accurate listing details and follow the seller terms.</p></details>
        <details className="help-card help-terms"><summary>Privacy, communications and site changes</summary><p>Use of personal information is covered by the site privacy notice. Electronic communications may be used for account, order and service updates. CSS may update site policies; where permitted, continued use after changes take effect constitutes acceptance. If a provision is unenforceable, the remaining provisions continue to apply to the extent allowed by law.</p></details>
        <details className="help-card help-terms"><summary>Disputes and governing law</summary><p>The supplied terms refer to the laws of Trinidad and Tobago and CARICOM and describe dispute resolution or arbitration. The precise scope and enforceability depend on the complete terms and applicable law; obtain qualified legal review before relying on this summary.</p></details>
      </section>

      <section id="contact" className="help-section help-contact">
        <span className="identity-eyebrow">WE’RE HERE TO HELP</span><h2>Contact Caribbean Star Store</h2>
        <p>For order, seller, refund or account questions, include the relevant order or item details when you contact CSS.</p>
        <div className="directory-hero-actions"><a className="identity-submit" href="mailto:caribbeanstarstore@gmail.com">Email CSS</a><a className="directory-secondary" href="tel:+12393308955">Call (239) 330-8955</a></div>
      </section>
    </main>
  </>;
}
