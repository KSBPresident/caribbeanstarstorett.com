import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Help & Information",
  description: "Learn about Caribbean Star Store, selling, bidding, payments, refunds, shipping, and store policies.",
  alternates: { canonical: "/help" },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store",
    title: "Help & Information | Caribbean Star Store",
    description:
      "Get help with selling, bidding, payments, refunds, shipping and policies at Caribbean Star Store.",
  
    images: [{ url: "/opengraph-image", alt: "Caribbean Star Store — Connecting the community across the Caribbean" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help & Information | Caribbean Star Store",
    description:
      "Get help with selling, bidding, payments, refunds, shipping and policies at Caribbean Star Store.",
  
    images: ["/twitter-image"],
  },
};

const topics = [
  ["about", "About CSS"], ["sell", "Sell & advertise"], ["bidding", "Bidding"],
  ["payments", "Payments"], ["search", "Search tips"], ["refunds", "Refunds"],
  ["shipping", "Shipping"], ["orders", "Orders"], ["terms", "Terms & conditions"],
] as const;

export default function HelpPage() {
  return <>
    <SiteHeader />
    <style>{".help-page{max-width:1200px}.help-hero{margin-bottom:22px}.help-nav{display:flex;gap:8px;overflow-x:auto;padding:12px;margin:0 0 30px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffffef;backdrop-filter:blur(10px)}.help-nav a{flex:none;padding:9px 12px;border-radius:20px;background:#f3f7fb;color:#18549a;font-size:12px;font-weight:800}.help-section{scroll-margin-top:120px;margin:36px 0}.help-section>h2{margin:7px 0 15px;font-size:clamp(22px,3vw,30px);color:#132d47}.help-card{padding:22px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 8px 24px #12304b08;color:#526071;font-size:13px;line-height:1.75}.help-card p:first-child{margin-top:0}.help-card p:last-child{margin-bottom:0}.help-card h3{margin:18px 0 6px;color:#172033;font-size:16px}.help-card ul,.help-card ol{padding-left:22px}.help-grid{margin-top:14px}.help-grid .directory-card>p{min-height:0}.help-callout,.help-intro{color:#526071;font-size:13px;line-height:1.7}.help-callout{margin:18px 0;padding:15px 18px;border-radius:9px;background:#eaf4ff}.help-callout a{color:#0877df;font-weight:800}.help-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.help-terms{margin:10px 0}.help-terms summary{color:#172033;font-weight:800;cursor:pointer}.help-terms[open] summary{margin-bottom:12px}.help-contact{padding:26px;border-radius:14px;background:#eff6fc}.help-contact>p{color:#526071;font-size:13px;line-height:1.7}.help-contact .directory-secondary{border-color:#18549a;color:#18549a}@media(max-width:680px){.help-section{margin:28px 0}.help-card{padding:17px}.help-grid-two{grid-template-columns:1fr}.help-nav{margin-inline:-2%;border-radius:0}.help-contact .directory-hero-actions{flex-direction:column}.help-contact .directory-hero-actions>*{width:100%}}"}</style>
    <main id="main-content" tabIndex={-1} className="identity-page directory-page help-page">
      <section className="directory-hero help-hero">
        <span className="identity-eyebrow">Caribbean Star Store</span>
        <h1>Here to help you shop, sell and grow.</h1>
        <p>Find answers about your account, orders, payments, shipping, bidding and building a business with Caribbean Star Store.</p>
        <div className="directory-hero-actions"><Link className="identity-submit" href="/marketplace">Explore the marketplace</Link><a className="directory-secondary" href="#contact">Contact CSS</a></div>
      </section>

      <div className="help-callout" role="note"><strong>Storefront status:</strong> Caribbean Star Store checkout is not open yet. Orders, payment processing, account order tracking and refunds are not available through this site at this time. The guidance below reflects policies supplied for CSS; confirm that each service is active before placing an order. Never send payment outside an enabled Caribbean Star Store checkout.</div>

      <nav className="help-nav" aria-label="Help topics">{topics.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>

      <section id="about" className="help-section">
        <span className="identity-eyebrow">GET TO KNOW US</span><h2>About Caribbean Star Store</h2>
        <div className="help-card"><p>Caribbean Star Store is a retail platform where business owners can sell a variety of new and used products. We strive to create a positive impact on customers, employees, small businesses and the communities where we operate. Our team of passionate builders shares a desire to offer customers quality and innovative products.</p><p>At Caribbean Star Store, our customers are our priority.</p></div>
        <div className="directory-grid help-grid">
          <article className="directory-card"><div className="directory-card-mark">✦</div><h3>Supporting businesses</h3><p>CSS helps businesses reach customers through the marketplace, giving them an opportunity to compete and showcase their products and services.</p></article>
          <article className="directory-card"><div className="directory-card-mark">↗</div><h3>Our impact</h3><p>We bring businesses and shoppers together around a variety of products, choice and convenient online discovery.</p></article>
          <article className="directory-card"><div className="directory-card-mark">★</div><h3>Careers</h3><p>We do not have company career opportunities to share right now. We will post information here when opportunities become available.</p></article>
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
        <div className="help-card"><p>In an auction, a seller sets a starting price and buyers place bids against one another. A bid is a commitment to purchase if you win, so review the listing and its terms before bidding.</p><h3>Getting a product listed</h3><p>Auction listings are available to sellers or vendors with a store on the platform. Sellers can contact Caribbean Star Store with information about their product to request an auction listing. Listings remain subject to platform review and availability.</p><p><Link className="directory-card-link" href="/auctions">See the Auctions section →</Link></p></div>
      </section>

      <section id="payments" className="help-section">
        <span className="identity-eyebrow">CHECKING OUT</span><h2>Payments</h2>
        <div className="help-card"><p>Payments are intended to be charged in U.S. dollars. When checkout opens, available methods may vary by country.</p><p>Payment methods supplied for CSS include:</p><ul><li>PayPal</li><li>Credit card</li><li>WiPay</li></ul><p>Confirm the methods and total shown in an active checkout before placing an order. Additional methods may become available.</p><p>Seller fees and payout timing are described in the seller terms below; confirm current terms with CSS before selling.</p></div>
      </section>

      <section id="search" className="help-section">
        <span className="identity-eyebrow">FIND WHAT YOU NEED</span><h2>Basic search tips</h2>
        <div className="help-card"><p>Search for products by entering a product name in the search bar at the top of the marketplace. Select a product name or image to view its details. Try a shorter phrase or another category if you do not find what you are looking for.</p><Link className="directory-card-link" href="/marketplace">Search the marketplace →</Link></div>
      </section>

      <section id="refunds" className="help-section">
        <span className="identity-eyebrow">PURCHASE PROTECTION</span><h2>Refunds & money-back guarantee</h2>
        <div className="help-grid-two">
          <article className="help-card"><h3>PayPal refunds</h3><p>Approved PayPal refunds are returned to the original PayPal account used for payment. CSS will send an email notification when the refund is processed. Bank clearance may take about 3–4 business days.</p><h3>Credit card refunds</h3><p>For an eligible refund on a credit-card purchase, contact CSS with the item number and account details. Once issued, your bank may take 3–4 business days to post it.</p></article>
          <article className="help-card"><h3>Money-back guarantee</h3><p>The CSS Money-Back Guarantee applies to eligible purchases at no extra fee. If an item has not arrived or is not as described, first contact your seller through your account and explain the issue.</p><p>If it remains unresolved after three business days, contact CSS. Any refund remains subject to the applicable order terms and eligibility.</p></article>
        </div>
      </section>

      <section id="shipping" className="help-section">
        <span className="identity-eyebrow">DELIVERY</span><h2>Shipping help</h2>
        <div className="help-card"><h3>Track a package</h3><ol><li>Sign in to your CSS account.</li><li>Open your order and select tracking.</li><li>Review the logistics information and tracking number.</li></ol><h3>How long does delivery take?</h3><p>Orders generally take 5–10 working days to arrive. Delivery times can vary by seller and destination. If your order has not shipped by the agreed date, contact the seller or CSS for an update or to request help.</p></div>
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

            <section id="full-terms" className="help-section">
        <span className="identity-eyebrow">FULL POLICY</span>
        <h2>Full terms and conditions</h2>
        <details className="help-card help-terms">
          <summary>Read the full terms supplied by Caribbean Star Store</summary>
          <h3>Conditions of use</h3>
          <p>Welcome to CaribbeanStarStore. CaribbeanStarStore (CSS) is here to provide a safe online market/platform to help communities connect through the sale of goods and services. CSS aims to provide a quality marketplace where vendors can communicate with clients and merchants locally and overseas to optimize sales. The services we provide are subject to the following conditions. Please read carefully.</p>
          <h3>Vendor policy agreement</h3>
          <p>To sign up as a vendor, click “Seller Registration” at the top of the website. Once registered, you will receive a reply within 24 hours with an application form and terms of agreement. Email the completed form to CaribbeanStarStore. There are no monthly fees or hidden charges; however, CSS is entitled to 15% of the cost of each item purchased from your online store inventory. This will be deducted automatically upon purchase.</p>
          <p>Prices are quoted in U.S. dollars. Payment platforms available to customers include PayPal, WiPay and direct bank transfers. Vendors receive half of the purchase cost after an order is placed, and the second half is dispatched once the item(s) are forwarded to the buyer. A further 2% is deducted to facilitate bank transfer fees. Vendor store features include coupons, vacation mode and reports sheet analytics.</p>
          <h3>Vendor rules and regulations</h3>
          <p>All disputes between vendors and customers are to be dealt with in a timely manner. Any breach of CSS terms and agreement would be addressed as per the company's protocols.</p>
          <h3>Auction/bidding</h3>
          <p>In an auction listing, vendors/sellers add a starting price to a product and buyers bid against one another. Auction/bidding is available only to sellers/vendors who register and have their own store on our platform. Sellers/vendors should contact Caribbean Star Store by email or phone with product information to request an auction listing.</p>
          <h3>Membership account</h3>
          <p>You are responsible for maintaining the confidentiality of your account and password, restricting access to your computer, and accepting responsibility for all activities under your account or password. The supplied terms say that anyone under 18 may use the website only with the involvement of a parent or guardian. They also reserve CSS’s discretion to edit content or cancel orders.</p>
          <h3>Product descriptions</h3>
          <p>CaribbeanStarStore (CSS) and its associates attempt to be as accurate as possible. As such, CSS warrants that product descriptions or other content of this site be accurate, complete, reliable, current, or error-free. However, if a product offered by Caribbean Star Store is not as described, your sole remedy is to return it in an unused condition with a new tracking number to facilitate return/exchange.</p>
          <h3>Reviews, comments, emails and other content</h3>
          <p>Visitors may post reviews, comments and other content and submit suggestions, ideas, comments, questions or other information, provided the content is not illegal, obscene, threatening, defamatory, invasive of privacy, infringing on intellectual property rights, injurious to third parties or objectionable. It must not contain software viruses, political campaigning, commercial solicitation, chain letters, mass mailing or spam. You may not use a false email address, impersonate any individual or entity, or mislead others as to the origin of a card or other content. Caribbean Star Store reserves the right, but not the obligation, to remove or edit such content and does not regularly review posted content.</p>
          <p>If you post content or submit material, and unless CSS indicates otherwise, you grant CaribbeanStarStore and its associates a nonexclusive, royalty-free, perpetual, irrevocable and fully sublicensable right to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute and display such content throughout the world in any media. You grant CSS and its associates and sublicensees the right to use the name you submit with such content if it chooses. You represent and warrant that you own or control the rights to content you post; that it is accurate; that its use does not violate this policy or injure any person or entity; and that you will indemnify Caribbean Star Store or its associates for claims resulting from content you supply.</p>
          <p>CaribbeanStarStore (CSS) has the right, but not the obligation, to monitor and edit or remove activity or content. CSS takes no responsibility and assumes no liability for content posted by you or any third party.</p>
          <h3>Privacy</h3>
          <p>Please review our Privacy Notice, which also governs your visit to our website, to understand our practices.</p>
          <h3>Electronic communications</h3>
          <p>When you visit CaribbeanStarStore (CSS) or send emails to us, you are communicating with us electronically. You consent to receive communications from us electronically. We will communicate by email or by posting notices on this site. You agree that agreements, notices, disclosures and other communications provided electronically satisfy any legal requirement for written communications.</p>
          <h3>Copyright</h3>
          <p>All content on this site, such as text, graphics, logos, icons, images, audio, downloads, data compilations and software, is the property of Caribbean Star Store (CSS) or its content suppliers and is protected by international copyright laws. The compilation of this content is the exclusive property of CSS.</p>
          <h3>Trade marks</h3>
          <p>CaribbeanStarStore (CSS) trademarks and trade dress may not be used with a product or service that is not CSS in a manner likely to cause confusion or disparage or discredit CSS. Other trademarks are the property of their respective owners, who may or may not be affiliated with CSS.</p>
          <h3>Risk of loss</h3>
          <p>Items purchased from Caribbean Star Store are made pursuant to a shipment contract. Risk of loss and title pass to you upon delivery to the carrier. Contact your vendor/seller for help with package updates or misunderstandings. If the vendor/seller does not resolve the issue, contact CSS.</p>
          <h3>Disclaimer of warranties and limitation of liability</h3>
          <p>Warranty will be attached to vendors' descriptions and not CaribbeanStarStore. CSS makes no representations or warranties of any kind, expressed or implied, on information, content, materials or products on this site.</p>
          <p>You expressly agree that your use of this site is at your sole risk to the full extent permissible by applicable law. This site, its servers and emails sent from CaribbeanStarStore are represented as free of viruses or other harmful components. CSS will not be liable for damages arising from use of this site, including direct, indirect, incidental, punitive and consequential damages. Some state laws do not allow limits on implied warranties or certain damages. If those laws apply, some disclaimers, exclusions or limitations may not apply and you may have additional rights.</p>
          <h3>Money back guarantee</h3>
          <p>CaribbeanStarStore's money back guarantee applies to most products on the website.</p>
          <h3>Applicable law</h3>
          <p>By visiting CaribbeanStarStore, you agree that the principle law will govern these Conditions of Use and disputes that may arise between you and CaribbeanStarStore or its associates. The supplied wording does not identify the governing law in this section.</p>
          <h3>Disputes</h3>
          <p>Disputes related to your visit to Caribbean Star Store or products purchased through CSS are stated to be submitted to confidential arbitration in Trinidad and Tobago/CARICOM, except where you have violated or threatened to violate Caribbean Star Store intellectual property rights.</p>
          <p>The Company may seek injunctive or other appropriate relief in any federal court in Trinidad and Tobago/CARICOM, and you consent to exclusive jurisdiction and venue in such courts. The arbitrator award shall be binding and may be entered as a judgment in any court of competent jurisdiction to the fullest extent permitted by applicable law. No arbitration under this Agreement shall be joined to an arbitration involving another party subject to this Agreement, including through class arbitration proceedings.</p>
          <h3>Site policies, modification and severability</h3>
          <p>Please review other policies, such as Caribbean Star Store's Shipping and Returns Policy, posted on this site. These policies also govern your visit. We reserve the right to change our policies and conditions of use at any time. If any condition is deemed invalid, it shall be severable and shall not affect the validity and enforceability of any remaining condition.</p>
          <h3>Questions and help</h3>
          <p>Questions regarding these Conditions of Use, Privacy Policy or other policy material can be directed to support by clicking the “Contact Us” link in the side menu, emailing caribbeanstarstore@gmail.com, or calling (239) 330-8955.</p>
        </details>
      </section>
              
<section id="contact" className="help-section help-contact">
        <span className="identity-eyebrow">WE’RE HERE TO HELP</span><h2>Contact Caribbean Star Store</h2>
        <p>For order, seller, refund or account questions, include the relevant order or item details when you contact CSS.</p>
        <div className="directory-hero-actions"><a className="identity-submit" href="mailto:caribbeanstarstore@gmail.com">Email CSS</a><a className="directory-secondary" href="tel:+12393308955">Call (239) 330-8955</a></div>
      </section>
    </main>
  </>;
}
