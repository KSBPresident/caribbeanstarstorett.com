export type Product = {
  id: string | number;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  currencyMinorUnit: number;
  rating: number;
  reviews: number;
  image: string;
  inStock: boolean;
  quantityAvailable?: number;
  description: string;
};

export const categories = [
  { key: "electronics-appliances", name: "Electronics & Appliances", icon: "▣", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" },
  { key: "groceries-food", name: "Groceries & Food", icon: "✦", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },
  { key: "home-living", name: "Home & Living", icon: "⌂", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80" },
  { key: "clothing-fashion", name: "Clothing & Fashion", icon: "◈", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80" },
  { key: "beauty-wellness", name: "Beauty & Wellness", icon: "✿", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80" },
  { key: "vehicles-parts", name: "Vehicles & Parts", icon: "⌁", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80" },
];

export const money = (amount: number, currency = "USD", minorUnit = 2) => {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  const digits = Math.max(0, Math.min(4, minorUnit));
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
};
