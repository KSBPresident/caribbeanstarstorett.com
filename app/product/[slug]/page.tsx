import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { money } from "../../../lib/store-data";
import { getStoreProductBySlug } from "../../../lib/store-catalog";
import { AddToCartButton } from "../../../components/add-to-cart-button";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/product/${encodeURIComponent(slug)}`;
  const { product } = await getStoreProductBySlug(slug);
  if (!product) {
    return {
      title: "Product details",
      description: "Product listings are temporarily unavailable here.",
      alternates: { canonical },
    };
  }

  const description = (product.description || `Shop ${product.name} through Caribbean Star Store. See this page for current product details and checkout availability.`)
    .replace(/\s+/g, " ")
    .slice(0, 160);

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getStoreProductBySlug(slug);
  const product = result.product;
  if (!product && result.status === "not-found") notFound();

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="product-detail">
        {product ? (
          <>
            <div className="breadcrumbs"><Link href="/">Home</Link> › {product.category} › {product.name}</div>
            <section className="detail-main">
              <div className="main-product-image"><img src={product.image} alt={product.name} /></div>
              <div className="detail-info">
                <h1>{product.name}</h1>
                {product.reviews > 0 ? <div className="rating">★ <b>{product.rating.toFixed(1)}</b> <span>({product.reviews} reviews)</span></div> : <p className="catalog-meta">No customer reviews yet</p>}
                <strong className="detail-price">{money(product.price, product.currency, product.currencyMinorUnit)}</strong>
                <p className={product.inStock ? "stock" : "catalog-meta"}>{product.inStock ? "Available" : "Check availability"}</p>
                <div className="seller-box"><b>Caribbean Star Store product listing</b><small>Product information and checkout will be available here after launch.</small></div>
                <p className="catalog-meta">Delivery, warranty, and return information will appear with each listing.</p>
                <AddToCartButton product={product} className="buy-now" />
                <p className="catalog-meta">Checkout will be available after the marketplace checkout service is connected.</p>
              </div>
            </section>
            <section className="detail-tabs"><b>Product details</b><div><p>{product.description || "No additional product details are available yet."}</p></div></section>
          </>
        ) : (
          <section className="identity-panel catalog-unavailable">
            <span className="identity-eyebrow">STORE CONNECTION</span>
            <h1>Product details are temporarily unavailable</h1>
            <p>Product details are not available yet. Browse the marketplace or explore businesses and opportunities.</p>
            <div className="cart-empty-actions">
              <Link className="identity-submit" href="/marketplace">Browse products</Link>
              <Link className="identity-secondary" href="/businesses">Explore businesses</Link>
              <Link className="identity-secondary" href="/opportunities">View opportunities</Link>
              
            </div>
          </section>
        )}
      </main>
    </>
  );
}
