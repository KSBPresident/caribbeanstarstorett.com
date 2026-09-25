import Link from "next/link";
import { money } from "../lib/store-data";
import type { Product } from "../lib/store-data";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card store-product">
      <Link href={`/product/${product.slug}`} className="product-image">
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
        <span className="badge">{product.inStock ? "Available" : "Check availability"}</span>
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
        {product.reviews > 0 ? <div className="rating">★ <b>{product.rating.toFixed(1)}</b> <span>({product.reviews} reviews)</span></div> : <div className="catalog-meta">No reviews yet</div>}
        <strong className="price">{money(product.price, product.currency, product.currencyMinorUnit)}</strong>
        <p className="seller">Listed in the original store</p>
        <a className="add-cart" href={product.permalink}>View in store</a>
      </div>
    </article>
  );
}
