import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { money } from "../../../lib/store-data";
import { getStoreProductBySlug } from "../../../lib/wordpress-store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getStoreProductBySlug(slug);
  if (!product) {
    return {
      title: "Product details",
      description: "Caribbean Star Store TT product listings are being prepared for launch.",
    };
  }

  const description = (product.description || `Shop ${product.name} through Caribbean Star Store TT. View the original listing for current details and checkout.`)
    .replace(/\s+/g, " ")
    .slice(0, 160);

  return {
    title: product.name,
    description,
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
      <main className="product-detail">
        {product ? (
          <>
            <div className="breadcrumbs"><Link href="/">Home</Link> › {product.category} › {product.name}</div>
            <section className="detail-main">
              <div className="main-product-image"><img src={product.image} alt={product.name} /></div>
              <div className="detail-info">
                <h1>{product.name}</h1>
                {product.reviews > 0 ? <div className="rating">★ <b>{product.rating.toFixed(1)}</b> <span>({product.reviews} reviews)</span></div> : <p className="catalog-meta">No customer reviews yet</p>}
                <strong className="detail-price">{money(product.price, product.currency, product.currencyMinorUnit)}</strong>
                <p className={product.inStock ? "stock" : "catalog-meta"}>{product.inStock ? "Available in the original store" : "Availability is shown by the original store"}</p>
                <div className="seller-box"><b>Caribbean Star Store product listing</b><small>Product information and checkout are managed by the original store.</small></div>
                <p className="catalog-meta">Check the original listing for current delivery, warranty, and return details.</p>
                <a className="buy-now" href={product.permalink}>View product and continue to checkout</a>
              </div>
            </section>
            <section className="detail-tabs"><b>Product details</b><div><p>{product.description || "See the original store listing for product details."}</p></div></section>
          </>
        ) : (
          <section className="identity-panel catalog-unavailable">
            <span className="identity-eyebrow">STORE CONNECTION</span>
            <h1>Product details are being prepared</h1>
            <p>This product is not available in the marketplace yet. Browse the product section again later, or explore businesses and opportunities now.</p>
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
