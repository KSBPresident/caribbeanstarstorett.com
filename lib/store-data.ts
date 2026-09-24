export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  currencyMinorUnit: number;
  rating: number;
  reviews: number;
  image: string;
  permalink: string;
  inStock: boolean;
  description: string;
};

export const categories = [
  { name: "Electronics & Appliances", icon: "▣", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" },
  { name: "Groceries & Food", icon: "✦", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },
  { name: "Home & Living", icon: "⌂", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80" },
  { name: "Clothing & Fashion", icon: "◈", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80" },
  { name: "Beauty & Wellness", icon: "✿", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80" },
  { name: "Vehicles & Parts", icon: "⌁", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80" },
];

export const money = (amount: number, currency = "TTD", minorUnit = 0) => {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "TTD";
  const digits = Math.max(0, Math.min(4, minorUnit));
  return new Intl.NumberFormat("en-TT", {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
};
